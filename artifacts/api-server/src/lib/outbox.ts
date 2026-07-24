// Durable notification outbox — scalability hardening (AWS master prompt:
// "if provider is temporarily down, messages remain queued and registration
// continues; track retries; do not send duplicates").
//
// Design:
//  - A row is enqueued ONLY when a real provider send FAILS (network error /
//    provider rejection). Successful sends never touch this table, and OTPs
//    are NEVER queued (time-sensitive — the player simply requests a new one).
//  - The sweep retries with exponential backoff (5m, 10m, 20m, 40m … cap 6h)
//    until sent, or marks the row "dead" after max_attempts and records the
//    final failure in notification_logs.
//  - Claiming uses UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED),
//    so the 2 PM2 cluster workers (and future SQS-style workers) never
//    double-send the same row. Rows stuck in "sending" (process crash) are
//    reclaimed after a 15-minute grace period.
//  - Live-row dedupe: identical messages (auto content-hash key) merge while
//    pending — "do not send duplicates" — but the same content can be sent
//    again later once the earlier row is sent/dead.
//  - Real sends only when outboxEnabled() — production or OUTBOX_ENABLED=1.
//    Everywhere else the sweep runs DRY (reports due count, touches nothing):
//    MSG91/Brevo real keys exist in dev, so accidental sends must be impossible.
import { createHash } from "node:crypto";
import { db } from "@workspace/db";
import { notificationOutboxTable } from "@workspace/db/schema";
import { sql, eq, and, lte, inArray } from "drizzle-orm";
import { logNotifications, type SendResult } from "./notify";

/** One-time idempotent migration — repo convention (works on dev + EC2 RDS without drizzle push). */
export async function ensureOutboxTable(): Promise<void> {
  await db.transaction(async (tx) => {
    // Serialize concurrent DDL: the 2 PM2 cluster workers boot simultaneously
    // (and vitest runs test files in parallel) — without this, concurrent
    // CREATE TABLE IF NOT EXISTS can still collide on pg_type (23505).
    // xact-scoped advisory lock auto-releases at commit, on this connection.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:outbox:ddl'))`);
    await tx.execute(sql`
    CREATE TABLE IF NOT EXISTS notification_outbox (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         uuid,
      channel         varchar(10)  NOT NULL,
      recipient       varchar(160) NOT NULL,
      recipient_name  varchar(120),
      template        varchar(60)  NOT NULL DEFAULT 'unknown',
      payload         jsonb        NOT NULL,
      dedupe_key      varchar(160),
      status          varchar(20)  NOT NULL DEFAULT 'pending',
      attempts        integer      NOT NULL DEFAULT 0,
      max_attempts    integer      NOT NULL DEFAULT 5,
      next_attempt_at timestamptz  NOT NULL DEFAULT now(),
      last_error      varchar(500),
      created_at      timestamptz  NOT NULL DEFAULT now(),
      sent_at         timestamptz
    )
  `);
    // Dedupe only among LIVE rows — a message successfully sent earlier may be
    // legitimately re-sent (and re-queued on failure) later.
    await tx.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS notification_outbox_live_dedupe_uq
      ON notification_outbox (dedupe_key)
      WHERE dedupe_key IS NOT NULL AND status IN ('pending','sending')
  `);
    await tx.execute(sql`
    CREATE INDEX IF NOT EXISTS notification_outbox_due_ix
      ON notification_outbox (status, next_attempt_at)
  `);
  });
}

/** Real retries only in production (or OUTBOX_ENABLED=1) — same gating pattern as reminders. */
export function outboxEnabled(): boolean {
  const env = (process.env["OUTBOX_ENABLED"] ?? "").trim().toLowerCase();
  if (env === "1" || env === "true") return true;
  if (env === "0" || env === "false") return false;
  return process.env["NODE_ENV"] === "production";
}

export interface OutboxMeta {
  userId?: string | null;
  template?: string;
  dedupeKey?: string | null;
}

/** Walk the DrizzleQueryError .cause chain for the underlying pg error code. */
function pgCode(e: unknown): string | undefined {
  let cur = e as { code?: string; cause?: unknown } | undefined;
  for (let i = 0; cur && i < 6; i++) {
    if (typeof cur.code === "string") return cur.code;
    cur = cur.cause as { code?: string; cause?: unknown } | undefined;
  }
  return undefined;
}

/** Deterministic content hash so the identical failed message merges into one queued row. */
function contentKey(channel: string, recipient: string, payload: Record<string, unknown>): string {
  const h = createHash("sha256").update(`${channel}|${recipient}|${JSON.stringify(payload)}`).digest("hex");
  return `auto:${h.slice(0, 64)}`;
}

/**
 * Queue a failed send for retry. Returns true when a new row was queued,
 * false when an identical message is already waiting (dedupe) or on error.
 * Never throws — outbox failures must not break the calling flow.
 */
export async function enqueueOutbox(entry: {
  channel: "email" | "sms";
  recipient: string;
  recipientName?: string | null;
  payload: Record<string, unknown>;
  error?: string;
  meta?: OutboxMeta;
}): Promise<boolean> {
  try {
    await db.insert(notificationOutboxTable).values({
      userId: entry.meta?.userId ?? null,
      channel: entry.channel,
      recipient: entry.recipient.slice(0, 160),
      recipientName: entry.recipientName?.slice(0, 120) ?? null,
      template: (entry.meta?.template ?? "unknown").slice(0, 60),
      payload: entry.payload,
      dedupeKey: entry.meta?.dedupeKey ?? contentKey(entry.channel, entry.recipient, entry.payload),
      lastError: entry.error ? entry.error.slice(0, 500) : null,
      // First retry no sooner than 5 minutes after the original failure.
      nextAttemptAt: new Date(Date.now() + 5 * 60_000),
    });
    console.warn(`[OUTBOX-QUEUED] ${entry.channel} to=${entry.recipient} template=${entry.meta?.template ?? "unknown"} — will retry`);
    return true;
  } catch (e) {
    if (pgCode(e) === "23505") {
      // Identical message already queued — "do not send duplicates".
      return false;
    }
    console.error("[OUTBOX] enqueue failed (message NOT queued)", e);
    return false;
  }
}

export interface OutboxSweepResult {
  dryRun: boolean;
  due: number;
  claimed: number;
  sent: number;
  retried: number;
  dead: number;
}

const BACKOFF_BASE_MIN = 5;
const BACKOFF_CAP_MIN = 360;

function backoffMinutes(attempts: number): number {
  return Math.min(BACKOFF_BASE_MIN * 2 ** Math.max(0, attempts - 1), BACKOFF_CAP_MIN);
}

/**
 * Retry due outbox rows. Cluster-safe (SKIP LOCKED claims). In dry-run mode
 * (anywhere outboxEnabled() is false, unless explicitly overridden) it only
 * reports how many rows are due — nothing is claimed or sent.
 */
export async function runOutboxSweep(limit = 25, opts?: { dryRun?: boolean }): Promise<OutboxSweepResult> {
  const dryRun = opts?.dryRun ?? !outboxEnabled();

  const dueRes = await db.execute(sql`
    SELECT count(*)::int AS due FROM notification_outbox
    WHERE (status = 'pending' AND next_attempt_at <= now())
       OR (status = 'sending' AND next_attempt_at <= now() - interval '15 minutes')
  `);
  const due = Number((dueRes.rows[0] as { due?: number } | undefined)?.due ?? 0);
  const result: OutboxSweepResult = { dryRun, due, claimed: 0, sent: 0, retried: 0, dead: 0 };
  if (dryRun || due === 0) {
    if (dryRun && due > 0) console.log(`[OUTBOX] DRY RUN — ${due} due row(s), nothing sent`);
    return result;
  }

  // Atomic claim: attempts++ and status=sending; SKIP LOCKED keeps the two
  // PM2 workers from grabbing the same rows. next_attempt_at=now() starts the
  // stuck-"sending" grace clock in case this process dies mid-send.
  const claimedRes = await db.execute(sql`
    UPDATE notification_outbox
       SET status = 'sending', attempts = attempts + 1, next_attempt_at = now()
     WHERE id IN (
       SELECT id FROM notification_outbox
        WHERE (status = 'pending' AND next_attempt_at <= now())
           OR (status = 'sending' AND next_attempt_at <= now() - interval '15 minutes')
        ORDER BY next_attempt_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
     )
     RETURNING id
  `);
  const ids = (claimedRes.rows as { id: string }[]).map((r) => r.id);
  result.claimed = ids.length;
  if (ids.length === 0) return result;

  const rows = await db.select().from(notificationOutboxTable).where(inArray(notificationOutboxTable.id, ids));

  // Deferred imports keep module init acyclic (sms/email dynamically import
  // this file on failure; the sweep statically importing them would cycle).
  const { sendSms } = await import("./sms");
  const { sendEmail } = await import("./email");

  for (const row of rows) {
    let outcome: SendResult;
    try {
      if (row.channel === "sms") {
        const p = row.payload as { message?: string };
        outcome = p.message
          ? await sendSms(row.recipient, p.message, { noOutbox: true })
          : { ok: false, error: "outbox row has no sms message payload" };
      } else {
        const p = row.payload as { subject?: string; htmlContent?: string };
        outcome = p.subject && p.htmlContent
          ? await sendEmail(
              { to: row.recipient, toName: row.recipientName ?? row.recipient, subject: p.subject, htmlContent: p.htmlContent },
              { noOutbox: true },
            )
          : { ok: false, error: "outbox row has no email payload" };
      }
    } catch (e) {
      outcome = { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
    }

    if (outcome.ok) {
      await db.update(notificationOutboxTable)
        .set({ status: "sent", sentAt: new Date(), lastError: null })
        .where(eq(notificationOutboxTable.id, row.id));
      result.sent++;
      console.log(`[OUTBOX-SENT] ${row.channel} to=${row.recipient} template=${row.template} attempt=${row.attempts + 1}`);
      if (row.userId) {
        await logNotifications(row.userId, `${row.template}-retry`, { [row.channel]: { ok: true } });
      }
      continue;
    }

    const attemptsNow = row.attempts + 1; // claim already incremented in DB
    const err = (outcome.error ?? "unknown provider failure").slice(0, 500);
    if (attemptsNow >= row.maxAttempts) {
      await db.update(notificationOutboxTable)
        .set({ status: "dead", lastError: err })
        .where(eq(notificationOutboxTable.id, row.id));
      result.dead++;
      console.error(`[OUTBOX-DEAD] ${row.channel} to=${row.recipient} template=${row.template} after ${attemptsNow} attempts: ${err}`);
      if (row.userId) {
        await logNotifications(row.userId, `${row.template}-retry`, { [row.channel]: { ok: false, error: `outbox dead after ${attemptsNow} attempts: ${err}` } });
      }
    } else {
      await db.update(notificationOutboxTable)
        .set({
          status: "pending",
          lastError: err,
          nextAttemptAt: new Date(Date.now() + backoffMinutes(attemptsNow) * 60_000),
        })
        .where(eq(notificationOutboxTable.id, row.id));
      result.retried++;
    }
  }

  return result;
}

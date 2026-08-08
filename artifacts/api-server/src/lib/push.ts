/**
 * Push notification infrastructure — Expo push API + in-app inbox.
 *
 * SAFETY MODEL (mirrors reminders/outbox — real MSG91/Brevo-style keys live in
 * dev, so accidental fan-out must be impossible):
 *  - Real device sends happen ONLY when pushEnabled() (production, or
 *    PUSH_ENABLED=1). Everywhere else sendPush runs a LOGGED DRY RUN: it still
 *    writes inbox rows (the app needs them) but never calls Expo.
 *  - notify(...) writes an inbox row with a dedupe key (partial unique index)
 *    so an event can be delivered at most once per user, ever — safe across
 *    restarts and the 2 PM2 workers.
 *  - DeviceNotRegistered receipts prune the dead token.
 *
 * Expo push: https://exp.host/--/api/v2/push/send — batches of up to 100.
 */
import { createHash } from "node:crypto";
import { db } from "@workspace/db";
import { pushTokensTable, notificationsInboxTable, notificationLogsTable } from "@workspace/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { logger } from "./logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

/** Real device sends only in production unless explicitly overridden via env. */
export function pushEnabled(): boolean {
  const env = (process.env["PUSH_ENABLED"] ?? "").trim().toLowerCase();
  if (env === "1" || env === "true") return true;
  if (env === "0" || env === "false") return false;
  return process.env["NODE_ENV"] === "production";
}

/** Idempotent boot-time migration (advisory-locked, repo convention). */
export async function ensurePushTables(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:push:ddl'))`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS push_tokens (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      uuid NOT NULL REFERENCES users(id),
      expo_token   varchar(200) NOT NULL UNIQUE,
      platform     varchar(10)  NOT NULL DEFAULT 'unknown',
      created_at   timestamptz  NOT NULL DEFAULT now(),
      last_seen_at timestamptz  NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens (user_id)`);

    await tx.execute(sql`CREATE TABLE IF NOT EXISTS notifications_inbox (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    uuid NOT NULL REFERENCES users(id),
      type       varchar(40)  NOT NULL,
      title      varchar(160) NOT NULL,
      body       text         NOT NULL,
      data       jsonb,
      dedupe_key varchar(160),
      read_at    timestamptz,
      created_at timestamptz  NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS notifications_inbox_user_idx ON notifications_inbox (user_id, created_at)`);
    // One inbox row per logical event per user — reserve-first dedupe authority.
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS notifications_inbox_dedupe_uq
      ON notifications_inbox (dedupe_key) WHERE dedupe_key IS NOT NULL`);
  });
}

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export type PushSendResult = {
  dryRun: boolean;
  tokens: number;
  tickets: number;
  removed: number;
};

const isExpoToken = (t: string) => /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(t);

/** Resolve the distinct Expo tokens for a set of user ids. */
async function tokensForUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const rows = await db.select({ t: pushTokensTable.expoToken })
    .from(pushTokensTable)
    .where(inArray(pushTokensTable.userId, userIds));
  return [...new Set(rows.map((r) => r.t))];
}

/**
 * Send a push to explicit tokens (or the tokens of the given users). Batched
 * (≤100), chunked. DRY RUN outside prod (logs, no network). Prunes tokens that
 * Expo reports as DeviceNotRegistered. Never throws — a push failure must never
 * break the calling flow.
 */
export async function sendPush(
  target: { userIds?: string[]; tokens?: string[] },
  payload: PushPayload,
): Promise<PushSendResult> {
  const dryRun = !pushEnabled();
  let tokens = (target.tokens ?? []).slice();
  if (target.userIds?.length) tokens = tokens.concat(await tokensForUsers(target.userIds));
  tokens = [...new Set(tokens)].filter(isExpoToken);

  const result: PushSendResult = { dryRun, tokens: tokens.length, tickets: 0, removed: 0 };
  if (tokens.length === 0) return result;

  if (dryRun) {
    logger.info({ count: tokens.length, title: payload.title }, "push DRY RUN — nothing sent");
    return result;
  }

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const chunk = tokens.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((to) => ({
      to, title: payload.title, body: payload.body,
      data: payload.data ?? {}, sound: "default" as const,
    }));
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, "expo push HTTP error");
        continue;
      }
      const j = (await res.json()) as { data?: Array<{ status?: string; details?: { error?: string } }> };
      const tickets = j.data ?? [];
      result.tickets += tickets.length;
      // Prune dead tokens reported inline.
      const dead: string[] = [];
      tickets.forEach((tk, idx) => {
        if (tk.status === "error" && tk.details?.error === "DeviceNotRegistered") dead.push(chunk[idx]);
      });
      if (dead.length) {
        await db.delete(pushTokensTable).where(inArray(pushTokensTable.expoToken, dead));
        result.removed += dead.length;
        logger.info({ removed: dead.length }, "pruned DeviceNotRegistered push tokens");
      }
    } catch (e) {
      logger.warn({ err: e }, "expo push batch failed");
    }
  }
  return result;
}

/** Deterministic auto dedupe key when the caller doesn't supply one. */
function autoKey(userId: string, type: string, title: string, body: string): string {
  const h = createHash("sha256").update(`${userId}|${type}|${title}|${body}`).digest("hex");
  return `auto:${h.slice(0, 40)}`;
}

export type NotifyResult = { inboxWritten: boolean; push: PushSendResult | null };

/**
 * The one-stop event notifier used by app flows and sweeps.
 *  1. Reserve-first: insert the inbox row with a dedupe key. If the key already
 *     exists, this event was already delivered → SKIP everything (idempotent).
 *  2. Write the in-app inbox row (always — even when push is gated off).
 *  3. Best-effort push to the user's devices + a notification_logs entry.
 *
 * Never throws.
 */
export async function notify(args: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Idempotency key — one delivery per logical event. Auto-derived if omitted. */
  dedupeKey?: string;
}): Promise<NotifyResult> {
  const dedupeKey = args.dedupeKey ?? autoKey(args.userId, args.type, args.title, args.body);
  try {
    const inserted = await db.execute(sql`
      INSERT INTO notifications_inbox (user_id, type, title, body, data, dedupe_key)
      VALUES (${args.userId}, ${args.type}, ${args.title}, ${args.body},
              ${args.data ? JSON.stringify(args.data) : null}::jsonb, ${dedupeKey})
      ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING
      RETURNING id
    `);
    // drizzle node-postgres returns the QueryResult (rows under .rows); some
    // driver configs return the row array directly — handle both.
    const rows = Array.isArray(inserted)
      ? inserted
      : ((inserted as unknown as { rows?: unknown[] }).rows ?? []);
    if (rows.length === 0) {
      // Already delivered — do not re-push.
      return { inboxWritten: false, push: null };
    }
  } catch (e) {
    logger.error({ err: e, type: args.type }, "notify: inbox insert failed");
    return { inboxWritten: false, push: null };
  }

  let push: PushSendResult | null = null;
  try {
    push = await sendPush({ userIds: [args.userId] }, { title: args.title, body: args.body, data: { type: args.type, ...(args.data ?? {}) } });
    // Record the push outcome in notification_logs (status reflects reality).
    await db.insert(notificationLogsTable).values({
      userId: args.userId,
      type: "push",
      template: args.type.slice(0, 50),
      status: push.dryRun ? "skipped" : push.tokens > 0 ? "sent" : "skipped",
      error: push.dryRun ? "push disabled (dry run)" : push.tokens === 0 ? "no device tokens" : null,
    }).catch(() => {});
  } catch (e) {
    logger.warn({ err: e, type: args.type }, "notify: push failed (inbox already written)");
  }
  return { inboxWritten: true, push };
}

/** Register (idempotent) an Expo token for a user. Re-points an existing token
 *  row to this user if the same device previously belonged to another account. */
export async function registerPushToken(userId: string, expoToken: string, platform: string): Promise<void> {
  const plat = ["ios", "android"].includes(platform) ? platform : "unknown";
  await db.execute(sql`
    INSERT INTO push_tokens (user_id, expo_token, platform, last_seen_at)
    VALUES (${userId}, ${expoToken}, ${plat}, now())
    ON CONFLICT (expo_token) DO UPDATE
      SET user_id = ${userId}, platform = ${plat}, last_seen_at = now()
  `);
}

/** Unregister a token (logout / disabled notifications). Only removes it when it
 *  belongs to this user (a stolen token can't be used to delete others'). */
export async function unregisterPushToken(userId: string, expoToken: string): Promise<void> {
  await db.delete(pushTokensTable).where(
    and(eq(pushTokensTable.userId, userId), eq(pushTokensTable.expoToken, expoToken)),
  );
}

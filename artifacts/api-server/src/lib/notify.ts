// Shared notification result + logging — every send attempt is recorded in
// notification_logs with its REAL outcome (sent | failed | skipped), never a
// blind default. Failures are also logged loudly to the console with the
// provider's error so they show up in PM2 / workflow logs.
import { db } from "@workspace/db";
import { notificationLogsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

/**
 * One-time idempotent migration, runs at server startup:
 * adds the notification_logs.error column used for failure details.
 */
export async function ensureNotificationErrorColumn(): Promise<void> {
  await db.execute(sql`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS error varchar(500)`);
}

/** Outcome of one delivery attempt on one channel. */
export type SendResult = {
  ok: boolean;
  /** true when the provider was never called (missing API key / not configured) */
  skipped?: boolean;
  /** provider error / reason, present when ok === false */
  error?: string;
  /**
   * Non-error advisory note to record alongside a (possibly successful) send —
   * e.g. "legacy_raw (DLT risk)" when a transactional SMS went out via the
   * legacy raw-text path instead of a DLT-approved MSG91 Flow template.
   */
  meta?: string;
};

/** Options accepted by sendSms/sendEmail (outbox integration). */
export interface SendOpts {
  /** Set by the outbox sweep so its own retries are never re-queued. */
  noOutbox?: boolean;
  /** Attribution for the queued retry row (user / template / dedupe key). */
  outboxMeta?: { userId?: string | null; template?: string; dedupeKey?: string | null };
  /**
   * Message type used to look up the DLT-approved MSG91 Flow template id
   * (see SMS_FLOW_ENV in lib/sms). When configured the SMS goes out via the
   * Flow API; otherwise it falls back to the legacy raw send with a
   * "legacy_raw (DLT risk)" note.
   */
  smsType?: string;
  /** Ordered Flow template variables (var1, var2 …) for the Flow API path. */
  smsFlowVars?: string[];
}

/**
 * Queue a FAILED provider send for durable retry (never called for OTPs or
 * skipped/no-key sends). Deferred import keeps sms/email/outbox acyclic.
 * Never throws.
 */
export async function queueSendFailure(
  channel: "email" | "sms",
  recipient: string,
  recipientName: string | null,
  payload: Record<string, unknown>,
  error: string | undefined,
  opts?: SendOpts,
): Promise<void> {
  if (opts?.noOutbox) return;
  try {
    const { enqueueOutbox } = await import("./outbox");
    await enqueueOutbox({ channel, recipient, recipientName, payload, error, meta: opts?.outboxMeta });
  } catch (e) {
    console.error("[OUTBOX] queueSendFailure crashed (message not queued)", e);
  }
}

const statusOf = (r: SendResult) => (r.skipped ? "skipped" : r.ok ? "sent" : "failed");

/**
 * Record the outcome of a multi-channel notification in notification_logs.
 * Never throws — a logging failure must not break the payment/verify flow,
 * but it is reported loudly on the console.
 */
export async function logNotifications(
  userId: string,
  template: string,
  results: { email?: SendResult; sms?: SendResult; whatsapp?: SendResult },
): Promise<void> {
  const rows = (Object.entries(results) as [string, SendResult | undefined][])
    .filter((e): e is [string, SendResult] => !!e[1])
    .map(([type, r]) => ({
      userId,
      type,
      template,
      status: statusOf(r),
      // Store the provider error when the send failed, otherwise any advisory
      // note (e.g. the "legacy_raw (DLT risk)" warning) so the detail is
      // always visible in the log row.
      error: (r.error ?? r.meta ?? null)?.slice(0, 500) ?? null,
    }));

  for (const row of rows) {
    if (row.status !== "sent") {
      console.error(`[NOTIFY-${row.status.toUpperCase()}] ${row.type}/${template} user=${userId}: ${row.error ?? "no detail"}`);
    } else if (row.error) {
      // Successful send that still carries an advisory note (DLT risk etc.).
      console.warn(`[NOTIFY-SENT] ${row.type}/${template} user=${userId}: ${row.error}`);
    }
  }

  try {
    if (rows.length) await db.insert(notificationLogsTable).values(rows);
  } catch (e) {
    console.error("[NOTIFY-LOG] failed to write notification_logs", e);
  }
}

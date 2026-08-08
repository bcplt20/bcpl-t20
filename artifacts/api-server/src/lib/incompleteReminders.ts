/**
 * Incomplete-registration reminders for DRAFTS (pre-registration funnel).
 *
 * The registrations-level P1 payment-pending nudge already lives in
 * reminders.ts (sendPaymentReminders). This sweep covers the earlier funnel:
 * autosave DRAFTS that have a VERIFIED phone but never finished — either the
 * Phase-1 payment is pending or the draft was abandoned after contact/profile.
 *
 * Safety model (identical to reminders.ts):
 *  1. Reserve-first dedupe on notification_logs.dedupe_key — the tick that wins
 *     the insert is the only sender. Max 2 reminders per draft (h24, h72).
 *  2. Hard age windows: h24 = 24–72h since last activity, h72 = 72h–7d. Older
 *     drafts never get messaged (no first-deploy blast).
 *  3. remindersEnabled() gate: real sends only in production / REMINDERS_ENABLED=1.
 *  4. mobileVerified === true ONLY — an unverified phone (mistyped / not the
 *     player's) must never receive an automated message.
 *
 * If the draft already has a linked user, we ALSO write an inbox row + push
 * (via notify(), itself gated + deduped).
 */
import { db } from "@workspace/db";
import { registrationDraftsTable, notificationLogsTable } from "@workspace/db/schema";
import { and, eq, gte, or } from "drizzle-orm";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { notify } from "./push";
import { remindersEnabled } from "./reminders";
import { logger } from "./logger";

const HOUR_MS = 60 * 60 * 1000;

export type IncompleteSweepResult = {
  dryRun: boolean;
  candidates: number;
  sent: number;
};

type DraftCandidate = {
  id: string;
  userId: string; // mobileVerified drafts always carry a linked user (draftOnOtpVerified)
  name: string;
  email: string | null;
  phone: string;
  bucket: "h24" | "h72";
};

const REMINDER_SMS =
  "BCPL: Your registration is almost done — just a step or two left. Finish it at bcplt20.com to lock your Player ID. -BCPL";

function emailBody(name: string): { subject: string; htmlContent: string } {
  const first = (name || "").trim().split(/\s+/)[0] || "there";
  return {
    subject: "Finish your BCPL registration",
    htmlContent:
      `<p>Hi ${first},</p>` +
      `<p>Your BCPL registration is almost complete — just a step or two left. ` +
      `Pick up right where you left off and lock in your Player ID.</p>` +
      `<p><a href="https://bcplt20.com/register">Finish my registration →</a></p>` +
      `<p>Results are shared within 15 days of your submission.</p>` +
      `<p>— Team BCPL</p>`,
  };
}

/** Drafts eligible for a reminder within the 7-day horizon. */
async function findDraftCandidates(now: number): Promise<DraftCandidate[]> {
  const rows = await db.select().from(registrationDraftsTable).where(and(
    eq(registrationDraftsTable.mobileVerified, true),
    // Not yet an active player, and either payment pending or abandoned.
    or(
      eq(registrationDraftsTable.status, "PAYMENT_PENDING"),
      eq(registrationDraftsTable.status, "PROFILE_COMPLETE"),
      eq(registrationDraftsTable.status, "OTP_VERIFIED"),
      eq(registrationDraftsTable.status, "ABANDONED"),
    ),
    gte(registrationDraftsTable.lastActivityAt, new Date(now - 168 * HOUR_MS)),
  ));

  const out: DraftCandidate[] = [];
  for (const d of rows) {
    // Already converted (real registration exists) — never nag.
    if (d.registrationId) continue;
    if (d.phase1PaymentStatus === "SUCCESS" || d.status === "PHASE1_ACTIVE") continue;
    if (!d.phone) continue;
    // mobileVerified is only ever set together with a userId; guard anyway so
    // the notification_logs reserve (userId NOT NULL) can never fail.
    if (!d.userId) continue;
    const age = now - d.lastActivityAt.getTime();
    let bucket: "h24" | "h72" | null = null;
    if (age >= 24 * HOUR_MS && age < 72 * HOUR_MS) bucket = "h24";
    else if (age >= 72 * HOUR_MS && age < 168 * HOUR_MS) bucket = "h72";
    if (!bucket) continue;
    out.push({
      id: d.id,
      userId: d.userId,
      name: d.fullName ?? "",
      email: d.email ?? null,
      phone: d.phone,
      bucket,
    });
  }
  return out;
}

/** Reserve the dedupe key then deliver email + SMS (+ inbox/push if a user
 *  exists). Total send failure marks the reserved row `failed` and is NOT
 *  retried — the key stays reserved so a flaky provider can't double-send. */
async function deliverDraft(c: DraftCandidate): Promise<boolean> {
  const dedupeKey = `draft_incomplete_${c.id}_${c.bucket}`;
  const template = `draft_incomplete_${c.bucket}`;
  const reserved = await db.insert(notificationLogsTable)
    .values({ userId: c.userId, type: "email", template, dedupeKey })
    .onConflictDoNothing()
    .returning({ id: notificationLogsTable.id });
  if (!reserved.length || !reserved[0]) return false; // another tick owns this key

  const results: PromiseSettledResult<{ ok: boolean; error?: string }>[] = [];
  const email = emailBody(c.name);
  results.push(...await Promise.allSettled([
    c.email
      ? sendEmail({ to: c.email, toName: c.name || "Player", subject: email.subject, htmlContent: email.htmlContent })
      : Promise.resolve({ ok: false, error: "no email" }),
    sendSms(c.phone, REMINDER_SMS),
  ]));
  const anyOk = results.some((r) => r.status === "fulfilled" && r.value.ok);

  if (!anyOk) {
    const detail = results
      .map((r) => (r.status === "fulfilled" ? r.value.error : String(r.reason)))
      .filter(Boolean).join("; ")
      .slice(0, 500);
    await db.update(notificationLogsTable)
      .set({ status: "failed", error: detail || "all channels failed" })
      .where(eq(notificationLogsTable.dedupeKey, dedupeKey))
      .catch(() => {});
  }

  // In-app inbox + push (own dedupe key).
  await notify({
    userId: c.userId,
    type: "registration_incomplete",
    title: "Finish your registration / रजिस्ट्रेशन पूरा करें",
    body:
      "Your BCPL registration is almost done — finish it at bcplt20.com to lock your Player ID.\n" +
      "आपका BCPL रजिस्ट्रेशन लगभग पूरा है — इसे bcplt20.com पर पूरा करके अपना Player ID सुरक्षित करें।",
    data: { draftId: c.id, screen: "register" },
    dedupeKey: `draft_incomplete_inbox_${c.id}_${c.bucket}`,
  }).catch(() => {});
  return anyOk;
}

/** Sweep entry point. Dry run reports the due count without sending. */
export async function sendIncompleteRegistrationReminders(opts: { dryRun?: boolean } = {}): Promise<IncompleteSweepResult> {
  const dryRun = opts.dryRun ?? !remindersEnabled();
  const now = Date.now();
  let candidates: DraftCandidate[] = [];
  try {
    candidates = await findDraftCandidates(now);
  } catch (e) {
    logger.error({ err: e }, "incomplete-registration sweep: candidate scan failed");
    return { dryRun, candidates: 0, sent: 0 };
  }

  if (dryRun) {
    if (candidates.length) logger.info({ candidates: candidates.length }, "incomplete-registration reminders DRY RUN");
    return { dryRun: true, candidates: candidates.length, sent: 0 };
  }

  let sent = 0;
  for (const c of candidates) {
    try {
      if (await deliverDraft(c)) sent++;
    } catch (e) {
      logger.error({ err: e, draftId: c.id }, "incomplete-registration reminder failed");
    }
  }
  if (candidates.length) logger.info({ candidates: candidates.length, sent }, "incomplete-registration reminders processed");
  return { dryRun: false, candidates: candidates.length, sent };
}

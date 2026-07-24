/**
 * Physical-trial completion notice (final-finishing spec §22).
 *
 * Fired when a coach LOCKS an assessment (staff /eval/submit). Guarantees:
 *  1. EXACTLY ONCE per registration, ever — reserve-first dedupe on
 *     notification_logs (same contract as the KYC/payment reminder sweeps).
 *     Correction → re-submit never re-sends: the dedupe key is consumed by
 *     the first submit.
 *  2. GATED like every other non-OTP sender: real sends only when
 *     remindersEnabled() (production, or REMINDERS_ENABLED=1). Outside that
 *     the reservation is marked "skipped" — dev/test can assert the pipeline
 *     without emailing a real player (real Brevo keys live in dev).
 *  3. Fire-and-forget safe: never throws — a provider outage must not break
 *     the evaluator's submit flow.
 */
import { db } from "@workspace/db";
import {
  registrationsTable, usersTable, notificationLogsTable,
  trialAllocationsTable, trialVenuesTable, trialSlotsTable,
} from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { sendEmail, tplTrialCompleted } from "./email";
import { remindersEnabled } from "./reminders";
import { logger } from "./logger";

/** Role value → player-facing label (server copy of the §6 vocabulary). */
const ROLE_LABELS: Record<string, string> = {
  bat: "Batsman", batsman: "Batsman",
  bowl: "Bowler", bowler: "Bowler",
  ar: "All-Rounder", all_rounder: "All-Rounder", allrounder: "All-Rounder", "all-rounder": "All-Rounder",
  wk: "Wicketkeeper", wicketkeeper: "Wicketkeeper", wicket_keeper: "Wicketkeeper", wicketkeeper_batsman: "Wicketkeeper",
};
export function roleLabel(role: string | null | undefined): string {
  if (!role) return "Player";
  return ROLE_LABELS[role.trim().toLowerCase()] ?? role;
}

export async function sendTrialCompletionNotice(registrationId: string): Promise<boolean> {
  try {
    const [reg] = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.id, registrationId)).limit(1);
    if (!reg) return false;
    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, reg.userId)).limit(1);
    if (!user?.email) {
      logger.warn({ registrationId }, "trial completion notice: no email on file — skipping");
      return false;
    }

    const [alloc] = await db.select().from(trialAllocationsTable)
      .where(and(
        eq(trialAllocationsTable.registrationId, registrationId),
        eq(trialAllocationsTable.status, "allocated"),
      )).limit(1);
    const [venue] = alloc
      ? await db.select().from(trialVenuesTable).where(eq(trialVenuesTable.id, alloc.venueId)).limit(1)
      : [undefined];
    const [slot] = alloc
      ? await db.select().from(trialSlotsTable).where(eq(trialSlotsTable.id, alloc.slotId)).limit(1)
      : [undefined];

    /* ── RESERVE-FIRST: claim the one-per-registration send ─────────────── */
    const reserved = await db.insert(notificationLogsTable)
      .values({
        userId: reg.userId, type: "email",
        template: "trial_completed",
        dedupeKey: "trial_completed_" + registrationId,
      })
      .onConflictDoNothing()
      .returning({ id: notificationLogsTable.id });
    if (!reserved.length || !reserved[0]) return false; // already notified once — never double-send

    if (!remindersEnabled()) {
      await db.update(notificationLogsTable)
        .set({ status: "skipped", error: "sends disabled outside production" })
        .where(eq(notificationLogsTable.id, reserved[0].id));
      logger.info({ registrationId }, "trial completion email skipped (sends disabled)");
      return false;
    }

    const firstName = (user.name ?? "Player").trim().split(/\s+/)[0] || "Player";
    const tpl = tplTrialCompleted({
      firstName,
      roleLabel: roleLabel(reg.role),
      trialCity: venue?.city ?? reg.trialCity ?? "—",
      venueName: venue?.venue ?? "—",
      trialDate: slot?.slotDate ?? "—",
      trialId: reg.regNumber ?? registrationId.slice(0, 8).toUpperCase(),
    });
    const res = await sendEmail({
      to: user.email, toName: user.name ?? "Player",
      subject: tpl.subject, htmlContent: tpl.htmlContent,
    });
    await db.update(notificationLogsTable)
      .set({
        status: res.ok ? "sent" : "failed",
        error: res.ok ? null : String(res.error ?? "send failed").slice(0, 500),
      })
      .where(eq(notificationLogsTable.id, reserved[0].id));
    if (!res.ok) logger.error({ registrationId, error: res.error }, "trial completion email failed");
    else logger.info({ registrationId }, "trial completion email sent");
    return res.ok;
  } catch (e) {
    logger.error({ err: e, registrationId }, "trial completion notice crashed");
    return false;
  }
}

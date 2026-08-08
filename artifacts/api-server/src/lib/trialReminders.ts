/**
 * Trial-day morning reminder sweep.
 *
 * On the morning of a player's allocated trial, nudge them with venue + time.
 * Sends SMS + email + push/inbox, reserve-first deduped (one per allocation),
 * gated by remindersEnabled() (dry run elsewhere).
 *
 * DATA LIMITATION: trial_slots.slot_date is FREE TEXT (e.g. "12 August 2025"),
 * so "is this today?" is best-effort via Date.parse against the server's local
 * calendar day. Unparseable dates are skipped (never mis-fired). When BCPL
 * moves slot dates to a real date column this becomes exact — the dedupe key is
 * per-allocation so tightening the match later can't double-send.
 */
import { db } from "@workspace/db";
import {
  trialAllocationsTable, trialSlotsTable, trialVenuesTable,
  registrationsTable, usersTable, notificationLogsTable,
} from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { notify } from "./push";
import { remindersEnabled } from "./reminders";
import { logger } from "./logger";

export type TrialSweepResult = { dryRun: boolean; candidates: number; sent: number };

function isToday(dateText: string, now: Date): boolean {
  const t = Date.parse(dateText);
  if (Number.isNaN(t)) return false;
  const d = new Date(t);
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

export async function sendTrialDayReminders(opts: { dryRun?: boolean } = {}): Promise<TrialSweepResult> {
  const dryRun = opts.dryRun ?? !remindersEnabled();
  const now = new Date();

  let rows: Array<{
    allocId: string; regId: string;
    venue: string; city: string; address: string | null;
    slotDate: string; reportingTime: string; startTime: string; batch: string;
    userId: string; name: string; email: string; phone: string;
  }> = [];
  try {
    const raw = await db.select({
      allocId: trialAllocationsTable.id,
      regId: trialAllocationsTable.registrationId,
      venue: trialVenuesTable.venue,
      city: trialVenuesTable.city,
      address: trialVenuesTable.address,
      slotDate: trialSlotsTable.slotDate,
      reportingTime: trialSlotsTable.reportingTime,
      startTime: trialSlotsTable.startTime,
      batch: trialSlotsTable.batchName,
      userId: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
    })
      .from(trialAllocationsTable)
      .innerJoin(trialSlotsTable, eq(trialSlotsTable.id, trialAllocationsTable.slotId))
      .innerJoin(trialVenuesTable, eq(trialVenuesTable.id, trialAllocationsTable.venueId))
      .innerJoin(registrationsTable, eq(registrationsTable.id, trialAllocationsTable.registrationId))
      .innerJoin(usersTable, eq(usersTable.id, registrationsTable.userId))
      .where(eq(trialAllocationsTable.status, "allocated"));
    rows = raw;
  } catch (e) {
    // Trial tables may not exist on a fresh DB — degrade to no-op.
    logger.warn({ err: e }, "trial-day sweep: allocation scan failed (tables may not exist)");
    return { dryRun, candidates: 0, sent: 0 };
  }

  const due = rows.filter((r) => isToday(r.slotDate, now));
  if (dryRun) {
    if (due.length) logger.info({ candidates: due.length }, "trial-day reminders DRY RUN");
    return { dryRun: true, candidates: due.length, sent: 0 };
  }

  let sent = 0;
  for (const r of due) {
    const dedupeKey = "trial_day_" + r.allocId;
    try {
      const reserved = await db.insert(notificationLogsTable)
        .values({ userId: r.userId, type: "sms", template: "trial_day_reminder", dedupeKey })
        .onConflictDoNothing()
        .returning({ id: notificationLogsTable.id });
      if (!reserved.length) continue; // another tick owns this key

      const smsText = `BCPL: Your trial is TODAY at ${r.venue}, ${r.city}. Report by ${r.reportingTime} (${r.batch}). Carry your Player ID/QR pass. -BCPL`;
      const email = {
        subject: "Your BCPL trial is today",
        htmlContent:
          `<p>Hi ${(r.name || "there").split(/\s+/)[0]},</p>` +
          `<p>Your BCPL trial is <b>today</b>.</p>` +
          `<p><b>Venue:</b> ${r.venue}, ${r.city}${r.address ? " — " + r.address : ""}<br/>` +
          `<b>Batch:</b> ${r.batch}<br/>` +
          `<b>Report by:</b> ${r.reportingTime} (starts ${r.startTime})</p>` +
          `<p>Please carry your Player ID / QR pass. All the best!</p><p>— Team BCPL</p>`,
      };
      const results = await Promise.allSettled([
        sendEmail({ to: r.email, toName: r.name, subject: email.subject, htmlContent: email.htmlContent }),
        sendSms(r.phone, smsText),
      ]);
      const anyOk = results.some((x) => x.status === "fulfilled" && x.value.ok);
      if (!anyOk) {
        const detail = results.map((x) => (x.status === "fulfilled" ? x.value.error : String(x.reason))).filter(Boolean).join("; ").slice(0, 500);
        await db.update(notificationLogsTable).set({ status: "failed", error: detail || "all channels failed" })
          .where(eq(notificationLogsTable.dedupeKey, dedupeKey)).catch(() => {});
      }

      void notify({
        userId: r.userId,
        type: "trial_day",
        title: "Your trial is today / आज आपका ट्रायल है",
        body:
          `Your BCPL trial is today at ${r.venue}, ${r.city}. Report by ${r.reportingTime} (${r.batch}). Carry your Player ID/QR pass.\n` +
          `आज आपका BCPL ट्रायल ${r.venue}, ${r.city} में है। ${r.reportingTime} तक पहुँचें (${r.batch})। अपना Player ID/QR पास साथ लाएँ।`,
        data: { registrationId: r.regId, allocationId: r.allocId, screen: "trial" },
        dedupeKey: "trial_day_inbox_" + r.allocId,
      });
      if (anyOk) sent++;
    } catch (e) {
      logger.error({ err: e, allocId: r.allocId }, "trial-day reminder failed");
    }
  }
  if (due.length) logger.info({ candidates: due.length, sent }, "trial-day reminders processed");
  return { dryRun: false, candidates: due.length, sent };
}

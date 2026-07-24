/**
 * Referral reward milestone congratulations (Task #55).
 *
 * The single source of truth for "a player reached a reward tier" is a row in
 * referral_reward_grants (UNIQUE(code, threshold)). When a NEW grant row is
 * created we congratulate the referring player across every channel we already
 * use — SMS (DLT Flow), WhatsApp template, email fallback — so they don't have
 * to open the dashboard to find out.
 *
 * Safety (mirrors resultRelease.ts / reminders.ts):
 *  - RESERVE-FIRST dedupe: we INSERT a notification_logs row keyed on
 *    "referral_milestone_<code>_<threshold>" with ON CONFLICT DO NOTHING. Only
 *    the caller that wins the reservation sends; a re-run, a double-fire, or a
 *    concurrent request can NEVER double-send.
 *  - Providers are only ever called from here after the reservation is won,
 *    and every attempt's REAL outcome is recorded via logNotifications, exactly
 *    like the payment/receipt senders.
 *  - Only NEW grants trigger this. The caller (the admin grant endpoint) passes
 *    us the grant only when its INSERT actually created a row — historical
 *    backfill / idempotent re-marks (unique-violation path) never reach here.
 *  - Never throws: a notification failure must not break the grant flow.
 */
import { db } from "@workspace/db";
import {
  notificationLogsTable,
  referralCodesTable,
  usersTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, tplReferralMilestone } from "./email";
import { sendSms } from "./sms";
import { sendWhatsApp, WA } from "./whatsapp";
import { logNotifications, type SendResult } from "./notify";
import { logger } from "./logger";

export interface MilestoneNotifyInput {
  /** Player referral code the grant belongs to (already upper-cased). */
  code: string;
  /** Milestone threshold (number of paid referrals) that was reached. */
  threshold: number;
  /** Snapshotted reward text from the grant row. */
  reward: string;
}

/**
 * Congratulate the player who owns `code` for reaching `threshold` paid
 * referrals. Reserve-first dedupe guarantees exactly-once delivery per
 * (code, threshold). Returns true when this call won the reservation and
 * attempted a send, false when another actor already owns the milestone
 * (or the code has no linked player / contact).
 */
export async function notifyReferralMilestone(input: MilestoneNotifyInput): Promise<boolean> {
  try {
    const code = input.code.toUpperCase();
    const dedupeKey = `referral_milestone_${code}_${input.threshold}`;

    // Resolve the player behind this referral code (player codes carry userId).
    const [rc] = await db
      .select({ userId: referralCodesTable.userId })
      .from(referralCodesTable)
      .where(eq(referralCodesTable.code, code))
      .limit(1);
    if (!rc?.userId) {
      logger.warn({ code, threshold: input.threshold }, "referral milestone: no linked player for code — skipping congrats");
      return false;
    }

    const [user] = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone })
      .from(usersTable)
      .where(eq(usersTable.id, rc.userId))
      .limit(1);
    if (!user) {
      logger.warn({ code, userId: rc.userId }, "referral milestone: user row missing — skipping congrats");
      return false;
    }

    // ── RESERVE-FIRST: claim the (code, threshold) send exactly once ──
    const reserved = await db
      .insert(notificationLogsTable)
      .values({ userId: user.id, type: "email", template: "referral_milestone", dedupeKey })
      .onConflictDoNothing()
      .returning({ id: notificationLogsTable.id });
    if (!reserved.length || !reserved[0]) {
      // Another actor already congratulated this milestone — never double-send.
      return false;
    }
    const reservedRowId = reserved[0].id;

    // ── Send on every channel we support, gated exactly like other senders ──
    const email = tplReferralMilestone(user.name, input.threshold, input.reward);
    const smsMsg =
      `BCPL T20: Congrats ${user.name}! ${input.threshold} of your referred players have paid — ` +
      `you have unlocked a referral reward: ${input.reward}. Our team will reach out. -BCPL T20`;

    const [emRes, smRes, waRes] = await Promise.allSettled([
      user.email
        ? sendEmail({ to: user.email, toName: user.name, subject: email.subject, htmlContent: email.htmlContent })
        : Promise.resolve<SendResult>({ ok: false, skipped: true, error: "no email on file" }),
      user.phone
        ? sendSms(user.phone, smsMsg, {
            smsType: "referral_milestone",
            smsFlowVars: [user.name, String(input.threshold), input.reward],
          })
        : Promise.resolve<SendResult>({ ok: false, skipped: true, error: "no phone on file" }),
      user.phone
        ? sendWhatsApp({
            phone: user.phone,
            templateName: WA.REFERRAL_MILESTONE,
            bodyValues: [user.name, String(input.threshold), input.reward],
          })
        : Promise.resolve<SendResult>({ ok: false, skipped: true, error: "no phone on file" }),
    ]);

    const settled = (r: PromiseSettledResult<SendResult>): SendResult =>
      r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason).slice(0, 300) };
    const em = settled(emRes);
    const sm = settled(smRes);
    const wa = settled(waRes);

    // Record SMS + WhatsApp outcomes (email outcome goes onto the reserved row
    // below so the dedupe key is never duplicated in notification_logs).
    await logNotifications(user.id, "referral_milestone", { sms: sm, whatsapp: wa });

    // Fold the real email outcome into the reserved dedupe row.
    const emailStatus = em.skipped ? "skipped" : em.ok ? "sent" : "failed";
    await db
      .update(notificationLogsTable)
      .set({ status: emailStatus, error: (em.error ?? em.meta ?? null)?.slice(0, 500) ?? null })
      .where(eq(notificationLogsTable.id, reservedRowId));

    logger.info(
      { code, threshold: input.threshold, emOk: em.ok, smOk: sm.ok, waOk: wa.ok },
      "referral milestone congrats attempted",
    );
    return true;
  } catch (e) {
    // Never let a congrats failure break the grant flow.
    logger.error({ err: e, code: input.code, threshold: input.threshold }, "referral milestone congrats crashed");
    return false;
  }
}

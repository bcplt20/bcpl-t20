// Task #75 — periodic sweep: nudge the admin when a KYC has been parked for
// manual review for more than 24 hours without being cleared.
//
// Task #73 emails the admin ONCE at the moment a KYC parks for manual review.
// Players are promised verification within 24–48 hours, so if a parked KYC is
// still unreviewed after 24h it must resurface — but exactly once, never a
// per-tick blast.
//
// Safety model (mirrors lib/reminders.ts):
//  1. Reserve-first dedupe: the partial UNIQUE index on
//     notification_logs.dedupe_key is the only authority — the tick that WINS
//     the insert is the only one that ever sends, so overlapping ticks (or a
//     restart) can never double-send. Dedupe key is per kyc-record.
//  2. Hard age window: a reminder fires only once the parked KYC is OLDER than
//     24h, and the query is SQL-bounded so a fresh deploy can't mass-blast.
//  3. remindersEnabled() gate: real sends only in production (or with
//     REMINDERS_ENABLED=1); everywhere else the sweep runs dry.
//
// "Parked for manual review" = the canonical state Task #73 alerts on: a KYC
// row still status='pending' whose PAN could not be auto-verified
// (pan_verified=false) OR whose Aadhaar is parked (aadhaar_ref begins
// "manual_review"). A verified KYC (status='verified') is never a candidate.
import { db } from "@workspace/db";
import {
  kycRecordsTable,
  registrationsTable,
  usersTable,
  notificationLogsTable,
} from "@workspace/db/schema";
import { and, eq, lt, or, like, inArray } from "drizzle-orm";
import { sendEmail, adminAlertRecipient, tplKycManualReview } from "./email";
import { remindersEnabled } from "./reminders";
import { logger } from "./logger";

const HOUR_MS = 60 * 60 * 1000;
// Only one reminder per parked KYC (the task text asks for a single nudge; a
// second reminder is not demanded). The dedupe key has no time bucket, so the
// reserve-first insert guarantees exactly one reminder for the lifetime of the
// record.
const REMINDER_TEMPLATE = "kyc_manual_review_reminder";

type Candidate = {
  kycId: string;
  registrationId: string;
  userId: string;
  playerName: string;
  playerPhone: string;
  trialCity: string;
  panVerified: boolean;
  aadhaarVerified: boolean;
  parkedAt: Date;
  dedupeKey: string;
};

export type KycReminderSweepResult = {
  dryRun: boolean;
  candidates: number;
  sent: number;
};

/**
 * KYC rows still parked for manual review AND older than 24h. Bounded to a
 * 30-day horizon so a fresh deploy can never load (and remind about) ancient
 * abandoned rows — anything older is stale and handled by the admin panel, not
 * an email blast.
 */
async function findParkedCandidates(now: number): Promise<Candidate[]> {
  const cutoff = new Date(now - 24 * HOUR_MS);
  const horizon = new Date(now - 30 * 24 * HOUR_MS);

  const rows = await db.select({
    kycId:           kycRecordsTable.id,
    registrationId:  kycRecordsTable.registrationId,
    panVerified:     kycRecordsTable.panVerified,
    aadhaarVerified: kycRecordsTable.aadhaarVerified,
    aadhaarRef:      kycRecordsTable.aadhaarRef,
    createdAt:       kycRecordsTable.createdAt,
    userId:          usersTable.id,
    playerName:      usersTable.name,
    playerPhone:     usersTable.phone,
    trialCity:       registrationsTable.trialCity,
  })
    .from(kycRecordsTable)
    .innerJoin(registrationsTable, eq(registrationsTable.id, kycRecordsTable.registrationId))
    .innerJoin(usersTable, eq(usersTable.id, registrationsTable.userId))
    .where(and(
      eq(kycRecordsTable.status, "pending"),
      // Parked = PAN needs manual review OR Aadhaar parked for manual review.
      or(
        eq(kycRecordsTable.panVerified, false),
        like(kycRecordsTable.aadhaarRef, "manual_review%"),
      ),
      lt(kycRecordsTable.createdAt, cutoff),
      // Never older than the horizon (mass-blast guard on first deploy).
      // Uses gt via the lower bound below.
    ));

  const out: Candidate[] = [];
  for (const r of rows) {
    if (r.createdAt.getTime() < horizon.getTime()) continue; // beyond horizon
    out.push({
      kycId:           r.kycId,
      registrationId:  r.registrationId,
      userId:          r.userId,
      playerName:      r.playerName ?? "Unknown player",
      playerPhone:     r.playerPhone ?? "—",
      trialCity:       r.trialCity ?? "TBD",
      panVerified:     r.panVerified,
      aadhaarVerified: r.aadhaarVerified,
      parkedAt:        r.createdAt,
      // Per kyc-record dedupe — one reminder ever, no time bucket.
      dedupeKey:       "kyc_manual_review_reminder_" + r.kycId,
    });
  }
  return out;
}

/** Reserve the dedupe key, then send ONE admin reminder email. Returns true
 *  only when the reminder actually went out. Total failure marks the reserved
 *  row `failed` (never retried) so a flaky provider can't cause double sends —
 *  same durability contract as the payment-reminder sweep. */
async function deliver(c: Candidate, alertTo: string): Promise<boolean> {
  const reserved = await db.insert(notificationLogsTable)
    .values({ userId: c.userId, type: "email", template: REMINDER_TEMPLATE, dedupeKey: c.dedupeKey })
    .onConflictDoNothing()
    .returning({ id: notificationLogsTable.id });
  if (!reserved.length || !reserved[0]) return false; // another tick already owns this key

  const tpl = tplKycManualReview({
    playerName:      c.playerName,
    playerPhone:     c.playerPhone,
    regIdShort:      c.registrationId.slice(0, 8).toUpperCase(),
    trialCity:       c.trialCity,
    panVerified:     c.panVerified,
    aadhaarVerified: c.aadhaarVerified,
    reason:          "⏰ Still unreviewed after 24h — this KYC has been parked for manual review for over a day. The player was promised verification within 24–48 hours; please review it now.",
    flaggedAt:       c.parkedAt,
  });
  const res = await sendEmail({
    to: alertTo,
    toName: "BCPL Admin",
    subject: "⏰ REMINDER — " + tpl.subject,
    htmlContent: tpl.htmlContent,
  });

  if (!res.ok) {
    await db.update(notificationLogsTable)
      .set({ status: "failed", error: String(res.error ?? "send failed").slice(0, 500) })
      .where(eq(notificationLogsTable.id, reserved[0].id));
    logger.error({ kycId: c.kycId, registrationId: c.registrationId, error: res.error }, "KYC manual-review reminder failed");
    return false;
  }
  logger.info({ kycId: c.kycId, registrationId: c.registrationId }, "KYC manual-review reminder sent");
  return true;
}

/**
 * Sweep: remind the admin about KYCs parked in manual review for >24h.
 * Exactly one reminder per parked KYC, ever.
 */
export async function sendKycManualReviewReminders(opts?: { dryRun?: boolean }): Promise<KycReminderSweepResult> {
  const dryRun = opts?.dryRun ?? !remindersEnabled();
  const now = Date.now();

  const candidates = await findParkedCandidates(now);
  if (!candidates.length) return { dryRun, candidates: 0, sent: 0 };

  // Drop candidates already reminded (dedupe key present) so a dry run reports
  // only what it WOULD send, and the live path skips the insert attempt.
  const keys = candidates.map(c => c.dedupeKey);
  const existing = new Set<string>();
  const seen = await db.select({ dedupeKey: notificationLogsTable.dedupeKey })
    .from(notificationLogsTable)
    .where(inArray(notificationLogsTable.dedupeKey, keys));
  for (const s of seen) if (s.dedupeKey) existing.add(s.dedupeKey);
  const fresh = candidates.filter(c => !existing.has(c.dedupeKey));

  if (!fresh.length) return { dryRun, candidates: 0, sent: 0 };

  const alertTo = adminAlertRecipient();
  if (!alertTo) {
    logger.error(
      { count: fresh.length },
      "ADMIN_ALERT_EMAIL not set — KYC manual-review reminders NOT sent. Set ADMIN_ALERT_EMAIL to the admin's monitored inbox.",
    );
    return { dryRun, candidates: fresh.length, sent: 0 };
  }

  let sent = 0;
  if (!dryRun) {
    for (const c of fresh) if (await deliver(c, alertTo)) sent++;
  } else {
    logger.info({ dedupeKeys: fresh.map(c => c.dedupeKey) }, "KYC manual-review reminders DRY RUN — nothing sent");
  }
  return { dryRun, candidates: fresh.length, sent };
}

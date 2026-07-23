// Stage 2 — idempotent payment reminder sweeps (P1 abandoned, P2 pending).
//
// Safety model (all three layers must hold):
//  1. Reserve-first dedupe: the partial UNIQUE index on
//     notification_logs.dedupe_key is the only authority — the tick that WINS
//     the insert is the only one that ever sends (same pattern as
//     sendVideoReminders), so overlapping ticks can never double-send.
//  2. Hard age windows: a reminder fires only while the row is INSIDE its
//     window, so a fresh deploy can never mass-blast months-old rows.
//  3. remindersEnabled() gate: real sends only in production (or with
//     REMINDERS_ENABLED=1); everywhere else the sweep runs dry — it reports
//     what it WOULD send without writing or sending anything.
import { db } from "@workspace/db";
import {
  registrationsTable,
  usersTable,
  phase1PaymentsTable,
  phase2PaymentsTable,
  phase1EvaluationsTable,
  notificationLogsTable,
} from "@workspace/db/schema";
import { and, desc, eq, gte, inArray, isNull, or } from "drizzle-orm";
import { sendEmail, tplPhase1PaymentReminder, tplPhase2PaymentReminder } from "./email";
import { sendSms } from "./sms";
import { logger } from "./logger";

const HOUR_MS = 60 * 60 * 1000;
const isPaid = (st: string) => st === "success" || st === "paid"; // legacy rows use "paid"

/** Real sends only in production unless explicitly overridden via env. */
export function remindersEnabled(): boolean {
  const env = (process.env["REMINDERS_ENABLED"] ?? "").trim().toLowerCase();
  if (env === "1" || env === "true") return true;
  if (env === "0" || env === "false") return false;
  return process.env["NODE_ENV"] === "production";
}

type Candidate = {
  userId: string;
  registrationId: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  bucket: string; // h24 | h72 (P1) · h48 | h120 (P2)
  dedupeKey: string;
  template: string;
};

export type ReminderSweepResult = {
  dryRun: boolean;
  p1Candidates: number;
  p1Sent: number;
  p2Candidates: number;
  p2Sent: number;
};

/* P1: registered but Phase 1 payment still pending.
   Windows: h24 = 24–72h after registration, h72 = 72h–7d. Older rows: never. */
async function findP1Candidates(now: number): Promise<Candidate[]> {
  // SQL-bounded to the reminder horizon (7 days): abandoned registrations
  // accumulate forever, so without this bound the sweep would eventually
  // load the whole abandonment history on every tick.
  const rows = await db.select({ reg: registrationsTable, user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(and(
      eq(registrationsTable.phase1Status, "pending"),
      gte(registrationsTable.createdAt, new Date(now - 168 * HOUR_MS)),
    ));
  if (!rows.length) return [];

  const ids = rows.map(r => r.reg.id);
  const paidSet = new Set<string>();
  const pays = await db.select({ registrationId: phase1PaymentsTable.registrationId, status: phase1PaymentsTable.status })
    .from(phase1PaymentsTable)
    .where(inArray(phase1PaymentsTable.registrationId, ids));
  for (const p of pays) if (isPaid(p.status)) paidSet.add(p.registrationId);

  const out: Candidate[] = [];
  for (const { reg, user } of rows) {
    // Paid but status not yet synced — the reconcile sweep will fix it; never nag a payer.
    if (paidSet.has(reg.id)) continue;
    const age = now - reg.createdAt.getTime();
    let bucket: string | null = null;
    if (age >= 24 * HOUR_MS && age < 72 * HOUR_MS) bucket = "h24";
    else if (age >= 72 * HOUR_MS && age < 168 * HOUR_MS) bucket = "h72";
    if (!bucket) continue;
    out.push({
      userId: user.id,
      registrationId: reg.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: reg.trialCity,
      bucket,
      dedupeKey: "p1_pay_reminder_" + reg.id + "_" + bucket,
      template: "p1_payment_reminder_" + bucket,
    });
  }
  return out;
}

/* P2: Phase 1 cleared (result released) but Phase 2 payment still pending.
   Anchor = evaluation.resultReleasedAt — legacy rows without a release
   timestamp are skipped (no anchor means no safe window, and a blast to
   old "selected" rows on first deploy is exactly what we must avoid).
   Windows: h48 = 2–5 days after release, h120 = 5–10 days. */
async function findP2Candidates(now: number): Promise<Candidate[]> {
  const rows = await db.select({ reg: registrationsTable, user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(and(
      eq(registrationsTable.phase1Status, "selected"),
      or(isNull(registrationsTable.phase2Status), eq(registrationsTable.phase2Status, "pending")),
    ));
  if (!rows.length) return [];

  const ids = rows.map(r => r.reg.id);
  const paidSet = new Set<string>();
  const pays = await db.select({ registrationId: phase2PaymentsTable.registrationId, status: phase2PaymentsTable.status })
    .from(phase2PaymentsTable)
    .where(inArray(phase2PaymentsTable.registrationId, ids));
  for (const p of pays) if (isPaid(p.status)) paidSet.add(p.registrationId);

  const evs = await db.select({
    registrationId: phase1EvaluationsTable.registrationId,
    resultReleasedAt: phase1EvaluationsTable.resultReleasedAt,
  })
    .from(phase1EvaluationsTable)
    .where(inArray(phase1EvaluationsTable.registrationId, ids))
    .orderBy(desc(phase1EvaluationsTable.attemptNumber));
  const releasedAt = new Map<string, Date>();
  for (const e of evs) {
    if (!releasedAt.has(e.registrationId) && e.resultReleasedAt) releasedAt.set(e.registrationId, e.resultReleasedAt);
  }

  const out: Candidate[] = [];
  for (const { reg, user } of rows) {
    if (paidSet.has(reg.id)) continue;
    const anchor = releasedAt.get(reg.id);
    if (!anchor) continue;
    const age = now - anchor.getTime();
    let bucket: string | null = null;
    if (age >= 48 * HOUR_MS && age < 120 * HOUR_MS) bucket = "h48";
    else if (age >= 120 * HOUR_MS && age < 240 * HOUR_MS) bucket = "h120";
    if (!bucket) continue;
    out.push({
      userId: user.id,
      registrationId: reg.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: reg.trialCity,
      bucket,
      dedupeKey: "p2_pay_reminder_" + reg.id + "_" + bucket,
      template: "p2_payment_reminder_" + bucket,
    });
  }
  return out;
}

/** Reserve the dedupe key, then send email + SMS. Returns true only when at
 *  least one channel went out. Total failure marks the reserved row `failed`
 *  (visible in the player's communication timeline) — it is NOT retried:
 *  the key stays reserved so a flaky provider can never cause double sends. */
async function deliver(c: Candidate, phase: 1 | 2): Promise<boolean> {
  const reserved = await db.insert(notificationLogsTable)
    .values({ userId: c.userId, type: "email", template: c.template, dedupeKey: c.dedupeKey })
    .onConflictDoNothing()
    .returning({ id: notificationLogsTable.id });
  if (!reserved.length || !reserved[0]) return false; // another tick owns this key

  const email = phase === 1
    ? tplPhase1PaymentReminder(c.name, c.city ?? "", c.bucket === "h72")
    : tplPhase2PaymentReminder(c.name);
  const smsText = phase === 1
    ? "BCPL T20: Your registration is saved but Phase 1 payment is pending. Complete it at bcplt20.com to get your Player ID. -BCPL T20"
    : "BCPL T20: Phase 1 cleared! Your Phase 2 payment is pending. Complete it at bcplt20.com to continue to KYC and trials. -BCPL T20";

  const [em, sm] = await Promise.allSettled([
    sendEmail({ to: c.email, toName: c.name, subject: email.subject, htmlContent: email.htmlContent }),
    sendSms(c.phone, smsText),
  ]);
  const emOk = em.status === "fulfilled" && em.value.ok;
  const smOk = sm.status === "fulfilled" && sm.value.ok;

  if (!emOk && !smOk) {
    const detail =
      (em.status === "fulfilled" ? em.value.error : String(em.reason)) ??
      (sm.status === "fulfilled" ? sm.value.error : String(sm.reason)) ??
      "all channels failed";
    await db.update(notificationLogsTable)
      .set({ status: "failed", error: String(detail).slice(0, 500) })
      .where(eq(notificationLogsTable.id, reserved[0].id));
    logger.error({ registrationId: c.registrationId, template: c.template, detail }, "payment reminder failed on all channels");
    return false;
  }
  logger.info({ registrationId: c.registrationId, template: c.template, emOk, smOk }, "payment reminder sent");
  return true;
}

export async function sendPaymentReminders(opts?: { dryRun?: boolean }): Promise<ReminderSweepResult> {
  const dryRun = opts?.dryRun ?? !remindersEnabled();
  const now = Date.now();
  const p1 = await findP1Candidates(now);
  const p2 = await findP2Candidates(now);

  // Drop candidates whose dedupe key already exists (already reminded).
  const keys = [...p1, ...p2].map(c => c.dedupeKey);
  const existing = new Set<string>();
  if (keys.length) {
    const seen = await db.select({ dedupeKey: notificationLogsTable.dedupeKey })
      .from(notificationLogsTable)
      .where(inArray(notificationLogsTable.dedupeKey, keys));
    for (const s of seen) if (s.dedupeKey) existing.add(s.dedupeKey);
  }
  const fresh1 = p1.filter(c => !existing.has(c.dedupeKey));
  const fresh2 = p2.filter(c => !existing.has(c.dedupeKey));

  let p1Sent = 0;
  let p2Sent = 0;
  if (!dryRun) {
    for (const c of fresh1) if (await deliver(c, 1)) p1Sent++;
    for (const c of fresh2) if (await deliver(c, 2)) p2Sent++;
  } else if (fresh1.length || fresh2.length) {
    logger.info(
      { p1: fresh1.map(c => c.dedupeKey), p2: fresh2.map(c => c.dedupeKey) },
      "payment reminders DRY RUN — nothing sent",
    );
  }
  return { dryRun, p1Candidates: fresh1.length, p1Sent, p2Candidates: fresh2.length, p2Sent };
}

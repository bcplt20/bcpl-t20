/**
 * Task #75 — the KYC manual-review reminder sweep.
 *
 * Task #73 alerts the admin ONCE when a KYC parks for manual review. If that
 * KYC is still unreviewed after 24 hours the sweep must resurface it to the
 * admin — but EXACTLY once, never a per-tick blast.
 *
 * Email is fully mocked (no Brevo call can fire — real keys are live in dev);
 * the DB is real. We seed a parked KYC, back-date it past the 24h window, and
 * assert:
 *   • a KYC parked <24h is NOT a candidate,
 *   • a KYC parked >24h fires exactly ONE reminder,
 *   • repeated sweeps never re-send (reserve-first dedupe per kyc-record),
 *   • a verified KYC is never reminded.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { eq, and } from "drizzle-orm";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";
process.env.ADMIN_ALERT_EMAIL = "admin-alert@test.bcpl";

const email = vi.hoisted(() => ({ sent: [] as { to: string; subject: string }[] }));

vi.mock("../src/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/email")>();
  return {
    ...actual,
    sendEmail: vi.fn(async (p: { to: string; subject: string }) => {
      email.sent.push({ to: p.to, subject: p.subject });
      return { ok: true as const };
    }),
  };
});

const { sendKycManualReviewReminders } = await import("../src/lib/kycReminders");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, kycRecordsTable, notificationLogsTable } =
  await import("@workspace/db/schema");

const suffix = String(Date.now()).slice(-7);
const phone = "93" + String(Date.now()).slice(-8);
const userEmail = "kycrem-" + suffix + "@test.bcpl";

let userId = "";
let regId = "";
let kycId = "";

const HOUR_MS = 60 * 60 * 1000;

async function setKycAge(hours: number) {
  await db.update(kycRecordsTable)
    .set({ createdAt: new Date(Date.now() - hours * HOUR_MS) })
    .where(eq(kycRecordsTable.id, kycId));
}

async function reminderLogs() {
  return db.select().from(notificationLogsTable).where(and(
    eq(notificationLogsTable.userId, userId),
    eq(notificationLogsTable.template, "kyc_manual_review_reminder"),
  ));
}

beforeAll(async () => {
  [{ id: userId }] = await db.insert(usersTable)
    .values({ name: "KYC Reminder Test", phone, email: userEmail, isVerified: true })
    .returning({ id: usersTable.id });
  [{ id: regId }] = await db.insert(registrationsTable)
    .values({ userId, role: "bat", trialCity: "Delhi", phase2Status: "payment_done" })
    .returning({ id: registrationsTable.id });
  // PAN could not be auto-verified → parked for manual review (Task #73 state).
  [{ id: kycId }] = await db.insert(kycRecordsTable).values({
    registrationId: regId,
    profession: "Salaried Employee",
    panRef: "manual_review_" + suffix,
    aadhaarRef: "manual_review_" + suffix,
    panVerified: false,
    aadhaarVerified: false,
    status: "pending",
  }).returning({ id: kycRecordsTable.id });
});

afterAll(async () => {
  if (userId) await db.delete(notificationLogsTable).where(eq(notificationLogsTable.userId, userId));
  if (kycId) await db.delete(kycRecordsTable).where(eq(kycRecordsTable.id, kycId));
  if (regId) await db.delete(registrationsTable).where(eq(registrationsTable.id, regId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
  vi.restoreAllMocks();
});

describe("KYC manual-review 24h reminder sweep", () => {
  // The dev DB is shared: other parked KYC rows may exist, so we assert on
  // OUR record's effects (email to our record + our dedupe log rows), never on
  // the global candidate count.
  const myDedupe = () => "kyc_manual_review_reminder_" + kycId;

  it("does NOT remind a KYC parked less than 24h ago", async () => {
    email.sent.length = 0;
    await setKycAge(2); // 2h old — inside the promised window
    await sendKycManualReviewReminders({ dryRun: false });
    // Our record produced no reminder row.
    expect((await reminderLogs()).length).toBe(0);
  });

  it("sends EXACTLY ONE reminder once the KYC is older than 24h", async () => {
    email.sent.length = 0;
    await setKycAge(30); // 30h old — past the 24h window
    await sendKycManualReviewReminders({ dryRun: false });
    // Exactly one reserved+sent notification_logs row for OUR record.
    const logs = await reminderLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]!.status).toBe("sent");
    expect(logs[0]!.dedupeKey).toBe(myDedupe());
    // The reminder email carries the REMINDER subject and goes to the admin.
    expect(email.sent.some(e => e.to === "admin-alert@test.bcpl" && /reminder/i.test(e.subject))).toBe(true);
  });

  it("never re-sends on repeated sweeps (reserve-first dedupe per kyc-record)", async () => {
    // Three more ticks — still parked, still >24h.
    await sendKycManualReviewReminders({ dryRun: false });
    await sendKycManualReviewReminders({ dryRun: false });
    await sendKycManualReviewReminders({ dryRun: false });
    // Still exactly ONE reminder row for our record, ever.
    expect((await reminderLogs()).length).toBe(1);
  });

  it("stops treating the KYC as a candidate once it is verified", async () => {
    // Fresh state: verified + clear the dedupe row so the query decides alone.
    await db.update(kycRecordsTable)
      .set({ status: "verified", panVerified: true, aadhaarVerified: true })
      .where(eq(kycRecordsTable.id, kycId));
    await db.delete(notificationLogsTable).where(eq(notificationLogsTable.userId, userId));
    await sendKycManualReviewReminders({ dryRun: false });
    expect((await reminderLogs()).length).toBe(0); // never reminded a verified KYC
  });

  it("dry run sends nothing for our record", async () => {
    await db.update(kycRecordsTable)
      .set({ status: "pending", panVerified: false })
      .where(eq(kycRecordsTable.id, kycId));
    await db.delete(notificationLogsTable).where(eq(notificationLogsTable.userId, userId));
    await setKycAge(30);
    const r = await sendKycManualReviewReminders({ dryRun: true });
    expect(r.dryRun).toBe(true);
    expect((await reminderLogs()).length).toBe(0); // dry run never writes a log row
  });
});

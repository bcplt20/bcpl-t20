/**
 * Task #76 — the KYC manual-review admin alert must fire EXACTLY ONCE even
 * when systems race.
 *
 * Task #73 alerts the admin on the transition INTO manual review. Two code
 * paths can independently verify Aadhaar for the same parked KYC:
 *   • the player's POST /api/kyc/verify-otp, and
 *   • Cashfree's POST /api/kyc/webhook (backup channel).
 * Both use the SAME atomic conditional UPDATE (aadhaar_verified false→true)
 * transition guard, so only the caller that actually flips the row may alert.
 * This test fires BOTH concurrently against one parked KYC (PAN unverified,
 * Aadhaar not yet verified) and asserts the DB END-STATE: exactly ONE
 * kyc_manual_review notification_logs row — not a count of how many handlers
 * happened to run.
 *
 * No real provider send can fire: sendEmail / sendSms / sendWhatsApp are all
 * mocked, and the Cashfree Aadhaar verify is mocked to succeed.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { eq, and } from "drizzle-orm";
import crypto from "node:crypto";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";
process.env.JWT_SECRET = process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD";
process.env.ADMIN_ALERT_EMAIL = "admin-alert@test.bcpl";
process.env.CF_VERIFY_SECRET = "race-webhook-secret";

// Count only the admin manual-review alert emails (subject prefix is stable).
const alerts = vi.hoisted(() => ({ count: 0 }));

vi.mock("../src/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/email")>();
  return {
    ...actual,
    sendEmail: vi.fn(async (p: { subject: string }) => {
      if (/manual review/i.test(p.subject)) alerts.count++;
      return { ok: true as const };
    }),
  };
});

// Player Aadhaar OTP verification succeeds (verify-otp path wins its check).
vi.mock("../src/lib/cashfree", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/cashfree")>();
  return {
    ...actual,
    verifyAadhaarOtp: vi.fn(async () => ({ valid: true, referenceId: "race-ref" })),
  };
});

// KYC-complete notify (never reached here — PAN unverified keeps it pending —
// but mock defensively so nothing can send).
vi.mock("../src/lib/sms", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/sms")>();
  return { ...actual, sendSms: vi.fn(async () => ({ ok: true as const })) };
});
vi.mock("../src/lib/whatsapp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/whatsapp")>();
  return { ...actual, sendWhatsApp: vi.fn(async () => ({ ok: true as const })), WA: actual.WA };
});

const request = (await import("supertest")).default;
const { default: app } = await import("../src/app");
const { signToken } = await import("../src/lib/auth");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, kycRecordsTable, notificationLogsTable } =
  await import("@workspace/db/schema");

const suffix = String(Date.now()).slice(-7);
const phone = "92" + String(Date.now()).slice(-8);
const userEmail = "kycrace-" + suffix + "@test.bcpl";
const aadhaarRef = "race-ref-" + suffix;

let userId = "";
let regId = "";
let kycId = "";
let token = "";

function signWebhook(body: unknown) {
  const ts = String(Date.now());
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac("sha256", process.env.CF_VERIFY_SECRET!)
    .update(ts + raw).digest("base64");
  return { ts, raw, sig };
}

async function alertLogs() {
  return db.select().from(notificationLogsTable).where(and(
    eq(notificationLogsTable.userId, userId),
    eq(notificationLogsTable.template, "kyc_manual_review"),
  ));
}

beforeAll(async () => {
  [{ id: userId }] = await db.insert(usersTable)
    .values({ name: "KYC Race Test", phone, email: userEmail, isVerified: true })
    .returning({ id: usersTable.id });
  token = signToken({ userId, phone });
  [{ id: regId }] = await db.insert(registrationsTable)
    .values({ userId, role: "bat", trialCity: "Delhi", phase2Status: "payment_done" })
    .returning({ id: registrationsTable.id });
  // Parked: PAN could not be auto-verified, Aadhaar not yet verified.
  [{ id: kycId }] = await db.insert(kycRecordsTable).values({
    registrationId: regId,
    profession: "Salaried Employee",
    panRef: "manual_review_" + suffix,
    aadhaarRef,
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

describe("KYC manual-review alert — exactly once under a verify-otp vs webhook race", () => {
  it("fires ONE admin alert and ends with the Aadhaar verified", async () => {
    alerts.count = 0;

    const webhookBody = { reference_id: aadhaarRef, status: "VALID" };
    const { ts, raw, sig } = signWebhook(webhookBody);

    // Fire BOTH transition attempts concurrently.
    const [otpRes, hookRes] = await Promise.all([
      request(app)
        .post("/api/kyc/verify-otp")
        .set("authorization", "Bearer " + token)
        .send({ registrationId: regId, aadhaarRefId: aadhaarRef, otp: "123456" }),
      request(app)
        .post("/api/kyc/webhook")
        .set("x-webhook-signature", sig)
        .set("x-webhook-timestamp", ts)
        .set("content-type", "application/json")
        .send(raw),
    ]);

    // Both handlers accepted the request.
    expect(otpRes.status).toBe(200);
    expect(hookRes.status).toBe(200);

    // The alert email is fire-and-forget; give the background sends a moment.
    await new Promise(r => setTimeout(r, 400));

    // DB END-STATE: the Aadhaar transition happened exactly once and the KYC
    // stayed pending (PAN still needs manual review).
    const [kyc] = await db.select().from(kycRecordsTable).where(eq(kycRecordsTable.id, kycId));
    expect(kyc!.aadhaarVerified).toBe(true);
    expect(kyc!.status).toBe("pending");

    // DB END-STATE: exactly ONE admin manual-review alert row for this KYC.
    const logs = await alertLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]!.status).toBe("sent");
    expect(logs[0]!.dedupeKey).toBe("kyc_manual_review_alert_" + regId);

    // And exactly ONE alert email actually went out.
    expect(alerts.count).toBe(1);
  });
});

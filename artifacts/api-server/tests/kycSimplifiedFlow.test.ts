/**
 * Task #57 — regression lock on the CURRENT simplified Phase-2 KYC server
 * contract, so future form/schema changes can't silently break it.
 *
 * Covers the two endpoints the simplified form drives:
 *   1. POST /api/kyc/initiate — happy path (PAN auto-verifies + Aadhaar OTP is
 *      sent), and the required-field enforcement (T-shirt size + emergency
 *      contact) the form now always sends. Blood group stays optional.
 *   2. POST /api/kyc/aadhaar-otp — the "Resend OTP" endpoint: (re)issues the
 *      Aadhaar OTP WITHOUT re-billing PAN, enforces its per-registration
 *      cooldown (429), and short-circuits when Aadhaar is already verified.
 *
 * All Cashfree provider calls are mocked — no billed vendor call, no real
 * MSG91/Brevo send. The DB is real (each run uses a fresh user/registration).
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";
process.env.JWT_SECRET = process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD";

// Provider mocks — deterministic, no network, no billing.
const cf = vi.hoisted(() => ({ otpCalls: 0 }));
vi.mock("../src/lib/cashfree", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/cashfree")>();
  return {
    ...actual,
    verifyPan: vi.fn(async () => ({ outcome: "valid" as const, name: "KYC Flow Test", referenceId: "pan-ref-ok" })),
    initiateAadhaarOtp: vi.fn(async () => { cf.otpCalls++; return { referenceId: "aadhaar-ref-" + cf.otpCalls }; }),
    verifyAadhaarOtp: vi.fn(async () => ({ valid: true as const, referenceId: "aadhaar-ref" })),
  };
});
// Belt-and-suspenders: no player notification can escape.
vi.mock("../src/lib/sms", async (o) => ({ ...(await o<typeof import("../src/lib/sms")>()), sendSms: vi.fn(async () => ({ ok: true as const })) }));
vi.mock("../src/lib/email", async (o) => ({ ...(await o<typeof import("../src/lib/email")>()), sendEmail: vi.fn(async () => ({ ok: true as const })) }));
vi.mock("../src/lib/whatsapp", async (o) => { const a = await o<typeof import("../src/lib/whatsapp")>(); return { ...a, sendWhatsApp: vi.fn(async () => ({ ok: true as const })), WA: a.WA }; });

const request = (await import("supertest")).default;
const { default: app } = await import("../src/app");
const { signToken } = await import("../src/lib/auth");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, kycRecordsTable, playerProfilesTable } =
  await import("@workspace/db/schema");

const suffix = String(Date.now()).slice(-7);
const phone = "91" + String(Date.now()).slice(-8);
const userEmail = "kycflow-" + suffix + "@test.bcpl";

let userId = "";
let regId = "";
let token = "";

const validBody = () => ({
  registrationId: regId,
  profession: "Salaried Employee",
  aadhaarNumber: "123456789012",
  panNumber: "ABCDE1234F",
  tshirtSize: "L",
  emergencyName: "Jane Doe",
  emergencyPhone: "9876543210",
});

const auth = (r: import("supertest").Test) => r.set("authorization", "Bearer " + token);

beforeAll(async () => {
  [{ id: userId }] = await db.insert(usersTable)
    .values({ name: "KYC Flow Test", phone, email: userEmail, isVerified: true })
    .returning({ id: usersTable.id });
  token = signToken({ userId, phone });
  [{ id: regId }] = await db.insert(registrationsTable)
    .values({ userId, role: "bat", trialCity: "Delhi", phase2Status: "payment_done" })
    .returning({ id: registrationsTable.id });
});

afterAll(async () => {
  if (regId) await db.delete(playerProfilesTable).where(eq(playerProfilesTable.registrationId, regId));
  if (regId) await db.delete(kycRecordsTable).where(eq(kycRecordsTable.registrationId, regId));
  if (regId) await db.delete(registrationsTable).where(eq(registrationsTable.id, regId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
  vi.restoreAllMocks();
});

describe("POST /api/kyc/initiate — simplified form happy path", () => {
  it("rejects a submission missing the required T-shirt size (400)", async () => {
    const { tshirtSize, ...noTshirt } = validBody();
    const res = await auth(request(app).post("/api/kyc/initiate")).send(noTshirt);
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/T-shirt size/i);
  });

  it("rejects a submission missing the emergency contact (400)", async () => {
    const { emergencyName, emergencyPhone, ...noEmergency } = validBody();
    const res = await auth(request(app).post("/api/kyc/initiate")).send(noEmergency);
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/emergency contact/i);
  });

  it("accepts a valid submission: PAN verified + OTP sent, profile persisted (blood group optional)", async () => {
    const res = await auth(request(app).post("/api/kyc/initiate")).send(validBody());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("OTP_SENT");
    expect(res.body.panVerified).toBe(true);
    expect(res.body.aadhaarRefId).toBeTruthy();

    // KYC row created, PAN verified, Aadhaar not yet verified, still pending.
    const [kyc] = await db.select().from(kycRecordsTable).where(eq(kycRecordsTable.registrationId, regId));
    expect(kyc!.panVerified).toBe(true);
    expect(kyc!.aadhaarVerified).toBe(false);
    expect(kyc!.status).toBe("pending");

    // Required profile fields stored; optional blood group left null.
    const [profile] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.registrationId, regId));
    expect(profile!.tshirtSize).toBe("L");
    expect(profile!.emergencyName).toBe("Jane Doe");
    expect(profile!.emergencyPhone).toBe("9876543210");
    expect(profile!.bloodGroup).toBeNull();
  });

  it("accepts an optional blood group when provided", async () => {
    const res = await auth(request(app).post("/api/kyc/initiate")).send({ ...validBody(), bloodGroup: "O+" });
    expect(res.status).toBe(200);
    const [profile] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.registrationId, regId));
    expect(profile!.bloodGroup).toBe("O+");
  });
});

describe("POST /api/kyc/aadhaar-otp — Resend OTP endpoint", () => {
  it("re-issues the OTP without re-billing PAN and returns the new ref", async () => {
    const before = cf.otpCalls;
    const res = await auth(request(app).post("/api/kyc/aadhaar-otp"))
      .send({ registrationId: regId, aadhaarNumber: "123456789012" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OTP_SENT");
    expect(res.body.aadhaarRefId).toBeTruthy();
    expect(cf.otpCalls).toBe(before + 1); // OTP re-sent; PAN NOT re-verified
  });

  it("enforces a validation error on a malformed Aadhaar number (400)", async () => {
    const res = await auth(request(app).post("/api/kyc/aadhaar-otp"))
      .send({ registrationId: regId, aadhaarNumber: "12345" });
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/aadhaar/i);
  });

  it("throttles repeated resends per registration with 429 (cooldown)", async () => {
    // The endpoint caps billed vendor calls at 6 per 10-min window per
    // registration. Prior tests already consumed some of the budget, so keep
    // hitting until it flips to 429 — proving the cooldown is enforced.
    let saw429 = false;
    for (let i = 0; i < 8; i++) {
      const res = await auth(request(app).post("/api/kyc/aadhaar-otp"))
        .send({ registrationId: regId, aadhaarNumber: "123456789012" });
      if (res.status === 429) { saw429 = true; expect(String(res.body.error)).toMatch(/wait/i); break; }
      expect(res.status).toBe(200);
    }
    expect(saw429).toBe(true);
  });

  it("short-circuits (no OTP send) once Aadhaar is already verified", async () => {
    await db.update(kycRecordsTable).set({ aadhaarVerified: true }).where(eq(kycRecordsTable.registrationId, regId));
    const before = cf.otpCalls;
    const res = await auth(request(app).post("/api/kyc/aadhaar-otp"))
      .send({ registrationId: regId, aadhaarNumber: "123456789012" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("AADHAAR_DONE");
    expect(cf.otpCalls).toBe(before); // no vendor call — already done
  });
});

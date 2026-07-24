/**
 * Task #32 — backfill of T-shirt size / emergency contact for players who
 * completed KYC BEFORE those fields were collected on the KYC page.
 *
 *   GET  /api/user/profile-completion — needsBackfill is true only when KYC is
 *        done AND the required profile fields are blank.
 *   POST /api/user/profile-backfill   — accepts ONLY the missing fields,
 *        validates like the KYC page (T-shirt + emergency required, blood group
 *        optional), and upserts the profile. No provider send happens here.
 *
 * No SMS/email path exists in these endpoints, but we mock the providers
 * defensively so nothing can ever fire. DB is real.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";
process.env.JWT_SECRET = process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD";

vi.mock("../src/lib/sms", async (o) => ({ ...(await o<typeof import("../src/lib/sms")>()), sendSms: vi.fn(async () => ({ ok: true as const })) }));
vi.mock("../src/lib/email", async (o) => ({ ...(await o<typeof import("../src/lib/email")>()), sendEmail: vi.fn(async () => ({ ok: true as const })) }));

const request = (await import("supertest")).default;
const { default: app } = await import("../src/app");
const { signToken } = await import("../src/lib/auth");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, kycRecordsTable, playerProfilesTable } =
  await import("@workspace/db/schema");

const suffix = String(Date.now()).slice(-7);
const phone = "90" + String(Date.now()).slice(-8);
const userEmail = "backfill-" + suffix + "@test.bcpl";

let userId = "";
let regId = "";
let token = "";

const auth = (r: import("supertest").Test) => r.set("authorization", "Bearer " + token);

beforeAll(async () => {
  [{ id: userId }] = await db.insert(usersTable)
    .values({ name: "Backfill Test", phone, email: userEmail, isVerified: true })
    .returning({ id: usersTable.id });
  token = signToken({ userId, phone });
  [{ id: regId }] = await db.insert(registrationsTable)
    .values({ userId, role: "bat", trialCity: "Delhi", phase2Status: "kyc_done" })
    .returning({ id: registrationsTable.id });
  // KYC verified but NO player_profiles row → pre-change player.
  await db.insert(kycRecordsTable).values({
    registrationId: regId, profession: "Salaried Employee",
    panRef: "pan-ok", aadhaarRef: "aadhaar-ok",
    panVerified: true, aadhaarVerified: true, status: "verified",
  });
});

afterAll(async () => {
  if (regId) await db.delete(playerProfilesTable).where(eq(playerProfilesTable.registrationId, regId));
  if (regId) await db.delete(kycRecordsTable).where(eq(kycRecordsTable.registrationId, regId));
  if (regId) await db.delete(registrationsTable).where(eq(registrationsTable.id, regId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
  vi.restoreAllMocks();
});

describe("GET /api/user/profile-completion", () => {
  it("flags needsBackfill for a KYC-done player with no profile", async () => {
    const res = await auth(request(app).get("/api/user/profile-completion"));
    expect(res.status).toBe(200);
    expect(res.body.kycDone).toBe(true);
    expect(res.body.profileComplete).toBe(false);
    expect(res.body.needsBackfill).toBe(true);
  });
});

describe("POST /api/user/profile-backfill", () => {
  it("rejects a payload missing the required T-shirt size (400)", async () => {
    const res = await auth(request(app).post("/api/user/profile-backfill"))
      .send({ emergencyName: "Jane", emergencyPhone: "9876543210" });
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/T-shirt/i);
  });

  it("rejects an invalid emergency phone (400)", async () => {
    const res = await auth(request(app).post("/api/user/profile-backfill"))
      .send({ tshirtSize: "L", emergencyName: "Jane", emergencyPhone: "123" });
    expect(res.status).toBe(400);
  });

  it("saves the missing fields and marks the profile complete", async () => {
    const res = await auth(request(app).post("/api/user/profile-backfill"))
      .send({ tshirtSize: "M", emergencyName: "Jane Doe", emergencyRelation: "Sister", emergencyPhone: "9876543210", bloodGroup: "B+" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [profile] = await db.select().from(playerProfilesTable).where(eq(playerProfilesTable.registrationId, regId));
    expect(profile!.tshirtSize).toBe("M");
    expect(profile!.emergencyName).toBe("Jane Doe");
    expect(profile!.emergencyRelation).toBe("Sister");
    expect(profile!.emergencyPhone).toBe("9876543210");
    expect(profile!.bloodGroup).toBe("B+");

    // Completion now reports complete + no backfill needed.
    const done = await auth(request(app).get("/api/user/profile-completion"));
    expect(done.body.profileComplete).toBe(true);
    expect(done.body.needsBackfill).toBe(false);
  });

  it("blocks backfill for a player whose KYC is NOT done (400)", async () => {
    // New user with no KYC.
    const p2 = "89" + String(Date.now()).slice(-8);
    const [{ id: uid2 }] = await db.insert(usersTable)
      .values({ name: "No KYC", phone: p2, email: "nokyc-" + suffix + "@test.bcpl", isVerified: true })
      .returning({ id: usersTable.id });
    const [{ id: rid2 }] = await db.insert(registrationsTable)
      .values({ userId: uid2, role: "bat", trialCity: "Delhi", phase2Status: "payment_done" })
      .returning({ id: registrationsTable.id });
    const tok2 = signToken({ userId: uid2, phone: p2 });
    const res = await request(app).post("/api/user/profile-backfill")
      .set("authorization", "Bearer " + tok2)
      .send({ tshirtSize: "L", emergencyName: "Jane", emergencyPhone: "9876543210" });
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/kyc/i);

    await db.delete(registrationsTable).where(eq(registrationsTable.id, rid2));
    await db.delete(usersTable).where(eq(usersTable.id, uid2));
  });
});

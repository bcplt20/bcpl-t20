/**
 * Registration drafts — server-side autosave for incomplete registrations.
 *
 * Covers (owner spec sections 2/3/4):
 *  - upsert creates REG-DRAFT-XXXXXX drafts; status derivation ladder
 *  - client can NEVER set otp / mobileVerified / status (zod strips them)
 *  - resume returns saved fields by clientKey
 *  - OTP verify hook (auth.ts) sets mobileVerified + links user
 *  - /register/phase1 hook links registrationId (PROFILE_COMPLETE)
 *  - payment hooks flip PAYMENT_PENDING → PHASE1_ACTIVE (converted)
 *  - sweep marks stale drafts ABANDONED, spares PHASE1_ACTIVE; activity revives
 *  - admin list + status filter + auth gate; rate limiter caps bursts
 *
 * OTP rows are seeded directly in otp_sessions — send-otp is never called,
 * so no real SMS can fire from this suite (MSG91 keys are live in dev).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq, like } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { registrationDraftsTable, usersTable, registrationsTable, otpSessionsTable } =
  await import("@workspace/db/schema");
const { ensureDraftsTable, draftOnPaymentEvent } = await import("../src/routes/drafts");

const admin = { "x-bcpl-admin": TEST_ADMIN_SECRET };
const suffix = String(Date.now()).slice(-7);
const key = (s: string) => `drafttest-${s}-${suffix}-k0000000000000000`.slice(0, 40);
const phone = "97" + String(Date.now()).slice(-8); // unique, matches ^[6-9]\d{9}$
const email = `draft-${suffix}@test.bcpl`;

let userToken = "";
let userId = "";
let regId = "";

beforeAll(async () => {
  await ensureDraftsTable();
});

afterAll(async () => {
  await db.delete(registrationDraftsTable)
    .where(like(registrationDraftsTable.clientKey, `drafttest-%${suffix}%`));
  if (userId) await db.delete(registrationsTable).where(eq(registrationsTable.userId, userId));
  await db.delete(otpSessionsTable).where(eq(otpSessionsTable.phone, phone));
  await db.delete(usersTable).where(eq(usersTable.phone, phone));
});

describe("drafts: autosave + status derivation", () => {
  it("creates a draft with a REG-DRAFT number", async () => {
    const r = await request(app).post("/api/drafts/upsert")
      .send({ clientKey: key("a"), fullName: "Draft Tester" });
    expect(r.status).toBe(200);
    expect(r.body.draftNumber).toMatch(/^REG-DRAFT-[A-HJ-KM-NP-Z2-9]{6}$/);
    expect(r.body.status).toBe("DRAFT_STARTED");
  });

  it("contact fields advance status; otp/verified/status keys from client are discarded", async () => {
    const r = await request(app).post("/api/drafts/upsert").send({
      clientKey: key("a"), phone,
      otp: "123456", mobileVerified: true, status: "PHASE1_ACTIVE", registrationId: "x",
    });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("CONTACT_ENTERED"); // client escalation ignored
    expect(r.body.mobileVerified).toBe(false);
  });

  it("otpRequested flag moves draft to OTP_PENDING", async () => {
    const r = await request(app).post("/api/drafts/upsert")
      .send({ clientKey: key("a"), otpRequested: true });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("OTP_PENDING");
  });

  it("resume returns saved fields by clientKey", async () => {
    const r = await request(app).get("/api/drafts/resume").query({ clientKey: key("a") });
    expect(r.status).toBe(200);
    expect(r.body.fullName).toBe("Draft Tester");
    expect(r.body.phone).toBe(phone);
    expect(r.body.status).toBe("OTP_PENDING");
    expect(r.body.mobileVerified).toBe(false);
  });

  it("rejects malformed clientKey", async () => {
    const r = await request(app).post("/api/drafts/upsert")
      .send({ clientKey: "short", fullName: "X" });
    expect(r.status).toBe(400);
  });
});

describe("drafts: OTP + registration hooks", () => {
  it("verify-otp hook sets mobileVerified and links user", async () => {
    await db.insert(otpSessionsTable).values({
      phone, otpCode: "123456", purpose: "register",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    const r = await request(app).post("/api/auth/verify-otp").send({
      phone, otp: "123456", purpose: "register",
      name: "Draft Tester", email, draftKey: key("a"),
    });
    expect(r.status).toBe(200);
    userToken = r.body.token;
    userId = r.body.user.id;

    const g = await request(app).get("/api/drafts/resume").query({ clientKey: key("a") });
    expect(g.body.mobileVerified).toBe(true);
    expect(g.body.status).toBe("OTP_VERIFIED");
  });

  it("register/phase1 hook links registration (PROFILE_COMPLETE)", async () => {
    const r = await request(app).post("/api/register/phase1")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ role: "bat", trialCity: "Delhi", dob: "2000-01-15" });
    expect(r.status).toBe(200);
    regId = r.body.registrationId;

    const g = await request(app).get("/api/drafts/resume").query({ clientKey: key("a") });
    expect(g.body.status).toBe("PROFILE_COMPLETE");
    const [row] = await db.select().from(registrationDraftsTable)
      .where(eq(registrationDraftsTable.clientKey, key("a"))).limit(1);
    expect(row.registrationId).toBe(regId);
    expect(row.userId).toBe(userId);
  });

  it("payment hooks: INITIATED → PAYMENT_PENDING, SUCCESS → PHASE1_ACTIVE (converted)", async () => {
    await draftOnPaymentEvent(regId, "INITIATED");
    let g = await request(app).get("/api/drafts/resume").query({ clientKey: key("a") });
    expect(g.body.status).toBe("PAYMENT_PENDING");
    expect(g.body.phase1PaymentStatus).toBe("INITIATED");

    await draftOnPaymentEvent(regId, "SUCCESS");
    g = await request(app).get("/api/drafts/resume").query({ clientKey: key("a") });
    expect(g.body.converted).toBe(true);
    expect(g.body.status).toBe("PHASE1_ACTIVE");

    // further autosaves are no-ops on a converted draft
    const u = await request(app).post("/api/drafts/upsert")
      .send({ clientKey: key("a"), fullName: "Changed" });
    expect(u.body.converted).toBe(true);

    // SUCCESS never downgrades
    await draftOnPaymentEvent(regId, "FAILED");
    const [row] = await db.select().from(registrationDraftsTable)
      .where(eq(registrationDraftsTable.clientKey, key("a"))).limit(1);
    expect(row.phase1PaymentStatus).toBe("SUCCESS");
  });
});

describe("drafts: abandonment sweep + admin", () => {
  it("sweep marks stale drafts ABANDONED but spares PHASE1_ACTIVE", async () => {
    await request(app).post("/api/drafts/upsert")
      .send({ clientKey: key("b"), fullName: "Stale One" });
    const old = new Date(Date.now() - 25 * 3600_000);
    await db.update(registrationDraftsTable).set({ lastActivityAt: old })
      .where(eq(registrationDraftsTable.clientKey, key("b")));
    // aged but converted — must be spared
    await db.update(registrationDraftsTable).set({ lastActivityAt: old })
      .where(eq(registrationDraftsTable.clientKey, key("a")));

    const r = await request(app).post("/api/admin/drafts/sweep-abandoned")
      .set(admin).send({ hours: 24 });
    expect(r.status).toBe(200);
    expect(r.body.marked).toBeGreaterThanOrEqual(1);

    const [b] = await db.select().from(registrationDraftsTable)
      .where(eq(registrationDraftsTable.clientKey, key("b"))).limit(1);
    expect(b.status).toBe("ABANDONED");
    expect(b.abandonedAt).not.toBeNull();
    const [a] = await db.select().from(registrationDraftsTable)
      .where(eq(registrationDraftsTable.clientKey, key("a"))).limit(1);
    expect(a.status).toBe("PHASE1_ACTIVE");
  });

  it("abandoned draft appears in admin list; activity revives it", async () => {
    const list = await request(app).get("/api/admin/drafts")
      .query({ status: "ABANDONED" }).set(admin);
    expect(list.status).toBe(200);
    expect(list.body.counts.ABANDONED).toBeGreaterThanOrEqual(1);
    expect(list.body.drafts.some((d: any) => d.clientKey === key("b"))).toBe(true);

    const u = await request(app).post("/api/drafts/upsert")
      .send({ clientKey: key("b"), email: `stale-${suffix}@test.bcpl` });
    expect(u.body.status).toBe("CONTACT_ENTERED");
    const [b] = await db.select().from(registrationDraftsTable)
      .where(eq(registrationDraftsTable.clientKey, key("b"))).limit(1);
    expect(b.abandonedAt).toBeNull();
  });

  it("admin endpoints reject callers without admin auth", async () => {
    const r = await request(app).get("/api/admin/drafts");
    expect([401, 403]).toContain(r.status);
  });

  it("rate limiter caps autosave bursts per clientKey", async () => {
    let got429 = 0;
    for (let i = 0; i < 35; i++) {
      const r = await request(app).post("/api/drafts/upsert")
        .send({ clientKey: key("rl"), fullName: `Burst ${i}` });
      if (r.status === 429) got429++;
    }
    expect(got429).toBeGreaterThan(0);
  });
});

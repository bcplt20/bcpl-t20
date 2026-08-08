/**
 * Refer & Earn contract (GET /api/user/referral, GET /api/admin/referrals) +
 * attribution / anti-abuse / qualified counts, and computed badges
 * (GET /api/user/badges).
 *
 * Reuses the existing referral plumbing (referral_codes kind='player',
 * referral_signups first-code-wins, phase1_payments = "qualified"). Attribution
 * itself is exercised through POST /api/marketing/attribute.
 */
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { inArray, eq } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const {
  usersTable, registrationsTable, phase1PaymentsTable,
  referralCodesTable, referralSignupsTable, referralRewardGrantsTable,
  phase1VideosTable, phase2PaymentsTable, kycRecordsTable,
} = await import("@workspace/db/schema");
const { signToken } = await import("../src/lib/auth");
const { ensureMarketingTables } = await import("../src/routes/marketing");
const { ensureReferralProgramTables } = await import("../src/routes/referralProgram");

const suffix = String(Date.now()).slice(-7);
const userIds: string[] = [];
const regIds: string[] = [];
const codes: string[] = [];

let seq = 0;
async function mkUser() {
  const n = ++seq;
  const [u] = await db.insert(usersTable).values({
    name: `Ref Test ${suffix}-${n}`,
    phone: `6${suffix}${String(n).padStart(2, "0")}`.slice(0, 12),
    email: `ref-${suffix}-${n}@test.bcpl`,
    isVerified: true,
  }).returning();
  userIds.push(u.id);
  return { user: u, token: signToken({ userId: u.id, phone: u.phone }) };
}

async function mkReg(userId: string, opts: { paid?: boolean } = {}) {
  const [reg] = await db.insert(registrationsTable).values({
    userId, role: "bat", trialCity: "RefCity" + suffix, phase1Status: opts.paid ? "payment_done" : "pending",
  }).returning();
  regIds.push(reg.id);
  if (opts.paid) {
    await db.insert(phase1PaymentsTable).values({
      registrationId: reg.id, amount: "299", status: "success",
      cashfreeOrderId: `p1_${suffix}_${reg.id.slice(0, 8)}`,
    } as typeof phase1PaymentsTable.$inferInsert);
  }
  return reg;
}

// Establish a personal code for a referrer via the referral card endpoint would
// require Phase-1 paid; simpler + deterministic: call GET /api/user/referral
// which lazily creates the BCPL code.
async function getReferralCard(token: string) {
  const res = await request(app).get("/api/user/referral").set("Authorization", `Bearer ${token}`);
  return res;
}

afterAll(async () => {
  if (codes.length) {
    await db.delete(referralRewardGrantsTable).where(inArray(referralRewardGrantsTable.code, codes));
    await db.delete(referralSignupsTable).where(inArray(referralSignupsTable.code, codes));
    await db.delete(referralCodesTable).where(inArray(referralCodesTable.code, codes));
  }
  if (regIds.length) {
    await db.delete(phase1PaymentsTable).where(inArray(phase1PaymentsTable.registrationId, regIds));
    await db.delete(phase2PaymentsTable).where(inArray(phase2PaymentsTable.registrationId, regIds));
    await db.delete(phase1VideosTable).where(inArray(phase1VideosTable.registrationId, regIds));
    await db.delete(kycRecordsTable).where(inArray(kycRecordsTable.registrationId, regIds));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, regIds));
  }
  if (userIds.length) await db.delete(usersTable).where(inArray(usersTable.id, userIds));
});

describe("GET /api/user/referral", () => {
  it("lazily creates a BCPL+6 code and returns the spec shape", async () => {
    await ensureMarketingTables();
    await ensureReferralProgramTables();
    const { token } = await mkUser();
    const res = await getReferralCard(token);
    expect(res.status).toBe(200);
    expect(res.body.code).toMatch(/^BCPL[A-Z0-9]{6}$/);
    expect(res.body.link).toContain(res.body.code);
    expect(res.body.totalRegistered).toBe(0);
    expect(res.body.totalPaid).toBe(0);
    expect(res.body.rewardStatus).toBe("none");
    codes.push(res.body.code);
    // Idempotent — same code on a second call.
    const res2 = await getReferralCard(token);
    expect(res2.body.code).toBe(res.body.code);
  });

  it("counts attribution, blocks self-referral, and reaches 'eligible' at 3 qualified", async () => {
    const referrer = await mkUser();
    const card = await getReferralCard(referrer.token);
    const code = card.body.code as string;
    codes.push(code);

    // Self-referral must be ignored.
    const selfReg = await mkReg(referrer.user.id, { paid: true });
    const selfAttr = await request(app).post("/api/marketing/attribute")
      .set("Authorization", `Bearer ${referrer.token}`).send({ registrationId: selfReg.id, code });
    expect(selfAttr.status).toBe(200);
    expect(selfAttr.body.attributed).toBe(false);

    // 3 distinct referred players, each paid → qualified.
    for (let i = 0; i < 3; i++) {
      const friend = await mkUser();
      const reg = await mkReg(friend.user.id, { paid: true });
      const attr = await request(app).post("/api/marketing/attribute")
        .set("Authorization", `Bearer ${friend.token}`).send({ registrationId: reg.id, code: code.toLowerCase() }); // case-insensitive
      expect(attr.body.attributed).toBe(true);
    }
    // One more registered-but-not-paid friend (counts as registered, not qualified).
    const pending = await mkUser();
    const pReg = await mkReg(pending.user.id, { paid: false });
    await request(app).post("/api/marketing/attribute")
      .set("Authorization", `Bearer ${pending.token}`).send({ registrationId: pReg.id, code });

    const after = await getReferralCard(referrer.token);
    expect(after.body.totalRegistered).toBe(4); // 3 paid + 1 pending
    expect(after.body.totalPaid).toBe(3);
    expect(after.body.rewardStatus).toBe("eligible");
  });

  it("blocks cross-account self-referral (second account, same phone)", async () => {
    const referrer = await mkUser();
    const card = await getReferralCard(referrer.token);
    const code = card.body.code as string;
    codes.push(code);

    // Second account for the same person: same 10-digit phone, +91 prefix.
    const [u2] = await db.insert(usersTable).values({
      name: `Ref Twin ${suffix}`,
      phone: `+91${referrer.user.phone}`.slice(0, 15),
      email: `ref-twin-${suffix}@test.bcpl`,
      isVerified: true,
    }).returning();
    userIds.push(u2.id);
    const twinToken = signToken({ userId: u2.id, phone: u2.phone });
    const reg = await mkReg(u2.id, { paid: true });
    const attr = await request(app).post("/api/marketing/attribute")
      .set("Authorization", `Bearer ${twinToken}`).send({ registrationId: reg.id, code });
    expect(attr.status).toBe(200);
    expect(attr.body.attributed).toBe(false);

    const after = await getReferralCard(referrer.token);
    expect(after.body.totalRegistered).toBe(0);
    expect(after.body.totalPaid).toBe(0);
  });

  it("becomes 'granted' once an admin records a grant", async () => {
    const referrer = await mkUser();
    const card = await getReferralCard(referrer.token);
    const code = card.body.code as string;
    codes.push(code);
    await db.insert(referralRewardGrantsTable).values({ code, threshold: 3, reward: "test reward" });
    const after = await getReferralCard(referrer.token);
    expect(after.body.rewardStatus).toBe("granted");
  });
});

describe("GET /api/admin/referrals", () => {
  it("requires admin and returns the referrer table", async () => {
    const noAuth = await request(app).get("/api/admin/referrals");
    expect(noAuth.status).toBe(403);
    const res = await request(app).get("/api/admin/referrals").set("x-bcpl-admin", TEST_ADMIN_SECRET);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.referrers)).toBe(true);
    expect(res.body.totals).toBeDefined();
  });
});

describe("GET /api/user/badges", () => {
  it("derives badges from journey data", async () => {
    const { user, token } = await mkUser();
    // Registration with classification complete (profile_complete) + paid.
    const [reg] = await db.insert(registrationsTable).values({
      userId: user.id, role: "bat", trialCity: "BadgeCity" + suffix,
      phase1Status: "payment_done",
      classification: { battingHand: "right", battingPosition: "opener" } as Record<string, unknown>,
    }).returning();
    regIds.push(reg.id);
    await db.insert(phase1VideosTable).values({
      registrationId: reg.id, s3Key: "k", declarationAccepted: true,
    } as typeof phase1VideosTable.$inferInsert);
    await db.insert(phase2PaymentsTable).values({
      registrationId: reg.id, amount: "2000", status: "success",
      cashfreeOrderId: `p2_${suffix}_${reg.id.slice(0, 8)}`,
    } as typeof phase2PaymentsTable.$inferInsert);
    await db.insert(kycRecordsTable).values({
      registrationId: reg.id, status: "verified", verifiedAt: new Date(),
    } as typeof kycRecordsTable.$inferInsert);

    const res = await request(app).get("/api/user/badges").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const byId: Record<string, { earned: boolean }> = {};
    for (const b of res.body.badges) byId[b.id] = b;
    expect(byId["profile_complete"].earned).toBe(true);
    expect(byId["video_uploaded"].earned).toBe(true);
    expect(byId["phase2_paid"].earned).toBe(true);
    expect(byId["kyc_verified"].earned).toBe(true);
    // Badges have bilingual + icon fields.
    expect(res.body.badges[0]).toHaveProperty("titleHi");
    expect(res.body.badges[0]).toHaveProperty("icon");
    // Not-yet-earned badges are present but false.
    expect(byId["referral_3"].earned).toBe(false);
  });
});

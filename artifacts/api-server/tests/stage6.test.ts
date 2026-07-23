/**
 * Stage 6 — homepage CMS config, employment verification, fraud extensions.
 *
 * Covers:
 *  - settings: homepage_config strict validation, per-key role gate
 *    (CONTENT_TEAM writes, FINANCE_TEAM blocked), public GET serving
 *  - employment: status enum + failed-needs-reason validation, KYC_TEAM
 *    allowed / FINANCE_TEAM forbidden, verifiedAt lifecycle, list exposure
 *  - fraud: duplicate video-etag / aadhaar-ref / pan-ref detection,
 *    re-scan idempotency (unique reg+type), clear/block review flow
 *
 * Role tokens are minted directly via signAdminToken (JWT identity is
 * payload-based, no DB row required) — deliberately avoids touching the
 * admin_users table, which the stage5 suite wipes in parallel.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const {
  usersTable, registrationsTable, kycRecordsTable, phase1VideosTable,
  fraudFlagsTable, siteSettingsTable,
} = await import("@workspace/db/schema");
const { ensureFraudTables } = await import("../src/routes/fraud");
const { ensureKycEmployment } = await import("../src/routes/kyc");
const { signAdminToken } = await import("../src/routes/adminUsers");

const admin = { "x-bcpl-admin": TEST_ADMIN_SECRET };
const suffix = String(Date.now()).slice(-7);

const tokenFor = (role: string) =>
  signAdminToken({ email: `s6-${role.toLowerCase()}-${suffix}@t.bcpl`, name: "S6 " + role, role });
const contentToken = tokenFor("CONTENT_TEAM");
const financeToken = tokenFor("FINANCE_TEAM");
const kycToken = tokenFor("KYC_TEAM");

const uids: string[] = [];
const regIds: string[] = [];
let seq = 0;

async function mkPlayer() {
  const n = ++seq;
  const [user] = await db.insert(usersTable).values({
    name: `S6 Test ${suffix}-${n}`,
    phone: `8${suffix}7${String(n).padStart(2, "0")}`.slice(0, 12),
    email: `s6-${suffix}-${n}@test.bcpl`,
    isVerified: true,
  }).returning();
  uids.push(user.id);
  const [reg] = await db.insert(registrationsTable).values({
    userId: user.id, role: "bat", trialCity: `S6City${suffix}`, regNumber: `BCPL-S6-${suffix}-${n}`,
  }).returning();
  regIds.push(reg.id);
  return { user, reg };
}

/* preserve any homepage_config an admin saved in dev */
let savedHomepage: unknown = null;

beforeAll(async () => {
  await ensureFraudTables();
  await ensureKycEmployment();
  const [row] = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, "homepage_config")).limit(1);
  savedHomepage = row?.value ?? null;
});

afterAll(async () => {
  if (regIds.length) {
    await db.delete(fraudFlagsTable).where(inArray(fraudFlagsTable.registrationId, regIds));
    await db.delete(phase1VideosTable).where(inArray(phase1VideosTable.registrationId, regIds));
    await db.delete(kycRecordsTable).where(inArray(kycRecordsTable.registrationId, regIds));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, regIds));
  }
  if (uids.length) await db.delete(usersTable).where(inArray(usersTable.id, uids));
  if (savedHomepage) {
    const now = new Date();
    await db.insert(siteSettingsTable)
      .values({ key: "homepage_config", value: savedHomepage as Record<string, unknown>, updatedAt: now })
      .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: savedHomepage as Record<string, unknown>, updatedAt: now } });
  } else {
    await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, "homepage_config"));
  }
});

/* ═══ 1. Homepage CMS config ════════════════════════════════════════ */
describe("Stage 6 — homepage CMS config", () => {
  it("rejects unknown keys and invalid values (strict schema)", async () => {
    const bad = await request(app).put("/api/settings/admin/homepage_config").set(admin)
      .send({ value: { bogusKey: 1 } });
    expect(bad.status).toBe(400);
    const badFee = await request(app).put("/api/settings/admin/homepage_config").set(admin)
      .send({ value: { phase1FeeStandard: -5 } });
    expect(badFee.status).toBe(400);
    const badStatus = await request(app).put("/api/settings/admin/homepage_config").set(admin)
      .send({ value: { registrationStatus: "paused" } });
    expect(badStatus.status).toBe(400);
  });

  it("role gate: CONTENT_TEAM writes, FINANCE_TEAM blocked", async () => {
    const cfg = {
      seasonNumber: 5, registrationStatus: "open",
      phase1FeeStandard: 299, phase1FeeAllRounder: 399,
      phase2FeeStandard: 2000, phase2FeeAllRounder: 3000,
      prizePool: "₹6 Cr", auctionValue: "₹20 L",
      importantDates: [{ label: "Phase 1 closes", date: "28 Feb 2027" }],
      stats: [{ label: "Cities", value: "50+" }],
    };
    const fin = await request(app).put("/api/settings/admin/homepage_config")
      .set("x-bcpl-admin-token", financeToken).send({ value: cfg });
    expect(fin.status).toBe(403);
    const ok = await request(app).put("/api/settings/admin/homepage_config")
      .set("x-bcpl-admin-token", contentToken).send({ value: cfg });
    expect(ok.status).toBe(200);
  });

  it("public GET serves the saved config", async () => {
    const r = await request(app).get("/api/settings/homepage_config");
    expect(r.status).toBe(200);
    expect(r.body.value.seasonNumber).toBe(5);
    expect(r.body.value.phase1FeeStandard).toBe(299);
    expect(r.body.value.importantDates[0].label).toBe("Phase 1 closes");
  });
});

/* ═══ 2. Employment verification ════════════════════════════════════ */
describe("Stage 6 — employment verification", () => {
  let kycId = "";

  it("seeds a KYC record with default pending employment", async () => {
    const { reg } = await mkPlayer();
    const [kyc] = await db.insert(kycRecordsTable).values({
      registrationId: reg.id, profession: "Engineer",
    }).returning();
    kycId = kyc.id;
    expect(kyc.employmentStatus).toBe("pending");
  });

  it("validates status enum and failed-needs-reason", async () => {
    const bad = await request(app).patch(`/api/admin/kyc/${kycId}/employment`)
      .set(admin).send({ status: "nope" });
    expect(bad.status).toBe(400);
    const noReason = await request(app).patch(`/api/admin/kyc/${kycId}/employment`)
      .set(admin).send({ status: "failed" });
    expect(noReason.status).toBe(400);
    const badCat = await request(app).patch(`/api/admin/kyc/${kycId}/employment`)
      .set(admin).send({ status: "verified", category: "astronaut" });
    expect(badCat.status).toBe(400);
  });

  it("KYC_TEAM sets statuses; FINANCE_TEAM forbidden; lifecycle fields correct", async () => {
    const fin = await request(app).patch(`/api/admin/kyc/${kycId}/employment`)
      .set("x-bcpl-admin-token", financeToken).send({ status: "verified" });
    expect(fin.status).toBe(403);

    const ok = await request(app).patch(`/api/admin/kyc/${kycId}/employment`)
      .set("x-bcpl-admin-token", kycToken)
      .send({ status: "verified", method: "document", reference: "HR letter #42", category: "salaried" });
    expect(ok.status).toBe(200);
    expect(ok.body.kyc.employmentStatus).toBe("verified");
    expect(ok.body.kyc.employmentVerifiedAt).toBeTruthy();
    expect(ok.body.kyc.employmentCategory).toBe("salaried");

    const failed = await request(app).patch(`/api/admin/kyc/${kycId}/employment`)
      .set("x-bcpl-admin-token", kycToken)
      .send({ status: "failed", failureReason: "Company not reachable" });
    expect(failed.status).toBe(200);
    expect(failed.body.kyc.employmentFailureReason).toBe("Company not reachable");
    expect(failed.body.kyc.employmentVerifiedAt).toBeNull();

    const moreInfo = await request(app).patch(`/api/admin/kyc/${kycId}/employment`)
      .set(admin).send({ status: "more_information_required" });
    expect(moreInfo.status).toBe(200);
    expect(moreInfo.body.kyc.employmentFailureReason).toBeNull();
  });

  it("admin KYC list exposes employment fields", async () => {
    const r = await request(app).get("/api/admin/kyc").set(admin);
    expect(r.status).toBe(200);
    const row = (r.body.kyc as Array<Record<string, unknown>>).find(k => k.id === kycId);
    expect(row).toBeTruthy();
    expect(row!.employmentStatus).toBe("more_information_required");
  });
});

/* ═══ 3. Fraud extensions ═══════════════════════════════════════════ */
describe("Stage 6 — fraud extensions", () => {
  let regA = ""; let regB = ""; let regC = "";

  it("seeds duplicate evidence across three players", async () => {
    const pA = await mkPlayer(); const pB = await mkPlayer(); const pC = await mkPlayer();
    regA = pA.reg.id; regB = pB.reg.id; regC = pC.reg.id;
    const etag = `S6ETAG-${suffix}`;
    await db.insert(phase1VideosTable).values([
      { registrationId: regA, etag, s3Key: `t/${suffix}-a.mp4` },
      { registrationId: regB, etag, s3Key: `t/${suffix}-b.mp4` },
      { registrationId: regC, etag: `S6OTHER-${suffix}`, s3Key: `t/${suffix}-c.mp4` },
    ]);
    await db.insert(kycRecordsTable).values([
      { registrationId: regA, aadhaarRef: `S6AAD-${suffix}`, panRef: `S6PANA-${suffix}` },
      { registrationId: regB, aadhaarRef: `S6AADB-${suffix}`, panRef: `S6PAN-${suffix}` },
      { registrationId: regC, aadhaarRef: `S6AAD-${suffix}`, panRef: `S6PAN-${suffix}` },
    ]);
  });

  it("scan flags video/aadhaar/pan duplicates; rescan idempotent; FINANCE forbidden", async () => {
    const forbidden = await request(app).post("/api/admin/fraud/scan")
      .set("x-bcpl-admin-token", financeToken);
    expect(forbidden.status).toBe(403);

    const scan = await request(app).post("/api/admin/fraud/scan")
      .set("x-bcpl-admin-token", kycToken);
    expect(scan.status).toBe(200);
    expect(scan.body.success).toBe(true);

    const mine = await db.select().from(fraudFlagsTable)
      .where(inArray(fraudFlagsTable.registrationId, [regA, regB, regC]));
    const keys = new Set(mine.map(f => f.type + ":" + f.registrationId));
    expect(keys.has("duplicate_video:" + regA)).toBe(true);
    expect(keys.has("duplicate_video:" + regB)).toBe(true);
    expect(keys.has("duplicate_video:" + regC)).toBe(false);
    expect(keys.has("duplicate_aadhaar:" + regA)).toBe(true);
    expect(keys.has("duplicate_aadhaar:" + regC)).toBe(true);
    expect(keys.has("duplicate_pan:" + regB)).toBe(true);
    expect(keys.has("duplicate_pan:" + regC)).toBe(true);
    expect(mine.length).toBe(6);

    const evid = mine.find(f => f.type === "duplicate_video" && f.registrationId === regA);
    expect((evid?.detail as Record<string, unknown>)?.etag).toBe(`S6ETAG-${suffix}`);
    expect((evid?.detail as { matchedRegistrations?: string[] })?.matchedRegistrations).toContain(regB);

    await request(app).post("/api/admin/fraud/scan").set(admin);
    const again = await db.select().from(fraudFlagsTable)
      .where(inArray(fraudFlagsTable.registrationId, [regA, regB, regC]));
    expect(again.length).toBe(6);
  });

  it("clear / block review flow with reviewer stamping", async () => {
    const flags = await db.select().from(fraudFlagsTable)
      .where(eq(fraudFlagsTable.registrationId, regA));
    const target = flags[0];

    const clear = await request(app).patch(`/api/admin/fraud/${target.id}`)
      .set("x-bcpl-admin-token", kycToken)
      .send({ action: "clear", note: "Same family, different players — verified manually" });
    expect(clear.status).toBe(200);
    expect(clear.body.flag.status).toBe("cleared");
    expect(clear.body.flag.reviewedBy).toContain("S6 KYC_TEAM");
    expect(clear.body.flag.note).toContain("Same family");

    const dup = await request(app).patch(`/api/admin/fraud/${target.id}`)
      .set(admin).send({ action: "clear" });
    expect(dup.status).toBe(409);

    const badAction = await request(app).patch(`/api/admin/fraud/${target.id}`)
      .set(admin).send({ action: "nuke" });
    expect(badAction.status).toBe(400);

    const block = await request(app).patch(`/api/admin/fraud/${target.id}`)
      .set(admin).send({ action: "block" });
    expect(block.status).toBe(200);

    const list = await request(app).get("/api/admin/fraud?status=blocked").set(admin);
    expect(list.status).toBe(200);
    expect((list.body.flags as Array<{ id: string }>).some(f => f.id === target.id)).toBe(true);

    const typed = await request(app).get("/api/admin/fraud?type=duplicate_pan").set(admin);
    expect(typed.status).toBe(200);
    expect((typed.body.flags as Array<{ type: string }>).every(f => f.type === "duplicate_pan")).toBe(true);
  });
});

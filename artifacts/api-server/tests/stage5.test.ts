/**
 * Stage 5 — RBAC (admin_users), finance refunds, KYC masking, API health.
 *
 * Locks:
 *  - email+password login issues role tokens; wrong creds still 401
 *  - SUPER_ADMIN-only admin-user CRUD; last active SUPER_ADMIN cannot be
 *    demoted/deactivated/deleted
 *  - refunds: manual-only creation, amount ≤ paid, one open refund per
 *    reg+phase, strict requested→approved→processed transitions
 *  - Aadhaar/PAN masked by default; ?reveal=1 only for SUPER_ADMIN /
 *    KYC_TEAM and always audited
 *  - trial city scoping: managers see/touch only their assigned cities
 * All seeded rows use a unique per-run suffix and are deleted afterAll.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq, inArray, and } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
const TEST_PANEL_PASSWORD = "test-panel-password-s5";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;
process.env.ADMIN_PANEL_PASSWORD = TEST_PANEL_PASSWORD;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const {
  usersTable, registrationsTable, phase1PaymentsTable, kycRecordsTable,
  adminUsersTable, refundsTable, auditLogsTable,
} = await import("@workspace/db/schema");
const { ensureAdminUsersTable } = await import("../src/routes/adminUsers");
const { ensureRefundsTables } = await import("../src/routes/refunds");
const { __resetAdminLoginRateLimit } = await import("../src/routes/admin");

const admin = { "x-bcpl-admin": TEST_ADMIN_SECRET };
const MASK = "\u2022\u2022\u2022\u2022";
const suffix = String(Date.now()).slice(-7);

const uids: string[] = [];
const regIds: string[] = [];
let seq = 0;

async function mkPlayer(regNumber: string) {
  const n = ++seq;
  const [user] = await db.insert(usersTable).values({
    name: `S5 Test ${suffix}-${n}`,
    phone: `8${suffix}9${String(n).padStart(2, "0")}`.slice(0, 12),
    email: `s5-${suffix}-${n}@test.bcpl`,
    isVerified: true,
  }).returning();
  uids.push(user.id);
  const [reg] = await db.insert(registrationsTable).values({
    userId: user.id, role: "bat", trialCity: `S5City${suffix}`, regNumber,
  }).returning();
  regIds.push(reg.id);
  return { user, reg };
}

async function mkPayment(registrationId: string, amount: string, tag: string) {
  const [p] = await db.insert(phase1PaymentsTable).values({
    registrationId, amount, cashfreeOrderId: `S5CF${suffix}-${tag}`,
    status: "success", paidAt: new Date(),
  }).returning();
  return p;
}

beforeAll(async () => {
  await ensureAdminUsersTable();
  await ensureRefundsTables();
  // the admin_users table belongs to this suite in dev — start clean so
  // the last-SUPER_ADMIN guard tests are deterministic
  await db.delete(adminUsersTable);
  __resetAdminLoginRateLimit();
});

afterAll(async () => {
  if (regIds.length) {
    await db.delete(refundsTable).where(inArray(refundsTable.registrationId, regIds));
    await db.delete(kycRecordsTable).where(inArray(kycRecordsTable.registrationId, regIds));
    await db.delete(phase1PaymentsTable).where(inArray(phase1PaymentsTable.registrationId, regIds));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, regIds));
  }
  if (uids.length) await db.delete(usersTable).where(inArray(usersTable.id, uids));
  await db.delete(adminUsersTable);
});

/* ═══ 1. Admin users CRUD + login ═══════════════════════════════════ */
describe("Stage 5 — admin users RBAC", () => {
  const finEmail = `fin-${suffix}@test.bcpl`;
  const finPass = "finance-pass-123";
  let finId = "";
  let finToken = "";
  const cityA = `S5Scope${suffix}`;
  let tcmToken = "";

  it("rejects unauthenticated access", async () => {
    const r = await request(app).get("/api/admin/admin-users");
    expect(r.status).toBe(403);
  });

  it("legacy secret (SUPER_ADMIN) lists admin users", async () => {
    const r = await request(app).get("/api/admin/admin-users").set(admin);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.admins)).toBe(true);
    expect(r.body.roles).toContain("FINANCE_TEAM");
  });

  it("creates a FINANCE_TEAM admin (no hash in response)", async () => {
    const r = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: finEmail, name: "Finance One", role: "FINANCE_TEAM", password: finPass });
    expect(r.status).toBe(201);
    expect(r.body.admin.role).toBe("FINANCE_TEAM");
    expect(r.body.admin.permissions).toContain("finance");
    expect("passwordHash" in r.body.admin).toBe(false);
    finId = r.body.admin.id;
    // The route's writeAudit is intentionally fire-and-forget (response is not
    // blocked on the audit insert) — poll briefly instead of racing it.
    let audit: unknown;
    for (let i = 0; i < 20 && !audit; i++) {
      [audit] = await db.select().from(auditLogsTable)
        .where(and(eq(auditLogsTable.action, "admin_user.create"), eq(auditLogsTable.entityKey, finEmail))).limit(1);
      if (!audit) await new Promise((r) => setTimeout(r, 100));
    }
    expect(audit).toBeTruthy();
  });

  it("rejects duplicate email (409), bad role & short password (400)", async () => {
    const dup = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: finEmail, name: "X", role: "FINANCE_TEAM", password: "long-enough-1" });
    expect(dup.status).toBe(409);
    const badRole = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: `x-${suffix}@t.bcpl`, name: "X", role: "GOD_MODE", password: "long-enough-1" });
    expect(badRole.status).toBe(400);
    const shortPw = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: `y-${suffix}@t.bcpl`, name: "Y", role: "FINANCE_TEAM", password: "short" });
    expect(shortPw.status).toBe(400);
  });

  it("email+password login issues a role token", async () => {
    __resetAdminLoginRateLimit();
    const r = await request(app).post("/api/admin/session").send({ email: finEmail, password: finPass });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeTruthy();
    expect(r.body.admin.role).toBe("FINANCE_TEAM");
    expect(r.body.admin.permissions).toContain("finance");
    finToken = r.body.token;
  });

  it("wrong password → 401; legacy panel password still works", async () => {
    __resetAdminLoginRateLimit();
    const bad = await request(app).post("/api/admin/session").send({ email: finEmail, password: "wrong-pass-999" });
    expect(bad.status).toBe(401);
    __resetAdminLoginRateLimit();
    const legacy = await request(app).post("/api/admin/session").send({ password: TEST_PANEL_PASSWORD });
    expect(legacy.status).toBe(200);
    expect(legacy.body.admin.role).toBe("SUPER_ADMIN");
  });

  it("session/verify returns the identity for role tokens", async () => {
    const r = await request(app).get("/api/admin/session/verify")
      .set("x-bcpl-admin-token", finToken);
    expect(r.status).toBe(200);
    expect(r.body.admin.role).toBe("FINANCE_TEAM");
  });

  it("non-SUPER_ADMIN gets 403 on admin-user CRUD", async () => {
    const r = await request(app).get("/api/admin/admin-users")
      .set("x-bcpl-admin-token", finToken);
    expect(r.status).toBe(403);
  });

  it("FINANCE token can reach refunds + health", async () => {
    const ref = await request(app).get("/api/admin/refunds").set("x-bcpl-admin-token", finToken);
    expect(ref.status).toBe(200);
    const health = await request(app).get("/api/admin/health").set("x-bcpl-admin-token", finToken);
    expect(health.status).toBe(200);
  });

  it("TRIAL_CITY_MANAGER requires cities; scoped manager is city-locked", async () => {
    const noCity = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: `tcm0-${suffix}@t.bcpl`, name: "T0", role: "TRIAL_CITY_MANAGER", password: "long-enough-1" });
    expect(noCity.status).toBe(400);

    const mk = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: `tcm-${suffix}@t.bcpl`, name: "TCM", role: "TRIAL_CITY_MANAGER", password: "long-enough-1", cities: [cityA] });
    expect(mk.status).toBe(201);
    __resetAdminLoginRateLimit();
    const login = await request(app).post("/api/admin/session")
      .send({ email: `tcm-${suffix}@t.bcpl`, password: "long-enough-1" });
    expect(login.status).toBe(200);
    tcmToken = login.body.token;

    // allocate: must name one of their cities
    const noCityRun = await request(app).post("/api/admin/trials/allocate")
      .set("x-bcpl-admin-token", tcmToken).send({});
    expect(noCityRun.status).toBe(400);
    const wrongCity = await request(app).post("/api/admin/trials/allocate")
      .set("x-bcpl-admin-token", tcmToken).send({ city: "Delhi" });
    expect(wrongCity.status).toBe(403);
    const okRun = await request(app).post("/api/admin/trials/allocate")
      .set("x-bcpl-admin-token", tcmToken).send({ city: cityA });
    expect(okRun.status).toBe(200);

    // slots list is filtered to their cities (other suites' cities hidden)
    const slots = await request(app).get("/api/admin/trials/slots")
      .set("x-bcpl-admin-token", tcmToken);
    expect(slots.status).toBe(200);
    expect(slots.body.slots).toEqual([]);

    // refunds are off-limits for trial managers
    const ref = await request(app).get("/api/admin/refunds").set("x-bcpl-admin-token", tcmToken);
    expect(ref.status).toBe(403);
  });

  it("protects the last active SUPER_ADMIN", async () => {
    const s1 = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: `s1-${suffix}@t.bcpl`, name: "S1", role: "SUPER_ADMIN", password: "long-enough-1" });
    expect(s1.status).toBe(201);
    const s1id = s1.body.admin.id;

    // only active SUPER_ADMIN row → demote/deactivate/delete all blocked
    const demote = await request(app).patch(`/api/admin/admin-users/${s1id}`).set(admin)
      .send({ role: "FINANCE_TEAM" });
    expect(demote.status).toBe(409);
    const deact = await request(app).patch(`/api/admin/admin-users/${s1id}`).set(admin)
      .send({ active: false });
    expect(deact.status).toBe(409);
    const del = await request(app).delete(`/api/admin/admin-users/${s1id}`).set(admin);
    expect(del.status).toBe(409);

    // add a second SUPER_ADMIN → now demoting S1 is fine
    const s2 = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: `s2-${suffix}@t.bcpl`, name: "S2", role: "SUPER_ADMIN", password: "long-enough-1" });
    expect(s2.status).toBe(201);
    const demote2 = await request(app).patch(`/api/admin/admin-users/${s1id}`).set(admin)
      .send({ role: "SUPPORT_TEAM" });
    expect(demote2.status).toBe(200);
    // S2 is now the last one → deleting it is blocked
    const del2 = await request(app).delete(`/api/admin/admin-users/${s2.body.admin.id}`).set(admin);
    expect(del2.status).toBe(409);
  });

  it("password change works and old password stops working", async () => {
    const newPass = "finance-pass-456";
    const upd = await request(app).patch(`/api/admin/admin-users/${finId}`).set(admin)
      .send({ password: newPass });
    expect(upd.status).toBe(200);
    __resetAdminLoginRateLimit();
    const oldLogin = await request(app).post("/api/admin/session").send({ email: finEmail, password: finPass });
    expect(oldLogin.status).toBe(401);
    __resetAdminLoginRateLimit();
    const newLogin = await request(app).post("/api/admin/session").send({ email: finEmail, password: newPass });
    expect(newLogin.status).toBe(200);
    finToken = newLogin.body.token;
  });
});

/* ═══ 2. Refunds — manual-only, strict transitions ══════════════════ */
describe("Stage 5 — refunds", () => {
  const regNumber = `S5R${suffix}`;
  let regId = "";
  let refundId = "";

  beforeAll(async () => {
    const { reg } = await mkPlayer(regNumber);
    regId = reg.id;
    await mkPayment(regId, "129.00", "a");
    await mkPayment(regId, "129.00", "b"); // duplicate → reconciliation candidate
  });

  it("surfaces duplicate successful payments as candidates", async () => {
    const r = await request(app).get("/api/admin/refunds/candidates").set(admin);
    expect(r.status).toBe(200);
    const hit = (r.body.candidates as { registrationId: string; payments: number; hasRefund: boolean }[])
      .find((c) => c.registrationId === regId);
    expect(hit).toBeTruthy();
    expect(hit!.payments).toBe(2);
    expect(hit!.hasRefund).toBe(false);
  });

  it("creates a refund by player ID; validates reason & amount", async () => {
    const bad = await request(app).post("/api/admin/refunds").set(admin)
      .send({ regNumber, phase: 1, reason: "changed_mind" });
    expect(bad.status).toBe(400);
    const tooMuch = await request(app).post("/api/admin/refunds").set(admin)
      .send({ regNumber, phase: 1, reason: "duplicate_payment", amount: 5000 });
    expect(tooMuch.status).toBe(400);
    const r = await request(app).post("/api/admin/refunds").set(admin)
      .send({ regNumber, phase: 1, reason: "duplicate_payment", eligibility: "eligible" });
    expect(r.status).toBe(201);
    expect(r.body.refund.status).toBe("requested");
    expect(r.body.refund.amount).toBe("129.00");
    expect(r.body.refund.paymentRef).toContain(`S5CF${suffix}`);
    refundId = r.body.refund.id;
  });

  it("blocks a second open refund for the same player+phase", async () => {
    const r = await request(app).post("/api/admin/refunds").set(admin)
      .send({ regNumber, phase: 1, reason: "technical_issue" });
    expect(r.status).toBe(409);
  });

  it("enforces requested→approved→processed transitions", async () => {
    const processEarly = await request(app).patch(`/api/admin/refunds/${refundId}`).set(admin)
      .send({ action: "process", refundRef: "UTR-EARLY" });
    expect(processEarly.status).toBe(409);

    const approve = await request(app).patch(`/api/admin/refunds/${refundId}`).set(admin)
      .send({ action: "approve" });
    expect(approve.status).toBe(200);
    expect(approve.body.refund.status).toBe("approved");

    const noRef = await request(app).patch(`/api/admin/refunds/${refundId}`).set(admin)
      .send({ action: "process" });
    expect(noRef.status).toBe(400);

    const done = await request(app).patch(`/api/admin/refunds/${refundId}`).set(admin)
      .send({ action: "process", refundRef: `UTR-${suffix}` });
    expect(done.status).toBe(200);
    expect(done.body.refund.status).toBe("processed");
    expect(done.body.refund.processedAt).toBeTruthy();

    const again = await request(app).patch(`/api/admin/refunds/${refundId}`).set(admin)
      .send({ action: "approve" });
    expect(again.status).toBe(409);
  });

  it("reject path is terminal", async () => {
    const r = await request(app).post("/api/admin/refunds").set(admin)
      .send({ regNumber, phase: 1, reason: "player_cancellation", amount: 50 });
    expect(r.status).toBe(201);
    expect(r.body.refund.amount).toBe("50.00");
    const rej = await request(app).patch(`/api/admin/refunds/${r.body.refund.id}`).set(admin)
      .send({ action: "reject", eligibility: "not_eligible" });
    expect(rej.status).toBe(200);
    expect(rej.body.refund.status).toBe("rejected");
    const proc = await request(app).patch(`/api/admin/refunds/${r.body.refund.id}`).set(admin)
      .send({ action: "process", refundRef: "X" });
    expect(proc.status).toBe(409);
  });

  it("nothing auto-creates refunds — only the two manual ones exist", async () => {
    const rows = await db.select().from(refundsTable).where(eq(refundsTable.registrationId, regId));
    expect(rows.length).toBe(2);
    for (const row of rows) expect(row.requestedBy).toBeTruthy();
  });
});

/* ═══ 3. KYC masking ════════════════════════════════════════════════ */
describe("Stage 5 — KYC Aadhaar/PAN masking", () => {
  const regNumber = `S5K${suffix}`;
  let regId = "";

  beforeAll(async () => {
    const { reg } = await mkPlayer(regNumber);
    regId = reg.id;
    await db.insert(kycRecordsTable).values({
      registrationId: regId, aadhaarRef: "999988887777", panRef: "ABCDE1234F",
      status: "verified", aadhaarVerified: true, verifiedAt: new Date(),
    });
  });

  function findRow(body: { kyc: Record<string, unknown>[] }) {
    return body.kyc.find((k) => k["registrationId"] === regId || k["regNumber"] === regNumber);
  }

  it("masks refs by default (SUPER_ADMIN)", async () => {
    const r = await request(app).get("/api/admin/kyc").set(admin);
    expect(r.status).toBe(200);
    expect(r.body.masked).toBe(true);
    expect(r.body.canReveal).toBe(true);
    const row = findRow(r.body);
    expect(row).toBeTruthy();
    expect(row!["aadhaarRef"]).toBe(`${MASK}7777`);
    expect(row!["panRef"]).toBe(`${MASK}234F`);
  });

  it("?reveal=1 returns raw values for SUPER_ADMIN and writes an audit row", async () => {
    const r = await request(app).get("/api/admin/kyc?reveal=1").set(admin);
    expect(r.status).toBe(200);
    expect(r.body.masked).toBe(false);
    const row = findRow(r.body);
    expect(row!["aadhaarRef"]).toBe("999988887777");
    expect(row!["panRef"]).toBe("ABCDE1234F");
    const [audit] = await db.select().from(auditLogsTable)
      .where(eq(auditLogsTable.action, "kyc.reveal")).limit(1);
    expect(audit).toBeTruthy();
  });

  it("non-KYC roles stay masked even with ?reveal=1", async () => {
    __resetAdminLoginRateLimit();
    const finLogin = await request(app).post("/api/admin/session")
      .send({ email: `fin-${suffix}@test.bcpl`, password: "finance-pass-456" });
    expect(finLogin.status).toBe(200);
    const r = await request(app).get("/api/admin/kyc?reveal=1")
      .set("x-bcpl-admin-token", finLogin.body.token);
    expect(r.status).toBe(200);
    expect(r.body.masked).toBe(true);
    expect(r.body.canReveal).toBe(false);
    const row = findRow(r.body);
    expect(row!["aadhaarRef"]).toBe(`${MASK}7777`);
  });
});

/* ═══ 4. API health ═════════════════════════════════════════════════ */
describe("Stage 5 — API health", () => {
  it("requires admin auth", async () => {
    const r = await request(app).get("/api/admin/health");
    expect(r.status).toBe(403);
  });

  it("returns integration statuses, job heartbeats and queue depths", async () => {
    const r = await request(app).get("/api/admin/health").set(admin);
    expect(r.status).toBe(200);
    expect(r.body.integrations).toHaveLength(8);
    for (const integ of r.body.integrations) {
      expect(typeof integ.id).toBe("string");
      expect(typeof integ.configured).toBe("boolean");
      expect("lastActivityAt" in integ).toBe(true);
    }
    const ids = r.body.integrations.map((x: { id: string }) => x.id);
    expect(ids).toContain("cashfree_pg");
    expect(ids).toContain("aadhaar_verify");
    expect(typeof r.body.jobs).toBe("object");
    expect(typeof r.body.queues).toBe("object");
    expect(typeof r.body.uptimeSec).toBe("number");
  });
});

/* ═══ 6. Review hardening — venue city-scoping + refund create race ═══ */
describe("Stage 5 — review hardening", () => {
  const hCity = `S5Ven${suffix}`;
  const hOther = `S5VenOther${suffix}`;
  let venInScopeId = "";
  let venOutId = "";
  let hTcmToken = "";

  afterAll(async () => {
    for (const id of [venInScopeId, venOutId]) {
      if (id) await request(app).delete(`/api/admin/trial-venues/${id}`).set(admin);
    }
  });

  it("trial-venues CRUD is city-scoped for TRIAL_CITY_MANAGER", async () => {
    const v1 = await request(app).post("/api/admin/trial-venues").set(admin)
      .send({ city: hCity, venue: "Ground A", trialDate: "2026-08-10", trialTime: "9 AM", reportingTime: "8 AM" });
    expect(v1.status).toBe(200);
    venInScopeId = v1.body.venue.id;
    const v2 = await request(app).post("/api/admin/trial-venues").set(admin)
      .send({ city: hOther, venue: "Ground B", trialDate: "2026-08-11", trialTime: "9 AM", reportingTime: "8 AM" });
    expect(v2.status).toBe(200);
    venOutId = v2.body.venue.id;

    const mk = await request(app).post("/api/admin/admin-users").set(admin)
      .send({ email: `tcm-h-${suffix}@t.bcpl`, name: "TCM H", role: "TRIAL_CITY_MANAGER", password: "long-enough-1", cities: [hCity] });
    expect(mk.status).toBe(201);
    __resetAdminLoginRateLimit();
    const login = await request(app).post("/api/admin/session")
      .send({ email: `tcm-h-${suffix}@t.bcpl`, password: "long-enough-1" });
    expect(login.status).toBe(200);
    hTcmToken = login.body.token;

    // list is filtered to assigned cities
    const list = await request(app).get("/api/admin/trial-venues").set("x-bcpl-admin-token", hTcmToken);
    expect(list.status).toBe(200);
    const cities = (list.body.venues as Array<{ city: string }>).map(v => v.city);
    expect(cities).toContain(hCity);
    expect(cities).not.toContain(hOther);

    // create outside scope blocked
    const mkOut = await request(app).post("/api/admin/trial-venues").set("x-bcpl-admin-token", hTcmToken)
      .send({ city: hOther, venue: "X", trialDate: "2026-08-12", trialTime: "9 AM", reportingTime: "8 AM" });
    expect(mkOut.status).toBe(403);

    // update / move-to-other-city / delete / announce outside scope blocked
    const updOut = await request(app).put(`/api/admin/trial-venues/${venOutId}`)
      .set("x-bcpl-admin-token", hTcmToken).send({ venue: "Hacked" });
    expect(updOut.status).toBe(403);
    const moveOut = await request(app).put(`/api/admin/trial-venues/${venInScopeId}`)
      .set("x-bcpl-admin-token", hTcmToken).send({ city: hOther });
    expect(moveOut.status).toBe(403);
    const delOut = await request(app).delete(`/api/admin/trial-venues/${venOutId}`)
      .set("x-bcpl-admin-token", hTcmToken);
    expect(delOut.status).toBe(403);
    const annOut = await request(app).post(`/api/admin/trial-venues/${venOutId}/announce`)
      .set("x-bcpl-admin-token", hTcmToken);
    expect(annOut.status).toBe(403);

    // within scope still works; SUPER_ADMIN unrestricted
    const updIn = await request(app).put(`/api/admin/trial-venues/${venInScopeId}`)
      .set("x-bcpl-admin-token", hTcmToken).send({ venue: "Ground A2" });
    expect(updIn.status).toBe(200);
    const updSuper = await request(app).put(`/api/admin/trial-venues/${venOutId}`)
      .set(admin).send({ venue: "Ground B2" });
    expect(updSuper.status).toBe(200);
  });

  it("concurrent refund creates cannot both land (unique open-refund guard)", async () => {
    const regNumber = `BCPL-RACE-${suffix}`;
    const { reg } = await mkPlayer(regNumber);
    await mkPayment(reg.id, "799.00", "race");
    const fire = () => request(app).post("/api/admin/refunds").set(admin)
      .send({ regNumber, phase: 1, reason: "duplicate_payment" });
    const results = await Promise.all([fire(), fire(), fire()]);
    const codes = results.map(r => r.status).sort();
    expect(codes).toEqual([201, 409, 409]);
  });
});

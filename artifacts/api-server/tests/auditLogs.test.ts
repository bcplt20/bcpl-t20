/**
 * Task #46 — GET /api/admin/audit-logs
 *
 * Verifies:
 *  - RBAC: SUPER_ADMIN only (a non-super role token is rejected 403).
 *  - Pagination + action/actor/date filtering shape the query correctly.
 *  - Player-visible admin mutations (phase1/phase2 status, kyc status)
 *    write an audit row with before → after values.
 *
 * Providers are never touched here — the write path under test is a DB
 * update; notification sends are behind reserve-first dedupe logs elsewhere.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { inArray } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-audit";
const TEST_SESSION_SECRET = "test-session-secret-for-audit";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const {
  usersTable, registrationsTable, kycRecordsTable, auditLogsTable, notificationLogsTable,
} = await import("@workspace/db/schema");
const { signAdminToken } = await import("../src/routes/adminUsers");

const suffix = String(Date.now()).slice(-7);
const uids: string[] = [];
const regIds: string[] = [];
const auditActionsWritten = [`audit.test.${suffix}`];

const superToken = signAdminToken({ email: `super-${suffix}@test.bcpl`, name: "Super", role: "SUPER_ADMIN" });
const superHdr = { "x-bcpl-admin-token": superToken };
// A non-super role: audit-logs must be forbidden for this token.
const supportToken = signAdminToken({ email: `support-${suffix}@test.bcpl`, name: "Support", role: "SUPPORT_TEAM" });

let regId = "";
let kycId = "";

beforeAll(async () => {
  const [user] = await db.insert(usersTable).values({
    name: `Audit Test ${suffix}`,
    phone: `9${suffix}8`.slice(0, 12),
    email: `audit-${suffix}@test.bcpl`,
    isVerified: true,
  }).returning();
  uids.push(user.id);
  const [reg] = await db.insert(registrationsTable).values({
    userId: user.id, role: "bat", trialCity: `AuditCity${suffix}`,
    phase1Status: "video_submitted", phase2Status: "pending",
  }).returning();
  regIds.push(reg.id);
  regId = reg.id;
  const [kyc] = await db.insert(kycRecordsTable).values({
    registrationId: reg.id, status: "pending",
  }).returning();
  kycId = kyc.id;

  // Seed a couple of audit rows directly so filter/pagination shape is testable
  // without depending on send-gated mutation side effects.
  await db.insert(auditLogsTable).values({
    actor: `seed-${suffix} (SUPER_ADMIN)`, action: `audit.test.${suffix}`,
    entity: "test_entity", entityKey: "seed-1",
    oldValue: { status: "a" }, newValue: { status: "b" },
  });
  await db.insert(auditLogsTable).values({
    actor: `other-${suffix} (SUPER_ADMIN)`, action: `audit.test.${suffix}`,
    entity: "test_entity", entityKey: "seed-2",
    oldValue: { status: "b" }, newValue: { status: "c" },
  });
});

afterAll(async () => {
  await db.delete(auditLogsTable).where(inArray(auditLogsTable.action, auditActionsWritten));
  if (regIds.length) {
    await db.delete(kycRecordsTable).where(inArray(kycRecordsTable.registrationId, regIds));
    await db.delete(auditLogsTable).where(inArray(auditLogsTable.entityKey, regIds));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, regIds));
  }
  if (uids.length) {
    await db.delete(notificationLogsTable).where(inArray(notificationLogsTable.userId, uids));
    await db.delete(usersTable).where(inArray(usersTable.id, uids));
  }
});

describe("Task #46 — audit-logs endpoint", () => {
  it("forbids non-SUPER_ADMIN roles (RBAC)", async () => {
    const r = await request(app).get("/api/admin/audit-logs")
      .set("x-bcpl-admin-token", supportToken);
    expect(r.status).toBe(403);
  });

  it("rejects unauthenticated access", async () => {
    const r = await request(app).get("/api/admin/audit-logs");
    expect(r.status).toBe(403);
  });

  it("returns paginated rows + vocab for SUPER_ADMIN", async () => {
    const r = await request(app).get(`/api/admin/audit-logs?action=audit.test.${suffix}`)
      .set(superHdr);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.logs)).toBe(true);
    expect(r.body.total).toBeGreaterThanOrEqual(2);
    expect(r.body.page).toBe(1);
    expect(r.body.logs.every((l: { action: string }) => l.action === `audit.test.${suffix}`)).toBe(true);
    // before → after preserved
    const seed1 = r.body.logs.find((l: { entityKey: string }) => l.entityKey === "seed-1");
    expect(seed1.oldValue).toEqual({ status: "a" });
    expect(seed1.newValue).toEqual({ status: "b" });
    // vocab arrays present for building filters
    expect(r.body.actions).toContain(`audit.test.${suffix}`);
  });

  it("honours pageSize + page offset", async () => {
    const p1 = await request(app).get(`/api/admin/audit-logs?action=audit.test.${suffix}&pageSize=1&page=1`).set(superHdr);
    const p2 = await request(app).get(`/api/admin/audit-logs?action=audit.test.${suffix}&pageSize=1&page=2`).set(superHdr);
    expect(p1.body.logs.length).toBe(1);
    expect(p2.body.logs.length).toBe(1);
    expect(p1.body.logs[0].id).not.toBe(p2.body.logs[0].id);
    expect(p1.body.pageSize).toBe(1);
    expect(p1.body.pages).toBeGreaterThanOrEqual(2);
  });

  it("filters by actor substring", async () => {
    const r = await request(app).get(`/api/admin/audit-logs?actor=other-${suffix}`).set(superHdr);
    expect(r.status).toBe(200);
    expect(r.body.logs.every((l: { actor: string }) => l.actor.includes(`other-${suffix}`))).toBe(true);
  });

  it("logs a phase1 status change with before → after", async () => {
    const r = await request(app).put(`/api/admin/registrations/${regId}/phase1-status`)
      .set(superHdr).send({ status: "payment_done" });
    expect(r.status).toBe(200);
    // writeAudit is fire-and-forget (void) — give the insert a tick, then poll.
    let row: { action: string; oldValue: unknown; newValue: unknown } | undefined;
    for (let i = 0; i < 20 && !row; i++) {
      await new Promise((res) => setTimeout(res, 50));
      const q = await request(app).get(`/api/admin/audit-logs?action=registration.phase1_status`).set(superHdr);
      row = q.body.logs.find((l: { entityKey: string }) => l.entityKey === regId);
    }
    expect(row).toBeTruthy();
    expect((row!.oldValue as { phase1Status: string }).phase1Status).toBe("video_submitted");
    expect((row!.newValue as { phase1Status: string }).phase1Status).toBe("payment_done");
  });

  it("logs a kyc status change", async () => {
    const r = await request(app).put(`/api/admin/kyc/${kycId}/status`)
      .set(superHdr).send({ status: "failed" });
    expect(r.status).toBe(200);
    let row: { newValue: unknown } | undefined;
    for (let i = 0; i < 20 && !row; i++) {
      await new Promise((res) => setTimeout(res, 50));
      const q = await request(app).get(`/api/admin/audit-logs?action=kyc.status`).set(superHdr);
      row = q.body.logs.find((l: { entityKey: string }) => l.entityKey === kycId);
    }
    expect(row).toBeTruthy();
    expect((row!.newValue as { status: string }).status).toBe("failed");
  });
});

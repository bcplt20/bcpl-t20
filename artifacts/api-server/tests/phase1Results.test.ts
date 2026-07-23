/**
 * Phase 1 result gating matrix (Task: transparent scoring & result reveal).
 *
 * Locks the /api/results/me contract so every pre-result state routes
 * distinctly (register → pay → upload → review → decision) and the full
 * result appears ONLY when a score exists AND the decision is announced.
 * Also covers the admin score upsert (validation, computed total, one row).
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
const { usersTable, registrationsTable, phase1ScoresTable } = await import("@workspace/db/schema");
const { signToken } = await import("../src/lib/auth");

const suffix = String(Date.now()).slice(-7); // unique per run
const createdUserIds: string[] = [];
const createdRegIds: string[] = [];

let seq = 0;
async function mkUser() {
  const n = ++seq;
  const [user] = await db.insert(usersTable).values({
    name: `P1 Gating Test ${suffix}-${n}`,
    phone: `7${suffix}${String(n).padStart(2, "0")}`.slice(0, 12),
    email: `p1test-${suffix}-${n}@test.bcpl`,
    isVerified: true,
  }).returning();
  createdUserIds.push(user.id);
  return user;
}

async function mkReg(phase1Status: string, opts: { role?: string; city?: string } = {}) {
  const user = await mkUser();
  const [reg] = await db.insert(registrationsTable).values({
    userId: user.id,
    role: opts.role ?? "bat",
    trialCity: opts.city ?? "TestCity" + suffix,
    phase1Status,
  }).returning();
  createdRegIds.push(reg.id);
  return { user, reg, token: signToken({ userId: user.id, phone: user.phone }) };
}

const SCORE = { roleSkill: 30, technique: 20, execution: 12, gameAwareness: 8, movement: 7, videoEvidence: 4 }; // total 81

async function insertScore(registrationId: string, total = 81) {
  await db.insert(phase1ScoresTable).values({ registrationId, ...SCORE, total });
}

afterAll(async () => {
  if (createdRegIds.length) {
    await db.delete(phase1ScoresTable).where(inArray(phase1ScoresTable.registrationId, createdRegIds));
    await db.delete(registrationsTable).where(inArray(registrationsTable.id, createdRegIds));
  }
  if (createdUserIds.length) {
    await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
  }
});

describe("GET /api/results/me — gating matrix", () => {
  it("no token → 401", async () => {
    const res = await request(app).get("/api/results/me");
    expect(res.status).toBe(401);
  });

  it("user without registration → not_registered", async () => {
    const user = await mkUser();
    const token = signToken({ userId: user.id, phone: user.phone });
    const res = await request(app).get("/api/results/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ available: false, reason: "not_registered" });
  });

  it("phase1Status=pending → payment_pending (must NOT collapse into under_review)", async () => {
    const { token } = await mkReg("pending");
    const res = await request(app).get("/api/results/me").set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ available: false, reason: "payment_pending", phase1Status: "pending" });
  });

  it("phase1Status=payment_done → video_pending", async () => {
    const { token } = await mkReg("payment_done");
    const res = await request(app).get("/api/results/me").set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ available: false, reason: "video_pending", phase1Status: "payment_done" });
  });

  it("phase1Status=video_submitted → under_review", async () => {
    const { token } = await mkReg("video_submitted");
    const res = await request(app).get("/api/results/me").set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ available: false, reason: "under_review" });
  });

  it("selected but unscored → score_pending (decision announced, score not entered)", async () => {
    const { token } = await mkReg("selected");
    const res = await request(app).get("/api/results/me").set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ available: false, reason: "score_pending", phase1Status: "selected" });
  });

  it("scored but still video_submitted → stays under_review (no premature reveal)", async () => {
    const { reg, token } = await mkReg("video_submitted");
    await insertScore(reg.id);
    const res = await request(app).get("/api/results/me").set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ available: false, reason: "under_review" });
  });

  it("selected + scored → full result, qualified, 6-part breakdown, no phone leak", async () => {
    const { user, reg, token } = await mkReg("selected");
    await insertScore(reg.id);
    const res = await request(app).get("/api/results/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ available: true, decision: "qualified", total: 81 });
    expect(res.body.breakdown).toHaveLength(6);
    expect(res.body.breakdown.map((b: { max: number }) => b.max)).toEqual([35, 25, 15, 10, 10, 5]);
    expect(res.body.cityCount).toBeGreaterThanOrEqual(1);
    // privacy: payload must never contain the player's phone number
    expect(JSON.stringify(res.body)).not.toContain(user.phone);
  });

  it("rejected + scored → not_shortlisted (same premium payload shape)", async () => {
    const { reg, token } = await mkReg("rejected");
    await insertScore(reg.id, 55);
    const res = await request(app).get("/api/results/me").set("Authorization", `Bearer ${token}`);
    expect(res.body).toMatchObject({ available: true, decision: "not_shortlisted", total: 55 });
    expect(res.body.breakdown).toHaveLength(6);
  });
});

describe("PUT /api/admin/registrations/:id/score", () => {
  it("rejects a criterion over its maximum → 400", async () => {
    const { reg } = await mkReg("video_submitted");
    const res = await request(app)
      .put(`/api/admin/registrations/${reg.id}/score`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET)
      .send({ ...SCORE, roleSkill: 36 });
    expect(res.status).toBe(400);
  });

  it("saves with server-computed total, then upserts in place (single row)", async () => {
    const { reg } = await mkReg("video_submitted");
    const first = await request(app)
      .put(`/api/admin/registrations/${reg.id}/score`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET)
      .send({ ...SCORE, selectorNote: "vitest note" });
    expect(first.status).toBe(200);
    expect(first.body.score.total).toBe(81);

    const second = await request(app)
      .put(`/api/admin/registrations/${reg.id}/score`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET)
      .send({ ...SCORE, roleSkill: 32 });
    expect(second.status).toBe(200);
    expect(second.body.score.total).toBe(83);

    const rows = await db.select().from(phase1ScoresTable).where(eq(phase1ScoresTable.registrationId, reg.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].total).toBe(83);
  });

  it("unknown registration id → 404", async () => {
    const res = await request(app)
      .put("/api/admin/registrations/00000000-0000-0000-0000-000000000000/score")
      .set("x-bcpl-admin", TEST_ADMIN_SECRET)
      .send(SCORE);
    expect(res.status).toBe(404);
  });
});

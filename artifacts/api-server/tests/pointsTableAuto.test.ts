/**
 * Automatic points-table recompute + DLS reduce-overs endpoint (integration).
 *
 *  - finalizing a match via PUT /admin/matches/:id/status auto-updates the table
 *  - re-scoring / editing the winner recomputes (idempotent, from scratch)
 *  - GET /api/points-table returns played/won/lost/noResult/points/nrr(3dp)
 *  - POST /api/scoring/:id/dls auth + validation (min 5, no increase)
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { inArray, eq } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { matchesTable, inningsTable, deliveriesTable, pointsTableEntries } = await import("@workspace/db/schema");
const { ensureDlsColumns } = await import("../src/lib/dls");

const SEASON = 920000 + Number(String(Date.now()).slice(-5));
const A = `PT Alpha ${SEASON}`;
const B = `PT Bravo ${SEASON}`;
const matchIds: string[] = [];
let mno = 0;

async function mkMatch(status = "scheduled") {
  const [m] = await db.insert(matchesTable).values({
    matchNo: Number(`6${String(Date.now()).slice(-6)}${++mno}`.slice(-8)),
    season: SEASON, team1: A, team2: B, venue: "PT Ground", status,
  }).returning();
  matchIds.push(m.id);
  return m;
}
async function mkInnings(matchId: string, num: number, bat: string, bowl: string, runs: number, wkts: number, overs: number, opts: { revisedOvers?: number; target?: number } = {}) {
  const [i] = await db.insert(inningsTable).values({
    matchId, inningsNumber: num, battingTeam: bat, bowlingTeam: bowl,
    totalRuns: runs, totalWickets: wkts, overs, balls: 0, status: "completed",
    originalOvers: 20, revisedOvers: opts.revisedOvers ?? null, target: opts.target ?? null,
  } as typeof inningsTable.$inferInsert).returning();
  return i;
}

beforeAll(async () => { await ensureDlsColumns(); });

afterAll(async () => {
  if (matchIds.length) {
    const inns = await db.select({ id: inningsTable.id }).from(inningsTable).where(inArray(inningsTable.matchId, matchIds));
    const ids = inns.map((i) => i.id);
    if (ids.length) await db.delete(deliveriesTable).where(inArray(deliveriesTable.inningsId, ids));
    await db.delete(inningsTable).where(inArray(inningsTable.matchId, matchIds));
    await db.delete(matchesTable).where(inArray(matchesTable.id, matchIds));
  }
  await db.delete(pointsTableEntries).where(eq(pointsTableEntries.season, SEASON));
});

describe("auto points-table recompute on finalize/edit", () => {
  it("finalizing a match updates the table automatically", async () => {
    const m = await mkMatch("innings2");
    await mkInnings(m.id, 1, A, B, 170, 6, 20);
    await mkInnings(m.id, 2, B, A, 150, 9, 20, { target: 171 });

    // Finalize via status endpoint (admin) — this triggers recompute.
    const fin = await request(app).put(`/api/matches/admin/matches/${m.id}/status`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET)
      .send({ status: "completed", winner: A, resultDesc: `${A} won by 20 runs` });
    expect(fin.status).toBe(200);

    const table = await request(app).get(`/api/points-table?season=${SEASON}`);
    expect(table.status).toBe(200);
    const rowA = table.body.table.find((r: { team: string }) => r.team === A);
    const rowB = table.body.table.find((r: { team: string }) => r.team === B);
    expect(rowA.played).toBe(1);
    expect(rowA.won).toBe(1);
    expect(rowA.points).toBe(2);
    expect(rowB.lost).toBe(1);
    expect(rowB.points).toBe(0);
    // NRR: A scored 170/20, conceded 150/20 → +1.000; 3-decimal, signed.
    expect(rowA.nrr).toBeCloseTo(170 / 20 - 150 / 20, 3);
    expect(rowA.nrrDisplay).toMatch(/^\+?\-?\d+\.\d{3}$/);
  });

  it("editing the winner recomputes from scratch (idempotent)", async () => {
    // Flip the winner to B; table must reflect the new result, not accumulate.
    const m = matchIds[0];
    await request(app).put(`/api/matches/admin/matches/${m}/status`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET)
      .send({ status: "completed", winner: B, resultDesc: `${B} won` });

    const table = await request(app).get(`/api/points-table?season=${SEASON}`);
    const rowA = table.body.table.find((r: { team: string }) => r.team === A);
    const rowB = table.body.table.find((r: { team: string }) => r.team === B);
    // Still only ONE match played each (idempotent, not incremented).
    expect(rowA.played).toBe(1);
    expect(rowB.played).toBe(1);
    expect(rowB.won).toBe(1);
    expect(rowA.won).toBe(0);
    expect(rowA.lost).toBe(1);
  });

  it("manual recompute endpoint works and requires admin", async () => {
    const noAuth = await request(app).post(`/api/points-table/admin/points-table/recompute`).send({ season: SEASON });
    expect(noAuth.status).toBe(403);
    const ok = await request(app).post(`/api/points-table/admin/points-table/recompute`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET).send({ season: SEASON });
    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body.standings)).toBe(true);
  });
});

describe("POST /api/scoring/:id/dls — reduce overs", () => {
  it("requires admin", async () => {
    const m = await mkMatch("live");
    await mkInnings(m.id, 1, A, B, 80, 3, 12);
    const res = await request(app).post(`/api/scoring/${m.id}/dls`)
      .send({ inningsNumber: 1, oversAvailable: 15 });
    expect(res.status).toBe(403);
  });

  it("rejects increasing overs beyond original", async () => {
    const m = matchIds[matchIds.length - 1];
    const res = await request(app).post(`/api/scoring/${m}/dls`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET).send({ inningsNumber: 1, oversAvailable: 25 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/beyond|original|20/i);
  });

  it("rejects below the 5-over minimum for a valid T20 result", async () => {
    const m = matchIds[matchIds.length - 1];
    const res = await request(app).post(`/api/scoring/${m}/dls`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET).send({ inningsNumber: 1, oversAvailable: 3 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 overs/i);
  });

  it("applies a valid reduction and recomputes the revised target", async () => {
    const m = await mkMatch("live");
    // Innings 1 complete: A 160/5 in 20 overs.
    await mkInnings(m.id, 1, A, B, 160, 5, 20);
    // Innings 2 live: B batting, some progress.
    const i2 = await db.insert(inningsTable).values({
      matchId: m.id, inningsNumber: 2, battingTeam: B, bowlingTeam: A,
      totalRuns: 40, totalWickets: 1, overs: 5, balls: 0, status: "live",
      originalOvers: 20, target: 161,
    } as typeof inningsTable.$inferInsert).returning();

    const res = await request(app).post(`/api/scoring/${m.id}/dls`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET).send({ inningsNumber: 2, oversAvailable: 10 });
    expect(res.status).toBe(200);
    expect(res.body.revisedOvers).toBe(10);
    expect(typeof res.body.revisedTarget).toBe("number");

    // The match now reports a dls block on the live endpoint.
    const live = await request(app).get(`/api/matches/${m.id}/live`);
    expect(live.body.dls).toBeTruthy();
    expect(live.body.dls.active).toBe(true);
    expect(live.body.dls.revisedOvers["2"]).toBe(10);
    expect(typeof live.body.dls.parScore).toBe("number");
  });
});

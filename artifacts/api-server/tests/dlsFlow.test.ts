/**
 * DLS end-to-end flow through the scoring endpoints (integration).
 *
 *  - a reduction applied to INNINGS 1 flows into innings 2's DLS target when
 *    innings 2 is created by /innings-end (was: silently defaulted to runs+1 @20)
 *  - a reduction registered for INNINGS 2 before it exists is adopted at creation
 *  - scoring mutations are serialized on the match row (concurrent balls don't
 *    lose an update)
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { inArray, eq, and } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { matchesTable, inningsTable, deliveriesTable } = await import("@workspace/db/schema");
const { ensureDlsColumns } = await import("../src/lib/dls");
const { computeDlsChaseTarget } = await import("../src/lib/matchResult");

const SEASON = 930000 + Number(String(Date.now()).slice(-5));
const A = `DF Alpha ${SEASON}`;
const B = `DF Bravo ${SEASON}`;
const matchIds: string[] = [];
let mno = 0;
const adm = (r: request.Test) => r.set("x-bcpl-admin", TEST_ADMIN_SECRET);

async function mkMatch(status = "live") {
  const [m] = await db.insert(matchesTable).values({
    matchNo: Number(`7${String(Date.now()).slice(-6)}${++mno}`.slice(-8)),
    season: SEASON, team1: A, team2: B, venue: "DF Ground", status,
  }).returning();
  matchIds.push(m.id);
  return m;
}
async function mkInnings(matchId: string, num: number, bat: string, bowl: string, opts: {
  runs?: number; wkts?: number; overs?: number; balls?: number; status?: string; revisedOvers?: number; target?: number;
} = {}) {
  const [i] = await db.insert(inningsTable).values({
    matchId, inningsNumber: num, battingTeam: bat, bowlingTeam: bowl,
    totalRuns: opts.runs ?? 0, totalWickets: opts.wkts ?? 0,
    overs: opts.overs ?? 0, balls: opts.balls ?? 0, status: opts.status ?? "live",
    originalOvers: 20, revisedOvers: opts.revisedOvers ?? null, target: opts.target ?? null,
  } as typeof inningsTable.$inferInsert).returning();
  return i;
}

beforeAll(async () => { await ensureDlsColumns(); });
afterAll(async () => {
  if (!matchIds.length) return;
  const inns = await db.select({ id: inningsTable.id }).from(inningsTable).where(inArray(inningsTable.matchId, matchIds));
  const ids = inns.map((i) => i.id);
  if (ids.length) await db.delete(deliveriesTable).where(inArray(deliveriesTable.inningsId, ids));
  await db.delete(inningsTable).where(inArray(inningsTable.matchId, matchIds));
  await db.delete(matchesTable).where(inArray(matchesTable.id, matchIds));
});

describe("first-innings reduction flows into the chase target", () => {
  it("reducing innings 1 sets a DLS target on innings 2 at creation (not runs+1@20)", async () => {
    const m = await mkMatch("live");
    // Innings 1 live, reduced mid-innings to 15 overs, closes at 130/6 in 15.
    const inn1 = await mkInnings(m.id, 1, A, B, { runs: 130, wkts: 6, overs: 15, status: "live" });

    // Apply the reduction to innings 1.
    const dls = await adm(request(app).post(`/api/scoring/${m.id}/dls`))
      .send({ inningsNumber: 1, oversAvailable: 15 });
    expect(dls.status).toBe(200);

    // End innings 1 → creates innings 2. Target MUST be the DLS revised target,
    // not the ordinary 131.
    const end = await adm(request(app).post(`/api/scoring/${m.id}/innings-end`)).send({});
    expect(end.status).toBe(200);
    const inn2 = end.body.innings2;
    expect(inn2.inningsNumber).toBe(2);

    // Recompute the expected DLS target from the same helper the server uses.
    const [inn1row] = await db.select().from(inningsTable)
      .where(and(eq(inningsTable.matchId, m.id), eq(inningsTable.inningsNumber, 1)));
    const [inn2row] = await db.select().from(inningsTable)
      .where(and(eq(inningsTable.matchId, m.id), eq(inningsTable.inningsNumber, 2)));
    const expected = computeDlsChaseTarget(inn1row, inn2row);
    expect(inn2.target).toBe(expected);
    // Innings-1 reduction with a same-length chase should give a target
    // different from the naive 131.
    expect(inn2.target).not.toBe(131);

    // Match is flagged DLS.
    const live = await request(app).get(`/api/matches/${m.id}/live`);
    expect(live.body.dls).toBeTruthy();
    expect(live.body.dls.revisedOvers["1"]).toBe(15);
  });
});

describe("innings-2 reduction registered before the chase exists", () => {
  it("is stashed at match level and adopted when innings 2 is created", async () => {
    const m = await mkMatch("innings2");
    await mkInnings(m.id, 1, A, B, { runs: 170, wkts: 5, overs: 20, status: "completed" });

    // Rain in the break: chase cut to 12 overs BEFORE innings 2 exists.
    const dls = await adm(request(app).post(`/api/scoring/${m.id}/dls`))
      .send({ inningsNumber: 2, oversAvailable: 12 });
    expect(dls.status).toBe(200);
    expect(dls.body.deferred).toBe(true);

    // Match-level column records it.
    const [mrow] = await db.select().from(matchesTable).where(eq(matchesTable.id, m.id));
    expect(mrow.dlsInnings2Overs).toBe(12);

    // Create innings 2 → adopts revised 12 overs + DLS target.
    const end = await adm(request(app).post(`/api/scoring/${m.id}/innings-end`)).send({});
    expect(end.status).toBe(200);
    const inn2 = end.body.innings2;
    expect(inn2.revisedOvers).toBe(12);
    const [inn1row] = await db.select().from(inningsTable)
      .where(and(eq(inningsTable.matchId, m.id), eq(inningsTable.inningsNumber, 1)));
    const expected = computeDlsChaseTarget(inn1row, inn2);
    expect(inn2.target).toBe(expected);
    expect(inn2.target).not.toBe(171);
  });
});

describe("scoring mutations serialize on the match row", () => {
  it("concurrent ball requests do not lose an update", async () => {
    const m = await mkMatch("live");
    await mkInnings(m.id, 1, A, B, { status: "live" });

    // Fire several single-run balls concurrently; each acquires FOR UPDATE in
    // turn, so all should land (no lost update).
    const N = 6;
    const reqs = Array.from({ length: N }, () =>
      adm(request(app).post(`/api/scoring/${m.id}/ball`))
        .send({ outcome: "1", batterName: "Bat", bowlerName: "Bowl" }));
    const results = await Promise.all(reqs);
    for (const r of results) expect(r.status).toBe(200);

    const [inn1] = await db.select().from(inningsTable)
      .where(and(eq(inningsTable.matchId, m.id), eq(inningsTable.inningsNumber, 1)));
    // All N legal balls counted exactly once.
    expect(inn1.totalRuns).toBe(N);
    const legalBalls = inn1.overs * 6 + inn1.balls;
    expect(legalBalls).toBe(N);
  });
});

/**
 * Route tests for GET /api/mvp/leaderboard (src/routes/mvp.ts).
 *
 * Uses a DEDICATED unique season so other suites' season-5 official matches
 * can't leak into the aggregate. Inserts real matches/innings/deliveries, then
 * asserts points, the final-eligibility rule (Man of the Series / car prize),
 * finalists payload, and the eligibleOnly filter.
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { inArray } from "drizzle-orm";

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { matchesTable, inningsTable, deliveriesTable } = await import("@workspace/db/schema");
const { __clearMvpCache } = await import("../src/routes/mvp");
const { DEFAULT_MVP_POINTS_CONFIG: C } = await import("../src/lib/mvpPoints");

// unique season per run (kept well away from real season 5)
const SEASON = 900000 + (Number(String(Date.now()).slice(-5)));
const TEAM_A = `MVP Alpha ${SEASON}`;
const TEAM_B = `MVP Bravo ${SEASON}`;
const TEAM_C = `MVP Charlie ${SEASON}`;

const matchIds: string[] = [];
let mno = 0;

async function insertMatch(opts: { team1: string; team2: string; stage: string; status: string }) {
  const [m] = await db.insert(matchesTable).values({
    matchNo: Number(`8${String(Date.now()).slice(-6)}${++mno}`.slice(-8)),
    season: SEASON,
    team1: opts.team1, team2: opts.team2,
    venue: "MVP Ground", stage: opts.stage, status: opts.status,
  }).returning();
  matchIds.push(m.id);
  return m;
}

async function insertInnings(matchId: string, battingTeam: string, bowlingTeam: string, innNo: number) {
  const [i] = await db.insert(inningsTable).values({
    matchId, inningsNumber: innNo, battingTeam, bowlingTeam, status: "completed",
  }).returning();
  return i;
}

type DelOpts = Partial<{
  overNumber: number; batterName: string; bowlerName: string; runsOffBat: number;
  extrasRuns: number; extraType: string | null; isWicket: boolean;
  dismissalType: string | null; dismissedBatter: string | null; fielderName: string | null;
}>;
async function insertDelivery(inningsId: string, o: DelOpts) {
  const runsOffBat = o.runsOffBat ?? 0, extrasRuns = o.extrasRuns ?? 0;
  await db.insert(deliveriesTable).values({
    inningsId,
    overNumber: o.overNumber ?? 0,
    ballInOver: 1,
    deliveryInOver: 1,
    batterName: o.batterName ?? "B",
    bowlerName: o.bowlerName ?? "W",
    runsOffBat, extrasRuns,
    extraType: o.extraType ?? null,
    totalRuns: runsOffBat + extrasRuns,
    isWicket: o.isWicket ?? false,
    dismissalType: o.dismissalType ?? null,
    dismissedBatter: o.dismissedBatter ?? null,
    fielderName: o.fielderName ?? null,
  });
}

beforeAll(async () => {
  // Completed league match: A bats vs B.
  const m1 = await insertMatch({ team1: TEAM_A, team2: TEAM_B, stage: "league", status: "completed" });
  const inn1 = await insertInnings(m1.id, TEAM_A, TEAM_B, 1);
  // Batter "Kohli" (TEAM_A): 6 + 4 + 2 = 12 runs, one six one four
  await insertDelivery(inn1.id, { batterName: "Kohli", runsOffBat: 6 });
  await insertDelivery(inn1.id, { batterName: "Kohli", runsOffBat: 4 });
  await insertDelivery(inn1.id, { batterName: "Kohli", runsOffBat: 2 });
  // Bowler "Bumrah" (TEAM_B) bowls Kohli out (bowled)
  await insertDelivery(inn1.id, { batterName: "Kohli", bowlerName: "Bumrah", isWicket: true, dismissalType: "bowled", dismissedBatter: "Kohli" });

  __clearMvpCache();
});

afterAll(async () => {
  if (matchIds.length) {
    const inns = await db.select({ id: inningsTable.id }).from(inningsTable).where(inArray(inningsTable.matchId, matchIds));
    const ids = inns.map(i => i.id);
    if (ids.length) await db.delete(deliveriesTable).where(inArray(deliveriesTable.inningsId, ids));
    await db.delete(inningsTable).where(inArray(inningsTable.matchId, matchIds));
    await db.delete(matchesTable).where(inArray(matchesTable.id, matchIds));
  }
  __clearMvpCache();
});

describe("GET /api/mvp/leaderboard", () => {
  it("computes points per player from official deliveries", async () => {
    const r = await request(app).get(`/api/mvp/leaderboard?season=${SEASON}`);
    expect(r.status).toBe(200);
    expect(r.body.season).toBe(SEASON);
    const kohli = r.body.leaderboard.find((p: { name: string }) => p.name === "Kohli");
    expect(kohli).toBeTruthy();
    expect(kohli.runs).toBe(12);
    // 12 runs + four bonus + six bonus (no milestone, not a duck)
    expect(kohli.breakdown.battingPoints).toBe(12 * C.batting.run + C.batting.fourBonus + C.batting.sixBonus);
    const bumrah = r.body.leaderboard.find((p: { name: string }) => p.name === "Bumrah");
    expect(bumrah.wickets).toBe(1);
    expect(bumrah.breakdown.bowlingPoints).toBe(C.bowling.wicket + C.bowling.bowledLbwBonus);
    expect(bumrah.points).toBe(bumrah.breakdown.battingPoints + bumrah.breakdown.bowlingPoints + bumrah.breakdown.fieldingPoints);
  });

  it("no final scheduled → finalists null, finalEligible false for all", async () => {
    const r = await request(app).get(`/api/mvp/leaderboard?season=${SEASON}`);
    expect(r.body.finalists).toBeNull();
    for (const p of r.body.leaderboard) expect(p.finalEligible).toBe(false);
    expect(r.body.note).toMatch(/No final scheduled/i);
  });

  it("when a final is scheduled, only finalist-team players are eligible", async () => {
    // Schedule a final between A and C (B does NOT play the final).
    await insertMatch({ team1: TEAM_A, team2: TEAM_C, stage: "final", status: "scheduled" });
    __clearMvpCache();

    const r = await request(app).get(`/api/mvp/leaderboard?season=${SEASON}`);
    expect(r.body.finalists).toEqual([TEAM_A, TEAM_C]);
    const kohli = r.body.leaderboard.find((p: { name: string }) => p.name === "Kohli"); // TEAM_A
    const bumrah = r.body.leaderboard.find((p: { name: string }) => p.name === "Bumrah"); // TEAM_B
    expect(kohli.finalEligible).toBe(true);
    expect(bumrah.finalEligible).toBe(false);
    expect(r.body.note).toMatch(/car prize/i);
  });

  it("default view auto re-ranks: finalist-team players FIRST even with fewer points", async () => {
    // With a final scheduled, Kohli (TEAM_A, eligible, 15 pts) must outrank
    // Bumrah (TEAM_B, NOT eligible, 33 pts from a wicket) in the DEFAULT view —
    // eligible rows are grouped ahead, then non-eligible, each points-desc.
    const r = await request(app).get(`/api/mvp/leaderboard?season=${SEASON}`);
    expect(r.status).toBe(200);
    const board: Array<{ name: string; rank: number; finalEligible: boolean; points: number }> = r.body.leaderboard;
    const kohli = board.find(p => p.name === "Kohli")!;
    const bumrah = board.find(p => p.name === "Bumrah")!;
    expect(bumrah.points).toBeGreaterThan(kohli.points); // Bumrah has more points…
    expect(kohli.rank).toBeLessThan(bumrah.rank);         // …yet Kohli ranks higher (eligible first)
    // eligible block precedes the non-eligible block
    const firstIneligibleIdx = board.findIndex(p => !p.finalEligible);
    const lastEligibleIdx = board.map(p => p.finalEligible).lastIndexOf(true);
    if (firstIneligibleIdx !== -1) expect(lastEligibleIdx).toBeLessThan(firstIneligibleIdx);
    // ranks contiguous 1..n across both groups
    board.forEach((p, i) => expect(p.rank).toBe(i + 1));
    // note explains the ordering + car ineligibility
    expect(r.body.note).toMatch(/ranked first/i);
    expect(r.body.note).toMatch(/not valid for the car/i);
  });

  it("eligibleOnly=1 filters to finalist-team players only", async () => {
    const r = await request(app).get(`/api/mvp/leaderboard?season=${SEASON}&eligibleOnly=1`);
    expect(r.status).toBe(200);
    expect(r.body.leaderboard.length).toBeGreaterThan(0);
    for (const p of r.body.leaderboard) expect(p.finalEligible).toBe(true);
    // Bumrah (TEAM_B) is excluded
    expect(r.body.leaderboard.find((p: { name: string }) => p.name === "Bumrah")).toBeUndefined();
    // ranks are contiguous from 1
    r.body.leaderboard.forEach((p: { rank: number }, i: number) => expect(p.rank).toBe(i + 1));
  });
});

describe("GET /api/mvp/stats", () => {
  type Leader = { player: string; team: string; matches: number; value: number };

  it("returns raw statistical leaders from the same completed-match deliveries", async () => {
    const r = await request(app).get(`/api/mvp/stats?season=${SEASON}`);
    expect(r.status).toBe(200);
    expect(r.body.season).toBe(SEASON);
    for (const k of ["mostRuns", "mostWickets", "mostCatches", "mostSixes", "mostFours"]) {
      expect(Array.isArray(r.body[k])).toBe(true);
    }
    // Kohli: 12 runs, one six, one four (TEAM_A).
    const runs = (r.body.mostRuns as Leader[]).find((x) => x.player === "Kohli");
    expect(runs).toMatchObject({ player: "Kohli", team: TEAM_A, value: 12, matches: 1 });
    expect((r.body.mostSixes as Leader[]).find((x) => x.player === "Kohli")).toMatchObject({ value: 1 });
    expect((r.body.mostFours as Leader[]).find((x) => x.player === "Kohli")).toMatchObject({ value: 1 });
    // Bumrah: 1 wicket (bowled), credited to the bowler.
    expect((r.body.mostWickets as Leader[]).find((x) => x.player === "Bumrah"))
      .toMatchObject({ player: "Bumrah", team: TEAM_B, value: 1 });
    // Each entry carries the contract shape.
    for (const e of r.body.mostRuns as Leader[]) {
      expect(e).toHaveProperty("player");
      expect(e).toHaveProperty("team");
      expect(e).toHaveProperty("matches");
      expect(e).toHaveProperty("value");
    }
  });
});

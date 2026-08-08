/**
 * Match moments (GET /api/matches/:id/moments), live-now
 * (GET /api/matches/live-now) + admin clip attach
 * (PATCH /api/matches/admin/matches/:id/moments).
 *
 * Inserts real deliveries and asserts the derived wicket/six/fifty/hat-trick
 * moments, then pins an admin clip and checks it merges in.
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { inArray } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { matchesTable, inningsTable, deliveriesTable, matchMomentsTable } = await import("@workspace/db/schema");
const { ensureMatchMomentsTable } = await import("../src/lib/matchMoments");

const SEASON = 910000 + Number(String(Date.now()).slice(-5));
const matchIds: string[] = [];
let mno = 0;

async function insertMatch(status: string) {
  const [m] = await db.insert(matchesTable).values({
    matchNo: Number(`7${String(Date.now()).slice(-6)}${++mno}`.slice(-8)),
    season: SEASON, team1: `Mo A ${SEASON}`, team2: `Mo B ${SEASON}`,
    venue: "Moment Ground", status,
  }).returning();
  matchIds.push(m.id);
  return m;
}
async function insertInnings(matchId: string) {
  const [i] = await db.insert(inningsTable).values({
    matchId, inningsNumber: 1, battingTeam: `Mo A ${SEASON}`, bowlingTeam: `Mo B ${SEASON}`, status: "completed",
  }).returning();
  return i;
}
let ballSeq = 0;
async function del(inningsId: string, o: Partial<{
  overNumber: number; ballInOver: number; batterName: string; bowlerName: string; runsOffBat: number;
  isWicket: boolean; dismissalType: string; dismissedBatter: string;
}>) {
  const runs = o.runsOffBat ?? 0;
  await db.insert(deliveriesTable).values({
    inningsId,
    overNumber: o.overNumber ?? 0,
    ballInOver: o.ballInOver ?? 1,
    deliveryInOver: ++ballSeq,
    batterName: o.batterName ?? "Striker",
    bowlerName: o.bowlerName ?? "Bowler",
    runsOffBat: runs, extrasRuns: 0, totalRuns: runs,
    isWicket: o.isWicket ?? false,
    dismissalType: o.dismissalType ?? null,
    dismissedBatter: o.dismissedBatter ?? null,
  } as typeof deliveriesTable.$inferInsert);
}

beforeAll(async () => { await ensureMatchMomentsTable(); });

afterAll(async () => {
  if (matchIds.length) {
    await db.delete(matchMomentsTable).where(inArray(matchMomentsTable.matchId, matchIds));
    const innings = await db.select({ id: inningsTable.id }).from(inningsTable).where(inArray(inningsTable.matchId, matchIds));
    const innIds = innings.map((i) => i.id);
    if (innIds.length) await db.delete(deliveriesTable).where(inArray(deliveriesTable.inningsId, innIds));
    await db.delete(inningsTable).where(inArray(inningsTable.matchId, matchIds));
    await db.delete(matchesTable).where(inArray(matchesTable.id, matchIds));
  }
});

describe("GET /api/matches/:id/moments", () => {
  it("derives wickets, sixes, a fifty and a hat-trick from deliveries", async () => {
    const m = await insertMatch("completed");
    const inn = await insertInnings(m.id);

    // A batter accumulates to 50 across balls, plus some sixes.
    // 8 sixes = 48, then a 4-run ball would need runsOffBat=4 (no six moment),
    // use 8 sixes (48) then a 2 to reach 50 → fifty on that ball.
    for (let i = 0; i < 8; i++) {
      await del(inn.id, { overNumber: i, ballInOver: 1, batterName: "Bighit", runsOffBat: 6 });
    }
    await del(inn.id, { overNumber: 8, ballInOver: 1, batterName: "Bighit", runsOffBat: 2 }); // crosses 50

    // Hat-trick: same bowler, three consecutive legal wicket balls.
    await del(inn.id, { overNumber: 9, ballInOver: 1, bowlerName: "Hattrick", isWicket: true, dismissalType: "bowled", dismissedBatter: "V1", batterName: "V1" });
    await del(inn.id, { overNumber: 9, ballInOver: 2, bowlerName: "Hattrick", isWicket: true, dismissalType: "bowled", dismissedBatter: "V2", batterName: "V2" });
    await del(inn.id, { overNumber: 9, ballInOver: 3, bowlerName: "Hattrick", isWicket: true, dismissalType: "caught", dismissedBatter: "V3", batterName: "V3" });

    const res = await request(app).get(`/api/matches/${m.id}/moments`);
    expect(res.status).toBe(200);
    const types = res.body.moments.map((x: { type: string }) => x.type);
    expect(types).toContain("six");
    expect(types).toContain("fifty");
    expect(types).toContain("wicket");
    expect(types).toContain("hat_trick");
    // Bilingual copy present.
    const six = res.body.moments.find((x: { type: string }) => x.type === "six");
    expect(six.text).toBeTruthy();
    expect(six.textHi).toBeTruthy();
    expect(res.body.moments.filter((x: { type: string }) => x.type === "six").length).toBe(8);
  });

  it("404s for an unknown match", async () => {
    const res = await request(app).get("/api/matches/00000000-0000-0000-0000-000000000000/moments");
    expect(res.status).toBe(404);
  });
});

describe("admin clip attach", () => {
  it("attaches and clears a clip URL (admin only)", async () => {
    const m = await insertMatch("completed");
    const inn = await insertInnings(m.id);
    await del(inn.id, { overNumber: 0, ballInOver: 2, runsOffBat: 6, batterName: "Clipper" });

    const noAuth = await request(app).patch(`/api/matches/admin/matches/${m.id}/moments`)
      .send({ inningsNumber: 1, overNumber: 0, ballInOver: 2, clipUrl: "https://x.test/clip.mp4" });
    expect(noAuth.status).toBe(403);

    const attach = await request(app).patch(`/api/matches/admin/matches/${m.id}/moments`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET)
      .send({ inningsNumber: 1, overNumber: 0, ballInOver: 2, clipUrl: "https://x.test/clip.mp4", caption: "Huge six" });
    expect(attach.status).toBe(200);

    const withClip = await request(app).get(`/api/matches/${m.id}/moments`);
    const six = withClip.body.moments.find((x: { type: string }) => x.type === "six");
    expect(six.clipUrl).toBe("https://x.test/clip.mp4");

    const clear = await request(app).patch(`/api/matches/admin/matches/${m.id}/moments`)
      .set("x-bcpl-admin", TEST_ADMIN_SECRET)
      .send({ inningsNumber: 1, overNumber: 0, ballInOver: 2, clipUrl: "" });
    expect(clear.status).toBe(200);
    const afterClear = await request(app).get(`/api/matches/${m.id}/moments`);
    const six2 = afterClear.body.moments.find((x: { type: string }) => x.type === "six");
    expect(six2.clipUrl).toBeUndefined();
  });
});

describe("GET /api/matches/live-now", () => {
  it("returns live/today matches with an isLive flag", async () => {
    const m = await insertMatch("live");
    const inn = await insertInnings(m.id);
    await del(inn.id, { overNumber: 0, ballInOver: 1, runsOffBat: 4, batterName: "LiveBat" });
    const res = await request(app).get(`/api/matches/live-now?season=${SEASON}`);
    expect(res.status).toBe(200);
    const found = res.body.matches.find((x: { matchId: string }) => x.matchId === m.id);
    expect(found).toBeTruthy();
    expect(found.isLive).toBe(true);
  });
});

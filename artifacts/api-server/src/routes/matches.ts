/**
 * Match management routes
 *
 * Public:
 *   GET  /api/matches              – list matches (season, status filters)
 *   GET  /api/matches/:id          – match detail + current score
 *   GET  /api/matches/:id/live     – compact live score (polled by frontend every 5 s)
 *   GET  /api/matches/:id/scorecard – full batting + bowling scorecards
 *
 * Admin (x-bcpl-admin header):
 *   POST /api/admin/matches              – create match
 *   PUT  /api/admin/matches/:id/toss     – record toss result
 *   POST /api/admin/matches/:id/xi       – set playing XI for both teams
 *   PUT  /api/admin/matches/:id/status   – update match status
 */

import { Router }       from "express";
import { db }           from "@workspace/db";
import {
  matchesTable, inningsTable, deliveriesTable, matchXITable,
} from "@workspace/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { z }            from "zod";

const router = Router();

/* ─── Helpers ─────────────────────────────────────────── */

/** Aggregate batting & bowling scorecards from deliveries */
async function buildScorecard(inningsId: string) {
  const deliveries = await db
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.inningsId, inningsId))
    .orderBy(asc(deliveriesTable.overNumber), asc(deliveriesTable.deliveryInOver));

  // Batting
  const batMap = new Map<string, {
    name: string; runs: number; balls: number; fours: number; sixes: number; dismissal: string;
  }>();

  // Bowling
  const bowlMap = new Map<string, {
    name: string; overs: number; balls: number; runs: number; wickets: number; wides: number; noBalls: number;
  }>();

  // Fall of wickets
  const fow: { wicket: number; batter: string; runs: number; overStr: string }[] = [];
  let totalWicketsNow = 0;

  for (const d of deliveries) {
    // Batting
    if (!batMap.has(d.batterName)) {
      batMap.set(d.batterName, { name: d.batterName, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: "" });
    }
    const bat = batMap.get(d.batterName)!;
    if (!d.extraType) {                        // legal delivery counts for batter
      bat.balls++;
      bat.runs += d.runsOffBat;
      if (d.runsOffBat === 4) bat.fours++;
      if (d.runsOffBat === 6) bat.sixes++;
    }
    if (d.isWicket && d.dismissedBatter === d.batterName) {
      bat.dismissal = buildDismissalStr(d.dismissalType, d.fielderName, d.bowlerName);
    }

    // Bowling
    if (!bowlMap.has(d.bowlerName)) {
      bowlMap.set(d.bowlerName, { name: d.bowlerName, overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 });
    }
    const bowl = bowlMap.get(d.bowlerName)!;
    bowl.runs += d.totalRuns;
    if (!d.extraType || d.extraType === "no_ball") {
      bowl.balls++;
      if (bowl.balls === 6) { bowl.overs++; bowl.balls = 0; }
    }
    if (d.extraType === "wide")    bowl.wides++;
    if (d.extraType === "no_ball") bowl.noBalls++;
    if (d.isWicket && d.dismissalType !== "run_out" && d.dismissalType !== "retired_hurt") {
      bowl.wickets++;
    }

    // FoW
    if (d.isWicket) {
      totalWicketsNow++;
      const innsRow = await db.select().from(inningsTable).where(eq(inningsTable.id, inningsId)).limit(1);
      fow.push({ wicket: totalWicketsNow, batter: d.dismissedBatter || d.batterName,
        runs: innsRow[0]?.totalRuns ?? 0, overStr: `${d.overNumber}.${d.ballInOver}` });
    }
  }

  return {
    batting: Array.from(batMap.values()),
    bowling: Array.from(bowlMap.values()),
    fallOfWickets: fow,
  };
}

function buildDismissalStr(
  type: string | null | undefined,
  fielder: string | null | undefined,
  bowler: string | null | undefined,
): string {
  if (!type) return "";
  const b = bowler || "?";
  const f = fielder || "?";
  if (type === "bowled")          return `b ${b}`;
  if (type === "caught")          return `c ${f} b ${b}`;
  if (type === "lbw")             return `lbw b ${b}`;
  if (type === "run_out")         return `run out (${f})`;
  if (type === "stumped")         return `st ${f} b ${b}`;
  if (type === "hit_wicket")      return `hit wicket b ${b}`;
  if (type === "caught_and_bowled") return `c & b ${b}`;
  if (type === "retired_hurt")    return "retired hurt";
  return "dismissed";
}

/* ─── Public routes ──────────────────────────────────── */

// GET /api/matches
router.get("/", async (req, res) => {
  const season = Number(req.query.season) || 5;
  const status = req.query.status as string | undefined;

  let q = db.select().from(matchesTable).where(eq(matchesTable.season, season)).$dynamic();
  if (status) q = q.where(eq(matchesTable.status, status)) as any;

  const rows = await (q as any).orderBy(asc(matchesTable.matchNo));
  res.json({ matches: rows });
});

// GET /api/matches/:id
router.get("/:id", async (req, res) => {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.id))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  const innings = await db.select().from(inningsTable)
    .where(eq(inningsTable.matchId, match.id))
    .orderBy(asc(inningsTable.inningsNumber));

  res.json({ match, innings });
});

// GET /api/matches/:id/live  (compact — polled every 5s by public website)
router.get("/:id/live", async (req, res) => {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.id))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  const innings = await db.select().from(inningsTable)
    .where(eq(inningsTable.matchId, match.id))
    .orderBy(asc(inningsTable.inningsNumber));

  // Last 6 deliveries for commentary
  const latest = await db.select().from(deliveriesTable)
    .where(eq(deliveriesTable.inningsId, innings[innings.length - 1]?.id ?? ""))
    .orderBy(desc(deliveriesTable.createdAt))
    .limit(6);

  res.json({
    matchId:   match.id,
    matchNo:   match.matchNo,
    team1:     match.team1,
    team2:     match.team2,
    venue:     match.venue,
    status:    match.status,
    winner:    match.winner,
    resultDesc:match.resultDesc,
    innings:   innings.map(i => ({
      number:       i.inningsNumber,
      battingTeam:  i.battingTeam,
      bowlingTeam:  i.bowlingTeam,
      totalRuns:    i.totalRuns,
      totalWickets: i.totalWickets,
      overs:        i.overs,
      balls:        i.balls,
      extras:       i.extras,
      target:       i.target,
      status:       i.status,
    })),
    recentDeliveries: latest.map(d => ({
      over:       `${d.overNumber}.${d.ballInOver}`,
      runs:       d.totalRuns,
      isWicket:   d.isWicket,
      commentary: d.commentary,
    })),
  });
});

// GET /api/matches/:id/scorecard
router.get("/:id/scorecard", async (req, res) => {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.id))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  const innings = await db.select().from(inningsTable)
    .where(eq(inningsTable.matchId, match.id))
    .orderBy(asc(inningsTable.inningsNumber));

  const scorecards = await Promise.all(innings.map(async i => ({
    innings:     i,
    scorecard:   await buildScorecard(i.id),
  })));

  res.json({ match, scorecards });
});

/* ─── Admin routes ───────────────────────────────────── */

// POST /api/admin/matches
router.post("/admin/matches", requireAdmin, async (req, res) => {
  const schema = z.object({
    matchNo:     z.number().int().positive(),
    season:      z.number().int().default(5),
    team1:       z.string().min(2).max(80),
    team2:       z.string().min(2).max(80),
    venue:       z.string().min(2).max(150),
    scheduledAt: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const [match] = await db.insert(matchesTable).values({
    ...parsed.data,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    status: "scheduled",
  }).returning();

  res.json({ success: true, match });
});

// PUT /api/admin/matches/:id/toss
router.put("/admin/matches/:id/toss", requireAdmin, async (req, res) => {
  const schema = z.object({
    tossWinner:   z.string().min(2).max(80),
    tossDecision: z.enum(["bat", "field"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const [match] = await db.update(matchesTable)
    .set({ ...parsed.data, status: "toss_done", updatedAt: new Date() })
    .where(eq(matchesTable.id, String(req.params.id)))
    .returning();

  if (!match) return void res.status(404).json({ error: "Match not found" });
  res.json({ success: true, match });
});

// POST /api/admin/matches/:id/xi  — set playing XI for both teams
router.post("/admin/matches/:id/xi", requireAdmin, async (req, res) => {
  const schema = z.object({
    xi1: z.array(z.object({ name: z.string(), role: z.enum(["BAT","BOWL","AR","WK"]) })).length(11),
    xi2: z.array(z.object({ name: z.string(), role: z.enum(["BAT","BOWL","AR","WK"]) })).length(11),
    battingTeam: z.string(), // which team bats first
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.id))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  const { xi1, xi2, battingTeam } = parsed.data;
  const isTeam1Batting = battingTeam === match.team1;
  const bowlingTeam    = isTeam1Batting ? match.team2 : match.team1;

  // Delete old XI records for this match
  await db.delete(matchXITable).where(eq(matchXITable.matchId, match.id));

  // Insert XI records
  const xiRows = [
    ...xi1.map((p, i) => ({ matchId: match.id, team: match.team1, playerName: p.name, playerRole: p.role, battingOrder: i + 1, isPlaying: true })),
    ...xi2.map((p, i) => ({ matchId: match.id, team: match.team2, playerName: p.name, playerRole: p.role, battingOrder: i + 1, isPlaying: true })),
  ];
  await db.insert(matchXITable).values(xiRows);

  // Create 1st innings
  const batXI  = isTeam1Batting ? xi1.map(p=>p.name) : xi2.map(p=>p.name);
  const bowlXI = isTeam1Batting ? xi2.map(p=>p.name) : xi1.map(p=>p.name);

  const [innings] = await db.insert(inningsTable).values({
    matchId:       match.id,
    inningsNumber: 1,
    battingTeam,
    bowlingTeam,
    battingXI: batXI,
    bowlingXI: bowlXI,
    status: "live",
  }).returning();

  // Update match status
  await db.update(matchesTable)
    .set({ status: "live", updatedAt: new Date() })
    .where(eq(matchesTable.id, match.id));

  res.json({ success: true, innings });
});

// PUT /api/admin/matches/:id/status
router.put("/admin/matches/:id/status", requireAdmin, async (req, res) => {
  const schema = z.object({
    status:        z.enum(["scheduled","toss_done","xi_selected","live","innings2","completed","abandoned"]),
    winner:        z.string().optional(),
    resultDesc:    z.string().optional(),
    playerOfMatch: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const [match] = await db.update(matchesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(matchesTable.id, String(req.params.id)))
    .returning();

  if (!match) return void res.status(404).json({ error: "Match not found" });
  res.json({ success: true, match });
});

export default router;

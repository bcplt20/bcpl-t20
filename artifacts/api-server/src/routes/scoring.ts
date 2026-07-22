/**
 * Live scoring routes (admin only)
 *
 * POST /api/admin/scoring/:matchId/ball   – record a delivery
 * POST /api/admin/scoring/:matchId/innings-end  – end current innings, start 2nd
 * PUT  /api/admin/scoring/:matchId/players – update striker / non-striker / bowler
 * DELETE /api/admin/scoring/:matchId/ball  – undo last delivery
 */

import { Router }   from "express";
import { db }       from "@workspace/db";
import {
  matchesTable, inningsTable, deliveriesTable,
} from "@workspace/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireAdmin }  from "../middlewares/adminAuth";
import { z }             from "zod";

const router = Router();

/* ─── Helpers ─────────────────────────────────────────── */
const fmtOvers = (overs: number, balls: number) => `${overs}.${balls}`;

function genCommentary(
  over: number, ball: number,
  outcome: string, batter: string,
  dismissal?: string,
): string {
  const tag = `${over}.${ball}`;
  if (dismissal)     return `${tag} — 💥 OUT! ${batter} ${dismissal}.`;
  if (outcome === "6") return `${tag} — 🚀 SIX! ${batter} goes over the top!`;
  if (outcome === "4") return `${tag} — 🏏 FOUR! Racing to the boundary!`;
  if (outcome === ".")  return `${tag} — 🎯 Dot ball. Tight bowling.`;
  if (outcome === "WD") return `${tag} — Wide ball signalled. +1 extra.`;
  if (outcome === "NB") return `${tag} — ⚠️ No ball! Free hit next delivery.`;
  if (outcome === "LB") return `${tag} — Leg bye, 1 extra.`;
  if (outcome === "B")  return `${tag} — Bye, 1 extra.`;
  return `${tag} — ${outcome} run(s) taken.`;
}

/* ─── POST /api/admin/scoring/:matchId/ball ──────────────── */
router.post("/:matchId/ball", requireAdmin, async (req, res) => {
  const bodySchema = z.object({
    outcome:      z.enum(["0","1","2","3","4","6",".","WD","NB","LB","B","W"]),
    batterName:   z.string().min(1),
    bowlerName:   z.string().min(1),
    // required only when outcome === "W"
    dismissalType:    z.enum(["bowled","caught","lbw","run_out","stumped","hit_wicket","caught_and_bowled","retired_hurt"]).optional(),
    dismissedBatter:  z.string().optional(),
    fielderName:      z.string().optional(),
    nonStrikerOut:    z.boolean().optional(),  // for run_out
    customCommentary: z.string().max(300).optional(),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const {
    outcome, batterName, bowlerName,
    dismissalType, dismissedBatter, fielderName, nonStrikerOut,
    customCommentary,
  } = parsed.data;

  // Load match + current innings
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.matchId))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });
  if (match.status !== "live" && match.status !== "innings2") {
    return void res.status(400).json({ error: "Match is not live" });
  }

  const innings = await db.select().from(inningsTable)
    .where(and(eq(inningsTable.matchId, match.id), eq(inningsTable.status, "live")))
    .orderBy(desc(inningsTable.inningsNumber))
    .limit(1);

  if (!innings.length) return void res.status(400).json({ error: "No live innings found" });
  const inn = innings[0];

  // Determine extra type
  const isWide  = outcome === "WD";
  const isNB    = outcome === "NB";
  const isLB    = outcome === "LB";
  const isBye   = outcome === "B";
  const isExtra = isWide || isNB || isLB || isBye;
  const isWicket= outcome === "W";
  const extraType = isWide?"wide":isNB?"no_ball":isLB?"leg_bye":isBye?"bye":undefined;

  const runsOffBat  = isWicket||isExtra||outcome==="."?0 : Number(outcome);
  const extrasRuns  = isExtra ? 1 : 0;
  const totalRunsD  = runsOffBat + extrasRuns;

  // Next ball number within over
  const lastDelivery = await db.select().from(deliveriesTable)
    .where(eq(deliveriesTable.inningsId, inn.id))
    .orderBy(desc(deliveriesTable.overNumber), desc(deliveriesTable.deliveryInOver))
    .limit(1);

  let overNumber      = inn.overs;
  let ballInOver      = inn.balls;   // legal balls completed in this over so far
  let deliveryInOver  = lastDelivery.length
    ? (lastDelivery[0].overNumber === overNumber ? lastDelivery[0].deliveryInOver + 1 : 1)
    : 1;

  // Legal ball increments ball count
  const isLegalBall = !isExtra;
  const newBalls    = isLegalBall ? ballInOver + 1 : ballInOver;
  const overDone    = isLegalBall && newBalls === 6;
  const newOvers    = overDone ? inn.overs + 1 : inn.overs;
  const finalBalls  = overDone ? 0 : newBalls;

  // Build dismissal string for commentary
  const dismissalStr = isWicket && dismissalType ? buildDis(dismissalType, fielderName, bowlerName) : undefined;

  const commentary = customCommentary ||
    genCommentary(overNumber, newBalls || deliveryInOver, outcome, batterName, dismissalStr);

  // Insert delivery
  await db.insert(deliveriesTable).values({
    inningsId:       inn.id,
    overNumber,
    ballInOver:      newBalls || ballInOver,
    deliveryInOver,
    batterName,
    bowlerName,
    runsOffBat,
    extrasRuns,
    extraType,
    totalRuns:       totalRunsD,
    isWicket,
    dismissalType:   dismissalType ?? null,
    dismissedBatter: dismissedBatter ?? (isWicket ? (nonStrikerOut ? undefined : batterName) : undefined) ?? null,
    fielderName:     fielderName ?? null,
    commentary,
  });

  // Update innings totals
  const newTotal    = inn.totalRuns + totalRunsD;
  const newWickets  = inn.totalWickets + (isWicket ? 1 : 0);
  const newExtras   = inn.extras + extrasRuns;

  // Check innings complete: 10 wickets or 20 overs
  const innsComplete = newWickets >= 10 || newOvers >= 20 ||
    (inn.target !== null && inn.target !== undefined && newTotal >= inn.target);

  const innsStatus = innsComplete ? "completed" : "live";

  await db.update(inningsTable).set({
    totalRuns:    newTotal,
    totalWickets: newWickets,
    overs:        newOvers,
    balls:        finalBalls,
    extras:       newExtras,
    status:       innsStatus,
    updatedAt:    new Date(),
  }).where(eq(inningsTable.id, inn.id));

  // If innings 1 just ended → update match status to innings2
  if (innsComplete && inn.inningsNumber === 1) {
    await db.update(matchesTable).set({ status: "innings2", updatedAt: new Date() })
      .where(eq(matchesTable.id, match.id));
  }
  // If innings 2 just ended → match completed
  if (innsComplete && inn.inningsNumber === 2) {
    await db.update(matchesTable).set({ status: "completed", updatedAt: new Date() })
      .where(eq(matchesTable.id, match.id));
  }

  res.json({
    success:     true,
    delivery:    { over: fmtOvers(overNumber, newBalls||ballInOver), runs: totalRunsD, isWicket, commentary },
    inningsTotal:{ runs: newTotal, wickets: newWickets, overs: newOvers, balls: finalBalls },
    inningsComplete: innsComplete,
  });
});

function buildDis(type: string, fielder?: string, bowler?: string): string {
  const b = bowler || "?", f = fielder || "?";
  if (type === "bowled")           return `b ${b}`;
  if (type === "caught")           return `c ${f} b ${b}`;
  if (type === "lbw")              return `lbw b ${b}`;
  if (type === "run_out")          return `run out (${f})`;
  if (type === "stumped")          return `st ${f} b ${b}`;
  if (type === "hit_wicket")       return `hit wicket b ${b}`;
  if (type === "caught_and_bowled") return `c & b ${b}`;
  if (type === "retired_hurt")     return "retired hurt";
  return "dismissed";
}

/* ─── POST /api/admin/scoring/:matchId/innings-end ────────── */
router.post("/:matchId/innings-end", requireAdmin, async (req, res) => {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.matchId))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  // Mark current innings complete
  await db.update(inningsTable).set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(inningsTable.matchId, match.id), eq(inningsTable.status, "live")));

  // Fetch 1st innings to set target
  const [inn1] = await db.select().from(inningsTable)
    .where(and(eq(inningsTable.matchId, match.id), eq(inningsTable.inningsNumber, 1))).limit(1);

  if (!inn1) return void res.status(400).json({ error: "1st innings not found" });

  const target = inn1.totalRuns + 1;
  const battingTeam = inn1.bowlingTeam; // now batting in 2nd
  const bowlingTeam = inn1.battingTeam;

  const [inn2] = await db.insert(inningsTable).values({
    matchId:       match.id,
    inningsNumber: 2,
    battingTeam,
    bowlingTeam,
    battingXI: inn1.bowlingXI as string[],
    bowlingXI: inn1.battingXI as string[],
    target,
    status: "live",
  }).returning();

  await db.update(matchesTable).set({ status: "live", updatedAt: new Date() })
    .where(eq(matchesTable.id, match.id));

  res.json({ success: true, innings2: inn2, target });
});

/* ─── DELETE /api/admin/scoring/:matchId/ball (undo) ───────── */
router.delete("/:matchId/ball", requireAdmin, async (req, res) => {
  const [inn] = await db.select().from(inningsTable)
    .where(and(eq(inningsTable.matchId, String(req.params.matchId)), eq(inningsTable.status, "live")))
    .orderBy(desc(inningsTable.inningsNumber))
    .limit(1);

  if (!inn) return void res.status(400).json({ error: "No live innings" });

  const [last] = await db.select().from(deliveriesTable)
    .where(eq(deliveriesTable.inningsId, inn.id))
    .orderBy(desc(deliveriesTable.createdAt))
    .limit(1);

  if (!last) return void res.status(400).json({ error: "No deliveries to undo" });

  // Reverse the totals
  const newTotal   = inn.totalRuns - last.totalRuns;
  const newWickets = inn.totalWickets - (last.isWicket ? 1 : 0);
  const newExtras  = inn.extras - last.extrasRuns;

  // Reverse ball count
  const isLegal = !last.extraType;
  let newBalls = inn.balls;
  let newOvers = inn.overs;
  if (isLegal) {
    if (newBalls === 0) { newOvers--; newBalls = 5; }
    else newBalls--;
  }

  await db.delete(deliveriesTable).where(eq(deliveriesTable.id, last.id));
  await db.update(inningsTable).set({
    totalRuns: newTotal, totalWickets: newWickets,
    overs: newOvers, balls: newBalls, extras: newExtras,
    status: "live", updatedAt: new Date(),
  }).where(eq(inningsTable.id, inn.id));

  res.json({ success: true, undone: last });
});

export default router;

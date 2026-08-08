/**
 * Live scoring routes (admin only). Mounted at /api/scoring.
 *
 * POST   /api/scoring/:matchId/ball          – record a delivery
 * POST   /api/scoring/:matchId/innings-end   – end current innings, start 2nd
 * DELETE /api/scoring/:matchId/ball          – undo last delivery
 * POST   /api/scoring/:matchId/dls           – rain interruption / reduce overs (DLS)
 */

import { Router }   from "express";
import { db }       from "@workspace/db";
import {
  matchesTable, inningsTable, deliveriesTable,
} from "@workspace/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { requireAdmin }  from "../middlewares/adminAuth";
import { z }             from "zod";
import { recomputePointsTable } from "../lib/pointsEngine";
import { decideResultForMatch } from "../lib/matchResult";
import { availableResource, dlsTarget, resourcePct } from "../lib/dls";
import { logger }        from "../lib/logger";

/** Best-effort points-table recompute — never fails the scoring request. */
async function safeRecompute(season: number): Promise<void> {
  try { await recomputePointsTable(season); }
  catch (e) { logger.error({ err: e, season }, "points-table auto-recompute failed"); }
}

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

  // Legal ball increments ball count (byes/leg-byes ARE legal deliveries; only wides & no-balls are re-bowled)
  const isLegalBall = !isWide && !isNB;
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

  // Check innings complete: 10 wickets, allotted overs reached (revised if a
  // DLS reduction is in force), or the (revised) target chased down.
  const allottedOvers = inn.revisedOvers ?? inn.originalOvers ?? 20;
  const innsComplete = newWickets >= 10 || newOvers >= allottedOvers ||
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
  // If innings 2 just ended → decide result (handles DLS) + auto-recompute table
  if (innsComplete && inn.inningsNumber === 2) {
    await db.update(matchesTable).set({ status: "completed", updatedAt: new Date() })
      .where(eq(matchesTable.id, match.id));
    await decideResultForMatch(match.id);
    await safeRecompute(match.season);
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

  // Idempotent: if innings 2 already exists, return it instead of duplicating
  const [existing2] = await db.select().from(inningsTable)
    .where(and(eq(inningsTable.matchId, match.id), eq(inningsTable.inningsNumber, 2))).limit(1);
  if (existing2) {
    await db.update(matchesTable).set({ status: "live", updatedAt: new Date() })
      .where(eq(matchesTable.id, match.id));
    return void res.json({ success: true, innings2: existing2, target: existing2.target });
  }

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

  // Reverse ball count (byes/leg-byes were legal deliveries)
  const isLegal = last.extraType !== "wide" && last.extraType !== "no_ball";
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

/* ─── POST /api/admin/scoring/:matchId/dls ─────────────────────────────────
 * Record a rain interruption / reduce the overs available for an innings.
 * Recomputes the DLS target for the chasing side when the reduction is applied
 * to (or after) innings 1. Scorer/admin authorized; the match row is locked
 * FOR UPDATE inside a transaction, matching every scoring mutation, so two
 * scorers can't apply conflicting reductions concurrently.
 *
 * Validations (ICC): cannot INCREASE overs beyond original; minimum 5 overs
 * for a valid T20 result. */
const dlsBody = z.object({
  inningsNumber: z.number().int().min(1).max(2),
  oversAvailable: z.number().int().min(1).max(20),
  // wickets lost at the moment of the stoppage (for the resource loss calc);
  // defaults to the innings' current wickets when omitted.
  wicketsLostAtStop: z.number().int().min(0).max(10).optional(),
});
router.post("/:matchId/dls", requireAdmin, async (req, res) => {
  const parsed = dlsBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const { inningsNumber, oversAvailable, wicketsLostAtStop } = parsed.data;
  const matchId = String(req.params.matchId);

  try {
    const result = await db.transaction(async (tx) => {
      // Lock the match row (all scorer writes serialize on it).
      const locked = await tx.execute(sql`SELECT id, season, status FROM matches WHERE id = ${matchId} FOR UPDATE`);
      const mrow = (locked.rows as Array<{ id: string; season: number; status: string }>)[0];
      if (!mrow) return { error: "Match not found", code: 404 as const };

      const [inn] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, inningsNumber))).limit(1);
      if (!inn) return { error: `Innings ${inningsNumber} not found`, code: 400 as const };

      const original = inn.originalOvers ?? 20;
      if (oversAvailable > original) {
        return { error: `Cannot increase overs beyond the original ${original}`, code: 400 as const };
      }
      if (oversAvailable < 5) {
        return { error: "Minimum 5 overs required for a valid T20 result under DLS", code: 400 as const };
      }
      const oversBowled = inn.overs + inn.balls / 6;
      if (oversAvailable < oversBowled) {
        return { error: `Innings has already bowled ${inn.overs}.${inn.balls} overs — revised overs cannot be below overs already bowled`, code: 400 as const };
      }

      // Log the interruption: resource lost between "stop" and "resume".
      const wktsAtStop = wicketsLostAtStop ?? inn.totalWickets;
      const oversLeftAtStop = (inn.revisedOvers ?? original) - oversBowled;
      const oversLeftAtResume = oversAvailable - oversBowled;
      const interruptions = [
        ...((inn.dlsInterruptions ?? []) as Array<{ oversLeftAtStop: number; wicketsLostAtStop: number; oversLeftAtResume: number }>),
        { oversLeftAtStop, wicketsLostAtStop: wktsAtStop, oversLeftAtResume },
      ];

      await tx.update(inningsTable).set({
        revisedOvers: oversAvailable,
        dlsInterruptions: interruptions,
        updatedAt: new Date(),
      }).where(eq(inningsTable.id, inn.id));

      // Mark the match as DLS-affected.
      await tx.update(matchesTable).set({ dlsApplied: true, updatedAt: new Date() })
        .where(eq(matchesTable.id, matchId));

      // If innings 2 exists, recompute its revised target from resources.
      let revisedTarget: number | null = null;
      const [inn1] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 1))).limit(1);
      const [inn2] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 2))).limit(1);
      if (inn1 && inn2) {
        const r1 = inningsResourceUsedTx(inn1);
        const r2 = availableResource(inn2.revisedOvers ?? inn2.originalOvers ?? 20,
          (inn2.dlsInterruptions ?? []) as Array<{ oversLeftAtStop: number; wicketsLostAtStop: number; oversLeftAtResume: number }>);
        revisedTarget = dlsTarget({ team1Score: inn1.totalRuns, team1Resource: r1, team2Resource: r2 });
        await tx.update(inningsTable).set({ target: revisedTarget, updatedAt: new Date() })
          .where(eq(inningsTable.id, inn2.id));
      }

      return { ok: true as const, season: mrow.season, revisedOvers: oversAvailable, revisedTarget, inningsNumber };
    });

    if ("error" in result) return void res.status(result.code ?? 400).json({ error: result.error });
    res.json({ success: true, ...result });
  } catch (e) {
    logger.error({ err: e, matchId }, "DLS reduce-overs failed");
    res.status(500).json({ error: "Could not apply DLS reduction" });
  }
});

/** Local copy of resource-used calc using a tx-selected innings row. */
function inningsResourceUsedTx(inn: typeof inningsTable.$inferSelect): number {
  const original = inn.originalOvers ?? 20;
  const interruptions = (inn.dlsInterruptions ?? []) as Array<{ oversLeftAtStop: number; wicketsLostAtStop: number; oversLeftAtResume: number }>;
  const available = availableResource(original, interruptions);
  if (inn.status === "completed") {
    const allocation = inn.revisedOvers ?? original;
    const oversLeftAtEnd = Math.max(0, allocation - (inn.overs + inn.balls / 6));
    const remaining = inn.totalWickets >= 10 ? 0 : resourcePct(oversLeftAtEnd, inn.totalWickets);
    return Math.max(0, available - remaining);
  }
  return available;
}

export default router;

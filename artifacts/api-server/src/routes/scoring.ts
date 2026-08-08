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
import { decideResultForMatch, computeDlsChaseTarget } from "../lib/matchResult";
import { logger }        from "../lib/logger";

/** Best-effort points-table recompute — never fails the scoring request. */
async function safeRecompute(season: number): Promise<void> {
  try { await recomputePointsTable(season); }
  catch (e) { logger.error({ err: e, season }, "points-table auto-recompute failed"); }
}

/**
 * Lock the match row FOR UPDATE inside the current transaction. Every scoring
 * mutation (ball / innings-end / undo / dls) serializes on this row so two
 * scorers can never interleave writes on the same match. Returns the locked
 * match {id, season, status} or null when the match doesn't exist.
 */
type TxLike = Parameters<Parameters<typeof db.transaction>[0]>[0];
async function lockMatch(tx: TxLike, matchId: string): Promise<{ id: string; season: number; status: string } | null> {
  const locked = await tx.execute(sql`SELECT id, season, status FROM matches WHERE id = ${matchId} FOR UPDATE`);
  return (locked.rows as Array<{ id: string; season: number; status: string }>)[0] ?? null;
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

  const matchId = String(req.params.matchId);
  let out: { status: number; body: Record<string, unknown> };
  let finalizedSeason: number | null = null;
  try {
    out = await db.transaction(async (tx) => {
  // Lock the match row — serializes all scoring writes for this match.
  const match = await lockMatch(tx, matchId);
  if (!match) return { status: 404, body: { error: "Match not found" } };
  if (match.status !== "live" && match.status !== "innings2") {
    return { status: 400, body: { error: "Match is not live" } };
  }

  const innings = await tx.select().from(inningsTable)
    .where(and(eq(inningsTable.matchId, match.id), eq(inningsTable.status, "live")))
    .orderBy(desc(inningsTable.inningsNumber))
    .limit(1);

  if (!innings.length) return { status: 400, body: { error: "No live innings found" } };
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
  const lastDelivery = await tx.select().from(deliveriesTable)
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
  await tx.insert(deliveriesTable).values({
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

  await tx.update(inningsTable).set({
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
    await tx.update(matchesTable).set({ status: "innings2", updatedAt: new Date() })
      .where(eq(matchesTable.id, match.id));
  }
  // If innings 2 just ended → mark completed inside the tx; the result decision
  // + points-table recompute run AFTER commit (they open their own reads).
  if (innsComplete && inn.inningsNumber === 2) {
    await tx.update(matchesTable).set({ status: "completed", updatedAt: new Date() })
      .where(eq(matchesTable.id, match.id));
    finalizedSeason = match.season;
  }

  return {
    status: 200,
    body: {
      success:     true,
      delivery:    { over: fmtOvers(overNumber, newBalls||ballInOver), runs: totalRunsD, isWicket, commentary },
      inningsTotal:{ runs: newTotal, wickets: newWickets, overs: newOvers, balls: finalBalls },
      inningsComplete: innsComplete,
    },
  };
    });
  } catch (e) {
    logger.error({ err: e, matchId }, "scoring ball failed");
    return void res.status(500).json({ error: "Could not record delivery" });
  }

  // Post-commit: decide result (handles DLS) + auto-recompute standings.
  if (finalizedSeason !== null) {
    await decideResultForMatch(matchId);
    await safeRecompute(finalizedSeason);
  }
  res.status(out.status).json(out.body);
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

/* ─── POST /api/admin/scoring/:matchId/innings-end ─────────────────────────
 * Ends the current innings and (for innings 1) creates innings 2.
 *
 * DLS flow: if the match has been rain-affected — either innings 1 was reduced,
 * or a reduction for the chase was registered ahead of time (matches.dls_innings2_overs) —
 * innings 2 is created with the correct REVISED allocation and its target is the
 * DLS revised target (resource ratio), NOT runs+1. This is what makes a
 * first-innings reduction actually flow through to the chase. */
router.post("/:matchId/innings-end", requireAdmin, async (req, res) => {
  const matchId = String(req.params.matchId);
  let out: { status: number; body: Record<string, unknown> };
  try {
    out = await db.transaction(async (tx) => {
      const match = await lockMatch(tx, matchId);
      if (!match) return { status: 404, body: { error: "Match not found" } };

      // Mark current live innings complete.
      await tx.update(inningsTable).set({ status: "completed", updatedAt: new Date() })
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.status, "live")));

      const [inn1] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 1))).limit(1);
      if (!inn1) return { status: 400, body: { error: "1st innings not found" } };

      // Idempotent: if innings 2 already exists, return it.
      const [existing2] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 2))).limit(1);
      if (existing2) {
        await tx.update(matchesTable).set({ status: "live", updatedAt: new Date() })
          .where(eq(matchesTable.id, matchId));
        return { status: 200, body: { success: true, innings2: existing2, target: existing2.target } };
      }

      // Read match-level DLS state for the chase (revised allocation & flag).
      const mfull = await tx.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
      const dlsInnings2Overs = mfull[0]?.dlsInnings2Overs ?? null;
      const dlsAffected = (mfull[0]?.dlsApplied ?? false) || inn1.revisedOvers != null || dlsInnings2Overs != null;

      const battingTeam = inn1.bowlingTeam; // now batting in 2nd
      const bowlingTeam = inn1.battingTeam;

      // The innings-2 allocation: an explicit pre-set reduction (rain before the
      // chase) wins; otherwise the same original overs as innings 1.
      const inn2Original = inn1.originalOvers ?? 20;
      const inn2Revised  = dlsInnings2Overs ?? null;

      const [inn2] = await tx.insert(inningsTable).values({
        matchId,
        inningsNumber: 2,
        battingTeam,
        bowlingTeam,
        battingXI: inn1.bowlingXI as string[],
        bowlingXI: inn1.battingXI as string[],
        originalOvers: inn2Original,
        revisedOvers:  inn2Revised,
        // provisional target; recomputed below when DLS is in force.
        target: inn1.totalRuns + 1,
        status: "live",
      }).returning();

      // DLS revised target for the chase (resource ratio). Applies whenever the
      // match is rain-affected — including a first-innings-only reduction.
      let target = inn1.totalRuns + 1;
      if (dlsAffected) {
        target = computeDlsChaseTarget(inn1, inn2);
        await tx.update(inningsTable).set({ target, updatedAt: new Date() })
          .where(eq(inningsTable.id, inn2.id));
        await tx.update(matchesTable).set({ dlsApplied: true, updatedAt: new Date() })
          .where(eq(matchesTable.id, matchId));
        inn2.target = target;
      }

      await tx.update(matchesTable).set({ status: "live", updatedAt: new Date() })
        .where(eq(matchesTable.id, matchId));

      return { status: 200, body: { success: true, innings2: inn2, target } };
    });
  } catch (e) {
    logger.error({ err: e, matchId }, "innings-end failed");
    return void res.status(500).json({ error: "Could not end innings" });
  }
  res.status(out.status).json(out.body);
});

/* ─── DELETE /api/admin/scoring/:matchId/ball (undo) ─────────
 * Serialized on the match row FOR UPDATE like every scoring mutation. */
router.delete("/:matchId/ball", requireAdmin, async (req, res) => {
  const matchId = String(req.params.matchId);
  let out: { status: number; body: Record<string, unknown> };
  try {
    out = await db.transaction(async (tx) => {
      const match = await lockMatch(tx, matchId);
      if (!match) return { status: 404, body: { error: "Match not found" } };

      const [inn] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.status, "live")))
        .orderBy(desc(inningsTable.inningsNumber))
        .limit(1);
      if (!inn) return { status: 400, body: { error: "No live innings" } };

      const [last] = await tx.select().from(deliveriesTable)
        .where(eq(deliveriesTable.inningsId, inn.id))
        .orderBy(desc(deliveriesTable.createdAt))
        .limit(1);
      if (!last) return { status: 400, body: { error: "No deliveries to undo" } };

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

      await tx.delete(deliveriesTable).where(eq(deliveriesTable.id, last.id));
      await tx.update(inningsTable).set({
        totalRuns: newTotal, totalWickets: newWickets,
        overs: newOvers, balls: newBalls, extras: newExtras,
        status: "live", updatedAt: new Date(),
      }).where(eq(inningsTable.id, inn.id));

      return { status: 200, body: { success: true, undone: last } };
    });
  } catch (e) {
    logger.error({ err: e, matchId }, "undo ball failed");
    return void res.status(500).json({ error: "Could not undo delivery" });
  }
  res.status(out.status).json(out.body);
});

/* ─── POST /api/admin/scoring/:matchId/dls ─────────────────────────────────
 * Record a rain interruption / reduce the overs available for an innings.
 *
 * Scorer/admin authorized; the match row is locked FOR UPDATE inside a
 * transaction, matching every scoring mutation, so two scorers can't apply
 * conflicting reductions concurrently.
 *
 * The reduction FLOWS to the chase:
 *   • reduce innings 1  → innings 2 (when it exists OR is later created) uses the
 *     DLS revised target computed from resources.
 *   • reduce innings 2 BEFORE it exists (rain during the break) → the revised
 *     allocation is stored on matches.dls_innings2_overs so endInnings adopts it
 *     and sets the DLS target at creation.
 *   • `applyBothInnings` → reduce BOTH innings to `oversAvailable` (rain before
 *     the chase starts): innings 1's allocation is trimmed and the chase target
 *     becomes the resource-ratio DLS target (both sides on equal, reduced overs).
 *
 * Validations (ICC): cannot INCREASE overs beyond original; minimum 5 overs for
 * a valid T20 result; cannot go below overs already bowled in that innings. */
const dlsBody = z.object({
  inningsNumber: z.number().int().min(1).max(2),
  oversAvailable: z.number().int().min(1).max(20),
  // wickets lost at the moment of the stoppage (for the resource loss calc);
  // defaults to the innings' current wickets when omitted.
  wicketsLostAtStop: z.number().int().min(0).max(10).optional(),
  // rain before the chase → reduce BOTH innings to the same allocation.
  applyBothInnings: z.boolean().optional(),
});
router.post("/:matchId/dls", requireAdmin, async (req, res) => {
  const parsed = dlsBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const { inningsNumber, oversAvailable, wicketsLostAtStop, applyBothInnings } = parsed.data;
  const matchId = String(req.params.matchId);

  try {
    const result = await db.transaction(async (tx) => {
      // Lock the match row (all scorer writes serialize on it).
      const mrow = await lockMatch(tx, matchId);
      if (!mrow) return { error: "Match not found", code: 404 as const };

      if (oversAvailable < 5) {
        return { error: "Minimum 5 overs required for a valid T20 result under DLS", code: 400 as const };
      }

      /** Apply the revised allocation + interruption log to one innings row. */
      const reduceInnings = async (inn: typeof inningsTable.$inferSelect) => {
        const original = inn.originalOvers ?? 20;
        if (oversAvailable > original) {
          return `Cannot increase overs beyond the original ${original}`;
        }
        const oversBowled = inn.overs + inn.balls / 6;
        if (oversAvailable < oversBowled) {
          return `Innings ${inn.inningsNumber} has already bowled ${inn.overs}.${inn.balls} overs — revised overs cannot be below overs already bowled`;
        }
        const wktsAtStop = wicketsLostAtStop ?? inn.totalWickets;
        const oversLeftAtStop = (inn.revisedOvers ?? original) - oversBowled;
        const oversLeftAtResume = oversAvailable - oversBowled;
        const interruptions = [
          ...((inn.dlsInterruptions ?? []) as Array<{ oversLeftAtStop: number; wicketsLostAtStop: number; oversLeftAtResume: number }>),
          { oversLeftAtStop, wicketsLostAtStop: wktsAtStop, oversLeftAtResume },
        ];
        await tx.update(inningsTable).set({
          revisedOvers: oversAvailable, dlsInterruptions: interruptions, updatedAt: new Date(),
        }).where(eq(inningsTable.id, inn.id));
        return null;
      };

      // Target innings row (may not exist yet for innings 2).
      const [innTarget] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, inningsNumber))).limit(1);

      // Innings 2 reduction before it exists → validate against 20 & stash it.
      if (inningsNumber === 2 && !innTarget) {
        if (oversAvailable > 20) return { error: "Cannot increase overs beyond the original 20", code: 400 as const };
        await tx.update(matchesTable).set({
          dlsInnings2Overs: oversAvailable, dlsApplied: true, updatedAt: new Date(),
        }).where(eq(matchesTable.id, matchId));
        return { ok: true as const, season: mrow.season, revisedOvers: oversAvailable, revisedTarget: null, inningsNumber, deferred: true };
      }

      if (!innTarget) return { error: `Innings ${inningsNumber} not found`, code: 400 as const };

      // Reduce the requested innings (and innings 1 too, if applyBothInnings).
      const err1 = await reduceInnings(innTarget);
      if (err1) return { error: err1, code: 400 as const };

      if (applyBothInnings && inningsNumber === 2) {
        const [inn1row] = await tx.select().from(inningsTable)
          .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 1))).limit(1);
        if (inn1row) {
          const err0 = await reduceInnings(inn1row);
          if (err0) return { error: err0, code: 400 as const };
        }
      }

      await tx.update(matchesTable).set({ dlsApplied: true, updatedAt: new Date() })
        .where(eq(matchesTable.id, matchId));

      // If both innings exist, (re)compute the chase's revised DLS target.
      let revisedTarget: number | null = null;
      const [inn1] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 1))).limit(1);
      const [inn2] = await tx.select().from(inningsTable)
        .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 2))).limit(1);
      if (inn1 && inn2) {
        revisedTarget = computeDlsChaseTarget(inn1, inn2);
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

export default router;

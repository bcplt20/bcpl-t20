/**
 * Automatic match-result decision on innings-2 completion.
 *
 * Handles the ordinary chase (target met/short/tie) AND the DLS rain-shortened
 * case: when innings 2 ends early because there are no more overs (revisedOvers
 * reached without the target), the result is decided against the DLS par score.
 * Result rows carry "(DLS method)" exactly like an official Standard-Edition
 * result. Also marks matches.dls_applied so NRR uses the revised overs.
 *
 * Idempotent: recomputes winner/resultDesc from the innings rows every call.
 */
import { db } from "@workspace/db";
import { matchesTable, inningsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { availableResource, dlsPar, T20_START_RESOURCE, resourcePct } from "./dls";

type InnRow = typeof inningsTable.$inferSelect;

/** Resource (%) actually used by an innings given its allocation/interruptions. */
export function inningsResourceUsed(inn: InnRow): number {
  const original = inn.originalOvers ?? 20;
  const interruptions = (inn.dlsInterruptions ?? []) as Array<{
    oversLeftAtStop: number; wicketsLostAtStop: number; oversLeftAtResume: number;
  }>;
  // Resource available to the innings given its allocation & interruptions.
  const available = availableResource(original, interruptions);
  if (inn.status === "completed") {
    // If the innings ended with overs still unused (all-out early or chase
    // finished early), the resource actually USED is available minus the
    // resource remaining at the point it ended.
    const allocation = inn.revisedOvers ?? original;
    const oversLeftAtEnd = Math.max(0, allocation - (inn.overs + inn.balls / 6));
    const remaining = inn.totalWickets >= 10 ? 0 : resourcePct(oversLeftAtEnd, inn.totalWickets);
    return Math.max(0, available - remaining);
  }
  return available;
}

/**
 * Decide + persist the result for a match whose 2nd innings has just completed.
 * Returns the updated match row (or null if the match/innings aren't ready).
 */
export async function decideResultForMatch(matchId: string): Promise<typeof matchesTable.$inferSelect | null> {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) return null;

  const [inn1] = await db.select().from(inningsTable)
    .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 1))).limit(1);
  const [inn2] = await db.select().from(inningsTable)
    .where(and(eq(inningsTable.matchId, matchId), eq(inningsTable.inningsNumber, 2))).limit(1);
  if (!inn1 || !inn2) return match;

  const dlsInvolved =
    inn1.revisedOvers != null || inn2.revisedOvers != null ||
    (inn1.dlsInterruptions?.length ?? 0) > 0 || (inn2.dlsInterruptions?.length ?? 0) > 0;

  const battingSecond = inn2.battingTeam;
  const battingFirst = inn1.battingTeam;

  let winner: string | null = null;
  let resultDesc = "";

  if (dlsInvolved) {
    // DLS par at the end of innings 2 for the chasing side.
    const r1 = inningsResourceUsed(inn1);
    const r2Available = availableResource(inn2.revisedOvers ?? inn2.originalOvers ?? 20, (inn2.dlsInterruptions ?? []) as any);
    const oversLeftAtEnd = inn2.totalWickets >= 10
      ? 0
      : Math.max(0, (inn2.revisedOvers ?? 20) - (inn2.overs + inn2.balls / 6));
    const par = dlsPar(inn1.totalRuns, r1, r2Available, oversLeftAtEnd, inn2.totalWickets);
    const chaseRuns = inn2.totalRuns;

    if (chaseRuns > par) {
      const by = 10 - inn2.totalWickets;
      winner = battingSecond;
      resultDesc = `${battingSecond} won by ${by} wicket${by === 1 ? "" : "s"} (DLS method)`;
    } else if (chaseRuns === par) {
      winner = null; // tie under DLS (no super over) → shared points
      resultDesc = `Match tied (DLS method)`;
    } else {
      const margin = par - chaseRuns;
      winner = battingFirst;
      resultDesc = `${battingFirst} won by ${margin} run${margin === 1 ? "" : "s"} (DLS method)`;
    }
    await db.update(matchesTable).set({
      status: "completed", winner, resultDesc, dlsApplied: true, updatedAt: new Date(),
    }).where(eq(matchesTable.id, matchId));
  } else {
    // Ordinary chase.
    const target = inn2.target ?? inn1.totalRuns + 1;
    const chaseRuns = inn2.totalRuns;
    if (chaseRuns >= target) {
      const by = 10 - inn2.totalWickets;
      winner = battingSecond;
      resultDesc = `${battingSecond} won by ${by} wicket${by === 1 ? "" : "s"}`;
    } else if (chaseRuns === target - 1) {
      winner = null; // tie
      resultDesc = `Match tied`;
    } else {
      const margin = (target - 1) - chaseRuns;
      winner = battingFirst;
      resultDesc = `${battingFirst} won by ${margin} run${margin === 1 ? "" : "s"}`;
    }
    await db.update(matchesTable).set({
      status: "completed", winner, resultDesc, dlsApplied: false, updatedAt: new Date(),
    }).where(eq(matchesTable.id, matchId));
  }

  const [updated] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  return updated ?? match;
}

/**
 * Build the `dls` block for a live/scorecard response, or null when DLS is not
 * relevant to this match. Includes per-innings revised overs, the (revised)
 * target for the chasing side, the current DLS par for the chasing side, and
 * how many runs the chasing side is ahead/behind par at this ball.
 */
export function buildDlsBlock(match: typeof matchesTable.$inferSelect, innings: InnRow[]): null | {
  active: boolean;
  revisedOvers: Record<number, number | null>;
  target: number | null;
  parScore: number | null;
  aheadBehind: number | null;
} {
  const inn1 = innings.find((i) => i.inningsNumber === 1);
  const inn2 = innings.find((i) => i.inningsNumber === 2);
  const anyReduced = innings.some((i) => i.revisedOvers != null || (i.dlsInterruptions?.length ?? 0) > 0);
  if (!match.dlsApplied && !anyReduced) return null;

  const revisedOvers: Record<number, number | null> = {};
  for (const i of innings) revisedOvers[i.inningsNumber] = i.revisedOvers ?? null;

  let target: number | null = null;
  let parScore: number | null = null;
  let aheadBehind: number | null = null;

  if (inn1) {
    const r1 = inningsResourceUsed(inn1);
    if (inn2) {
      const r2Available = availableResource(
        inn2.revisedOvers ?? inn2.originalOvers ?? 20,
        (inn2.dlsInterruptions ?? []) as Array<{ oversLeftAtStop: number; wicketsLostAtStop: number; oversLeftAtResume: number }>,
      );
      target = inn2.target ?? null;
      const allocation = inn2.revisedOvers ?? inn2.originalOvers ?? 20;
      const oversLeftNow = inn2.totalWickets >= 10 ? 0 : Math.max(0, allocation - (inn2.overs + inn2.balls / 6));
      parScore = dlsPar(inn1.totalRuns, r1, r2Available, oversLeftNow, inn2.totalWickets);
      aheadBehind = inn2.totalRuns - parScore;
    }
  }
  return { active: true, revisedOvers, target, parScore, aheadBehind };
}

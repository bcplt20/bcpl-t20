/**
 * Claim/lease helpers for phase1_evaluations workers (architect review).
 *
 * Every worker run stamps the rows it claims with a per-run claim_token.
 * Every subsequent write for that row is CAS-guarded on the token, so when a
 * stale sweep reclaims a row from a slow-but-alive worker, exactly one of
 * them can finalize: the loser's UPDATE matches 0 rows and its result is
 * discarded (no last-write-wins, no double notifications, no drifting data).
 */
import { db } from "@workspace/db";
import { phase1EvaluationsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "./logger";

/** CAS write: applies only while this run still owns the claim. */
export async function casEvalUpdate(
  evalId: string,
  runToken: string,
  set: Partial<typeof phase1EvaluationsTable.$inferInsert>,
): Promise<boolean> {
  const rows = await db.update(phase1EvaluationsTable)
    .set(set)
    .where(and(
      eq(phase1EvaluationsTable.id, evalId),
      eq(phase1EvaluationsTable.claimToken, runToken),
    ))
    .returning({ id: phase1EvaluationsTable.id });
  if (rows.length === 0) {
    logger.warn({ evalId }, "phase1 eval write discarded — claim was reclaimed by another worker");
    return false;
  }
  return true;
}

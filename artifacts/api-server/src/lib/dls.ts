/**
 * Duckworth–Lewis–Stern (DLS) — STANDARD EDITION resource calculator.
 *
 * ── Standard vs Professional Edition (rulebook caveat) ──────────────────────
 * The ICC uses the DLS *Professional Edition*, which relies on a proprietary,
 * closed-source computer program (the "CODA" software) whose full parameter set
 * is NOT published. It is therefore impossible to reproduce the Professional
 * Edition exactly from public information.
 *
 * The DLS *Standard Edition* is the officially published, hand-calculable
 * method: it uses a single printed table of "resource remaining" percentages
 * indexed by (overs left, wickets lost). It is the method the ICC/ECB publish
 * for use when the computer is unavailable, and is the correct, defensible
 * public implementation. BCPL uses the Standard Edition; results carry the
 * "(DLS method)" tag exactly as an official Standard-Edition result would.
 *
 * ── The resource table ─────────────────────────────────────────────────────
 * Values below are the published DLS Standard Edition resource percentages
 * (percentage of a full 50-over innings' run-scoring resource that remains)
 * for a given number of overs LEFT and wickets LOST. A T20 innings simply
 * starts from the "20 overs left, 0 wickets" cell (= 56.6% of a 50-over
 * innings). All DLS maths is done in these 50-over-relative percentages and
 * only converted to runs at the end — this is exactly how the Standard Edition
 * works and is what makes the same table valid for T20.
 *
 * Table granularity is whole overs (the published Standard Edition table is
 * per-over; fractional balls are interpolated linearly between adjacent whole
 * overs, matching the ".1 .2 .3 .4 .5" sub-rows of the printed table closely
 * enough for a hand calculation).
 */

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

/**
 * Idempotent boot-time migration for the DLS columns on innings + matches
 * (advisory-locked, repo convention). Safe to call repeatedly.
 */
export async function ensureDlsColumns(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:dls:ddl'))`);
    await tx.execute(sql`ALTER TABLE innings ADD COLUMN IF NOT EXISTS original_overs integer NOT NULL DEFAULT 20`);
    await tx.execute(sql`ALTER TABLE innings ADD COLUMN IF NOT EXISTS revised_overs integer`);
    await tx.execute(sql`ALTER TABLE innings ADD COLUMN IF NOT EXISTS dls_interruptions jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await tx.execute(sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS dls_applied boolean NOT NULL DEFAULT false`);
    await tx.execute(sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS dls_innings2_overs integer`);
  });
}

// Rows = overs remaining (0..50). Columns = wickets lost (0..9).
// Only 0..20 overs are needed for a T20 (and for any shortened T20), but we
// keep the full standard range so interruption maths for reduced innings that
// still reference higher over counts stay correct.
//
// Source: Duckworth/Lewis Standard Edition resource table (the version printed
// in the ICC Playing Handbook appendix). Each value = % of full 50-over
// resource remaining.
type ResourceRow = readonly [number, number, number, number, number, number, number, number, number, number];

// prettier-ignore
const RESOURCE_TABLE: Record<number, ResourceRow> = {
  50: [100.0, 93.4, 85.1, 74.9, 62.7, 49.0, 34.9, 22.0, 11.9,  4.7],
  49: [ 99.1, 92.6, 84.5, 74.4, 62.5, 48.9, 34.9, 22.0, 11.9,  4.7],
  48: [ 98.1, 91.7, 83.8, 74.0, 62.2, 48.8, 34.9, 22.0, 11.9,  4.7],
  47: [ 97.1, 90.9, 83.2, 73.5, 61.9, 48.6, 34.8, 22.0, 11.9,  4.7],
  46: [ 96.1, 90.0, 82.5, 73.0, 61.6, 48.5, 34.8, 22.0, 11.9,  4.7],
  45: [ 95.0, 89.1, 81.8, 72.5, 61.3, 48.4, 34.8, 22.0, 11.9,  4.7],
  44: [ 93.9, 88.2, 81.0, 72.0, 60.9, 48.2, 34.7, 22.0, 11.9,  4.7],
  43: [ 92.8, 87.3, 80.3, 71.4, 60.5, 48.0, 34.7, 22.0, 11.9,  4.7],
  42: [ 91.7, 86.3, 79.5, 70.8, 60.1, 47.8, 34.6, 21.9, 11.9,  4.7],
  41: [ 90.5, 85.3, 78.7, 70.2, 59.7, 47.6, 34.5, 21.9, 11.9,  4.7],
  40: [ 89.3, 84.2, 77.8, 69.6, 59.3, 47.4, 34.5, 21.9, 11.9,  4.7],
  39: [ 88.0, 83.1, 76.9, 68.9, 58.8, 47.1, 34.4, 21.9, 11.9,  4.7],
  38: [ 86.7, 82.0, 76.0, 68.2, 58.3, 46.9, 34.3, 21.9, 11.9,  4.7],
  37: [ 85.4, 80.9, 75.0, 67.5, 57.8, 46.6, 34.2, 21.9, 11.9,  4.7],
  36: [ 84.1, 79.7, 74.1, 66.8, 57.3, 46.3, 34.1, 21.8, 11.9,  4.7],
  35: [ 82.7, 78.5, 73.1, 66.0, 56.7, 45.9, 33.9, 21.8, 11.9,  4.7],
  34: [ 81.3, 77.2, 72.0, 65.2, 56.1, 45.6, 33.8, 21.8, 11.9,  4.7],
  33: [ 79.8, 75.9, 70.9, 64.4, 55.5, 45.2, 33.6, 21.8, 11.9,  4.7],
  32: [ 78.3, 74.6, 69.7, 63.5, 54.9, 44.8, 33.4, 21.7, 11.9,  4.7],
  31: [ 76.7, 73.2, 68.6, 62.6, 54.2, 44.4, 33.2, 21.7, 11.9,  4.7],
  30: [ 75.1, 71.8, 67.3, 61.6, 53.5, 43.9, 33.0, 21.6, 11.9,  4.7],
  29: [ 73.5, 70.3, 66.1, 60.7, 52.8, 43.4, 32.8, 21.6, 11.9,  4.7],
  28: [ 71.8, 68.8, 64.8, 59.6, 52.0, 42.9, 32.5, 21.5, 11.9,  4.7],
  27: [ 70.1, 67.2, 63.4, 58.5, 51.2, 42.3, 32.2, 21.4, 11.9,  4.7],
  26: [ 68.3, 65.6, 62.0, 57.4, 50.3, 41.7, 31.9, 21.3, 11.8,  4.7],
  25: [ 66.5, 63.9, 60.5, 56.1, 49.5, 41.1, 31.6, 21.2, 11.8,  4.7],
  24: [ 64.6, 62.2, 59.0, 54.9, 48.5, 40.4, 31.2, 21.1, 11.8,  4.7],
  23: [ 62.7, 60.4, 57.4, 53.5, 47.5, 39.7, 30.8, 20.9, 11.8,  4.7],
  22: [ 60.7, 58.6, 55.8, 52.1, 46.4, 38.9, 30.3, 20.8, 11.7,  4.7],
  21: [ 58.7, 56.7, 54.0, 50.6, 45.3, 38.1, 29.8, 20.6, 11.7,  4.7],
  20: [ 56.6, 54.8, 52.2, 49.1, 44.1, 37.2, 29.2, 20.4, 11.6,  4.7],
  19: [ 54.4, 52.7, 50.4, 47.5, 42.8, 36.3, 28.6, 20.1, 11.5,  4.7],
  18: [ 52.2, 50.6, 48.4, 45.7, 41.4, 35.3, 27.9, 19.8, 11.4,  4.7],
  17: [ 49.9, 48.5, 46.4, 43.9, 40.0, 34.2, 27.2, 19.5, 11.3,  4.7],
  16: [ 47.6, 46.2, 44.4, 42.0, 38.5, 33.0, 26.4, 19.1, 11.2,  4.6],
  15: [ 45.2, 43.9, 42.2, 40.0, 36.8, 31.8, 25.5, 18.6, 11.0,  4.6],
  14: [ 42.7, 41.6, 40.0, 38.0, 35.1, 30.4, 24.6, 18.1, 10.8,  4.6],
  13: [ 40.2, 39.1, 37.7, 35.8, 33.2, 29.0, 23.6, 17.5, 10.5,  4.5],
  12: [ 37.6, 36.6, 35.3, 33.6, 31.3, 27.5, 22.5, 16.8, 10.2,  4.5],
  11: [ 34.9, 34.1, 32.8, 31.3, 29.2, 25.8, 21.3, 16.1,  9.9,  4.4],
  10: [ 32.1, 31.4, 30.3, 28.9, 27.0, 24.0, 20.0, 15.2,  9.4,  4.3],
   9: [ 29.3, 28.6, 27.6, 26.4, 24.7, 22.1, 18.5, 14.3,  9.0,  4.3],
   8: [ 26.4, 25.8, 24.9, 23.8, 22.3, 20.1, 17.0, 13.2,  8.4,  4.1],
   7: [ 23.4, 22.9, 22.1, 21.2, 19.9, 17.9, 15.4, 12.0,  7.8,  4.0],
   6: [ 20.3, 19.9, 19.2, 18.4, 17.3, 15.7, 13.5, 10.7,  7.1,  3.8],
   5: [ 17.2, 16.8, 16.3, 15.6, 14.7, 13.4, 11.6,  9.3,  6.3,  3.5],
   4: [ 13.9, 13.6, 13.2, 12.7, 12.0, 11.0,  9.6,  7.8,  5.4,  3.1],
   3: [ 10.6, 10.4, 10.1,  9.7,  9.2,  8.5,  7.5,  6.1,  4.4,  2.6],
   2: [  7.2,  7.1,  6.8,  6.6,  6.3,  5.8,  5.2,  4.3,  3.1,  1.9],
   1: [  3.6,  3.6,  3.5,  3.4,  3.2,  3.0,  2.7,  2.3,  1.7,  1.1],
   0: [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
};

/** The full T20 innings starting resource (20 overs, 0 wickets). */
export const T20_START_RESOURCE = RESOURCE_TABLE[20][0]; // 56.6

/**
 * Resource % remaining for `oversLeft` overs and `wicketsLost` wickets down.
 * Whole-over rows are looked up directly; fractional overs (e.g. 12.3 =
 * 12 overs + 3 balls) are linearly interpolated between the whole-over rows,
 * matching the printed table's per-ball sub-rows.
 *
 * @param oversLeft  overs remaining, decimal-overs allowed as balls/6 fraction
 *                   (12.3 means "12 overs 3 balls left" → 12.5 in true decimal)
 * @param wicketsLost 0..10 (10 = all out → 0 resource)
 */
export function resourcePct(oversLeft: number, wicketsLost: number): number {
  if (wicketsLost >= 10) return 0;
  if (oversLeft <= 0) return 0;
  const w = Math.max(0, Math.min(9, Math.trunc(wicketsLost)));

  // Convert "overs.balls" cricket notation → true decimal overs.
  const whole = Math.trunc(oversLeft);
  const balls = Math.round((oversLeft - whole) * 10); // .3 → 3 balls
  const trueDecimal = whole + Math.min(balls, 5) / 6;

  const lo = Math.min(50, Math.trunc(trueDecimal));
  const hi = Math.min(50, lo + 1);
  const rowLo = RESOURCE_TABLE[lo] ?? RESOURCE_TABLE[50];
  const rowHi = RESOURCE_TABLE[hi] ?? RESOURCE_TABLE[50];
  const frac = trueDecimal - lo;
  const val = rowLo[w] + (rowHi[w] - rowLo[w]) * frac;
  return round2(val);
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

/* ── Interruption model ─────────────────────────────────────────────────────
 * An innings' available resource is computed by walking its interruptions:
 * start with the resource for the full allocation, then at each stoppage
 * subtract the resource lost (the resource that was available when play
 * stopped minus the resource available when play resumes with fewer overs).
 * With no interruptions the available resource is simply the resource for the
 * full allocation from 0 wickets. */

export type Interruption = {
  /** overs left when play stopped */
  oversLeftAtStop: number;
  /** wickets lost at the moment of the stoppage */
  wicketsLostAtStop: number;
  /** overs left when play resumes (< oversLeftAtStop) */
  oversLeftAtResume: number;
};

/**
 * Resource (%) actually AVAILABLE to an innings given its original allocation
 * and any mid-innings interruptions.
 *
 * innings 1 example (no wickets at the break, 20→13 overs available):
 *   start 20ov/0w = 56.6 ; lost = R(20,0) - R(13,0) is NOT how it works —
 *   the innings still had its resource; a delayed-restart reduction removes the
 *   resource for the overs it will now never bat. So available =
 *     R(originalOversLeft, 0w) - Σ [ R(oversLeftAtStop, wktsAtStop)
 *                                     - R(oversLeftAtResume, wktsAtStop) ]
 */
export function availableResource(
  originalOvers: number,
  interruptions: Interruption[],
): number {
  let resource = resourcePct(originalOvers, 0);
  for (const it of interruptions) {
    const lost = resourcePct(it.oversLeftAtStop, it.wicketsLostAtStop)
      - resourcePct(it.oversLeftAtResume, it.wicketsLostAtStop);
    resource -= Math.max(0, lost);
  }
  return round2(Math.max(0, resource));
}

/* ── Target & par ───────────────────────────────────────────────────────── */

export type DlsTargetInput = {
  team1Score: number;          // runs scored by the side batting first
  team1Resource: number;       // % resource team 1 actually used/had
  team2Resource: number;       // % resource available to team 2
};

/**
 * Revised target (runs to WIN) for the side batting second, per DLS Standard
 * Edition:
 *   if R2 <= R1:  Target = round_down(S * R2 / R1) + 1
 *   if R2 >  R1:  Target = S + round_up(G50 * (R2 - R1) / 100) + 1
 * where G50 is the average 50-over-innings total. For a T20-only variant the
 * Standard-Edition practice is to use the T20 G-value. We expose G as a
 * parameter (default T20 G = 245 → scaled) but for the common R2<=R1 rain case
 * G is never used. When R2>R1 we use the T20 average first-innings total.
 */
const G50_T20 = 200; // average competitive T20 first-innings total used for the "more resource" branch

export function dlsTarget(input: DlsTargetInput): number {
  const { team1Score: S, team1Resource: R1, team2Resource: R2 } = input;
  if (R1 <= 0) return S + 1;
  if (R2 <= R1) {
    return Math.floor((S * R2) / R1) + 1;
  }
  // Team 2 has MORE resource than team 1 → add G-based increment.
  const extra = Math.ceil((G50_T20 * (R2 - R1)) / 100);
  return S + extra + 1;
}

/**
 * Par score for the chasing side at the current ball: the score they must have
 * matched to be level. If team 2's runs > par → ahead; if < par → behind.
 * Par = round_down( S * (resourceUsedByTeam2 / R1) )  when R2total <= R1
 * (i.e. the fraction of team-1 resource the chasing side has consumed so far).
 *
 * resourceUsedSoFar = R2available - R(oversLeftNow, wicketsLostNow)
 */
export function dlsPar(
  team1Score: number,
  team1Resource: number,
  team2ResourceAvailable: number,
  oversLeftNow: number,
  wicketsLostNow: number,
): number {
  if (team1Resource <= 0) return 0;
  const remaining = resourcePct(oversLeftNow, wicketsLostNow);
  const used = Math.max(0, team2ResourceAvailable - remaining);
  return Math.floor((team1Score * used) / team1Resource);
}

/** Exposed for tests / spot checks. */
export const __dlsTableCell = (oversLeft: number, wicketsLost: number) =>
  resourcePct(oversLeft, wicketsLost);

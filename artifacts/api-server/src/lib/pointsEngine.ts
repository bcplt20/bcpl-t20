/**
 * ICC-standard Net Run Rate + automatic points-table recompute.
 *
 * The points table is ALWAYS recomputed from scratch from every completed
 * official match of the season — never incremented. This makes it idempotent:
 * finalizing, re-scoring, editing or deleting a match all just trigger a full
 * recompute and the table converges to the single correct state.
 *
 * ── Points ──────────────────────────────────────────────────────────────────
 *   win                              = 2
 *   tie (no super over) / no-result  = 1 each
 *   loss                             = 0
 *
 * ── Net Run Rate (ICC) ──────────────────────────────────────────────────────
 *   NRR = (total runs scored / total overs faced)
 *       − (total runs conceded / total overs bowled)
 *   summed across ALL completed matches (not an average of per-match NRRs).
 *
 *   • A team that is bowled out counts the FULL allotted overs as "overs faced"
 *     (its actual overs are ignored), per ICC Playing Conditions.
 *   • Overs are handled in TRUE decimal (17.3 overs = 17.5), never as "17.3".
 *   • DLS-shortened matches: the ICC uses the REVISED overs allocation, not the
 *     nominal 20. For the side batting second in a completed DLS match, their
 *     revised quota is used as the denominator; for the side batting first the
 *     overs they actually faced (or full revised allocation if bowled out).
 *     When a DLS result is decided (target-setting side's revised figures) the
 *     revised allocations flow straight from the innings rows.
 */
import { db } from "@workspace/db";
import { matchesTable, inningsTable, pointsTableEntries } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

/** Convert cricket "overs.balls" notation to true decimal overs (17.3 → 17.5). */
export function oversToDecimal(overs: number, balls: number): number {
  return overs + balls / 6;
}

export type TeamAgg = {
  team: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;   // includes ties without super over
  points: number;
  runsScored: number;
  oversFaced: number;    // decimal, with all-out → full allocation
  runsConceded: number;
  oversBowled: number;   // decimal, opposition all-out → full allocation
  form: string[];
};

/**
 * The overs to charge a batting innings for NRR: if the side was bowled out
 * (10 wickets) the FULL allocation counts; otherwise the actual overs faced.
 * `allocation` is the revised overs (DLS) or original overs for that innings.
 */
export function inningsOversForNrr(
  totalWickets: number,
  actualOvers: number,
  actualBalls: number,
  allocation: number,
): number {
  if (totalWickets >= 10) return allocation;             // all out → full quota
  return oversToDecimal(actualOvers, actualBalls);
}

type InnRow = typeof inningsTable.$inferSelect;
type MatchRow = typeof matchesTable.$inferSelect;

/** Build the empty aggregate for a team. */
function emptyAgg(team: string): TeamAgg {
  return {
    team, played: 0, won: 0, lost: 0, noResult: 0, points: 0,
    runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, form: [],
  };
}

/**
 * Pure aggregator: given completed matches + their innings, produce per-team
 * standings incl. NRR. Exported for unit testing with hand-built fixtures.
 *
 * `existingTeams` seeds rows so teams with zero completed matches still appear.
 */
export function aggregateStandings(
  matches: MatchRow[],
  inningsByMatch: Map<string, InnRow[]>,
  existingTeams: string[] = [],
): Array<TeamAgg & { nrr: number }> {
  const agg = new Map<string, TeamAgg>();
  const ensure = (team: string) => {
    if (!agg.has(team)) agg.set(team, emptyAgg(team));
    return agg.get(team)!;
  };
  for (const t of existingTeams) ensure(t);

  for (const m of matches) {
    if (m.status !== "completed") continue;
    const inns = (inningsByMatch.get(m.id) ?? []).filter((i) => i.status === "completed");
    const a = ensure(m.team1);
    const b = ensure(m.team2);
    a.played++; b.played++;

    // Result classification.
    const isNoResult = !m.winner; // no declared winner → no-result / tie split 1-1
    if (isNoResult) {
      a.noResult++; b.noResult++;
      a.form.push("N"); b.form.push("N");
    } else {
      const winner = m.winner!;
      const loser = winner === m.team1 ? m.team2 : m.team1;
      ensure(winner).won++;
      ensure(loser).lost++;
      ensure(winner).form.push("W");
      ensure(loser).form.push("L");
    }

    // NRR contribution (needs both innings present & completed).
    for (const inn of inns) {
      const batTeam = inn.battingTeam;
      const bowlTeam = inn.bowlingTeam;
      const allocation = inn.revisedOvers ?? inn.originalOvers ?? 20;
      const oversFaced = inningsOversForNrr(inn.totalWickets, inn.overs, inn.balls, allocation);
      const bat = ensure(batTeam);
      const bowl = ensure(bowlTeam);
      bat.runsScored += inn.totalRuns;
      bat.oversFaced += oversFaced;
      bowl.runsConceded += inn.totalRuns;
      bowl.oversBowled += oversFaced;
    }
  }

  const out: Array<TeamAgg & { nrr: number }> = [];
  for (const t of agg.values()) {
    t.points = t.won * 2 + t.noResult * 1;
    t.form = t.form.slice(-5);
    const scoredRate = t.oversFaced > 0 ? t.runsScored / t.oversFaced : 0;
    const concededRate = t.oversBowled > 0 ? t.runsConceded / t.oversBowled : 0;
    const nrr = round3(scoredRate - concededRate);
    out.push({ ...t, nrr });
  }
  // Sort: points desc, then NRR desc.
  out.sort((x, y) => y.points - x.points || y.nrr - x.nrr);
  return out;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Recompute + persist the whole points table for a season from completed
 * official matches. Idempotent. Preserves the row set for teams that already
 * exist in the table (so hand-seeded teams with 0 completed matches stay).
 */
export async function recomputePointsTable(season: number): Promise<Array<TeamAgg & { nrr: number }>> {
  const matches = await db.select().from(matchesTable).where(eq(matchesTable.season, season));
  const completed = matches.filter((m) => m.status === "completed");

  const inningsByMatch = new Map<string, InnRow[]>();
  for (const m of completed) {
    const inns = await db.select().from(inningsTable).where(eq(inningsTable.matchId, m.id));
    inningsByMatch.set(m.id, inns);
  }

  // Seed with any teams already present in the table for this season (keeps
  // manually-seeded teams visible even before they play), plus all match teams.
  const existingRows = await db.select({ team: pointsTableEntries.team })
    .from(pointsTableEntries).where(eq(pointsTableEntries.season, season));
  const seedTeams = new Set<string>(existingRows.map((r) => r.team));
  for (const m of matches) { seedTeams.add(m.team1); seedTeams.add(m.team2); }

  const standings = aggregateStandings(completed, inningsByMatch, [...seedTeams]);

  // Persist: upsert every standing row; leave rows for teams no longer present
  // untouched only if they still exist as seeds (they will, since seedTeams
  // includes existing rows). This is a full replace for computed columns.
  for (const s of standings) {
    const [existing] = await db.select().from(pointsTableEntries)
      .where(and(eq(pointsTableEntries.team, s.team), eq(pointsTableEntries.season, season)))
      .limit(1);
    if (existing) {
      await db.update(pointsTableEntries).set({
        played: s.played, won: s.won, lost: s.lost, noResult: s.noResult,
        points: s.points, nrr: s.nrr, form: s.form, updatedAt: new Date(),
      }).where(eq(pointsTableEntries.id, existing.id));
    } else {
      await db.insert(pointsTableEntries).values({
        season, team: s.team,
        played: s.played, won: s.won, lost: s.lost, noResult: s.noResult,
        points: s.points, nrr: s.nrr, form: s.form,
      });
    }
  }

  return standings;
}

/**
 * MVP / fantasy leaderboard for OFFICIAL BCPL matches.
 *
 *   GET /api/mvp/leaderboard?season=&limit=&eligibleOnly=1
 *
 * Aggregates Dream11-style points per player across all COMPLETED official
 * matches of the season (matches → innings → deliveries), using the point
 * table stored in site_settings key `mvp_points_config` (owner-editable, see
 * settings.ts). Man-of-the-Series (owner's car prize) eligibility = only
 * players whose team plays the FINAL (matches.stage = 'final'). If no final is
 * scheduled yet, finalists = null and finalEligible = false for everyone.
 *
 * The response is cached in memory for ~60s per (season, config) to keep the
 * heavy per-delivery aggregation off the hot path.
 */
import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable, inningsTable, deliveriesTable, siteSettingsTable,
} from "@workspace/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  computeMvpPoints, resolveMvpConfig, type ScoredDelivery, type PlayerAggregate,
  type MvpPointsConfig,
} from "../lib/mvpPoints";

const router = Router();

const DEFAULT_SEASON = 5;

/* ── in-memory cache (~60s) ─────────────────────────────────────────────── */
type CacheEntry = {
  computedAt: number;
  players: PlayerAggregate[];
  finalists: [string, string] | null;
  config: MvpPointsConfig;
};
const CACHE_TTL_MS = 60_000;
const cache = new Map<number, CacheEntry>();

/** Test hook — clear the leaderboard cache. */
export function __clearMvpCache(): void {
  cache.clear();
}

async function loadConfig() {
  const [row] = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, "mvp_points_config")).limit(1);
  return resolveMvpConfig(row?.value ?? null);
}

/** Build (or reuse) the full per-player aggregate + finalists for a season. */
async function buildLeaderboard(season: number): Promise<CacheEntry> {
  const hit = cache.get(season);
  if (hit && Date.now() - hit.computedAt < CACHE_TTL_MS) return hit;

  const config = await loadConfig();

  // Completed official matches of the season.
  const matches = await db.select({
    id: matchesTable.id, team1: matchesTable.team1, team2: matchesTable.team2,
    stage: matchesTable.stage, status: matchesTable.status,
  }).from(matchesTable).where(and(
    eq(matchesTable.season, season),
    eq(matchesTable.status, "completed"),
  ));

  // Finalists come from the FINAL fixture (any status — a scheduled final still
  // defines who is eligible for the car), independent of completion.
  const [finalMatch] = await db.select({
    team1: matchesTable.team1, team2: matchesTable.team2,
  }).from(matchesTable).where(and(
    eq(matchesTable.season, season),
    eq(matchesTable.stage, "final"),
  )).limit(1);
  const finalists: [string, string] | null = finalMatch
    ? [finalMatch.team1, finalMatch.team2] : null;

  const matchIds = matches.map(m => m.id);
  let players: PlayerAggregate[] = [];

  if (matchIds.length > 0) {
    const innings = await db.select({
      id: inningsTable.id, matchId: inningsTable.matchId,
      battingTeam: inningsTable.battingTeam, bowlingTeam: inningsTable.bowlingTeam,
    }).from(inningsTable).where(inArray(inningsTable.matchId, matchIds));

    const inningsById = new Map(innings.map(i => [i.id, i]));
    const matchIdByInnings = new Map(innings.map(i => [i.id, i.matchId]));
    const inningsIds = innings.map(i => i.id);

    if (inningsIds.length > 0) {
      const dels = await db.select().from(deliveriesTable)
        .where(inArray(deliveriesTable.inningsId, inningsIds));

      const scored: ScoredDelivery[] = dels.map(d => {
        const inn = inningsById.get(d.inningsId);
        return {
          inningsId: d.inningsId,
          overNumber: d.overNumber,
          batterName: d.batterName,
          bowlerName: d.bowlerName,
          runsOffBat: d.runsOffBat,
          extrasRuns: d.extrasRuns,
          extraType: d.extraType ?? null,
          totalRuns: d.totalRuns,
          isWicket: d.isWicket,
          dismissalType: d.dismissalType ?? null,
          dismissedBatter: d.dismissedBatter ?? null,
          fielderName: d.fielderName ?? null,
          battingTeam: inn?.battingTeam ?? "",
          bowlingTeam: inn?.bowlingTeam ?? "",
        };
      });
      players = computeMvpPoints(scored, matchIdByInnings, config);
    }
  }

  const entry: CacheEntry = { computedAt: Date.now(), players, finalists, config };
  cache.set(season, entry);
  return entry;
}

/* ── GET /api/mvp/leaderboard ───────────────────────────────────────────── */
router.get("/leaderboard", async (req, res) => {
  try {
    const season = Number(req.query.season) || DEFAULT_SEASON;
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(500, Math.floor(limitRaw)) : 50;
    const eligibleOnly = String(req.query.eligibleOnly ?? "") === "1"
      || String(req.query.eligibleOnly ?? "").toLowerCase() === "true";

    const { players, finalists, config } = await buildLeaderboard(season);
    const finalTeams = new Set(finalists ?? []);

    // players[] arrives sorted by points desc (from computeMvpPoints).
    let rows = players.map((p) => ({
      playerId: `${p.team}::${p.name}`, // deliveries carry names, not ids
      name: p.name,
      team: p.team,
      matches: p.matches,
      runs: p.runs,
      wickets: p.wickets,
      catches: p.catches,
      points: p.points,
      breakdown: p.breakdown,
      finalEligible: finalists ? finalTeams.has(p.team) : false,
    }));

    if (eligibleOnly) {
      // Restrict to finalist-team players only.
      rows = rows.filter(r => r.finalEligible);
    } else if (finalists) {
      // Default view once a final exists: eligible players FIRST (points desc),
      // then the rest (points desc), with rank numbers continuing across both
      // groups. Each row keeps finalEligible so UIs can flag non-eligible rows
      // as "not valid for the car". Stable partition preserves points ordering.
      rows = [
        ...rows.filter(r => r.finalEligible),
        ...rows.filter(r => !r.finalEligible),
      ];
    }
    // Assign contiguous ranks 1..n over the (possibly re-ordered/filtered) set.
    const ranked = rows.slice(0, limit).map((r, idx) => ({ rank: idx + 1, ...r }));

    res.json({
      season,
      leaderboard: ranked,
      finalists,
      // Live scoring config so public "how points work" guides never go stale
      // after an admin edits mvp_points_config.
      pointsConfig: config,
      note: finalists
        ? "Man of the Series (car prize) eligibility is limited to players whose team plays the final. Eligible players are ranked first; non-eligible players follow and are not valid for the car."
        : "No final scheduled yet — Man of the Series eligibility is not decided. finalEligible is false for all players.",
    });
  } catch (e) {
    logger.error({ err: e }, "mvp leaderboard failed");
    res.status(500).json({ error: "Could not load MVP leaderboard" });
  }
});

export default router;

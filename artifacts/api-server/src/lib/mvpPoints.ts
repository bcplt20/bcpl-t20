/**
 * MVP / fantasy points engine (Dream11-style) for OFFICIAL BCPL matches.
 *
 * Points are computed from the admin-scored official scorecard — the
 * `matches` → `innings` → `deliveries` tables — NOT the community-scorer
 * matches. Official deliveries reference players by NAME (batterName /
 * bowlerName / fielderName), so aggregation keys on player name + the team
 * that player batted/bowled for (the innings batting/bowling team).
 *
 * The point rule table is stored in the site_settings key `mvp_points_config`
 * (owner-editable via the settings admin PUT, role-gated). The defaults below
 * are the shipped Dream11-style values.
 */
import { z } from "zod";

/* ── config shape (validated on settings PUT) ───────────────────────────── */
export const mvpPointsConfigSchema = z.object({
  batting: z.object({
    run: z.number(),
    fourBonus: z.number(),
    sixBonus: z.number(),
    milestone30: z.number(),
    milestone50: z.number(),
    milestone100: z.number(),
    duck: z.number(),
  }).strict(),
  bowling: z.object({
    wicket: z.number(),
    bowledLbwBonus: z.number(),
    haul3: z.number(),
    haul4: z.number(),
    haul5: z.number(),
    maidenOver: z.number(),
  }).strict(),
  fielding: z.object({
    catch: z.number(),
    threeCatchBonus: z.number(),
    stumping: z.number(),
    directRunout: z.number(),
    assistedRunout: z.number(),
  }).strict(),
}).strict();

export type MvpPointsConfig = z.infer<typeof mvpPointsConfigSchema>;

/** Shipped Dream11-style defaults (owner's spec). */
export const DEFAULT_MVP_POINTS_CONFIG: MvpPointsConfig = {
  batting: {
    run: 1,
    fourBonus: 1,
    sixBonus: 2,
    milestone30: 4,
    milestone50: 8,
    milestone100: 16,
    duck: -2,
  },
  bowling: {
    wicket: 25,
    bowledLbwBonus: 8,
    haul3: 4,
    haul4: 8,
    haul5: 16,
    maidenOver: 12,
  },
  fielding: {
    catch: 8,
    threeCatchBonus: 4,
    stumping: 12,
    directRunout: 12,
    assistedRunout: 6,
  },
};

/** Merge a stored (possibly partial/older) config over the defaults so a
 *  missing sub-key never crashes the calculator. */
export function resolveMvpConfig(stored: unknown): MvpPointsConfig {
  const parsed = mvpPointsConfigSchema.safeParse(stored);
  if (parsed.success) return parsed.data;
  const s = (stored ?? {}) as Record<string, Record<string, number>>;
  const d = DEFAULT_MVP_POINTS_CONFIG;
  return {
    batting: { ...d.batting, ...(s.batting ?? {}) },
    bowling: { ...d.bowling, ...(s.bowling ?? {}) },
    fielding: { ...d.fielding, ...(s.fielding ?? {}) },
  };
}

/* ── input types (from official deliveries) ─────────────────────────────── */
export type ScoredDelivery = {
  inningsId: string;
  overNumber: number;      // 0-based
  batterName: string;
  bowlerName: string;
  runsOffBat: number;
  extrasRuns: number;
  extraType: string | null; // null | "wide" | "no_ball" | "leg_bye" | "bye"
  totalRuns: number;
  isWicket: boolean;
  dismissalType: string | null;
  dismissedBatter: string | null;
  fielderName: string | null;
  /** team the striker/bowler belongs to for this delivery */
  battingTeam: string;
  bowlingTeam: string;
};

export type PlayerBreakdown = {
  battingPoints: number;
  bowlingPoints: number;
  fieldingPoints: number;
};

export type PlayerAggregate = {
  name: string;
  team: string;
  matches: number;
  runs: number;
  wickets: number;
  catches: number;
  points: number;
  breakdown: PlayerBreakdown;
};

const BOWLER_WICKET_TYPES = new Set([
  "bowled", "caught", "lbw", "stumped", "hit_wicket", "caught_and_bowled",
]);
const BOWLED_LBW = new Set(["bowled", "lbw"]);

/**
 * Compute per-player MVP points for one or more matches.
 *
 * @param deliveries flat list across all innings of the matches being scored.
 * @param matchIdByInnings maps inningsId → matchId (for per-match aggregation
 *   of wicket hauls, 3-catch bonuses, ducks, and the `matches` count).
 * @param config resolved point table.
 */
export function computeMvpPoints(
  deliveries: ScoredDelivery[],
  matchIdByInnings: Map<string, string>,
  config: MvpPointsConfig,
): PlayerAggregate[] {
  const c = config;

  // Per (player, team) running aggregate across ALL matches.
  type Acc = PlayerAggregate & { _matches: Set<string> };
  const players = new Map<string, Acc>();
  const keyOf = (name: string, team: string) => `${team}::${name}`;
  const getPlayer = (name: string, team: string): Acc => {
    const k = keyOf(name, team);
    let p = players.get(k);
    if (!p) {
      p = {
        name, team, matches: 0, runs: 0, wickets: 0, catches: 0, points: 0,
        breakdown: { battingPoints: 0, bowlingPoints: 0, fieldingPoints: 0 },
        _matches: new Set<string>(),
      };
      players.set(k, p);
    }
    return p;
  };
  const matchOf = (inningsId: string) => matchIdByInnings.get(inningsId) ?? inningsId;

  /* Per-innings, per-player scratch state (for batting milestones/ducks,
     bowling hauls, maidens, per-match catch bonuses). Keyed by matchId so a
     player who plays multiple matches earns hauls/bonuses per match. */
  // batting: matchId::team::batter → { runs, balls, fours, sixes, out }
  const bat = new Map<string, { name: string; team: string; matchId: string; runs: number; balls: number; fours: number; sixes: number; out: boolean }>();
  // bowling: matchId::bowlingTeam::bowler → { wickets, bowledLbw }
  const bowl = new Map<string, { name: string; team: string; matchId: string; wickets: number; bowledLbw: number }>();
  // maiden overs: matchId::inningsId::over::bowler → runs conceded (bowler credit)
  const overAgg = new Map<string, { name: string; team: string; matchId: string; runsConceded: number; legalBalls: number }>();
  // fielding catches per match: matchId::team::fielder → catches
  const fieldCatch = new Map<string, { name: string; team: string; matchId: string; catches: number }>();

  for (const d of deliveries) {
    const matchId = matchOf(d.inningsId);

    /* ── batting ── */
    const bKey = `${matchId}::${d.battingTeam}::${d.batterName}`;
    let bs = bat.get(bKey);
    if (!bs) { bs = { name: d.batterName, team: d.battingTeam, matchId, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }; bat.set(bKey, bs); }
    bs.runs += d.runsOffBat;
    // balls faced: legal deliveries + no-balls count; wides do NOT.
    if (d.extraType !== "wide") bs.balls += 1;
    if (d.runsOffBat === 4) bs.fours += 1;
    if (d.runsOffBat === 6) bs.sixes += 1;

    /* ── bowling wicket credit ── */
    if (d.isWicket && d.dismissalType && BOWLER_WICKET_TYPES.has(d.dismissalType)) {
      const wKey = `${matchId}::${d.bowlingTeam}::${d.bowlerName}`;
      let ws = bowl.get(wKey);
      if (!ws) { ws = { name: d.bowlerName, team: d.bowlingTeam, matchId, wickets: 0, bowledLbw: 0 }; bowl.set(wKey, ws); }
      ws.wickets += 1;
      if (BOWLED_LBW.has(d.dismissalType)) ws.bowledLbw += 1;
    }

    /* ── batter dismissal (for duck) ── */
    if (d.isWicket && d.dismissalType !== "retired_hurt") {
      const outName = d.dismissedBatter || d.batterName;
      const oKey = `${matchId}::${d.battingTeam}::${outName}`;
      let os = bat.get(oKey);
      if (!os) { os = { name: outName, team: d.battingTeam, matchId, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }; bat.set(oKey, os); }
      os.out = true;
    }

    /* ── maiden over tracking (per bowler per over) ── */
    const oKey = `${matchId}::${d.inningsId}::${d.overNumber}::${d.bowlerName}`;
    let ov = overAgg.get(oKey);
    if (!ov) { ov = { name: d.bowlerName, team: d.bowlingTeam, matchId, runsConceded: 0, legalBalls: 0 }; overAgg.set(oKey, ov); }
    // runs conceded to the bowler = off bat + wides + no-balls (byes/leg-byes not charged)
    const chargedExtras = (d.extraType === "wide" || d.extraType === "no_ball") ? d.extrasRuns : 0;
    ov.runsConceded += d.runsOffBat + chargedExtras;
    if (d.extraType !== "wide" && d.extraType !== "no_ball") ov.legalBalls += 1;

    /* ── fielding ── */
    if (d.isWicket && d.fielderName) {
      if (d.dismissalType === "caught" || d.dismissalType === "stumped") {
        // fielder is on the BOWLING side
        const fKey = `${matchId}::${d.bowlingTeam}::${d.fielderName}`;
        const p = getPlayer(d.fielderName, d.bowlingTeam);
        if (d.dismissalType === "caught") {
          p.breakdown.fieldingPoints += c.fielding.catch;
          p.catches += 1;
          let fc = fieldCatch.get(fKey);
          if (!fc) { fc = { name: d.fielderName, team: d.bowlingTeam, matchId, catches: 0 }; fieldCatch.set(fKey, fc); }
          fc.catches += 1;
        } else {
          p.breakdown.fieldingPoints += c.fielding.stumping;
        }
        p._matches.add(matchId);
      } else if (d.dismissalType === "run_out") {
        // fielderName may be "A" (direct) or "A/B" (assisted → thrower/catcher)
        const parts = d.fielderName.split("/").map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          for (const nm of parts.slice(0, 2)) {
            const p = getPlayer(nm, d.bowlingTeam);
            p.breakdown.fieldingPoints += c.fielding.assistedRunout;
            p._matches.add(matchId);
          }
        } else if (parts.length === 1) {
          const p = getPlayer(parts[0], d.bowlingTeam);
          p.breakdown.fieldingPoints += c.fielding.directRunout;
          p._matches.add(matchId);
        }
      }
    }
  }

  /* ── fold batting into players (runs, milestones, duck) ── */
  for (const bs of bat.values()) {
    const p = getPlayer(bs.name, bs.team);
    let pts = bs.runs * c.batting.run + bs.fours * c.batting.fourBonus + bs.sixes * c.batting.sixBonus;
    if (bs.runs >= 100) pts += c.batting.milestone100;
    else if (bs.runs >= 50) pts += c.batting.milestone50;
    else if (bs.runs >= 30) pts += c.batting.milestone30;
    // duck: out for 0 (batters only — a player who faced at least one ball / was dismissed)
    if (bs.out && bs.runs === 0) pts += c.batting.duck;
    p.breakdown.battingPoints += pts;
    p.runs += bs.runs;
    p._matches.add(bs.matchId);
  }

  /* ── fold bowling wickets + hauls ── */
  for (const ws of bowl.values()) {
    const p = getPlayer(ws.name, ws.team);
    let pts = ws.wickets * c.bowling.wicket + ws.bowledLbw * c.bowling.bowledLbwBonus;
    if (ws.wickets >= 5) pts += c.bowling.haul5;
    else if (ws.wickets >= 4) pts += c.bowling.haul4;
    else if (ws.wickets >= 3) pts += c.bowling.haul3;
    p.breakdown.bowlingPoints += pts;
    p.wickets += ws.wickets;
    p._matches.add(ws.matchId);
  }

  /* ── maiden overs (6 legal balls, 0 runs conceded) ── */
  for (const ov of overAgg.values()) {
    if (ov.legalBalls >= 6 && ov.runsConceded === 0) {
      const p = getPlayer(ov.name, ov.team);
      p.breakdown.bowlingPoints += c.bowling.maidenOver;
      p._matches.add(ov.matchId);
    }
  }

  /* ── 3-catch-in-a-match bonus ── */
  for (const fc of fieldCatch.values()) {
    if (fc.catches >= 3) {
      const p = getPlayer(fc.name, fc.team);
      p.breakdown.fieldingPoints += c.fielding.threeCatchBonus;
    }
  }

  /* ── finalize ── */
  const out: PlayerAggregate[] = [];
  for (const p of players.values()) {
    p.matches = p._matches.size;
    p.points = p.breakdown.battingPoints + p.breakdown.bowlingPoints + p.breakdown.fieldingPoints;
    const { _matches, ...clean } = p;
    void _matches;
    out.push(clean);
  }
  // Highest points first; stable tiebreak by name.
  out.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return out;
}

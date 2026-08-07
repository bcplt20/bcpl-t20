/**
 * Community scorer — "मेरा match, मेरी scoring".
 *
 * Any logged-in user (player OTP account) can create their own match and do
 * ball-by-ball scoring from the app, CricHeroes-style but simpler. Completely
 * separate tables from official BCPL matches (matches/innings/deliveries),
 * so the tournament data can never be touched by outside scorers.
 *
 *   POST   /api/community/matches            (auth)  create match (+innings 1)
 *   GET    /api/community/matches/mine       (auth)  my matches
 *   GET    /api/community/matches/:id        public  full scorecard (shareable)
 *   POST   /api/community/matches/:id/ball   (owner) record a delivery
 *   DELETE /api/community/matches/:id/ball   (owner) undo last delivery
 *   POST   /api/community/matches/:id/innings-end (owner) close innings / start 2nd
 *   POST   /api/community/matches/:id/finish (owner) finish match (auto result text)
 *
 * Engine mirrors the official scoring rules (scoring.ts) with community
 * upgrades: wides/byes/leg-byes can carry extra runs, no-balls carry bat runs,
 * run-outs can carry completed runs, overs limit is per-match (1–50).
 */
import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
export default router;

/* ── tables (idempotent ensure, advisory-locked) ────────────────────────── */
let ready = false;
async function ensureTables(): Promise<void> {
  if (ready) return;
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:community_scoring:ddl'))`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS community_matches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id uuid NOT NULL,
      team1 varchar(80) NOT NULL,
      team2 varchar(80) NOT NULL,
      venue varchar(120) NOT NULL DEFAULT '',
      overs_limit int NOT NULL,
      players_per_side int NOT NULL DEFAULT 11,
      status varchar(20) NOT NULL DEFAULT 'live',
      result_desc text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_matches_owner_idx ON community_matches (owner_user_id, created_at DESC)`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS community_innings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id uuid NOT NULL REFERENCES community_matches(id) ON DELETE CASCADE,
      innings_number int NOT NULL,
      batting_team varchar(80) NOT NULL,
      bowling_team varchar(80) NOT NULL,
      total_runs int NOT NULL DEFAULT 0,
      total_wickets int NOT NULL DEFAULT 0,
      overs int NOT NULL DEFAULT 0,
      balls int NOT NULL DEFAULT 0,
      extras int NOT NULL DEFAULT 0,
      target int,
      status varchar(12) NOT NULL DEFAULT 'live',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (match_id, innings_number)
    )`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS community_deliveries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      innings_id uuid NOT NULL REFERENCES community_innings(id) ON DELETE CASCADE,
      over_number int NOT NULL,
      ball_in_over int NOT NULL,
      delivery_in_over int NOT NULL,
      batter_name varchar(80) NOT NULL,
      bowler_name varchar(80) NOT NULL,
      runs_off_bat int NOT NULL DEFAULT 0,
      extras_runs int NOT NULL DEFAULT 0,
      extra_type varchar(10),
      total_runs int NOT NULL DEFAULT 0,
      is_wicket boolean NOT NULL DEFAULT false,
      dismissal_type varchar(24),
      dismissed_batter varchar(80),
      fielder_name varchar(80),
      commentary text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_deliveries_innings_idx ON community_deliveries (innings_id, created_at DESC)`);
  });
  ready = true;
}

/* ── row shapes ─────────────────────────────────────────────────────────── */
type MatchRow = {
  id: string; owner_user_id: string; team1: string; team2: string; venue: string;
  overs_limit: number; players_per_side: number; status: string; result_desc: string;
  created_at: string; updated_at: string;
};
type InnRow = {
  id: string; match_id: string; innings_number: number; batting_team: string; bowling_team: string;
  total_runs: number; total_wickets: number; overs: number; balls: number; extras: number;
  target: number | null; status: string;
};
type DelRow = {
  id: string; innings_id: string; over_number: number; ball_in_over: number; delivery_in_over: number;
  batter_name: string; bowler_name: string; runs_off_bat: number; extras_runs: number;
  extra_type: string | null; total_runs: number; is_wicket: boolean; dismissal_type: string | null;
  dismissed_batter: string | null; fielder_name: string | null; commentary: string; created_at: string;
};
const rows = <T,>(out: unknown): T[] => ((out as { rows: T[] }).rows ?? []);

function matchApi(m: MatchRow) {
  return {
    id: m.id, team1: m.team1, team2: m.team2, venue: m.venue,
    oversLimit: m.overs_limit, playersPerSide: m.players_per_side,
    status: m.status, resultDesc: m.result_desc, createdAt: m.created_at,
  };
}
function innApi(i: InnRow) {
  return {
    inningsNumber: i.innings_number, battingTeam: i.batting_team, bowlingTeam: i.bowling_team,
    totalRuns: i.total_runs, totalWickets: i.total_wickets, overs: i.overs, balls: i.balls,
    extras: i.extras, target: i.target, status: i.status,
  };
}

async function loadOwnedMatch(req: AuthRequest): Promise<{ match?: MatchRow; err?: { code: number; msg: string } }> {
  await ensureTables();
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { err: { code: 404, msg: "Match not found" } };
  const [m] = rows<MatchRow>(await db.execute(sql`SELECT * FROM community_matches WHERE id = ${id}`));
  if (!m) return { err: { code: 404, msg: "Match not found" } };
  if (m.owner_user_id !== req.user!.userId) return { err: { code: 403, msg: "Only the scorer who created this match can score it" } };
  return { match: m };
}

/* ── create match ───────────────────────────────────────────────────────── */
router.post("/matches", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    team1: z.string().trim().min(1).max(80),
    team2: z.string().trim().min(1).max(80),
    venue: z.string().trim().max(120).default(""),
    oversLimit: z.number().int().min(1).max(50),
    playersPerSide: z.number().int().min(2).max(11).default(11),
    battingFirst: z.enum(["team1", "team2"]).default("team1"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  if (d.team1.toLowerCase() === d.team2.toLowerCase()) {
    return void res.status(400).json({ error: "Team names must be different" });
  }
  try {
    await ensureTables();
    // gentle abuse guard: max 30 matches per scorer per day
    const [cnt] = rows<{ n: string }>(await db.execute(
      sql`SELECT count(*) n FROM community_matches WHERE owner_user_id = ${req.user!.userId} AND created_at > now() - interval '1 day'`,
    ));
    if (Number(cnt?.n ?? 0) >= 30) return void res.status(429).json({ error: "Daily match limit reached" });

    const battingTeam = d.battingFirst === "team1" ? d.team1 : d.team2;
    const bowlingTeam = d.battingFirst === "team1" ? d.team2 : d.team1;
    const [m] = rows<MatchRow>(await db.execute(sql`
      INSERT INTO community_matches (owner_user_id, team1, team2, venue, overs_limit, players_per_side)
      VALUES (${req.user!.userId}, ${d.team1}, ${d.team2}, ${d.venue}, ${d.oversLimit}, ${d.playersPerSide})
      RETURNING *`));
    await db.execute(sql`
      INSERT INTO community_innings (match_id, innings_number, batting_team, bowling_team)
      VALUES (${m.id}, 1, ${battingTeam}, ${bowlingTeam})`);
    res.json({ success: true, match: matchApi(m) });
  } catch (e) {
    logger.warn({ err: e }, "community match create failed");
    res.status(500).json({ error: "Could not create match" });
  }
});

/* ── my matches ─────────────────────────────────────────────────────────── */
router.get("/matches/mine", requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const list = rows<MatchRow>(await db.execute(
      sql`SELECT * FROM community_matches WHERE owner_user_id = ${req.user!.userId} ORDER BY created_at DESC LIMIT 50`,
    ));
    res.json({ matches: list.map(matchApi) });
  } catch (e) {
    logger.warn({ err: e }, "community mine failed");
    res.status(500).json({ error: "Could not load matches" });
  }
});

/* ── public scorecard ───────────────────────────────────────────────────── */
router.get("/matches/:id", async (req, res) => {
  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Match not found" });
    const [m] = rows<MatchRow>(await db.execute(sql`SELECT * FROM community_matches WHERE id = ${id}`));
    if (!m) return void res.status(404).json({ error: "Match not found" });
    const inns = rows<InnRow>(await db.execute(
      sql`SELECT * FROM community_innings WHERE match_id = ${m.id} ORDER BY innings_number ASC`,
    ));
    const innings = [];
    for (const inn of inns) {
      const dels = rows<DelRow>(await db.execute(
        sql`SELECT * FROM community_deliveries WHERE innings_id = ${inn.id} ORDER BY created_at ASC`,
      ));
      /* batting / bowling cards computed from deliveries (same conventions as
         the official scorecard: WD/NB don't count as balls faced; bowler
         concedes total runs; run_out/retired not credited to bowler). */
      const bat = new Map<string, { runs: number; balls: number; fours: number; sixes: number; out: string | null }>();
      const bowl = new Map<string, { balls: number; runs: number; wickets: number }>();
      for (const dl of dels) {
        const b = bat.get(dl.batter_name) ?? { runs: 0, balls: 0, fours: 0, sixes: 0, out: null };
        const legalFaced = dl.extra_type === null || dl.extra_type === "bye" || dl.extra_type === "leg_bye";
        if (legalFaced) b.balls += 1;
        b.runs += dl.runs_off_bat;
        if (dl.runs_off_bat === 4) b.fours += 1;
        if (dl.runs_off_bat === 6) b.sixes += 1;
        bat.set(dl.batter_name, b);
        if (dl.is_wicket && dl.dismissed_batter) {
          const ob = bat.get(dl.dismissed_batter) ?? { runs: 0, balls: 0, fours: 0, sixes: 0, out: null };
          ob.out = dl.dismissal_type ?? "out";
          bat.set(dl.dismissed_batter, ob);
        }
        const bw = bowl.get(dl.bowler_name) ?? { balls: 0, runs: 0, wickets: 0 };
        if (dl.extra_type !== "wide" && dl.extra_type !== "no_ball") bw.balls += 1;
        // byes/leg-byes are NOT charged to the bowler
        bw.runs += dl.runs_off_bat + (dl.extra_type === "wide" || dl.extra_type === "no_ball" ? dl.extras_runs : 0);
        if (dl.is_wicket && dl.dismissal_type && !["run_out", "retired_hurt"].includes(dl.dismissal_type)) bw.wickets += 1;
        bowl.set(dl.bowler_name, bw);
      }
      innings.push({
        ...innApi(inn),
        batting: [...bat.entries()].map(([name, s]) => ({ name, ...s })),
        bowling: [...bowl.entries()].map(([name, s]) => ({
          name, overs: `${Math.floor(s.balls / 6)}.${s.balls % 6}`, runs: s.runs, wickets: s.wickets,
        })),
        recentBalls: dels.slice(-12).map((dl) => ({
          over: `${dl.over_number}.${dl.ball_in_over}`, runs: dl.total_runs,
          isWicket: dl.is_wicket, extraType: dl.extra_type, commentary: dl.commentary,
        })),
      });
    }
    res.json({ match: matchApi(m), innings });
  } catch (e) {
    logger.warn({ err: e }, "community scorecard failed");
    res.status(500).json({ error: "Could not load scorecard" });
  }
});

/* ── record a ball ──────────────────────────────────────────────────────── */
const ballSchema = z.object({
  type: z.enum(["run", "wide", "noball", "bye", "legbye", "wicket"]),
  runs: z.number().int().min(0).max(6).default(0),
  batterName: z.string().trim().min(1).max(80),
  bowlerName: z.string().trim().min(1).max(80),
  dismissalType: z.enum(["bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket", "caught_and_bowled", "retired_hurt"]).optional(),
  dismissedBatter: z.string().trim().max(80).optional(),
  fielderName: z.string().trim().max(80).optional(),
});

router.post("/matches/:id/ball", requireAuth, async (req: AuthRequest, res) => {
  const parsed = ballSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  if (d.type === "wicket" && !d.dismissalType) return void res.status(400).json({ error: "dismissalType required for a wicket" });
  try {
    const { match: m, err } = await loadOwnedMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    if (m!.status === "completed") return void res.status(400).json({ error: "Match already finished" });

    /* Whole mutation in one tx: match row locked FOR UPDATE serialises
       concurrent ball posts / undo / innings-end (two devices, retries). */
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      const [inn] = rows<InnRow>(await tx.execute(
        sql`SELECT * FROM community_innings WHERE match_id = ${m!.id} AND status = 'live' ORDER BY innings_number DESC LIMIT 1 FOR UPDATE`,
      ));
      if (!inn) return { errMsg: "No live innings — end/start innings first" };

      const isWide = d.type === "wide", isNB = d.type === "noball";
      const isBye = d.type === "bye", isLB = d.type === "legbye";
      const isWicket = d.type === "wicket";
      const extraType = isWide ? "wide" : isNB ? "no_ball" : isLB ? "leg_bye" : isBye ? "bye" : null;
      const runsOffBat = isWide || isBye || isLB ? 0 : d.runs;             // run, noball(bat), wicket(run-out runs)
      const extrasRuns = isWide ? 1 + d.runs : isNB ? 1 : (isBye || isLB) ? Math.max(1, d.runs) : 0;
      const totalRunsD = runsOffBat + extrasRuns;
      // retired hurt is NOT a wicket in the total
      const countsAsWicket = isWicket && d.dismissalType !== "retired_hurt";

      const [last] = rows<DelRow>(await tx.execute(
        sql`SELECT * FROM community_deliveries WHERE innings_id = ${inn.id} ORDER BY created_at DESC LIMIT 1`,
      ));
      const deliveryInOver = last && last.over_number === inn.overs ? last.delivery_in_over + 1 : 1;

      const isLegalBall = !isWide && !isNB;
      const newBalls = isLegalBall ? inn.balls + 1 : inn.balls;
      const overDone = isLegalBall && newBalls === 6;
      const newOvers = overDone ? inn.overs + 1 : inn.overs;
      const finalBalls = overDone ? 0 : newBalls;

      const tag = `${inn.overs}.${newBalls || deliveryInOver}`;
      const commentary = isWicket
        ? `${tag} — OUT! ${d.dismissedBatter || d.batterName} (${d.dismissalType})`
        : `${tag} — ${d.type === "run" ? `${d.runs} run(s)` : `${d.type} +${totalRunsD}`}`;

      await tx.execute(sql`
        INSERT INTO community_deliveries (innings_id, over_number, ball_in_over, delivery_in_over,
          batter_name, bowler_name, runs_off_bat, extras_runs, extra_type, total_runs,
          is_wicket, dismissal_type, dismissed_batter, fielder_name, commentary)
        VALUES (${inn.id}, ${inn.overs}, ${newBalls || inn.balls}, ${deliveryInOver},
          ${d.batterName}, ${d.bowlerName}, ${runsOffBat}, ${extrasRuns}, ${extraType}, ${totalRunsD},
          ${isWicket}, ${d.dismissalType ?? null}, ${isWicket ? (d.dismissedBatter || d.batterName) : null},
          ${d.fielderName ?? null}, ${commentary})`);

      const newTotal = inn.total_runs + totalRunsD;
      const newWkts = inn.total_wickets + (countsAsWicket ? 1 : 0);
      const maxWkts = m!.players_per_side - 1;
      const complete = newWkts >= maxWkts || newOvers >= m!.overs_limit ||
        (inn.target !== null && newTotal >= inn.target);

      await tx.execute(sql`UPDATE community_innings SET
        total_runs = ${newTotal}, total_wickets = ${newWkts}, overs = ${newOvers}, balls = ${finalBalls},
        extras = ${inn.extras + extrasRuns}, status = ${complete ? "completed" : "live"}, updated_at = now()
        WHERE id = ${inn.id}`);
      if (complete) {
        await tx.execute(sql`UPDATE community_matches SET status = ${inn.innings_number === 1 ? "innings2" : "completed"}, updated_at = now() WHERE id = ${m!.id}`);
      }
      return { inn, newTotal, newWkts, newOvers, finalBalls, complete, commentary };
    });
    if ("errMsg" in result) return void res.status(400).json({ error: result.errMsg });
    if (result.complete && result.inn.innings_number === 2) await finalizeResult(m!.id);

    res.json({
      success: true,
      inningsTotal: { runs: result.newTotal, wickets: result.newWkts, overs: result.newOvers, balls: result.finalBalls },
      inningsComplete: result.complete,
      commentary: result.commentary,
    });
  } catch (e) {
    logger.warn({ err: e }, "community ball failed");
    res.status(500).json({ error: "Could not record ball" });
  }
});

/* ── undo last ball ─────────────────────────────────────────────────────── */
router.delete("/matches/:id/ball", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { match: m, err } = await loadOwnedMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      const [inn] = rows<InnRow>(await tx.execute(
        sql`SELECT * FROM community_innings WHERE match_id = ${m!.id} ORDER BY innings_number DESC LIMIT 1 FOR UPDATE`,
      ));
      if (!inn) return "No innings";
      const [last] = rows<DelRow>(await tx.execute(
        sql`SELECT * FROM community_deliveries WHERE innings_id = ${inn.id} ORDER BY created_at DESC LIMIT 1`,
      ));
      if (!last) return "No deliveries to undo";

      const isLegal = last.extra_type !== "wide" && last.extra_type !== "no_ball";
      let newBalls = inn.balls, newOvers = inn.overs;
      if (isLegal) {
        if (newBalls === 0) { newOvers -= 1; newBalls = 5; } else newBalls -= 1;
      }
      const wasWicket = last.is_wicket && last.dismissal_type !== "retired_hurt";
      await tx.execute(sql`DELETE FROM community_deliveries WHERE id = ${last.id}`);
      await tx.execute(sql`UPDATE community_innings SET
        total_runs = ${inn.total_runs - last.total_runs},
        total_wickets = ${inn.total_wickets - (wasWicket ? 1 : 0)},
        overs = ${newOvers}, balls = ${newBalls},
        extras = ${inn.extras - last.extras_runs}, status = 'live', updated_at = now()
        WHERE id = ${inn.id}`);
      await tx.execute(sql`UPDATE community_matches SET status = ${inn.innings_number === 1 ? "live" : "innings2"}, result_desc = '', updated_at = now() WHERE id = ${m!.id}`);
      return null;
    });
    if (out) return void res.status(400).json({ error: out });
    res.json({ success: true });
  } catch (e) {
    logger.warn({ err: e }, "community undo failed");
    res.status(500).json({ error: "Could not undo" });
  }
});

/* ── innings end / start 2nd ────────────────────────────────────────────── */
router.post("/matches/:id/innings-end", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { match: m, err } = await loadOwnedMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      await tx.execute(sql`UPDATE community_innings SET status = 'completed', updated_at = now() WHERE match_id = ${m!.id} AND status = 'live'`);
      const [inn1] = rows<InnRow>(await tx.execute(
        sql`SELECT * FROM community_innings WHERE match_id = ${m!.id} AND innings_number = 1`,
      ));
      if (!inn1) return { errMsg: "1st innings not found" };
      const [existing2] = rows<InnRow>(await tx.execute(
        sql`SELECT * FROM community_innings WHERE match_id = ${m!.id} AND innings_number = 2`,
      ));
      if (existing2) {
        await tx.execute(sql`UPDATE community_matches SET status = 'innings2', updated_at = now() WHERE id = ${m!.id}`);
        return { target: existing2.target };
      }
      const target = inn1.total_runs + 1;
      await tx.execute(sql`
        INSERT INTO community_innings (match_id, innings_number, batting_team, bowling_team, target)
        VALUES (${m!.id}, 2, ${inn1.bowling_team}, ${inn1.batting_team}, ${target})`);
      await tx.execute(sql`UPDATE community_matches SET status = 'innings2', updated_at = now() WHERE id = ${m!.id}`);
      return { target };
    });
    if ("errMsg" in out) return void res.status(400).json({ error: out.errMsg });
    res.json({ success: true, target: out.target });
  } catch (e) {
    logger.warn({ err: e }, "community innings-end failed");
    res.status(500).json({ error: "Could not end innings" });
  }
});

/* ── finish match ───────────────────────────────────────────────────────── */
router.post("/matches/:id/finish", requireAuth, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({ abandon: z.boolean().default(false) });
    const parsed = schema.safeParse(req.body ?? {});
    const abandon = parsed.success ? parsed.data.abandon : false;
    const { match: m, err } = await loadOwnedMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      if (!abandon) {
        // a real result needs a scored 2nd innings
        const [n] = rows<{ n: string }>(await tx.execute(sql`
          SELECT count(*) n FROM community_deliveries d
          JOIN community_innings i ON i.id = d.innings_id
          WHERE i.match_id = ${m!.id} AND i.innings_number = 2`));
        if (Number(n?.n ?? 0) === 0) {
          return { errMsg: "Second innings has no balls yet — score it first, or abandon the match" };
        }
      }
      await tx.execute(sql`UPDATE community_innings SET status = 'completed', updated_at = now() WHERE match_id = ${m!.id} AND status = 'live'`);
      await tx.execute(sql`UPDATE community_matches SET status = 'completed', updated_at = now() WHERE id = ${m!.id}`);
      return {};
    });
    if ("errMsg" in out) return void res.status(400).json({ error: out.errMsg });
    const resultDesc = abandon
      ? await (async () => { await db.execute(sql`UPDATE community_matches SET result_desc = 'Match abandoned' WHERE id = ${m!.id}`); return "Match abandoned"; })()
      : await finalizeResult(m!.id);
    res.json({ success: true, resultDesc });
  } catch (e) {
    logger.warn({ err: e }, "community finish failed");
    res.status(500).json({ error: "Could not finish match" });
  }
});

async function finalizeResult(matchId: string): Promise<string> {
  const inns = rows<InnRow>(await db.execute(
    sql`SELECT * FROM community_innings WHERE match_id = ${matchId} ORDER BY innings_number ASC`,
  ));
  const [m] = rows<MatchRow>(await db.execute(sql`SELECT * FROM community_matches WHERE id = ${matchId}`));
  let desc = "";
  if (inns.length === 2 && m) {
    const [i1, i2] = inns;
    if (i2.total_runs > i1.total_runs) {
      desc = `${i2.batting_team} won by ${(m.players_per_side - 1) - i2.total_wickets} wicket(s)`;
    } else if (i1.total_runs > i2.total_runs) {
      desc = `${i1.batting_team} won by ${i1.total_runs - i2.total_runs} run(s)`;
    } else {
      desc = "Match tied";
    }
    await db.execute(sql`UPDATE community_matches SET result_desc = ${desc} WHERE id = ${matchId}`);
  }
  return desc;
}

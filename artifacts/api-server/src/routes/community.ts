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
 *   POST   /api/community/matches/:id/innings-end (owner/scorer) close innings / start 2nd
 *   POST   /api/community/matches/:id/finish (owner/scorer) finish match (auto result text)
 *
 * Phase 2 (roles + verification):
 *   POST   /api/community/matches/:id/officials              (owner) appoint scorer/umpire by phone
 *   GET    /api/community/matches/:id/officials              (owner/official) list officials
 *   DELETE /api/community/matches/:id/officials/:userId      (owner) remove official
 *   POST   /api/community/matches/:id/verify-team/start      (owner) send team OTP (masked phone only)
 *   POST   /api/community/matches/:id/verify-team/confirm    (owner) confirm last4 + code → verify team
 * Scoring mutations (ball/undo/innings-end/finish) allow the owner OR an
 * appointed scorer. A match with two linked teams can only be scored once BOTH
 * teams are verified (owner's own team is auto-verified). Raw phone numbers are
 * NEVER returned — only phoneMasked (last-4) to the team/match owner.
 *
 * Engine mirrors the official scoring rules (scoring.ts) with community
 * upgrades: wides/byes/leg-byes can carry extra runs, no-balls carry bat runs,
 * run-outs can carry completed runs, overs limit is per-match (1–50).
 */
import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createHash, randomInt } from "node:crypto";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { sendOtp } from "../lib/sms";

const router = Router();
export default router;

/* ── SMS gating (hard rule) ──────────────────────────────────────────────────
   Real MSG91 keys live in dev, so we must NOT deliver real SMS outside prod.
   Mirror the exact gate the reminder/outbox sweeps use: real sends only in
   production (or with COMMUNITY_SMS_ENABLED=1). Everywhere else we skip the
   provider call entirely. We also never route OTPs through the outbox retry
   queue — the send is a single best-effort call to sendOtp(). */
function communitySmsEnabled(): boolean {
  const env = (process.env["COMMUNITY_SMS_ENABLED"] ?? "").trim().toLowerCase();
  if (env === "1" || env === "true") return true;
  if (env === "0" || env === "false") return false;
  return process.env["NODE_ENV"] === "production";
}
const isTestEnv = (): boolean => process.env["NODE_ENV"] === "test";

/** SHA-256 hex of a verification code (codes are never stored in plaintext). */
function hashCode(code: string): string {
  return createHash("sha256").update(String(code)).digest("hex");
}
/** Cryptographically-random 6-digit OTP as a zero-padded string. */
function gen6(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

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

    /* ── Phase 1: cricket profiles ──────────────────────────────────────── */
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS community_profiles (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      display_name varchar(80) NOT NULL,
      role varchar(16) NOT NULL,
      batting_style varchar(8) NOT NULL,
      bowling_style varchar(80),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);

    /* ── Phase 1: teams + members ───────────────────────────────────────── */
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS community_teams (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name varchar(40) NOT NULL,
      short_name varchar(5) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_teams_owner_idx ON community_teams (owner_user_id, created_at DESC)`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS community_team_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id uuid NOT NULL REFERENCES community_teams(id) ON DELETE CASCADE,
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      phone varchar(15),
      name varchar(80) NOT NULL,
      role varchar(24) NOT NULL DEFAULT '',
      added_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_team_members_team_idx ON community_team_members (team_id, added_at ASC)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_team_members_phone_idx ON community_team_members (phone)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_team_members_user_idx ON community_team_members (user_id)`);
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS community_team_members_team_phone_uq
      ON community_team_members (team_id, phone) WHERE phone IS NOT NULL`);
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS community_team_members_team_user_uq
      ON community_team_members (team_id, user_id) WHERE user_id IS NOT NULL`);

    /* ── Phase 1: roster-linked matches (nullable, backward compatible) ──── */
    await tx.execute(sql`ALTER TABLE community_matches ADD COLUMN IF NOT EXISTS team_a_id uuid REFERENCES community_teams(id)`);
    await tx.execute(sql`ALTER TABLE community_matches ADD COLUMN IF NOT EXISTS team_b_id uuid REFERENCES community_teams(id)`);
    await tx.execute(sql`ALTER TABLE community_deliveries ADD COLUMN IF NOT EXISTS striker_member_id uuid REFERENCES community_team_members(id)`);
    await tx.execute(sql`ALTER TABLE community_deliveries ADD COLUMN IF NOT EXISTS bowler_member_id uuid REFERENCES community_team_members(id)`);

    /* ── Phase 2: match officials (owner-appointed scorers / umpires) ────── */
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS community_match_officials (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id uuid NOT NULL REFERENCES community_matches(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role varchar(16) NOT NULL DEFAULT 'scorer',
      added_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      added_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (match_id, user_id)
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_match_officials_match_idx ON community_match_officials (match_id)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_match_officials_user_idx ON community_match_officials (user_id)`);

    /* ── Phase 2: team-verification (OTP) per match ─────────────────────── */
    await tx.execute(sql`ALTER TABLE community_matches ADD COLUMN IF NOT EXISTS team_a_verified boolean NOT NULL DEFAULT false`);
    await tx.execute(sql`ALTER TABLE community_matches ADD COLUMN IF NOT EXISTS team_b_verified boolean NOT NULL DEFAULT false`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS community_team_verifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id uuid NOT NULL REFERENCES community_matches(id) ON DELETE CASCADE,
      team_id uuid NOT NULL REFERENCES community_teams(id) ON DELETE CASCADE,
      member_id uuid NOT NULL REFERENCES community_team_members(id) ON DELETE CASCADE,
      code_hash varchar(64) NOT NULL,
      last4 varchar(4) NOT NULL,
      attempts int NOT NULL DEFAULT 0,
      expires_at timestamptz NOT NULL,
      verified_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (match_id, team_id)
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS community_team_verifications_match_idx ON community_team_verifications (match_id)`);
  });
  ready = true;
}

/* ── row shapes ─────────────────────────────────────────────────────────── */
type MatchRow = {
  id: string; owner_user_id: string; team1: string; team2: string; venue: string;
  overs_limit: number; players_per_side: number; status: string; result_desc: string;
  team_a_id: string | null; team_b_id: string | null;
  team_a_verified: boolean; team_b_verified: boolean;
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
  striker_member_id: string | null; bowler_member_id: string | null;
};
type ProfileRow = {
  user_id: string; display_name: string; role: string; batting_style: string;
  bowling_style: string | null; created_at: string; updated_at: string;
};
type TeamRow = {
  id: string; owner_user_id: string; name: string; short_name: string; created_at: string;
};
type MemberRow = {
  id: string; team_id: string; user_id: string | null; phone: string | null;
  name: string; role: string; added_at: string;
};
const rows = <T,>(out: unknown): T[] => ((out as { rows: T[] }).rows ?? []);

function profileApi(p: ProfileRow) {
  return {
    userId: p.user_id, displayName: p.display_name, role: p.role,
    battingStyle: p.batting_style, bowlingStyle: p.bowling_style,
    createdAt: p.created_at, updatedAt: p.updated_at,
  };
}
function teamApi(t: TeamRow) {
  return {
    id: t.id, ownerUserId: t.owner_user_id, name: t.name,
    shortName: t.short_name, createdAt: t.created_at,
  };
}
/** Mask a phone to the last 4 digits only, e.g. "9876543210" → "******3210".
 *  Never returns the raw number. */
function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/[^0-9]/g, "");
  if (digits.length < 4) return "*".repeat(digits.length);
  return "*".repeat(digits.length - 4) + digits.slice(-4);
}

/**
 * Member → API shape. RAW phone is NEVER returned to anyone. Only the team
 * owner (canSeeMasked=true) gets a `phoneMasked` field (last-4 only); everyone
 * else gets no phone information at all.
 */
function memberApi(mm: MemberRow, canSeeMasked = false) {
  const base = {
    id: mm.id, teamId: mm.team_id, userId: mm.user_id,
    name: mm.name, role: mm.role, addedAt: mm.added_at,
  };
  return canSeeMasked ? { ...base, phoneMasked: maskPhone(mm.phone) } : base;
}

/**
 * Backfill: when a user (identified by phone) is known, link any team-member
 * rows that were added by phone before the user existed. Cheap idempotent hook
 * — call from the community profile PUT, NOT from the auth/OTP routes.
 * Must be called with a db/tx handle that exposes `.execute`.
 */
export async function linkPhoneToTeams(
  dbc: Pick<typeof db, "execute">,
  userId: string,
  phone: string | null | undefined,
): Promise<void> {
  if (!phone) return;
  const p = String(phone).trim();
  if (!p) return;
  await dbc.execute(sql`
    UPDATE community_team_members m
    SET user_id = ${userId}
    WHERE m.phone = ${p} AND m.user_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM community_team_members x
        WHERE x.team_id = m.team_id AND x.user_id = ${userId}
      )`);
}

function matchApi(m: MatchRow) {
  return {
    id: m.id, team1: m.team1, team2: m.team2, venue: m.venue,
    oversLimit: m.overs_limit, playersPerSide: m.players_per_side,
    status: m.status, resultDesc: m.result_desc, createdAt: m.created_at,
    teamAId: m.team_a_id ?? null, teamBId: m.team_b_id ?? null,
    teamAVerified: !!m.team_a_verified, teamBVerified: !!m.team_b_verified,
  };
}
function innApi(i: InnRow) {
  return {
    inningsNumber: i.innings_number, battingTeam: i.batting_team, bowlingTeam: i.bowling_team,
    totalRuns: i.total_runs, totalWickets: i.total_wickets, overs: i.overs, balls: i.balls,
    extras: i.extras, target: i.target, status: i.status,
  };
}

/**
 * True when `userId` may SCORE this match: the match owner, OR a user who was
 * appointed as an official with role 'scorer'. Takes a db/tx handle so it can
 * run inside the mutation transaction (under the match-row lock).
 */
async function canScore(
  dbc: Pick<typeof db, "execute">,
  match: MatchRow,
  userId: string,
): Promise<boolean> {
  if (match.owner_user_id === userId) return true;
  const [off] = rows<{ id: string }>(await dbc.execute(
    sql`SELECT id FROM community_match_officials
        WHERE match_id = ${match.id} AND user_id = ${userId} AND role = 'scorer'`,
  ));
  return !!off;
}

/** Load a match the caller may SCORE (owner OR an appointed scorer). */
async function loadScorableMatch(req: AuthRequest): Promise<{ match?: MatchRow; err?: { code: number; msg: string } }> {
  await ensureTables();
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { err: { code: 404, msg: "Match not found" } };
  const [m] = rows<MatchRow>(await db.execute(sql`SELECT * FROM community_matches WHERE id = ${id}`));
  if (!m) return { err: { code: 404, msg: "Match not found" } };
  if (!(await canScore(db, m, req.user!.userId))) {
    return { err: { code: 403, msg: "Only the match owner or an appointed scorer can score this match" } };
  }
  return { match: m };
}

/** Team-verification gate — reads the LOCKED match row inside a tx (never a
 *  stale pre-load) and returns true when scoring must be BLOCKED: a match with
 *  BOTH linked teams can only be scored once BOTH are verified for this match
 *  (owner's own team is auto-verified at link time; opponent teams go through
 *  the OTP flow). Matches without both teams linked are never blocked. Callers
 *  must have already taken `SELECT ... FOR UPDATE` on the row. */
async function teamsUnverifiedLocked(tx: Pick<typeof db, "execute">, matchId: string): Promise<boolean> {
  const [row] = rows<{ team_a_id: string | null; team_b_id: string | null; team_a_verified: boolean; team_b_verified: boolean }>(
    await tx.execute(sql`SELECT team_a_id, team_b_id, team_a_verified, team_b_verified FROM community_matches WHERE id = ${matchId}`),
  );
  if (!row) return false;
  return !!(row.team_a_id && row.team_b_id && !(row.team_a_verified && row.team_b_verified));
}

/** Load a match the caller OWNS (strict — for officials/verification admin). */
async function loadOwnedMatch(req: AuthRequest): Promise<{ match?: MatchRow; err?: { code: number; msg: string } }> {
  await ensureTables();
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { err: { code: 404, msg: "Match not found" } };
  const [m] = rows<MatchRow>(await db.execute(sql`SELECT * FROM community_matches WHERE id = ${id}`));
  if (!m) return { err: { code: 404, msg: "Match not found" } };
  if (m.owner_user_id !== req.user!.userId) return { err: { code: 403, msg: "Only the match owner can do that" } };
  return { match: m };
}

/* ── create match ───────────────────────────────────────────────────────── */
router.post("/matches", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    team1: z.string().trim().min(1).max(80).optional(),
    team2: z.string().trim().min(1).max(80).optional(),
    venue: z.string().trim().max(120).default(""),
    oversLimit: z.number().int().min(1).max(50),
    playersPerSide: z.number().int().min(2).max(11).default(11),
    battingFirst: z.enum(["team1", "team2"]).default("team1"),
    teamAId: z.string().uuid().optional(),
    teamBId: z.string().uuid().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    await ensureTables();

    /* Team-name defaults: when a linked team is picked and no explicit name is
       given, the team name becomes the display name (names stay source of truth).
       Team-verification: a team OWNED by the match creator is auto-verified;
       any other linked team must pass the OTP flow before scoring. */
    let team1 = d.team1, team2 = d.team2;
    const teamAId = d.teamAId ?? null, teamBId = d.teamBId ?? null;
    let teamAVerified = false, teamBVerified = false;
    if (teamAId) {
      const [ta] = rows<{ name: string; owner_user_id: string }>(await db.execute(
        sql`SELECT name, owner_user_id FROM community_teams WHERE id = ${teamAId}`));
      if (!ta) return void res.status(400).json({ error: "teamAId not found" });
      if (!team1) team1 = ta.name;
      teamAVerified = ta.owner_user_id === req.user!.userId;
    }
    if (teamBId) {
      const [tb] = rows<{ name: string; owner_user_id: string }>(await db.execute(
        sql`SELECT name, owner_user_id FROM community_teams WHERE id = ${teamBId}`));
      if (!tb) return void res.status(400).json({ error: "teamBId not found" });
      if (!team2) team2 = tb.name;
      teamBVerified = tb.owner_user_id === req.user!.userId;
    }
    if (!team1 || !team2) return void res.status(400).json({ error: "team1 and team2 are required (or pick linked teams)" });
    if (team1.toLowerCase() === team2.toLowerCase()) {
      return void res.status(400).json({ error: "Team names must be different" });
    }

    // gentle abuse guard: max 30 matches per scorer per day
    const [cnt] = rows<{ n: string }>(await db.execute(
      sql`SELECT count(*) n FROM community_matches WHERE owner_user_id = ${req.user!.userId} AND created_at > now() - interval '1 day'`,
    ));
    if (Number(cnt?.n ?? 0) >= 30) return void res.status(429).json({ error: "Daily match limit reached" });

    const battingTeam = d.battingFirst === "team1" ? team1 : team2;
    const bowlingTeam = d.battingFirst === "team1" ? team2 : team1;
    const [m] = rows<MatchRow>(await db.execute(sql`
      INSERT INTO community_matches (owner_user_id, team1, team2, venue, overs_limit, players_per_side, team_a_id, team_b_id, team_a_verified, team_b_verified)
      VALUES (${req.user!.userId}, ${team1}, ${team2}, ${d.venue}, ${d.oversLimit}, ${d.playersPerSide}, ${teamAId}, ${teamBId}, ${teamAVerified}, ${teamBVerified})
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
    /* Roster chips: when teams are linked, expose full rosters so the app can
       render member chips. Names remain the display source of truth. */
    const rosters: Record<"teamA" | "teamB", { id: string; name: string; role: string }[]> = { teamA: [], teamB: [] };
    for (const [key, teamId] of [["teamA", m.team_a_id], ["teamB", m.team_b_id]] as const) {
      if (!teamId) continue;
      const mems = rows<MemberRow>(await db.execute(
        sql`SELECT * FROM community_team_members WHERE team_id = ${teamId} ORDER BY added_at ASC`,
      ));
      rosters[key] = mems.map((mm) => ({ id: mm.id, name: mm.name, role: mm.role }));
    }
    res.json({
      match: matchApi(m), innings,
      rosters: (m.team_a_id || m.team_b_id) ? rosters : undefined,
    });
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
  strikerMemberId: z.string().uuid().optional(),
  bowlerMemberId: z.string().uuid().optional(),
});

router.post("/matches/:id/ball", requireAuth, async (req: AuthRequest, res) => {
  const parsed = ballSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  if (d.type === "wicket" && !d.dismissalType) return void res.status(400).json({ error: "dismissalType required for a wicket" });
  try {
    const { match: m, err } = await loadScorableMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    if (m!.status === "completed") return void res.status(400).json({ error: "Match already finished" });

    /* Whole mutation in one tx: match row locked FOR UPDATE serialises
       concurrent ball posts / undo / innings-end (two devices, retries). */
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      /* Team-verification gate — read from the LOCKED row (not the pre-load) so
         a verify-team confirm racing this ball is serialised correctly. */
      if (await teamsUnverifiedLocked(tx, m!.id)) return { unverified: true as const };
      const [inn] = rows<InnRow>(await tx.execute(
        sql`SELECT * FROM community_innings WHERE match_id = ${m!.id} AND status = 'live' ORDER BY innings_number DESC LIMIT 1 FOR UPDATE`,
      ));
      if (!inn) return { errMsg: "No live innings — end/start innings first" };

      /* Roster linkage (member ids power stats):
         - member ids are only accepted when the match has linked teams;
         - the striker must belong to the CURRENT batting side and the bowler
           to the bowling side of the active innings.
         team1 ↔ team_a_id, team2 ↔ team_b_id; the innings' batting_team name
         resolves which side is batting. */
      const strikerMemberId = d.strikerMemberId ?? null;
      const bowlerMemberId = d.bowlerMemberId ?? null;
      if ((strikerMemberId || bowlerMemberId) && !(m!.team_a_id && m!.team_b_id)) {
        return { errMsg: "Member ids require both teams to be linked to the match" };
      }
      if (strikerMemberId || bowlerMemberId) {
        const battingTeamId = inn.batting_team === m!.team1 ? m!.team_a_id : m!.team_b_id;
        const bowlingTeamId = inn.batting_team === m!.team1 ? m!.team_b_id : m!.team_a_id;
        for (const [mid, side] of [[strikerMemberId, battingTeamId], [bowlerMemberId, bowlingTeamId]] as const) {
          if (!mid) continue;
          const [mem] = rows<{ team_id: string }>(await tx.execute(
            sql`SELECT team_id FROM community_team_members WHERE id = ${mid}`,
          ));
          if (!mem || mem.team_id !== side) {
            return { errMsg: "Member does not belong to the correct side for this ball" };
          }
        }
      }

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
          is_wicket, dismissal_type, dismissed_batter, fielder_name, commentary,
          striker_member_id, bowler_member_id)
        VALUES (${inn.id}, ${inn.overs}, ${newBalls || inn.balls}, ${deliveryInOver},
          ${d.batterName}, ${d.bowlerName}, ${runsOffBat}, ${extrasRuns}, ${extraType}, ${totalRunsD},
          ${isWicket}, ${d.dismissalType ?? null}, ${isWicket ? (d.dismissedBatter || d.batterName) : null},
          ${d.fielderName ?? null}, ${commentary}, ${strikerMemberId}, ${bowlerMemberId})`);

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
        if (inn.innings_number === 2) await finalizeResult(tx, m!.id);
      }
      return { inn, newTotal, newWkts, newOvers, finalBalls, complete, commentary };
    });
    if ("unverified" in result) return void res.status(400).json({ error: "Both linked teams must be verified before scoring", code: "team_unverified" });
    if ("errMsg" in result) return void res.status(400).json({ error: result.errMsg });

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
    const { match: m, err } = await loadScorableMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      if (await teamsUnverifiedLocked(tx, m!.id)) return "team_unverified";
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
    if (out === "team_unverified") return void res.status(400).json({ error: "Both linked teams must be verified before scoring", code: "team_unverified" });
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
    const { match: m, err } = await loadScorableMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      if (await teamsUnverifiedLocked(tx, m!.id)) return { unverified: true as const };
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
    if ("unverified" in out) return void res.status(400).json({ error: "Both linked teams must be verified before scoring", code: "team_unverified" });
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
    const { match: m, err } = await loadScorableMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      // Gate applies even for abandon:true — an unverified match cannot be
      // completed/abandoned by the scorer until both linked teams are verified.
      if (await teamsUnverifiedLocked(tx, m!.id)) return { unverified: true as const };
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
      if (abandon) {
        await tx.execute(sql`UPDATE community_matches SET result_desc = 'Match abandoned' WHERE id = ${m!.id}`);
        return { resultDesc: "Match abandoned" };
      }
      return { resultDesc: await finalizeResult(tx, m!.id) };
    });
    if ("unverified" in out) return void res.status(400).json({ error: "Both linked teams must be verified before scoring", code: "team_unverified" });
    if ("errMsg" in out) return void res.status(400).json({ error: out.errMsg });
    res.json({ success: true, resultDesc: out.resultDesc });
  } catch (e) {
    logger.warn({ err: e }, "community finish failed");
    res.status(500).json({ error: "Could not finish match" });
  }
});

/* Must be called INSIDE the transaction that holds the match-row lock, so an
   interleaved undo can never reopen the innings between commit and result. */
async function finalizeResult(dbc: Pick<typeof db, "execute">, matchId: string): Promise<string> {
  const inns = rows<InnRow>(await dbc.execute(
    sql`SELECT * FROM community_innings WHERE match_id = ${matchId} ORDER BY innings_number ASC`,
  ));
  const [m] = rows<MatchRow>(await dbc.execute(sql`SELECT * FROM community_matches WHERE id = ${matchId}`));
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
    await dbc.execute(sql`UPDATE community_matches SET result_desc = ${desc} WHERE id = ${matchId}`);
  }
  return desc;
}

/* ══════════════════════════════════════════════════════════════════════════
   Phase 1 — cricket platform (profiles, teams, roster-linked stats)
   Patterns mirror the scorer above: ensureTables() first, zod validation,
   requireAuth, mutations inside db.transaction with the row locked FOR UPDATE,
   camelCase JSON responses.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── cricket profile ────────────────────────────────────────────────────── */
router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const [p] = rows<ProfileRow>(await db.execute(
      sql`SELECT * FROM community_profiles WHERE user_id = ${req.user!.userId}`,
    ));
    if (!p) return void res.status(404).json({ error: "No profile yet" });
    res.json({ profile: profileApi(p) });
  } catch (e) {
    logger.warn({ err: e }, "community profile get failed");
    res.status(500).json({ error: "Could not load profile" });
  }
});

router.put("/profile", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    displayName: z.string().trim().min(1).max(80),
    role: z.enum(["batsman", "bowler", "all_rounder", "wicket_keeper"]),
    battingStyle: z.enum(["right", "left"]),
    bowlingStyle: z.string().trim().max(80).nullish(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    await ensureTables();
    const bowlingStyle = d.bowlingStyle && d.bowlingStyle.length ? d.bowlingStyle : null;
    const p = await db.transaction(async (tx) => {
      const [row] = rows<ProfileRow>(await tx.execute(sql`
        INSERT INTO community_profiles (user_id, display_name, role, batting_style, bowling_style, updated_at)
        VALUES (${req.user!.userId}, ${d.displayName}, ${d.role}, ${d.battingStyle}, ${bowlingStyle}, now())
        ON CONFLICT (user_id) DO UPDATE SET
          display_name = EXCLUDED.display_name, role = EXCLUDED.role,
          batting_style = EXCLUDED.batting_style, bowling_style = EXCLUDED.bowling_style,
          updated_at = now()
        RETURNING *`));
      // cheap hook: link any pending team-member rows for this user's phone
      await linkPhoneToTeams(tx, req.user!.userId, req.user!.phone);
      return row;
    });
    res.json({ success: true, profile: profileApi(p) });
  } catch (e) {
    logger.warn({ err: e }, "community profile put failed");
    res.status(500).json({ error: "Could not save profile" });
  }
});

/* ── profile stats (aggregated over roster-linked deliveries) ───────────── */
router.get("/profile/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const uid = req.user!.userId;
    // Batting: deliveries where this user is the striker (via member linkage).
    // WD/NB don't count as balls faced; byes/leg-byes do (no bat runs though).
    const [bat] = rows<{
      matches: string; innings: string; runs: string; balls: string; fours: string; sixes: string;
    }>(await db.execute(sql`
      SELECT
        count(DISTINCT i.match_id)                                             AS matches,
        count(DISTINCT d.innings_id)                                           AS innings,
        coalesce(sum(d.runs_off_bat), 0)                                       AS runs,
        coalesce(sum(CASE WHEN d.extra_type IS NULL OR d.extra_type IN ('bye','leg_bye') THEN 1 ELSE 0 END), 0) AS balls,
        coalesce(sum(CASE WHEN d.runs_off_bat = 4 THEN 1 ELSE 0 END), 0)       AS fours,
        coalesce(sum(CASE WHEN d.runs_off_bat = 6 THEN 1 ELSE 0 END), 0)       AS sixes
      FROM community_deliveries d
      JOIN community_innings i ON i.id = d.innings_id
      JOIN community_team_members mm ON mm.id = d.striker_member_id
      WHERE mm.user_id = ${uid}`));
    // Bowling: deliveries where this user is the bowler.
    const [bowl] = rows<{
      matches: string; innings: string; balls: string; conceded: string; wickets: string;
    }>(await db.execute(sql`
      SELECT
        count(DISTINCT i.match_id)                                             AS matches,
        count(DISTINCT d.innings_id)                                           AS innings,
        coalesce(sum(CASE WHEN d.extra_type IN ('wide','no_ball') THEN 0 ELSE 1 END), 0) AS balls,
        coalesce(sum(d.runs_off_bat + CASE WHEN d.extra_type IN ('wide','no_ball') THEN d.extras_runs ELSE 0 END), 0) AS conceded,
        coalesce(sum(CASE WHEN d.is_wicket AND d.dismissal_type NOT IN ('run_out','retired_hurt') THEN 1 ELSE 0 END), 0) AS wickets
      FROM community_deliveries d
      JOIN community_innings i ON i.id = d.innings_id
      JOIN community_team_members mm ON mm.id = d.bowler_member_id
      WHERE mm.user_id = ${uid}`));

    const runs = Number(bat?.runs ?? 0), ballsFaced = Number(bat?.balls ?? 0);
    const bBalls = Number(bowl?.balls ?? 0), conceded = Number(bowl?.conceded ?? 0);
    const strikeRate = ballsFaced > 0 ? Math.round((runs / ballsFaced) * 10000) / 100 : 0;
    const oversBowled = Math.floor(bBalls / 6) + (bBalls % 6) / 10;
    const economy = bBalls > 0 ? Math.round((conceded / (bBalls / 6)) * 100) / 100 : 0;

    res.json({
      stats: {
        batting: {
          matches: Number(bat?.matches ?? 0),
          innings: Number(bat?.innings ?? 0),
          runs,
          balls: ballsFaced,
          fours: Number(bat?.fours ?? 0),
          sixes: Number(bat?.sixes ?? 0),
          strikeRate,
        },
        bowling: {
          matches: Number(bowl?.matches ?? 0),
          innings: Number(bowl?.innings ?? 0),
          wickets: Number(bowl?.wickets ?? 0),
          balls: bBalls,
          overs: oversBowled,
          runsConceded: conceded,
          economy,
        },
      },
    });
  } catch (e) {
    logger.warn({ err: e }, "community profile stats failed");
    res.status(500).json({ error: "Could not load stats" });
  }
});

/* ── teams ──────────────────────────────────────────────────────────────── */
router.post("/teams", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().trim().min(1).max(40),
    shortName: z.string().trim().min(1).max(5),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    await ensureTables();
    const out = await db.transaction(async (tx) => {
      /* Serialise concurrent creates for THIS owner so count+insert is atomic
         (advisory lock keyed on the owner id — released at tx end). */
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:community_teams:' || ${req.user!.userId}))`);
      const [cnt] = rows<{ n: string }>(await tx.execute(
        sql`SELECT count(*) n FROM community_teams WHERE owner_user_id = ${req.user!.userId}`,
      ));
      if (Number(cnt?.n ?? 0) >= 20) return { errMsg: "Team limit reached (20 per user)" };
      const [t] = rows<TeamRow>(await tx.execute(sql`
        INSERT INTO community_teams (owner_user_id, name, short_name)
        VALUES (${req.user!.userId}, ${d.name}, ${d.shortName})
        RETURNING *`));
      return { team: t };
    });
    if ("errMsg" in out) return void res.status(400).json({ error: out.errMsg });
    res.json({ success: true, team: teamApi(out.team) });
  } catch (e) {
    logger.warn({ err: e }, "community team create failed");
    res.status(500).json({ error: "Could not create team" });
  }
});

router.get("/teams/mine", requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const list = rows<TeamRow>(await db.execute(sql`
      SELECT DISTINCT t.* FROM community_teams t
      LEFT JOIN community_team_members m ON m.team_id = t.id
      WHERE t.owner_user_id = ${req.user!.userId} OR m.user_id = ${req.user!.userId}
      ORDER BY t.created_at DESC LIMIT 100`));
    res.json({ teams: list.map(teamApi) });
  } catch (e) {
    logger.warn({ err: e }, "community teams mine failed");
    res.status(500).json({ error: "Could not load teams" });
  }
});

/* Public read, but PII-aware: optionalAuth attaches req.user when a valid token
   is present so we can reveal phones ONLY to the team owner. */
router.get("/teams/:id", optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Team not found" });
    const [t] = rows<TeamRow>(await db.execute(sql`SELECT * FROM community_teams WHERE id = ${id}`));
    if (!t) return void res.status(404).json({ error: "Team not found" });
    const mems = rows<MemberRow>(await db.execute(
      sql`SELECT * FROM community_team_members WHERE team_id = ${id} ORDER BY added_at ASC`,
    ));
    const isOwner = req.user?.userId === t.owner_user_id;
    res.json({ team: teamApi(t), members: mems.map((mm) => memberApi(mm, isOwner)) });
  } catch (e) {
    logger.warn({ err: e }, "community team get failed");
    res.status(500).json({ error: "Could not load team" });
  }
});

async function loadOwnedTeam(req: AuthRequest): Promise<{ team?: TeamRow; err?: { code: number; msg: string } }> {
  await ensureTables();
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { err: { code: 404, msg: "Team not found" } };
  const [t] = rows<TeamRow>(await db.execute(sql`SELECT * FROM community_teams WHERE id = ${id}`));
  if (!t) return { err: { code: 404, msg: "Team not found" } };
  if (t.owner_user_id !== req.user!.userId) return { err: { code: 403, msg: "Only the team owner can do that" } };
  return { team: t };
}

router.post("/teams/:id/members", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().trim().min(1).max(80),
    phone: z.string().trim().min(4).max(15).optional(),
    role: z.string().trim().max(24).default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    const { team: t, err } = await loadOwnedTeam(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_teams WHERE id = ${t!.id} FOR UPDATE`);
      const [cnt] = rows<{ n: string }>(await tx.execute(
        sql`SELECT count(*) n FROM community_team_members WHERE team_id = ${t!.id}`,
      ));
      if (Number(cnt?.n ?? 0) >= 25) return { errMsg: "Member limit reached (25 per team)" };

      // Auto-link: if the phone matches a users row, set user_id and prefer
      // that user's community_profile display_name (if any).
      let userId: string | null = null;
      let name = d.name;
      const phone = d.phone ?? null;
      if (phone) {
        const [u] = rows<{ id: string }>(await tx.execute(
          sql`SELECT id FROM users WHERE phone = ${phone}`,
        ));
        if (u) {
          userId = u.id;
          const [prof] = rows<{ display_name: string }>(await tx.execute(
            sql`SELECT display_name FROM community_profiles WHERE user_id = ${u.id}`,
          ));
          if (prof?.display_name) name = prof.display_name;
        }
      }
      // uniqueness guards (mirror the partial unique indexes)
      if (phone) {
        const [dup] = rows<{ id: string }>(await tx.execute(
          sql`SELECT id FROM community_team_members WHERE team_id = ${t!.id} AND phone = ${phone}`,
        ));
        if (dup) return { errMsg: "That phone is already on the team" };
      }
      if (userId) {
        const [dup] = rows<{ id: string }>(await tx.execute(
          sql`SELECT id FROM community_team_members WHERE team_id = ${t!.id} AND user_id = ${userId}`,
        ));
        if (dup) return { errMsg: "That player is already on the team" };
      }
      const [mm] = rows<MemberRow>(await tx.execute(sql`
        INSERT INTO community_team_members (team_id, user_id, phone, name, role)
        VALUES (${t!.id}, ${userId}, ${phone}, ${name}, ${d.role})
        RETURNING *`));
      return { member: mm };
    });
    if ("errMsg" in out) return void res.status(400).json({ error: out.errMsg });
    // owner-only endpoint → phone is safe to echo back
    res.json({ success: true, member: memberApi(out.member, true) });
  } catch (e) {
    logger.warn({ err: e }, "community add member failed");
    res.status(500).json({ error: "Could not add member" });
  }
});

router.delete("/teams/:id/members/:memberId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { team: t, err } = await loadOwnedTeam(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const memberId = String(req.params.memberId);
    if (!/^[0-9a-f-]{36}$/i.test(memberId)) return void res.status(404).json({ error: "Member not found" });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_teams WHERE id = ${t!.id} FOR UPDATE`);
      const [mm] = rows<MemberRow>(await tx.execute(
        sql`SELECT * FROM community_team_members WHERE id = ${memberId} AND team_id = ${t!.id} FOR UPDATE`,
      ));
      if (!mm) return "Member not found";
      await tx.execute(sql`DELETE FROM community_team_members WHERE id = ${memberId}`);
      return null;
    });
    if (out) return void res.status(404).json({ error: out });
    res.json({ success: true });
  } catch (e) {
    logger.warn({ err: e }, "community remove member failed");
    res.status(500).json({ error: "Could not remove member" });
  }
});

router.patch("/teams/:id", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().trim().min(1).max(40).optional(),
    shortName: z.string().trim().min(1).max(5).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  if (d.name === undefined && d.shortName === undefined) {
    return void res.status(400).json({ error: "Nothing to update" });
  }
  try {
    const { team: t, err } = await loadOwnedTeam(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const updated = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_teams WHERE id = ${t!.id} FOR UPDATE`);
      const [row] = rows<TeamRow>(await tx.execute(sql`
        UPDATE community_teams SET
          name = ${d.name ?? t!.name},
          short_name = ${d.shortName ?? t!.short_name}
        WHERE id = ${t!.id}
        RETURNING *`));
      return row;
    });
    res.json({ success: true, team: teamApi(updated) });
  } catch (e) {
    logger.warn({ err: e }, "community team rename failed");
    res.status(500).json({ error: "Could not update team" });
  }
});

router.delete("/teams/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { team: t, err } = await loadOwnedTeam(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_teams WHERE id = ${t!.id} FOR UPDATE`);
      const [ref] = rows<{ n: string }>(await tx.execute(
        sql`SELECT count(*) n FROM community_matches WHERE team_a_id = ${t!.id} OR team_b_id = ${t!.id}`,
      ));
      if (Number(ref?.n ?? 0) > 0) return "Team is used by a match and cannot be deleted";
      await tx.execute(sql`DELETE FROM community_teams WHERE id = ${t!.id}`);
      return null;
    });
    if (out) return void res.status(400).json({ error: out });
    res.json({ success: true });
  } catch (e) {
    logger.warn({ err: e }, "community team delete failed");
    res.status(500).json({ error: "Could not delete team" });
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   Phase 2 — match officials + team-verification OTP
   ══════════════════════════════════════════════════════════════════════════ */

type OfficialRow = {
  id: string; match_id: string; user_id: string; role: string; added_by: string; added_at: string;
};

/* ── match officials ─────────────────────────────────────────────────────── */

/** POST /matches/:id/officials — owner appoints a registered user by phone. */
router.post("/matches/:id/officials", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    phone: z.string().trim().min(4).max(15),
    role: z.enum(["scorer", "umpire"]).default("scorer"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    const { match: m, err } = await loadOwnedMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      const [u] = rows<{ id: string; name: string; phone: string }>(await tx.execute(
        sql`SELECT id, name, phone FROM users WHERE phone = ${d.phone}`,
      ));
      // No account for this phone → let the app show "invite them to install".
      if (!u) return { code: 404 as const, errMsg: "no_account" };
      if (u.id === m!.owner_user_id) return { code: 400 as const, errMsg: "Owner is already the match scorer" };
      const [existing] = rows<OfficialRow>(await tx.execute(
        sql`SELECT * FROM community_match_officials WHERE match_id = ${m!.id} AND user_id = ${u.id}`,
      ));
      if (existing) return { code: 400 as const, errMsg: "That user is already an official on this match" };
      const [off] = rows<OfficialRow>(await tx.execute(sql`
        INSERT INTO community_match_officials (match_id, user_id, role, added_by)
        VALUES (${m!.id}, ${u.id}, ${d.role}, ${req.user!.userId})
        RETURNING *`));
      return { official: off, name: u.name, phone: u.phone };
    });
    if ("errMsg" in out) return void res.status(out.code as number).json({ error: out.errMsg });
    res.json({
      success: true,
      official: {
        id: out.official.id, userId: out.official.user_id, role: out.official.role,
        name: out.name, phoneMasked: maskPhone(out.phone), addedAt: out.official.added_at,
      },
    });
  } catch (e) {
    logger.warn({ err: e }, "community add official failed");
    res.status(500).json({ error: "Could not add official" });
  }
});

/** GET /matches/:id/officials — owner or any official may list. */
router.get("/matches/:id/officials", requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Match not found" });
    const [m] = rows<MatchRow>(await db.execute(sql`SELECT * FROM community_matches WHERE id = ${id}`));
    if (!m) return void res.status(404).json({ error: "Match not found" });
    const isOwner = m.owner_user_id === req.user!.userId;
    const [self] = rows<{ id: string }>(await db.execute(
      sql`SELECT id FROM community_match_officials WHERE match_id = ${id} AND user_id = ${req.user!.userId}`,
    ));
    if (!isOwner && !self) return void res.status(403).json({ error: "Only the match owner or an official can view this" });
    const list = rows<OfficialRow & { name: string; phone: string }>(await db.execute(sql`
      SELECT o.*, u.name, u.phone FROM community_match_officials o
      JOIN users u ON u.id = o.user_id
      WHERE o.match_id = ${id} ORDER BY o.added_at ASC`));
    res.json({
      officials: list.map((o) => ({
        id: o.id, userId: o.user_id, role: o.role, name: o.name,
        // phone masked ONLY for the owner; other officials see just name/role.
        ...(isOwner ? { phoneMasked: maskPhone(o.phone) } : {}),
        addedAt: o.added_at,
      })),
    });
  } catch (e) {
    logger.warn({ err: e }, "community list officials failed");
    res.status(500).json({ error: "Could not load officials" });
  }
});

/** DELETE /matches/:id/officials/:userId — owner only. */
router.delete("/matches/:id/officials/:userId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { match: m, err } = await loadOwnedMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const userId = String(req.params.userId);
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return void res.status(404).json({ error: "Official not found" });
    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      const [off] = rows<OfficialRow>(await tx.execute(
        sql`SELECT * FROM community_match_officials WHERE match_id = ${m!.id} AND user_id = ${userId} FOR UPDATE`,
      ));
      if (!off) return "Official not found";
      await tx.execute(sql`DELETE FROM community_match_officials WHERE id = ${off.id}`);
      return null;
    });
    if (out) return void res.status(404).json({ error: out });
    res.json({ success: true });
  } catch (e) {
    logger.warn({ err: e }, "community remove official failed");
    res.status(500).json({ error: "Could not remove official" });
  }
});

/* ── team-verification OTP ───────────────────────────────────────────────── */

/** Resolve which side (a/b) a team occupies in a match, or null if not linked. */
function teamSide(m: MatchRow, teamId: string): "a" | "b" | null {
  if (m.team_a_id === teamId) return "a";
  if (m.team_b_id === teamId) return "b";
  return null;
}

/** POST /matches/:id/verify-team/start — owner starts OTP verification for a
 *  linked team by sending a code to one of that team's members (by phone). */
router.post("/matches/:id/verify-team/start", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    teamId: z.string().uuid(),
    memberId: z.string().uuid(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    const { match: m, err } = await loadOwnedMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const side = teamSide(m!, d.teamId);
    if (!side) return void res.status(400).json({ error: "That team is not linked to this match" });
    const alreadyVerified = side === "a" ? m!.team_a_verified : m!.team_b_verified;
    if (alreadyVerified) return void res.status(400).json({ error: "That team is already verified" });

    const started = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      const [mem] = rows<MemberRow>(await tx.execute(
        sql`SELECT * FROM community_team_members WHERE id = ${d.memberId} AND team_id = ${d.teamId} FOR UPDATE`,
      ));
      if (!mem) return { errMsg: "Member not found on that team", code: 404 as const };
      if (!mem.phone) return { errMsg: "That member has no phone to verify with", code: 400 as const };

      const code = gen6();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      const last4 = String(mem.phone).replace(/[^0-9]/g, "").slice(-4);
      // Upsert one verification row per (match, team) — restart resets attempts.
      await tx.execute(sql`
        INSERT INTO community_team_verifications (match_id, team_id, member_id, code_hash, last4, attempts, expires_at, verified_at)
        VALUES (${m!.id}, ${d.teamId}, ${mem.id}, ${hashCode(code)}, ${last4}, 0, ${expiresAt.toISOString()}, NULL)
        ON CONFLICT (match_id, team_id) DO UPDATE SET
          member_id = EXCLUDED.member_id, code_hash = EXCLUDED.code_hash, last4 = EXCLUDED.last4,
          attempts = 0, expires_at = EXCLUDED.expires_at, verified_at = NULL, created_at = now()`);
      return { phone: mem.phone, code, phoneMasked: maskPhone(mem.phone) };
    });
    if ("errMsg" in started) return void res.status(started.code as number).json({ error: started.errMsg });

    /* SMS gate (hard rule): deliver the OTP only in production (or when
       COMMUNITY_SMS_ENABLED=1). Single best-effort send — never queued to the
       outbox retry sweep. */
    if (communitySmsEnabled()) {
      try { await sendOtp(started.phone, started.code); }
      catch (e) { logger.warn({ err: e }, "community team-verify OTP send failed"); }
    } else {
      logger.info({ matchId: m!.id, teamId: d.teamId }, "community team-verify OTP send skipped (not prod / gate off)");
    }

    // Never expose the raw phone. In test env, echo the code so tests can confirm.
    res.json({
      success: true,
      phoneMasked: started.phoneMasked,
      ...(isTestEnv() ? { devCode: started.code } : {}),
    });
  } catch (e) {
    logger.warn({ err: e }, "community verify-team start failed");
    res.status(500).json({ error: "Could not start team verification" });
  }
});

/** POST /matches/:id/verify-team/confirm — owner confirms with the target
 *  member's phone last-4 AND the 6-digit code. */
router.post("/matches/:id/verify-team/confirm", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    teamId: z.string().uuid(),
    last4: z.string().trim().regex(/^[0-9]{4}$/),
    code: z.string().trim().regex(/^[0-9]{6}$/),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    const { match: m, err } = await loadOwnedMatch(req);
    if (err) return void res.status(err.code).json({ error: err.msg });
    const side = teamSide(m!, d.teamId);
    if (!side) return void res.status(400).json({ error: "That team is not linked to this match" });

    const out = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM community_matches WHERE id = ${m!.id} FOR UPDATE`);
      const [v] = rows<{
        id: string; code_hash: string; last4: string; attempts: number;
        expires_at: string; verified_at: string | null;
      }>(await tx.execute(
        sql`SELECT * FROM community_team_verifications WHERE match_id = ${m!.id} AND team_id = ${d.teamId} FOR UPDATE`,
      ));
      if (!v) return { code: 400 as const, errMsg: "Start verification first" };
      if (v.verified_at) return { verified: true };
      if (new Date(v.expires_at).getTime() < Date.now()) return { code: 400 as const, errMsg: "Code expired — start again" };
      if (v.attempts >= 5) return { code: 429 as const, errMsg: "Too many attempts — start again" };

      const ok = v.last4 === d.last4 && v.code_hash === hashCode(d.code);
      if (!ok) {
        await tx.execute(sql`UPDATE community_team_verifications SET attempts = attempts + 1 WHERE id = ${v.id}`);
        return { code: 400 as const, errMsg: "Incorrect last4 or code" };
      }
      await tx.execute(sql`UPDATE community_team_verifications SET verified_at = now() WHERE id = ${v.id}`);
      if (side === "a") {
        await tx.execute(sql`UPDATE community_matches SET team_a_verified = true, updated_at = now() WHERE id = ${m!.id}`);
      } else {
        await tx.execute(sql`UPDATE community_matches SET team_b_verified = true, updated_at = now() WHERE id = ${m!.id}`);
      }
      return { verified: true };
    });
    if ("errMsg" in out) return void res.status(out.code as number).json({ error: out.errMsg });
    res.json({ success: true, verified: true });
  } catch (e) {
    logger.warn({ err: e }, "community verify-team confirm failed");
    res.status(500).json({ error: "Could not confirm team verification" });
  }
});

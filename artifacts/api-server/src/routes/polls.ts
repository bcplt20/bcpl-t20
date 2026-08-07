/**
 * Fan Voting (IPL-style polls) — website + mobile app.
 *
 * Public (voting is anonymous-friendly — no login required):
 *   GET  /api/polls                 open + recently-closed polls (+counts if allowed)
 *   GET  /api/polls/:slug           one poll by slug (+counts if allowed)
 *   POST /api/polls/:id/vote        cast one vote. Body { optionId, deviceId? }.
 *                                   Dedupe key = 'user:<id>' when a valid Bearer
 *                                   token is present, else 'device:<deviceId>'.
 *                                   One vote per (poll, voter_key) → 409 on dup.
 *                                   Anti-abuse: hashed-IP soft cap per poll +
 *                                   short-window rate limit keyed by IP+device.
 *
 * Admin (x-bcpl-admin-token, CONTENT_TEAM or SUPER_ADMIN):
 *   POST   /api/admin/polls                     create poll (+options)
 *   GET    /api/admin/polls                     list all polls
 *   GET    /api/admin/polls/:id                 one poll (with options + results)
 *   PATCH  /api/admin/polls/:id                 edit poll fields / open|close
 *   DELETE /api/admin/polls/:id                 delete poll (+options, +votes)
 *   POST   /api/admin/polls/:id/options         add an option
 *   PATCH  /api/admin/polls/:id/options/:optId  edit an option
 *   DELETE /api/admin/polls/:id/options/:optId  delete an option
 *   GET    /api/admin/polls/:id/results         counts, percentages, total votes
 *
 * Vote counts/percentages are exposed publicly ONLY when the poll is closed OR
 * showLiveResults is true. No PII is ever returned in public responses (votes
 * are aggregated; voter ids never leak).
 *
 * Patterns mirror community.ts: idempotent advisory-locked ensureTables(), zod
 * validation, one mutation per db.transaction with rows locked FOR UPDATE,
 * camelCase JSON. Vote status strings are only 'draft' | 'open' | 'closed'.
 */
import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { optionalAuth, type AuthRequest } from "../middlewares/auth";
import { requireAdmin, requireRole } from "../middlewares/adminAuth";
import { logger } from "../lib/logger";
import { createHash } from "node:crypto";

const publicRouter = Router();
const adminRouter = Router();

const rows = <T,>(out: unknown): T[] => ((out as { rows: T[] }).rows ?? []);

/* ── tables (idempotent ensure, advisory-locked) ────────────────────────── */
let ready = false;
async function ensureTables(): Promise<void> {
  if (ready) return;
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:fan_polls:ddl'))`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS fan_polls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug varchar(80) NOT NULL UNIQUE,
      title_en varchar(160) NOT NULL,
      title_hi varchar(160) NOT NULL DEFAULT '',
      category varchar(32) NOT NULL DEFAULT 'custom',
      status varchar(12) NOT NULL DEFAULT 'draft',
      opens_at timestamptz,
      closes_at timestamptz,
      show_live_results boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS fan_polls_status_idx ON fan_polls (status, created_at DESC)`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS fan_poll_options (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id uuid NOT NULL REFERENCES fan_polls(id) ON DELETE CASCADE,
      label varchar(120) NOT NULL,
      image_url varchar(600),
      team_name varchar(80),
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS fan_poll_options_poll_idx ON fan_poll_options (poll_id, sort_order ASC)`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS fan_poll_votes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      poll_id uuid NOT NULL REFERENCES fan_polls(id) ON DELETE CASCADE,
      option_id uuid NOT NULL REFERENCES fan_poll_options(id) ON DELETE CASCADE,
      user_id uuid,
      voter_key text NOT NULL DEFAULT '',
      ip_hash text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    // ── In-place migration for dev DBs that predate anonymous voting ────────
    // Older schema had user_id NOT NULL + UNIQUE(poll_id,user_id). We move to a
    // voter_key ('user:<id>' | 'device:<uuid>') keyed uniqueness so guests can
    // vote once per device. All steps are idempotent.
    await tx.execute(sql`ALTER TABLE fan_poll_votes ADD COLUMN IF NOT EXISTS voter_key text NOT NULL DEFAULT ''`);
    await tx.execute(sql`ALTER TABLE fan_poll_votes ADD COLUMN IF NOT EXISTS ip_hash text`);
    await tx.execute(sql`ALTER TABLE fan_poll_votes ALTER COLUMN user_id DROP NOT NULL`);
    // Backfill voter_key for any legacy rows that were user-authored.
    await tx.execute(sql`
      UPDATE fan_poll_votes SET voter_key = 'user:' || user_id::text
      WHERE (voter_key IS NULL OR voter_key = '') AND user_id IS NOT NULL`);
    // Drop the old user-only unique constraint if it still exists.
    await tx.execute(sql`ALTER TABLE fan_poll_votes DROP CONSTRAINT IF EXISTS fan_poll_votes_poll_id_user_id_key`);
    // New uniqueness: one vote per (poll, voter_key).
    await tx.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS fan_poll_votes_poll_voter_key_uidx
      ON fan_poll_votes (poll_id, voter_key)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS fan_poll_votes_option_idx ON fan_poll_votes (option_id)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS fan_poll_votes_poll_ip_idx ON fan_poll_votes (poll_id, ip_hash)`);
  });
  ready = true;
}

/* ── row shapes ─────────────────────────────────────────────────────────── */
type PollRow = {
  id: string; slug: string; title_en: string; title_hi: string; category: string;
  status: string; opens_at: string | null; closes_at: string | null;
  show_live_results: boolean; created_at: string; updated_at: string;
};
type OptionRow = {
  id: string; poll_id: string; label: string; image_url: string | null;
  team_name: string | null; sort_order: number; created_at: string;
};

const POLL_CATEGORIES = ["man_of_series", "best_batsman", "best_bowler", "custom"] as const;
const POLL_STATUSES = ["draft", "open", "closed"] as const;

function pollApi(p: PollRow) {
  return {
    id: p.id, slug: p.slug, titleEn: p.title_en, titleHi: p.title_hi,
    category: p.category, status: p.status,
    opensAt: p.opens_at, closesAt: p.closes_at,
    showLiveResults: !!p.show_live_results,
    createdAt: p.created_at, updatedAt: p.updated_at,
  };
}
function optionApi(o: OptionRow) {
  return {
    id: o.id, pollId: o.poll_id, label: o.label, imageUrl: o.image_url,
    teamName: o.team_name, sortOrder: o.sort_order,
  };
}

/** Is the poll accepting votes right now (status open + within window)? */
function isVotingOpen(p: PollRow, now = Date.now()): boolean {
  if (p.status !== "open") return false;
  if (p.opens_at && new Date(p.opens_at).getTime() > now) return false;
  if (p.closes_at && new Date(p.closes_at).getTime() < now) return false;
  return true;
}

/** May the PUBLIC see per-option counts/percentages for this poll? */
function resultsVisible(p: PollRow): boolean {
  return p.status === "closed" || !!p.show_live_results;
}

/** Load options + per-option counts for a poll. */
async function optionsWithCounts(pollId: string): Promise<Array<OptionRow & { votes: number }>> {
  const opts = rows<OptionRow>(await db.execute(
    sql`SELECT * FROM fan_poll_options WHERE poll_id = ${pollId} ORDER BY sort_order ASC, created_at ASC`,
  ));
  const counts = rows<{ option_id: string; n: string }>(await db.execute(
    sql`SELECT option_id, count(*) n FROM fan_poll_votes WHERE poll_id = ${pollId} GROUP BY option_id`,
  ));
  const byOpt = new Map(counts.map(c => [c.option_id, Number(c.n)]));
  return opts.map(o => ({ ...o, votes: byOpt.get(o.id) ?? 0 }));
}

/** Public option payload — includes counts/percent only when allowed. */
function publicOptions(opts: Array<OptionRow & { votes: number }>, showCounts: boolean) {
  const total = opts.reduce((s, o) => s + o.votes, 0);
  return {
    totalVotes: showCounts ? total : null,
    options: opts.map(o => ({
      ...optionApi(o),
      ...(showCounts
        ? { votes: o.votes, percent: total > 0 ? Math.round((o.votes / total) * 1000) / 10 : 0 }
        : {}),
    })),
  };
}

/* ── anti-abuse for anonymous voting ────────────────────────────────────── */

// Short-window rate limit, keyed by IP + deviceId (NOT userId — votes are
// anonymous). Prevents rapid-fire spamming from one device/network.
const VOTE_WINDOW_MS = 10_000;
const VOTE_MAX = 5; // max vote attempts per (ip+device) per window
const voteHits = new Map<string, { count: number; resetAt: number }>();
/** Test hook — reset the vote rate-limiter. */
export function __resetVoteRateLimit(): void { voteHits.clear(); }
function voteRateLimited(key: string): boolean {
  const now = Date.now();
  const e = voteHits.get(key);
  if (!e || e.resetAt < now) { voteHits.set(key, { count: 1, resetAt: now + VOTE_WINDOW_MS }); return false; }
  e.count += 1;
  return e.count > VOTE_MAX;
}

// Soft per-IP-per-poll cap. Shared networks (offices, colleges) legitimately
// produce many votes, so this is a generous soft cap (NOT a hard unique on IP).
const IP_VOTES_PER_POLL_CAP = 20;

/** Real client IP behind nginx (last x-forwarded-for entry is proxy-appended). */
function clientIp(req: { headers: Record<string, unknown>; ip?: string }): string {
  const xff = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xff) ? xff[xff.length - 1] : xff;
  if (typeof raw === "string" && raw.trim()) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.ip ?? "unknown";
}

/** Hash the IP before storing it — we never persist raw client IPs. */
function hashIp(ip: string): string {
  return createHash("sha256").update(`bcpl:poll-ip:${ip}`).digest("hex");
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLIC ROUTES
   ══════════════════════════════════════════════════════════════════════════ */

/** GET /api/polls — open + recently-closed polls. */
publicRouter.get("/", async (_req, res) => {
  try {
    await ensureTables();
    const list = rows<PollRow>(await db.execute(sql`
      SELECT * FROM fan_polls
      WHERE status IN ('open', 'closed')
      ORDER BY (status = 'open') DESC, updated_at DESC
      LIMIT 50`));
    const out = await Promise.all(list.map(async (p) => {
      const opts = await optionsWithCounts(p.id);
      return {
        ...pollApi(p),
        votingOpen: isVotingOpen(p),
        ...publicOptions(opts, resultsVisible(p)),
      };
    }));
    res.json({ polls: out });
  } catch (e) {
    logger.error({ err: e }, "polls list failed");
    res.status(500).json({ error: "Could not load polls" });
  }
});

/** GET /api/polls/:slug — one poll by slug. */
publicRouter.get("/:slug", async (req, res) => {
  try {
    await ensureTables();
    const slug = String(req.params.slug);
    const [p] = rows<PollRow>(await db.execute(sql`SELECT * FROM fan_polls WHERE slug = ${slug}`));
    if (!p || p.status === "draft") return void res.status(404).json({ error: "Poll not found" });
    const opts = await optionsWithCounts(p.id);
    res.json({
      poll: {
        ...pollApi(p),
        votingOpen: isVotingOpen(p),
        ...publicOptions(opts, resultsVisible(p)),
      },
    });
  } catch (e) {
    logger.error({ err: e }, "poll get failed");
    res.status(500).json({ error: "Could not load poll" });
  }
});

/** POST /api/polls/:id/vote — anonymous-friendly. One vote per (poll, voter):
 *  voter = the logged-in player if a valid Bearer token is present, else the
 *  client-generated persistent deviceId. Body: { optionId, deviceId? }. */
publicRouter.post("/:id/vote", optionalAuth, async (req: AuthRequest, res) => {
  const parsed = z.object({
    optionId: z.string().uuid(),
    deviceId: z.string().uuid().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "optionId (uuid) is required" });
  const optionId = parsed.data.optionId;

  // Prefer the authed player; otherwise fall back to the anonymous device id.
  const userId = req.user?.userId ?? null;
  const deviceId = parsed.data.deviceId ?? null;
  if (!userId && !deviceId) {
    return void res.status(400).json({ error: "deviceId (uuid) is required to vote as a guest" });
  }
  const voterKey = userId ? `user:${userId}` : `device:${deviceId}`;
  const ipHash = hashIp(clientIp(req));

  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Poll not found" });

    // Short-window spam guard, keyed by IP + device/voter (not userId).
    if (voteRateLimited(`${ipHash}:${voterKey}`)) {
      return void res.status(429).json({ error: "You're voting too fast — please slow down." });
    }

    const out = await db.transaction(async (tx) => {
      const [p] = rows<PollRow>(await tx.execute(sql`SELECT * FROM fan_polls WHERE id = ${id} FOR UPDATE`));
      if (!p) return { code: 404 as const, errMsg: "Poll not found" };
      if (!isVotingOpen(p)) return { code: 400 as const, errMsg: "This poll is not open for voting right now." };
      const [opt] = rows<OptionRow>(await tx.execute(
        sql`SELECT * FROM fan_poll_options WHERE id = ${optionId} AND poll_id = ${id}`,
      ));
      if (!opt) return { code: 400 as const, errMsg: "That option does not belong to this poll." };
      // One vote per (poll, voter_key); friendly 409.
      const [existing] = rows<{ id: string }>(await tx.execute(
        sql`SELECT id FROM fan_poll_votes WHERE poll_id = ${id} AND voter_key = ${voterKey} FOR UPDATE`,
      ));
      if (existing) return { code: 409 as const, errMsg: "You've already voted in this poll." };
      // Soft per-IP-per-poll cap (shared networks allowed, but capped).
      const [{ n }] = rows<{ n: string }>(await tx.execute(
        sql`SELECT count(*) n FROM fan_poll_votes WHERE poll_id = ${id} AND ip_hash = ${ipHash}`,
      ));
      if (Number(n) >= IP_VOTES_PER_POLL_CAP) {
        return { code: 429 as const, errMsg: "बहुत सारे votes इस network से — please try later." };
      }
      await tx.execute(sql`
        INSERT INTO fan_poll_votes (poll_id, option_id, user_id, voter_key, ip_hash)
        VALUES (${id}, ${optionId}, ${userId}, ${voterKey}, ${ipHash})`);
      return { poll: p };
    });
    if ("errMsg" in out) return void res.status(out.code as number).json({ error: out.errMsg });

    // Echo the latest counts only if this poll shows them publicly.
    const opts = await optionsWithCounts(id);
    res.json({
      success: true,
      ...publicOptions(opts, resultsVisible(out.poll)),
    });
  } catch (e) {
    logger.error({ err: e }, "poll vote failed");
    res.status(500).json({ error: "Could not record your vote" });
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN ROUTES (CONTENT_TEAM or SUPER_ADMIN)
   ══════════════════════════════════════════════════════════════════════════ */
adminRouter.use(requireAdmin, requireRole("CONTENT_TEAM"));

const optionInput = z.object({
  label: z.string().trim().min(1).max(120),
  imageUrl: z.string().trim().url().max(600).nullish(),
  teamName: z.string().trim().max(80).nullish(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

const createPollSchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9-]*$/, "slug must be lowercase alphanumeric with dashes"),
  titleEn: z.string().trim().min(1).max(160),
  titleHi: z.string().trim().max(160).default(""),
  category: z.enum(POLL_CATEGORIES).default("custom"),
  status: z.enum(POLL_STATUSES).default("draft"),
  opensAt: z.string().datetime().nullish(),
  closesAt: z.string().datetime().nullish(),
  showLiveResults: z.boolean().default(true),
  options: z.array(optionInput).max(50).default([]),
});

/** POST /api/admin/polls — create a poll (+ options). */
adminRouter.post("/", async (req, res) => {
  const parsed = createPollSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    await ensureTables();
    const out = await db.transaction(async (tx) => {
      const [dup] = rows<{ id: string }>(await tx.execute(sql`SELECT id FROM fan_polls WHERE slug = ${d.slug}`));
      if (dup) return { errMsg: "A poll with that slug already exists" };
      const [p] = rows<PollRow>(await tx.execute(sql`
        INSERT INTO fan_polls (slug, title_en, title_hi, category, status, opens_at, closes_at, show_live_results)
        VALUES (${d.slug}, ${d.titleEn}, ${d.titleHi}, ${d.category}, ${d.status},
                ${d.opensAt ?? null}, ${d.closesAt ?? null}, ${d.showLiveResults})
        RETURNING *`));
      for (let i = 0; i < d.options.length; i++) {
        const o = d.options[i];
        await tx.execute(sql`
          INSERT INTO fan_poll_options (poll_id, label, image_url, team_name, sort_order)
          VALUES (${p.id}, ${o.label}, ${o.imageUrl ?? null}, ${o.teamName ?? null}, ${o.sortOrder ?? i})`);
      }
      return { poll: p };
    });
    if ("errMsg" in out) return void res.status(400).json({ error: out.errMsg });
    const opts = await optionsWithCounts(out.poll.id);
    res.json({ success: true, poll: pollApi(out.poll), options: opts.map(optionApi) });
  } catch (e) {
    logger.error({ err: e }, "poll create failed");
    res.status(500).json({ error: "Could not create poll" });
  }
});

/** GET /api/admin/polls — list all polls (any status). */
adminRouter.get("/", async (_req, res) => {
  try {
    await ensureTables();
    const list = rows<PollRow>(await db.execute(sql`SELECT * FROM fan_polls ORDER BY created_at DESC LIMIT 200`));
    const totals = rows<{ poll_id: string; n: string }>(await db.execute(
      sql`SELECT poll_id, count(*) n FROM fan_poll_votes GROUP BY poll_id`,
    ));
    const byPoll = new Map(totals.map(t => [t.poll_id, Number(t.n)]));
    res.json({ polls: list.map(p => ({ ...pollApi(p), totalVotes: byPoll.get(p.id) ?? 0 })) });
  } catch (e) {
    logger.error({ err: e }, "admin poll list failed");
    res.status(500).json({ error: "Could not load polls" });
  }
});

/** GET /api/admin/polls/:id — one poll with options + results. */
adminRouter.get("/:id", async (req, res) => {
  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Poll not found" });
    const [p] = rows<PollRow>(await db.execute(sql`SELECT * FROM fan_polls WHERE id = ${id}`));
    if (!p) return void res.status(404).json({ error: "Poll not found" });
    const opts = await optionsWithCounts(p.id);
    const total = opts.reduce((s, o) => s + o.votes, 0);
    res.json({
      poll: pollApi(p),
      totalVotes: total,
      options: opts.map(o => ({
        ...optionApi(o), votes: o.votes,
        percent: total > 0 ? Math.round((o.votes / total) * 1000) / 10 : 0,
      })),
    });
  } catch (e) {
    logger.error({ err: e }, "admin poll get failed");
    res.status(500).json({ error: "Could not load poll" });
  }
});

const patchPollSchema = z.object({
  titleEn: z.string().trim().min(1).max(160).optional(),
  titleHi: z.string().trim().max(160).optional(),
  category: z.enum(POLL_CATEGORIES).optional(),
  status: z.enum(POLL_STATUSES).optional(),
  opensAt: z.string().datetime().nullish(),
  closesAt: z.string().datetime().nullish(),
  showLiveResults: z.boolean().optional(),
}).refine(v => Object.keys(v).length > 0, "no fields to update");

/** PATCH /api/admin/polls/:id — edit fields / open|close. */
adminRouter.patch("/:id", async (req, res) => {
  const parsed = patchPollSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Poll not found" });
    const out = await db.transaction(async (tx) => {
      const [p] = rows<PollRow>(await tx.execute(sql`SELECT * FROM fan_polls WHERE id = ${id} FOR UPDATE`));
      if (!p) return null;
      const [updated] = rows<PollRow>(await tx.execute(sql`
        UPDATE fan_polls SET
          title_en = ${d.titleEn ?? p.title_en},
          title_hi = ${d.titleHi ?? p.title_hi},
          category = ${d.category ?? p.category},
          status = ${d.status ?? p.status},
          opens_at = ${d.opensAt === undefined ? p.opens_at : d.opensAt},
          closes_at = ${d.closesAt === undefined ? p.closes_at : d.closesAt},
          show_live_results = ${d.showLiveResults === undefined ? p.show_live_results : d.showLiveResults},
          updated_at = now()
        WHERE id = ${id} RETURNING *`));
      return updated;
    });
    if (!out) return void res.status(404).json({ error: "Poll not found" });
    res.json({ success: true, poll: pollApi(out) });
  } catch (e) {
    logger.error({ err: e }, "admin poll patch failed");
    res.status(500).json({ error: "Could not update poll" });
  }
});

/** DELETE /api/admin/polls/:id — delete a poll (options + votes cascade). */
adminRouter.delete("/:id", async (req, res) => {
  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Poll not found" });
    const out = await db.transaction(async (tx) => {
      const [p] = rows<PollRow>(await tx.execute(sql`SELECT * FROM fan_polls WHERE id = ${id} FOR UPDATE`));
      if (!p) return false;
      await tx.execute(sql`DELETE FROM fan_polls WHERE id = ${id}`);
      return true;
    });
    if (!out) return void res.status(404).json({ error: "Poll not found" });
    res.json({ success: true });
  } catch (e) {
    logger.error({ err: e }, "admin poll delete failed");
    res.status(500).json({ error: "Could not delete poll" });
  }
});

/** POST /api/admin/polls/:id/options — add an option. */
adminRouter.post("/:id/options", async (req, res) => {
  const parsed = optionInput.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const o = parsed.data;
  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Poll not found" });
    const out = await db.transaction(async (tx) => {
      const [p] = rows<PollRow>(await tx.execute(sql`SELECT id FROM fan_polls WHERE id = ${id} FOR UPDATE`));
      if (!p) return null;
      const [row] = rows<OptionRow>(await tx.execute(sql`
        INSERT INTO fan_poll_options (poll_id, label, image_url, team_name, sort_order)
        VALUES (${id}, ${o.label}, ${o.imageUrl ?? null}, ${o.teamName ?? null}, ${o.sortOrder ?? 0})
        RETURNING *`));
      return row;
    });
    if (!out) return void res.status(404).json({ error: "Poll not found" });
    res.json({ success: true, option: optionApi(out) });
  } catch (e) {
    logger.error({ err: e }, "admin option add failed");
    res.status(500).json({ error: "Could not add option" });
  }
});

const patchOptionSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  imageUrl: z.string().trim().url().max(600).nullish(),
  teamName: z.string().trim().max(80).nullish(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
}).refine(v => Object.keys(v).length > 0, "no fields to update");

/** PATCH /api/admin/polls/:id/options/:optId — edit an option. */
adminRouter.patch("/:id/options/:optId", async (req, res) => {
  const parsed = patchOptionSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const d = parsed.data;
  try {
    await ensureTables();
    const id = String(req.params.id), optId = String(req.params.optId);
    if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(optId)) {
      return void res.status(404).json({ error: "Option not found" });
    }
    const out = await db.transaction(async (tx) => {
      const [o] = rows<OptionRow>(await tx.execute(
        sql`SELECT * FROM fan_poll_options WHERE id = ${optId} AND poll_id = ${id} FOR UPDATE`,
      ));
      if (!o) return null;
      const [updated] = rows<OptionRow>(await tx.execute(sql`
        UPDATE fan_poll_options SET
          label = ${d.label ?? o.label},
          image_url = ${d.imageUrl === undefined ? o.image_url : d.imageUrl},
          team_name = ${d.teamName === undefined ? o.team_name : d.teamName},
          sort_order = ${d.sortOrder ?? o.sort_order}
        WHERE id = ${optId} RETURNING *`));
      return updated;
    });
    if (!out) return void res.status(404).json({ error: "Option not found" });
    res.json({ success: true, option: optionApi(out) });
  } catch (e) {
    logger.error({ err: e }, "admin option patch failed");
    res.status(500).json({ error: "Could not update option" });
  }
});

/** DELETE /api/admin/polls/:id/options/:optId — delete an option. */
adminRouter.delete("/:id/options/:optId", async (req, res) => {
  try {
    await ensureTables();
    const id = String(req.params.id), optId = String(req.params.optId);
    if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(optId)) {
      return void res.status(404).json({ error: "Option not found" });
    }
    const out = await db.transaction(async (tx) => {
      const [o] = rows<OptionRow>(await tx.execute(
        sql`SELECT * FROM fan_poll_options WHERE id = ${optId} AND poll_id = ${id} FOR UPDATE`,
      ));
      if (!o) return false;
      await tx.execute(sql`DELETE FROM fan_poll_options WHERE id = ${optId}`);
      return true;
    });
    if (!out) return void res.status(404).json({ error: "Option not found" });
    res.json({ success: true });
  } catch (e) {
    logger.error({ err: e }, "admin option delete failed");
    res.status(500).json({ error: "Could not delete option" });
  }
});

/** GET /api/admin/polls/:id/results — counts, percentages, total votes. */
adminRouter.get("/:id/results", async (req, res) => {
  try {
    await ensureTables();
    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: "Poll not found" });
    const [p] = rows<PollRow>(await db.execute(sql`SELECT * FROM fan_polls WHERE id = ${id}`));
    if (!p) return void res.status(404).json({ error: "Poll not found" });
    const opts = await optionsWithCounts(p.id);
    const total = opts.reduce((s, o) => s + o.votes, 0);
    res.json({
      pollId: p.id, slug: p.slug, status: p.status, totalVotes: total,
      results: opts.map(o => ({
        optionId: o.id, label: o.label, teamName: o.team_name,
        votes: o.votes, percent: total > 0 ? Math.round((o.votes / total) * 1000) / 10 : 0,
      })),
    });
  } catch (e) {
    logger.error({ err: e }, "admin poll results failed");
    res.status(500).json({ error: "Could not load results" });
  }
});

export { publicRouter as fanPollsRouter, adminRouter as adminFanPollsRouter };

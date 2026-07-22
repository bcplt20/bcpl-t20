/**
 * Franchise team + squad routes
 *
 * Public:
 *   GET  /api/teams                – list teams (with player counts)
 *   GET  /api/teams/:slug          – team detail + full squad (slug or uuid)
 *
 * Admin (x-bcpl-admin header):
 *   POST   /api/teams/admin/teams               – create team
 *   PUT    /api/teams/admin/teams/:id           – update team info
 *   DELETE /api/teams/admin/teams/:id           – delete team (players cascade)
 *   POST   /api/teams/admin/teams/:id/players   – add squad player
 *   PUT    /api/teams/admin/players/:playerId   – update squad player
 *   DELETE /api/teams/admin/players/:playerId   – remove squad player
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { teamsTable, teamPlayersTable } from "@workspace/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { z } from "zod";

const router = Router();

/* ─── Bootstrap: tables + seed the 10 real Season-5 franchises ── */

const SEED_TEAMS: { slug: string; name: string; city: string; color: string; secondColor: string }[] = [
  { slug: "rajasthan-scorchers", name: "Rajasthan Scorchers", city: "Jaipur",     color: "#E97B6B", secondColor: "#F5A623" },
  { slug: "punjab-warriors",     name: "Punjab Warriors",     city: "Chandigarh", color: "#DC2626", secondColor: "#1D4ED8" },
  { slug: "kolkata-tigers",      name: "Kolkata Tigers",      city: "Kolkata",    color: "#F97316", secondColor: "#7C3AED" },
  { slug: "lucknow-nawabs",      name: "Lucknow Nawabs",      city: "Lucknow",    color: "#F59E0B", secondColor: "#065F46" },
  { slug: "mumbai-mavericks",    name: "Mumbai Mavericks",    city: "Mumbai",     color: "#3B82F6", secondColor: "#F59E0B" },
  { slug: "hyderabad-hawks",     name: "Hyderabad Hawks",     city: "Hyderabad",  color: "#16A34A", secondColor: "#EF4444" },
  { slug: "delhi-suryas",        name: "Delhi Suryas",        city: "Delhi",      color: "#6366F1", secondColor: "#F97316" },
  { slug: "chennai-thalaivas",   name: "Chennai Thalaivas",   city: "Chennai",    color: "#2563EB", secondColor: "#F59E0B" },
  { slug: "ahmedabad-lions",     name: "Ahmedabad Lions",     city: "Ahmedabad",  color: "#B91C1C", secondColor: "#F59E0B" },
  { slug: "bengaluru-rockets",   name: "Bengaluru Rockets",   city: "Bengaluru",  color: "#EF4444", secondColor: "#1D4ED8" },
];

export async function ensureTeams(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS teams (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      season        integer NOT NULL DEFAULT 5,
      slug          varchar(60) NOT NULL UNIQUE,
      name          varchar(80) NOT NULL,
      city          varchar(80) NOT NULL DEFAULT '',
      color         varchar(9)  NOT NULL DEFAULT '#FF6B00',
      second_color  varchar(9)  NOT NULL DEFAULT '#F59E0B',
      logo_url      text        NOT NULL DEFAULT '',
      captain       varchar(100) NOT NULL DEFAULT '',
      coach         varchar(100) NOT NULL DEFAULT '',
      owner         varchar(120) NOT NULL DEFAULT '',
      home_ground   varchar(120) NOT NULL DEFAULT '',
      titles_won    integer NOT NULL DEFAULT 0,
      created_at    timestamptz NOT NULL DEFAULT now(),
      updated_at    timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS team_players (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id         uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      name            varchar(100) NOT NULL,
      role            varchar(20) NOT NULL DEFAULT 'Batsman',
      age             integer,
      state           varchar(80) NOT NULL DEFAULT '',
      photo_url       text NOT NULL DEFAULT '',
      batting_style   varchar(40) NOT NULL DEFAULT '',
      bowling_style   varchar(40) NOT NULL DEFAULT '',
      jersey_no       varchar(6)  NOT NULL DEFAULT '',
      nationality     varchar(20) NOT NULL DEFAULT 'Indian',
      is_captain      boolean NOT NULL DEFAULT false,
      is_vice_captain boolean NOT NULL DEFAULT false,
      auction_price   varchar(20) NOT NULL DEFAULT '',
      stats           json NOT NULL DEFAULT '{}'::json,
      created_at      timestamptz NOT NULL DEFAULT now(),
      updated_at      timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS team_players_team_id_idx ON team_players (team_id)`);

  const existing = await db.select({ n: sql<number>`count(*)` }).from(teamsTable);
  if (Number(existing[0]?.n ?? 0) === 0) {
    await db.insert(teamsTable).values(
      SEED_TEAMS.map(t => ({
        ...t,
        season: 5,
        logoUrl: `bcpl-assets/logos/${t.slug.replace(/-/g, "_")}.png`,
      })),
    );
    console.log("[teams] seeded 10 Season-5 franchises");
  }
}

/* ─── Validation ──────────────────────────────────────── */

const teamBody = z.object({
  name:        z.string().trim().min(1).max(80),
  city:        z.string().trim().max(80).optional(),
  color:       z.string().trim().max(9).optional(),
  secondColor: z.string().trim().max(9).optional(),
  logoUrl:     z.string().optional(),
  captain:     z.string().trim().max(100).optional(),
  coach:       z.string().trim().max(100).optional(),
  owner:       z.string().trim().max(120).optional(),
  homeGround:  z.string().trim().max(120).optional(),
  titlesWon:   z.coerce.number().int().min(0).optional(),
  season:      z.coerce.number().int().optional(),
});

const playerBody = z.object({
  name:          z.string().trim().min(1).max(100),
  role:          z.enum(["Batsman", "Bowler", "All-rounder", "Wicket-keeper"]).optional(),
  age:           z.coerce.number().int().min(10).max(70).nullable().optional(),
  state:         z.string().trim().max(80).optional(),
  photoUrl:      z.string().optional(),
  battingStyle:  z.string().trim().max(40).optional(),
  bowlingStyle:  z.string().trim().max(40).optional(),
  jerseyNo:      z.string().trim().max(6).optional(),
  nationality:   z.string().trim().max(20).optional(),
  isCaptain:     z.boolean().optional(),
  isViceCaptain: z.boolean().optional(),
  auctionPrice:  z.string().trim().regex(/^\d*$/, "auctionPrice must be digits only (rupees), e.g. 500000").max(12).optional(),
  stats:         z.record(z.any()).optional(),
});

const slugify = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ─── Admin routes (registered before /:slug catch-all) ── */

router.post("/admin/teams", requireAdmin, async (req, res) => {
  try {
    const body = teamBody.parse(req.body);
    const slug = slugify(body.name);
    const dup = await db.select({ id: teamsTable.id }).from(teamsTable).where(eq(teamsTable.slug, slug));
    if (dup.length) return res.status(409).json({ error: "A team with this name already exists" });
    const [team] = await db.insert(teamsTable).values({ ...body, slug, season: body.season ?? 5 }).returning();
    return res.json({ success: true, team });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || "Invalid input" });
    console.error("[teams] create failed:", e);
    return res.status(500).json({ error: "Failed to create team" });
  }
});

router.put("/admin/teams/:id", requireAdmin, async (req, res) => {
  try {
    const body = teamBody.partial().parse(req.body);
    const [team] = await db.update(teamsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(teamsTable.id, String(req.params.id)))
      .returning();
    if (!team) return res.status(404).json({ error: "Team not found" });
    return res.json({ success: true, team });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || "Invalid input" });
    console.error("[teams] update failed:", e);
    return res.status(500).json({ error: "Failed to update team" });
  }
});

router.delete("/admin/teams/:id", requireAdmin, async (req, res) => {
  try {
    const [team] = await db.delete(teamsTable).where(eq(teamsTable.id, String(req.params.id))).returning();
    if (!team) return res.status(404).json({ error: "Team not found" });
    return res.json({ success: true });
  } catch (e) {
    console.error("[teams] delete failed:", e);
    return res.status(500).json({ error: "Failed to delete team" });
  }
});

router.post("/admin/teams/:id/players", requireAdmin, async (req, res) => {
  try {
    const body = playerBody.parse(req.body);
    // A registration can only be sold into one squad — guard against double-sell
    const srcRegId = (body.stats as Record<string, unknown> | undefined)?.regId;
    if (typeof srcRegId === "string" && srcRegId) {
      const dup = await db
        .select({ id: teamPlayersTable.id })
        .from(teamPlayersTable)
        .where(sql`${teamPlayersTable.stats} ->> 'regId' = ${srcRegId}`);
      if (dup.length > 0) {
        res.status(409).json({ error: "This player is already in a squad (sold earlier). Refresh the auction pool." });
        return;
      }
    }
    const [team] = await db.select({ id: teamsTable.id }).from(teamsTable).where(eq(teamsTable.id, String(req.params.id)));
    if (!team) return res.status(404).json({ error: "Team not found" });
    const [player] = await db.insert(teamPlayersTable).values({ ...body, teamId: team.id }).returning();
    return res.json({ success: true, player });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || "Invalid input" });
    console.error("[teams] add player failed:", e);
    return res.status(500).json({ error: "Failed to add player" });
  }
});

router.put("/admin/players/:playerId", requireAdmin, async (req, res) => {
  try {
    const body = playerBody.partial().parse(req.body);
    const [player] = await db.update(teamPlayersTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(teamPlayersTable.id, String(req.params.playerId)))
      .returning();
    if (!player) return res.status(404).json({ error: "Player not found" });
    return res.json({ success: true, player });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || "Invalid input" });
    console.error("[teams] update player failed:", e);
    return res.status(500).json({ error: "Failed to update player" });
  }
});

router.delete("/admin/players/:playerId", requireAdmin, async (req, res) => {
  try {
    const [player] = await db.delete(teamPlayersTable).where(eq(teamPlayersTable.id, String(req.params.playerId))).returning();
    if (!player) return res.status(404).json({ error: "Player not found" });
    return res.json({ success: true });
  } catch (e) {
    console.error("[teams] delete player failed:", e);
    return res.status(500).json({ error: "Failed to remove player" });
  }
});

/* ─── Public routes ───────────────────────────────────── */

router.get("/", async (req, res) => {
  try {
    const season = Number(req.query.season) || 5;
    const teams = await db.select().from(teamsTable)
      .where(eq(teamsTable.season, season))
      .orderBy(asc(teamsTable.name));
    const counts = await db.select({
      teamId: teamPlayersTable.teamId,
      n: sql<number>`count(*)`,
    }).from(teamPlayersTable).groupBy(teamPlayersTable.teamId);
    const countMap = new Map(counts.map(c => [c.teamId, Number(c.n)]));
    return res.json({ teams: teams.map(t => ({ ...t, playerCount: countMap.get(t.id) ?? 0 })) });
  } catch (e) {
    console.error("[teams] list failed:", e);
    return res.status(500).json({ error: "Failed to load teams" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const key = String(req.params.slug);
    const where = UUID_RE.test(key) ? eq(teamsTable.id, key) : eq(teamsTable.slug, key);
    const [team] = await db.select().from(teamsTable).where(where);
    if (!team) return res.status(404).json({ error: "Team not found" });
    const players = await db.select().from(teamPlayersTable)
      .where(eq(teamPlayersTable.teamId, team.id))
      .orderBy(asc(teamPlayersTable.createdAt));
    return res.json({ team, players });
  } catch (e) {
    console.error("[teams] detail failed:", e);
    return res.status(500).json({ error: "Failed to load team" });
  }
});

export default router;

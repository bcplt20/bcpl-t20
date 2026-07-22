import { Router } from "express";
import { db } from "@workspace/db";
import {
  referralCodesTable,
  referralSignupsTable,
  referralRewardTiersTable,
  referralRewardGrantsTable,
  usersTable,
  registrationsTable,
  phase1PaymentsTable,
} from "@workspace/db/schema";
import { eq, and, asc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/adminAuth";
import { PAID_STATUSES, isUniqueViolation } from "./marketing";
import { logger } from "../lib/logger";

/**
 * Player referral program (builds on the marketing referral plumbing):
 *  - every Phase-1-PAID player gets a personal referral_codes row (kind='player'),
 *    created lazily on first /me call — covers old players automatically
 *  - clicks / signups / paid attribution reuse /api/marketing/click + /attribute
 *  - "paid" is always COMPUTED from phase1_payments (never stored), so the
 *    verify flow, the webhook flow and any future reconciliation all count
 *  - admin-editable reward ladder + manual "reward given" bookkeeping
 *
 * Integrity guardrail: rewards are money/merch/recognition ONLY. Nothing in
 * this router touches selection, trials or scoring — and it must stay that way.
 */

const router = Router();

/* ────────────────────────────────────────────────────────────────────────────
 * Startup migration (idempotent — called from index.ts start loop AFTER
 * ensureMarketingTables, which creates referral_codes)
 * ──────────────────────────────────────────────────────────────────────────── */

/** Seeded suggestions only — every threshold & reward is admin-editable.
 *  Ladder starts at 1 so the first reward feels reachable; 11 = "Team XI". */
const DEFAULT_TIERS: Array<{ threshold: number; reward: string }> = [
  { threshold: 1,    reward: "🎖️ 'BCPL Recruiter' shoutout on official BCPL socials" },
  { threshold: 5,    reward: "🧢 Official BCPL Season 5 cap" },
  { threshold: 11,   reward: "👕 Exclusive 'Team XI' BCPL jersey" },
  { threshold: 25,   reward: "🏏 Full BCPL kit — cap, jersey & kitbag" },
  { threshold: 50,   reward: "💰 ₹500 cash reward" },
  { threshold: 100,  reward: "💰 ₹1,500 cash + match-day shoutout" },
  { threshold: 200,  reward: "💰 ₹4,000 cash + VIP match-day felicitation" },
  { threshold: 1000, reward: "🏆 ₹25,000 cash + season-topper trophy on finals day" },
];

export async function ensureReferralProgramTables(): Promise<void> {
  await db.execute(
    sql`ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES users(id)`,
  );
  await db.execute(sql`CREATE TABLE IF NOT EXISTS referral_reward_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    threshold integer NOT NULL UNIQUE,
    reward varchar(200) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS referral_reward_grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    threshold integer NOT NULL,
    reward varchar(200) NOT NULL,
    given_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(code, threshold)
  )`);
  const [cnt] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(referralRewardTiersTable);
  if ((cnt?.n ?? 0) === 0) {
    await db.insert(referralRewardTiersTable).values(DEFAULT_TIERS);
    logger.info("seeded default referral reward ladder");
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Shared helpers
 * ──────────────────────────────────────────────────────────────────────────── */

type CodeCounts = { joined: number; paid: number };

/** joined/paid per referral code. paid = distinct registrations with a
 *  successful Phase-1 payment (free OTP signups never count for rewards). */
async function referralCounts(codes: string[]): Promise<Map<string, CodeCounts>> {
  const map = new Map<string, CodeCounts>();
  if (codes.length === 0) return map;
  for (const c of codes) map.set(c, { joined: 0, paid: 0 });

  const joined = await db
    .select({ code: referralSignupsTable.code, n: sql<number>`count(*)::int` })
    .from(referralSignupsTable)
    .where(inArray(referralSignupsTable.code, codes))
    .groupBy(referralSignupsTable.code);
  const paid = await db
    .select({
      code: referralSignupsTable.code,
      n: sql<number>`count(distinct ${referralSignupsTable.registrationId})::int`,
    })
    .from(referralSignupsTable)
    .innerJoin(
      phase1PaymentsTable,
      eq(phase1PaymentsTable.registrationId, referralSignupsTable.registrationId),
    )
    .where(
      and(
        inArray(referralSignupsTable.code, codes),
        inArray(phase1PaymentsTable.status, PAID_STATUSES),
      ),
    )
    .groupBy(referralSignupsTable.code);

  for (const r of joined) map.get(r.code)!.joined = r.n;
  for (const r of paid) map.get(r.code)!.paid = r.n;
  return map;
}

/** Unambiguous alphabet (no I/L/O/0/1) for the random code suffix. */
const SUFFIX_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Get or lazily create the player's personal code. Returns null only if
 *  6 generation attempts all collided (practically impossible). */
async function ensurePlayerCode(userId: string, name: string): Promise<string | null> {
  const [existing] = await db
    .select({ code: referralCodesTable.code })
    .from(referralCodesTable)
    .where(eq(referralCodesTable.userId, userId))
    .limit(1);
  if (existing) return existing.code;

  const base = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8) || "PLAYER";
  for (let attempt = 0; attempt < 6; attempt++) {
    const len = attempt === 0 ? 3 : 4;
    let rand = "";
    for (let i = 0; i < len; i++) {
      rand += SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
    }
    const code = `${base}${rand}`.slice(0, 30);
    try {
      const [row] = await db
        .insert(referralCodesTable)
        .values({ code, name, kind: "player", platform: "Player", userId })
        .returning({ code: referralCodesTable.code });
      logger.info({ userId, code: row!.code }, "player referral code created");
      return row!.code;
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      // Either the code collided (retry with a new suffix) or a parallel
      // request already created this user's code (return it).
      const [mine] = await db
        .select({ code: referralCodesTable.code })
        .from(referralCodesTable)
        .where(eq(referralCodesTable.userId, userId))
        .limit(1);
      if (mine) return mine.code;
    }
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Player: my referral card  GET /api/referral/me
 * ──────────────────────────────────────────────────────────────────────────── */
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return void res.status(404).json({ error: "User not found" });

    // Eligible = has a successful Phase-1 payment (works for old players too —
    // the code is created right here on first dashboard load, not at pay time).
    const [reg] = await db
      .select({ id: registrationsTable.id })
      .from(registrationsTable)
      .where(eq(registrationsTable.userId, userId))
      .limit(1);
    let eligible = false;
    if (reg) {
      const [p] = await db
        .select({ id: phase1PaymentsTable.id })
        .from(phase1PaymentsTable)
        .where(
          and(
            eq(phase1PaymentsTable.registrationId, reg.id),
            inArray(phase1PaymentsTable.status, PAID_STATUSES),
          ),
        )
        .limit(1);
      eligible = Boolean(p);
    }
    if (!eligible) return void res.json({ eligible: false });

    const myCode = await ensurePlayerCode(userId, user.name);
    if (!myCode) {
      return void res.status(500).json({ error: "Could not create your referral code — please try again" });
    }

    // All player codes → my counts, my rank, top-10 leaderboard.
    const players = await db
      .select({ code: referralCodesTable.code, name: referralCodesTable.name })
      .from(referralCodesTable)
      .where(eq(referralCodesTable.kind, "player"));
    const counts = await referralCounts(players.map((p) => p.code));
    const ranked = players
      .map((p) => ({ name: p.name, code: p.code, ...(counts.get(p.code) ?? { joined: 0, paid: 0 }) }))
      .filter((r) => r.paid > 0)
      .sort((a, b) => b.paid - a.paid || b.joined - a.joined || a.code.localeCompare(b.code));
    const myIndex = ranked.findIndex((r) => r.code === myCode);

    const tiers = await db
      .select()
      .from(referralRewardTiersTable)
      .orderBy(asc(referralRewardTiersTable.threshold));
    const grants = await db
      .select({ threshold: referralRewardGrantsTable.threshold })
      .from(referralRewardGrantsTable)
      .where(eq(referralRewardGrantsTable.code, myCode));
    const givenSet = new Set(grants.map((g) => g.threshold));
    const mine = counts.get(myCode) ?? { joined: 0, paid: 0 };

    res.json({
      eligible: true,
      code: myCode,
      link: `https://bcplt20.com/r/${myCode}`,
      joined: mine.joined,
      paid: mine.paid,
      rank: myIndex === -1 ? null : myIndex + 1,
      totalReferrers: ranked.length,
      tiers: tiers.map((t) => ({
        threshold: t.threshold,
        reward: t.reward,
        reached: mine.paid >= t.threshold,
        rewardGiven: givenSet.has(t.threshold),
      })),
      leaderboard: ranked.slice(0, 10).map((r, i) => ({
        rank: i + 1,
        name: r.name,
        paid: r.paid,
        isMe: r.code === myCode,
      })),
    });
  } catch (e) {
    logger.error({ err: e }, "referral /me failed");
    res.status(500).json({ error: "Failed to load referral info" });
  }
});

/* ────────────────────────────────────────────────────────────────────────────
 * Admin: reward ladder CRUD
 * ──────────────────────────────────────────────────────────────────────────── */
const tierBody = z.object({
  threshold: z.coerce.number().int().min(1).max(100000),
  reward: z.string().trim().min(1).max(200),
});

router.get("/admin/tiers", requireAdmin, async (_req, res) => {
  const tiers = await db
    .select()
    .from(referralRewardTiersTable)
    .orderBy(asc(referralRewardTiersTable.threshold));
  res.json({ tiers });
});

router.post("/admin/tiers", requireAdmin, async (req, res) => {
  const parsed = tierBody.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid tier" });
  }
  try {
    const [row] = await db.insert(referralRewardTiersTable).values(parsed.data).returning();
    res.json({ success: true, tier: row });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return void res.status(409).json({ error: `A tier at ${parsed.data.threshold} referrals already exists` });
    }
    logger.error({ err: e }, "tier create failed");
    res.status(500).json({ error: "Failed to create tier" });
  }
});

router.put("/admin/tiers/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const parsed = tierBody.partial().safeParse(req.body);
  if (!parsed.success || (parsed.data.threshold === undefined && parsed.data.reward === undefined)) {
    return void res.status(400).json({ error: "Nothing to update" });
  }
  try {
    const [row] = await db
      .update(referralRewardTiersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(referralRewardTiersTable.id, id))
      .returning();
    if (!row) return void res.status(404).json({ error: "Tier not found" });
    res.json({ success: true, tier: row });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return void res.status(409).json({ error: "A tier at that referral count already exists" });
    }
    logger.error({ err: e }, "tier update failed");
    res.status(500).json({ error: "Failed to update tier" });
  }
});

router.delete("/admin/tiers/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const deleted = await db
    .delete(referralRewardTiersTable)
    .where(eq(referralRewardTiersTable.id, id))
    .returning({ id: referralRewardTiersTable.id });
  if (deleted.length === 0) return void res.status(404).json({ error: "Tier not found" });
  res.json({ success: true });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Admin: full referrer leaderboard + reward bookkeeping
 * ──────────────────────────────────────────────────────────────────────────── */
router.get("/admin/overview", requireAdmin, async (_req, res) => {
  try {
    const players = await db
      .select({
        code: referralCodesTable.code,
        name: referralCodesTable.name,
        clicks: referralCodesTable.clicks,
        createdAt: referralCodesTable.createdAt,
        phone: usersTable.phone,
      })
      .from(referralCodesTable)
      .leftJoin(usersTable, eq(referralCodesTable.userId, usersTable.id))
      .where(eq(referralCodesTable.kind, "player"));

    const counts = await referralCounts(players.map((p) => p.code));
    const tiers = await db
      .select()
      .from(referralRewardTiersTable)
      .orderBy(asc(referralRewardTiersTable.threshold));
    const grants = await db.select().from(referralRewardGrantsTable);
    const grantsByCode = new Map<string, Map<number, string>>();
    for (const g of grants) {
      if (!grantsByCode.has(g.code)) grantsByCode.set(g.code, new Map());
      grantsByCode.get(g.code)!.set(g.threshold, g.reward);
    }
    const tierThresholds = new Set(tiers.map((t) => t.threshold));

    const rows = players
      .map((p) => {
        const c = counts.get(p.code) ?? { joined: 0, paid: 0 };
        const given = grantsByCode.get(p.code) ?? new Map<number, string>();
        const milestones = tiers
          .filter((t) => c.paid >= t.threshold)
          .map((t) => ({ threshold: t.threshold, reward: t.reward, given: given.has(t.threshold) }));
        // Grants made under an older ladder (tier since edited/deleted) stay
        // visible with the reward text snapshotted at grant time — history is
        // never silently lost when the admin reshapes the ladder.
        for (const [threshold, snapshotReward] of given) {
          if (!tierThresholds.has(threshold)) {
            milestones.push({ threshold, reward: snapshotReward + " (former tier)", given: true });
          }
        }
        milestones.sort((a, b) => a.threshold - b.threshold);
        return {
          code: p.code,
          name: p.name,
          phone: p.phone,
          clicks: p.clicks,
          createdAt: p.createdAt,
          joined: c.joined,
          paid: c.paid,
          milestones,
        };
      })
      .sort((a, b) => b.paid - a.paid || b.joined - a.joined || a.name.localeCompare(b.name));

    res.json({
      players: rows,
      totals: {
        referrers: rows.length,
        activeReferrers: rows.filter((r) => r.paid > 0).length,
        joined: rows.reduce((s, r) => s + r.joined, 0),
        paid: rows.reduce((s, r) => s + r.paid, 0),
        rewardsGiven: grants.length,
        rewardsDue: rows.reduce((s, r) => s + r.milestones.filter((m) => !m.given).length, 0),
      },
    });
  } catch (e) {
    logger.error({ err: e }, "referral overview failed");
    res.status(500).json({ error: "Failed to load referral overview" });
  }
});

const grantBody = z.object({
  code: z.string().trim().min(2).max(30),
  threshold: z.coerce.number().int().min(1),
});

/** Mark a milestone reward as physically handed out (idempotent). */
router.post("/admin/grants", requireAdmin, async (req, res) => {
  const parsed = grantBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "code and threshold required" });
  const code = parsed.data.code.toUpperCase();
  const threshold = parsed.data.threshold;

  const [rc] = await db
    .select({ id: referralCodesTable.id })
    .from(referralCodesTable)
    .where(and(eq(referralCodesTable.code, code), eq(referralCodesTable.kind, "player")))
    .limit(1);
  if (!rc) return void res.status(404).json({ error: "Player referral code not found" });

  const [tier] = await db
    .select()
    .from(referralRewardTiersTable)
    .where(eq(referralRewardTiersTable.threshold, threshold))
    .limit(1);
  if (!tier) return void res.status(404).json({ error: "No reward tier at that threshold" });

  try {
    await db.insert(referralRewardGrantsTable).values({ code, threshold, reward: tier.reward });
  } catch (e) {
    if (!isUniqueViolation(e)) {
      logger.error({ err: e }, "grant create failed");
      return void res.status(500).json({ error: "Failed to record reward" });
    }
    // Already marked given — idempotent success.
  }
  res.json({ success: true });
});

/** Un-mark a reward (recorded by mistake). */
router.delete("/admin/grants", requireAdmin, async (req, res) => {
  const parsed = grantBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "code and threshold required" });
  await db
    .delete(referralRewardGrantsTable)
    .where(
      and(
        eq(referralRewardGrantsTable.code, parsed.data.code.toUpperCase()),
        eq(referralRewardGrantsTable.threshold, parsed.data.threshold),
      ),
    );
  res.json({ success: true });
});

export default router;

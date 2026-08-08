/**
 * Growth surface — player-facing endpoints mounted under /api/user:
 *   POST   /api/user/push-token            register an Expo push token
 *   DELETE /api/user/push-token            unregister a token (logout)
 *   GET    /api/user/notifications         latest 50 inbox items + unread count
 *   POST   /api/user/notifications/read    mark all (or given ids) as read
 *   GET    /api/user/referral              Refer & Earn card (spec contract)
 *   GET    /api/user/badges               computed achievement badges
 *
 * Referral here is a THIN contract adapter over the existing referral program
 * (routes/referralProgram.ts + marketing attribution) — it does NOT duplicate
 * codes, attribution or reward bookkeeping.
 */
import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, registrationsTable, phase1PaymentsTable,
  referralCodesTable, referralSignupsTable, referralRewardGrantsTable,
  notificationsInboxTable,
} from "@workspace/db/schema";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/adminAuth";
import { registerPushToken, unregisterPushToken } from "../lib/push";
import { computeBadges } from "../lib/badges";
import { pickUserRegistration } from "./user";
import { logger } from "../lib/logger";

const router = Router();

const PAID = ["success", "paid"];
const QUALIFIED_FOR_ELIGIBLE = 3; // 3 qualified referrals → reward-eligible

/* ── Push tokens ─────────────────────────────────────────────────────────── */
const tokenBody = z.object({
  token: z.string().trim().min(10).max(200),
  platform: z.enum(["ios", "android"]).optional(),
});

router.post("/push-token", requireAuth, async (req: AuthRequest, res) => {
  const parsed = tokenBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "A valid Expo push token is required" });
  try {
    await registerPushToken(req.user!.userId, parsed.data.token, parsed.data.platform ?? "unknown");
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "push-token register failed");
    res.status(500).json({ error: "Could not save push token" });
  }
});

router.delete("/push-token", requireAuth, async (req: AuthRequest, res) => {
  const parsed = tokenBody.pick({ token: true }).safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "token is required" });
  try {
    await unregisterPushToken(req.user!.userId, parsed.data.token);
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "push-token unregister failed");
    res.status(500).json({ error: "Could not remove push token" });
  }
});

/* ── Notification inbox ──────────────────────────────────────────────────── */
router.get("/notifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const rows = await db.select({
      id: notificationsInboxTable.id,
      type: notificationsInboxTable.type,
      title: notificationsInboxTable.title,
      body: notificationsInboxTable.body,
      data: notificationsInboxTable.data,
      readAt: notificationsInboxTable.readAt,
      createdAt: notificationsInboxTable.createdAt,
    })
      .from(notificationsInboxTable)
      .where(eq(notificationsInboxTable.userId, userId))
      .orderBy(desc(notificationsInboxTable.createdAt))
      .limit(50);
    const [unread] = await db.select({ n: sql<number>`count(*)::int` })
      .from(notificationsInboxTable)
      .where(and(eq(notificationsInboxTable.userId, userId), isNull(notificationsInboxTable.readAt)));
    res.json({ notifications: rows, unreadCount: unread?.n ?? 0 });
  } catch (e) {
    logger.error({ err: e }, "notifications list failed");
    res.status(500).json({ error: "Could not load notifications" });
  }
});

const readBody = z.object({ ids: z.array(z.string().uuid()).max(200).optional() });
router.post("/notifications/read", requireAuth, async (req: AuthRequest, res) => {
  const parsed = readBody.safeParse(req.body ?? {});
  if (!parsed.success) return void res.status(400).json({ error: "Invalid ids" });
  try {
    const userId = req.user!.userId;
    const now = new Date();
    if (parsed.data.ids && parsed.data.ids.length) {
      await db.update(notificationsInboxTable)
        .set({ readAt: now })
        .where(and(
          eq(notificationsInboxTable.userId, userId),
          inArray(notificationsInboxTable.id, parsed.data.ids),
          isNull(notificationsInboxTable.readAt),
        ));
    } else {
      // Mark ALL unread as read.
      await db.update(notificationsInboxTable)
        .set({ readAt: now })
        .where(and(eq(notificationsInboxTable.userId, userId), isNull(notificationsInboxTable.readAt)));
    }
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "notifications read failed");
    res.status(500).json({ error: "Could not update notifications" });
  }
});

/* ── Refer & Earn (contract adapter) ─────────────────────────────────────── */
const SUFFIX_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Lazily create a BCPL-prefixed personal code (BCPL + 6 chars). Idempotent —
 *  returns the existing code if the user already has one (incl. codes created
 *  by the older referralProgram flow, whose codes are also unique per user). */
async function ensureReferralCode(userId: string, name: string): Promise<string | null> {
  const [existing] = await db.select({ code: referralCodesTable.code })
    .from(referralCodesTable)
    .where(eq(referralCodesTable.userId, userId))
    .limit(1);
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 6; attempt++) {
    let rand = "";
    for (let i = 0; i < 6; i++) rand += SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
    const code = `BCPL${rand}`;
    try {
      const [row] = await db.insert(referralCodesTable)
        .values({ code, name: name || "Player", kind: "player", platform: "Player", userId })
        .returning({ code: referralCodesTable.code });
      return row!.code;
    } catch (e) {
      // Collision on code OR on the per-user unique — re-read and return mine.
      const [mine] = await db.select({ code: referralCodesTable.code })
        .from(referralCodesTable)
        .where(eq(referralCodesTable.userId, userId))
        .limit(1);
      if (mine) return mine.code;
      if (attempt === 5) { logger.error({ err: e, userId }, "referral code create exhausted"); }
    }
  }
  return null;
}

router.get("/referral", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return void res.status(404).json({ error: "User not found" });

    const code = await ensureReferralCode(userId, user.name);
    if (!code) return void res.status(500).json({ error: "Could not create your referral code — please try again" });

    // totalRegistered = signups attributed to my code; totalPaid = distinct
    // registrations that reached a successful Phase-1 payment (= "qualified").
    const [reg] = await db.select({ n: sql<number>`count(*)::int` })
      .from(referralSignupsTable)
      .where(eq(referralSignupsTable.code, code));
    const [paid] = await db.select({ n: sql<number>`count(distinct ${referralSignupsTable.registrationId})::int` })
      .from(referralSignupsTable)
      .innerJoin(phase1PaymentsTable, eq(phase1PaymentsTable.registrationId, referralSignupsTable.registrationId))
      .where(and(eq(referralSignupsTable.code, code), inArray(phase1PaymentsTable.status, PAID)));

    const totalRegistered = reg?.n ?? 0;
    const totalPaid = paid?.n ?? 0;

    // rewardStatus: granted (admin recorded a grant) > eligible (>=3 qualified) > none.
    const grants = await db.select({ id: referralRewardGrantsTable.id })
      .from(referralRewardGrantsTable)
      .where(eq(referralRewardGrantsTable.code, code))
      .limit(1);
    let rewardStatus: "none" | "eligible" | "granted" = "none";
    if (grants.length) rewardStatus = "granted";
    else if (totalPaid >= QUALIFIED_FOR_ELIGIBLE) rewardStatus = "eligible";

    res.json({
      code,
      link: `https://bcplt20.com/r/${code}`,
      totalRegistered,
      totalPaid,
      rewardStatus,
      qualifiedNeeded: QUALIFIED_FOR_ELIGIBLE,
    });
  } catch (e) {
    logger.error({ err: e }, "referral card failed");
    res.status(500).json({ error: "Could not load referral info" });
  }
});

/* ── Badges (computed) ───────────────────────────────────────────────────── */
router.get("/badges", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const reg = await pickUserRegistration(userId);
    const badges = await computeBadges(
      userId,
      reg ? { id: reg.id, role: reg.role, classification: reg.classification } : null,
    );
    res.json({ badges });
  } catch (e) {
    logger.error({ err: e }, "badges failed");
    res.status(500).json({ error: "Could not load badges" });
  }
});

/* ── Admin: referrals overview  GET /api/admin/referrals ─────────────────────
 * Contract alias for the mobile/admin app. The rich reward-ladder bookkeeping
 * lives at /api/referral/admin/overview; this returns a compact per-referrer
 * table (code, name, phone, registered, qualified, rewardStatus).
 */
export const adminGrowthRouter = Router();

adminGrowthRouter.get("/referrals", requireAdmin, async (_req, res) => {
  try {
    const players = await db.select({
      code: referralCodesTable.code,
      name: referralCodesTable.name,
      clicks: referralCodesTable.clicks,
      createdAt: referralCodesTable.createdAt,
      phone: usersTable.phone,
    })
      .from(referralCodesTable)
      .leftJoin(usersTable, eq(referralCodesTable.userId, usersTable.id))
      .where(eq(referralCodesTable.kind, "player"));

    const codes = players.map((p) => p.code);
    const registered = new Map<string, number>();
    const qualified = new Map<string, number>();
    const granted = new Set<string>();
    for (const c of codes) { registered.set(c, 0); qualified.set(c, 0); }

    if (codes.length) {
      const regRows = await db.select({ code: referralSignupsTable.code, n: sql<number>`count(*)::int` })
        .from(referralSignupsTable)
        .where(inArray(referralSignupsTable.code, codes))
        .groupBy(referralSignupsTable.code);
      for (const r of regRows) registered.set(r.code, r.n);

      const qRows = await db.select({
        code: referralSignupsTable.code,
        n: sql<number>`count(distinct ${referralSignupsTable.registrationId})::int`,
      })
        .from(referralSignupsTable)
        .innerJoin(phase1PaymentsTable, eq(phase1PaymentsTable.registrationId, referralSignupsTable.registrationId))
        .where(and(inArray(referralSignupsTable.code, codes), inArray(phase1PaymentsTable.status, PAID)))
        .groupBy(referralSignupsTable.code);
      for (const r of qRows) qualified.set(r.code, r.n);

      const gRows = await db.select({ code: referralRewardGrantsTable.code })
        .from(referralRewardGrantsTable)
        .where(inArray(referralRewardGrantsTable.code, codes));
      for (const g of gRows) granted.add(g.code);
    }

    const rows = players.map((p) => {
      const totalPaid = qualified.get(p.code) ?? 0;
      const rewardStatus: "none" | "eligible" | "granted" =
        granted.has(p.code) ? "granted" : totalPaid >= QUALIFIED_FOR_ELIGIBLE ? "eligible" : "none";
      return {
        code: p.code,
        name: p.name,
        phone: p.phone,
        clicks: p.clicks,
        createdAt: p.createdAt,
        totalRegistered: registered.get(p.code) ?? 0,
        totalPaid,
        rewardStatus,
      };
    }).sort((a, b) => b.totalPaid - a.totalPaid || b.totalRegistered - a.totalRegistered || a.name.localeCompare(b.name));

    res.json({
      referrers: rows,
      totals: {
        referrers: rows.length,
        activeReferrers: rows.filter((r) => r.totalPaid > 0).length,
        totalRegistered: rows.reduce((s, r) => s + r.totalRegistered, 0),
        totalPaid: rows.reduce((s, r) => s + r.totalPaid, 0),
        eligible: rows.filter((r) => r.rewardStatus === "eligible").length,
        granted: rows.filter((r) => r.rewardStatus === "granted").length,
      },
    });
  } catch (e) {
    logger.error({ err: e }, "admin referrals failed");
    res.status(500).json({ error: "Could not load referrals" });
  }
});

export default router;

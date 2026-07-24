import { Router } from "express";
import { db } from "@workspace/db";
import {
  referralCodesTable,
  referralSignupsTable,
  marketingCampaignsTable,
  emailCampaignsTable,
  smsCampaignsTable,
  whatsappTemplatesTable,
  notificationLogsTable,
  usersTable,
  registrationsTable,
  phase1PaymentsTable,
  phase1VideosTable,
  phase2PaymentsTable,
} from "@workspace/db/schema";
import { eq, ne, and, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/adminAuth";
import { sendEmail } from "../lib/email";
import { sendWhatsApp } from "../lib/whatsapp";
import type { SendResult } from "../lib/notify";
import { logger } from "../lib/logger";

const router = Router();

/* Payment rows that count as money received (webhook writes "success",
 * older reconciliation wrote "paid"). Shared with the player referral
 * program so "paid referral" always means the same thing. */
export const PAID_STATUSES = ["success", "paid"];

/** Postgres unique_violation (23505) — drizzle wraps the pg error in .cause. */
export function isUniqueViolation(e: unknown): boolean {
  let cur = e as { code?: string; message?: string; cause?: unknown } | undefined;
  for (let depth = 0; cur && depth < 4; depth++) {
    if (cur.code === "23505") return true;
    if (String(cur.message ?? "").includes("duplicate key value")) return true;
    cur = cur.cause as typeof cur;
  }
  return false;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Startup migrations (idempotent — called from index.ts start loop)
 * ──────────────────────────────────────────────────────────────────────────── */
export async function ensureMarketingTables(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS referral_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    kind varchar(20) NOT NULL DEFAULT 'influencer',
    platform varchar(30) NOT NULL DEFAULT 'Other',
    city varchar(50),
    phone varchar(15),
    email varchar(255),
    commission_rate numeric(5,2) NOT NULL DEFAULT 0,
    paid_out numeric(12,2) NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    clicks integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS referral_signups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid NOT NULL UNIQUE REFERENCES registrations(id),
    code varchar(30) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(150) NOT NULL,
    channel varchar(40) NOT NULL DEFAULT 'Other',
    budget numeric(12,2) NOT NULL DEFAULT 0,
    spent numeric(12,2) NOT NULL DEFAULT 0,
    start_date varchar(20),
    end_date varchar(20),
    goal varchar(100),
    status varchar(20) NOT NULL DEFAULT 'active',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS email_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject varchar(300) NOT NULL,
    body text NOT NULL,
    audience json NOT NULL DEFAULT '{}',
    status varchar(20) NOT NULL DEFAULT 'sending',
    total_recipients integer NOT NULL DEFAULT 0,
    sent_count integer NOT NULL DEFAULT 0,
    failed_count integer NOT NULL DEFAULT 0,
    test_sent_to varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
  )`);
  // A campaign still 'sending' at boot means the process died mid-send.
  await db.execute(
    sql`UPDATE email_campaigns SET status = 'failed', completed_at = now() WHERE status = 'sending'`,
  );

  // Bulk SMS / WhatsApp campaigns (SMS/WhatsApp twin of email_campaigns).
  await db.execute(sql`CREATE TABLE IF NOT EXISTS sms_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel varchar(20) NOT NULL,
    name varchar(150) NOT NULL,
    body text NOT NULL DEFAULT '',
    flow_template_id varchar(120),
    template_name varchar(120),
    template_vars json NOT NULL DEFAULT '[]',
    audience json NOT NULL DEFAULT '{}',
    status varchar(20) NOT NULL DEFAULT 'sending',
    total_recipients integer NOT NULL DEFAULT 0,
    sent_count integer NOT NULL DEFAULT 0,
    failed_count integer NOT NULL DEFAULT 0,
    skipped_count integer NOT NULL DEFAULT 0,
    dry_run integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
  )`);
  await db.execute(
    sql`UPDATE sms_campaigns SET status = 'failed', completed_at = now() WHERE status = 'sending'`,
  );
  // Reserve-first dedupe for bulk sends leans on the same partial unique index
  // on notification_logs.dedupe_key that reminders / milestones use.
  await db.execute(sql`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS dedupe_key varchar(160)`);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS notification_logs_dedupe_uq
    ON notification_logs (dedupe_key) WHERE dedupe_key IS NOT NULL
  `);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Public: referral click tracking  POST /api/marketing/click/:code
 * ──────────────────────────────────────────────────────────────────────────── */
const CODE_RE = /^[A-Z0-9_-]{2,30}$/;

router.post("/click/:code", async (req, res) => {
  try {
    const code = String(req.params.code ?? "").trim().toUpperCase();
    if (CODE_RE.test(code)) {
      await db.execute(
        sql`UPDATE referral_codes SET clicks = clicks + 1, updated_at = now() WHERE code = ${code} AND active = true`,
      );
    }
  } catch (e) {
    logger.error({ err: e }, "referral click tracking failed");
  }
  // Always 200 — never leak whether a code exists.
  res.json({ ok: true });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Authed: attribute a registration to a referral code
 * POST /api/marketing/attribute  { registrationId, code }
 * ──────────────────────────────────────────────────────────────────────────── */
router.post("/attribute", requireAuth, async (req: AuthRequest, res) => {
  const parsed = z
    .object({ registrationId: z.string().uuid(), code: z.string().min(2).max(30) })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const code = parsed.data.code.trim().toUpperCase();

  // The registration must belong to the logged-in user (no attributing others' regs).
  const [reg] = await db
    .select({ id: registrationsTable.id })
    .from(registrationsTable)
    .where(
      and(
        eq(registrationsTable.id, parsed.data.registrationId),
        eq(registrationsTable.userId, req.user!.userId),
      ),
    );
  if (!reg) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  const [rc] = await db
    .select({ id: referralCodesTable.id, userId: referralCodesTable.userId })
    .from(referralCodesTable)
    .where(and(eq(referralCodesTable.code, code), eq(referralCodesTable.active, true)));
  if (!rc) {
    // Unknown/inactive code — ignore silently so the registration flow never breaks.
    res.json({ ok: true, attributed: false });
    return;
  }
  if (rc.userId && rc.userId === req.user!.userId) {
    // Self-referral guard: a player opening their own link can't refer themselves.
    res.json({ ok: true, attributed: false });
    return;
  }

  // First code wins (registration_id UNIQUE).
  await db.execute(
    sql`INSERT INTO referral_signups (registration_id, code) VALUES (${reg.id}, ${code}) ON CONFLICT (registration_id) DO NOTHING`,
  );
  res.json({ ok: true, attributed: true });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Admin: real funnel  GET /api/marketing/funnel
 * ──────────────────────────────────────────────────────────────────────────── */
router.get("/funnel", requireAdmin, async (_req, res) => {
  try {
    const count = sql<number>`count(*)::int`;
    const [
      [users],
      [regs],
      [p1Paid],
      [videos],
      [selected],
      [p2Paid],
      [p1Rev],
      [p2Rev],
      cityRows,
    ] = await Promise.all([
      db.select({ n: count }).from(usersTable),
      db.select({ n: count }).from(registrationsTable),
      db
        .select({ n: sql<number>`count(distinct registration_id)::int` })
        .from(phase1PaymentsTable)
        .where(inArray(phase1PaymentsTable.status, PAID_STATUSES)),
      db
        .select({ n: sql<number>`count(distinct registration_id)::int` })
        .from(phase1VideosTable),
      db
        .select({ n: count })
        .from(registrationsTable)
        .where(eq(registrationsTable.phase1Status, "selected")),
      db
        .select({ n: sql<number>`count(distinct registration_id)::int` })
        .from(phase2PaymentsTable)
        .where(inArray(phase2PaymentsTable.status, PAID_STATUSES)),
      db
        .select({ n: sql<number>`coalesce(sum(amount), 0)::float` })
        .from(phase1PaymentsTable)
        .where(inArray(phase1PaymentsTable.status, PAID_STATUSES)),
      db
        .select({ n: sql<number>`coalesce(sum(amount), 0)::float` })
        .from(phase2PaymentsTable)
        .where(inArray(phase2PaymentsTable.status, PAID_STATUSES)),
      db
        .selectDistinct({ city: registrationsTable.trialCity })
        .from(registrationsTable),
    ]);

    res.json({
      counts: {
        users: users?.n ?? 0,
        registrations: regs?.n ?? 0,
        phase1Paid: p1Paid?.n ?? 0,
        videoUploaded: videos?.n ?? 0,
        phase1Selected: selected?.n ?? 0,
        phase2Paid: p2Paid?.n ?? 0,
      },
      revenue: {
        phase1: p1Rev?.n ?? 0,
        phase2: p2Rev?.n ?? 0,
        total: (p1Rev?.n ?? 0) + (p2Rev?.n ?? 0),
      },
      cities: cityRows
        .map((r) => r.city)
        .filter((c): c is string => Boolean(c))
        .sort(),
    });
  } catch (e) {
    logger.error({ err: e }, "funnel query failed");
    res.status(500).json({ error: "Failed to load funnel" });
  }
});

/* ────────────────────────────────────────────────────────────────────────────
 * Admin: referral codes with real stats
 * ──────────────────────────────────────────────────────────────────────────── */
type CodeStats = {
  clicks: number;
  signups: number;
  paid: number;
  revenue: number;
  commission: number;
};

async function computeReferralStats() {
  // Player referral codes (kind='player') are managed by the player referral
  // program (/api/referral) — exclude them here so the marketing screens stay
  // agent/influencer-only and don't balloon as player codes grow.
  const codes = await db
    .select()
    .from(referralCodesTable)
    .where(ne(referralCodesTable.kind, "player"))
    .orderBy(desc(referralCodesTable.createdAt));
  const signups = await db
    .select({
      code: referralSignupsTable.code,
      registrationId: referralSignupsTable.registrationId,
    })
    .from(referralSignupsTable);

  const regIds = [...new Set(signups.map((s) => s.registrationId))];
  const [p1, p2] = regIds.length
    ? await Promise.all([
        db
          .select({
            registrationId: phase1PaymentsTable.registrationId,
            amount: phase1PaymentsTable.amount,
          })
          .from(phase1PaymentsTable)
          .where(
            and(
              inArray(phase1PaymentsTable.registrationId, regIds),
              inArray(phase1PaymentsTable.status, PAID_STATUSES),
            ),
          ),
        db
          .select({
            registrationId: phase2PaymentsTable.registrationId,
            amount: phase2PaymentsTable.amount,
          })
          .from(phase2PaymentsTable)
          .where(
            and(
              inArray(phase2PaymentsTable.registrationId, regIds),
              inArray(phase2PaymentsTable.status, PAID_STATUSES),
            ),
          ),
      ])
    : [[], []];

  const p1PaidRegs = new Set(p1.map((r) => r.registrationId));
  const revenueByReg = new Map<string, number>();
  for (const r of [...p1, ...p2]) {
    revenueByReg.set(r.registrationId, (revenueByReg.get(r.registrationId) ?? 0) + Number(r.amount));
  }

  return codes.map((c) => {
    const mine = signups.filter((s) => s.code === c.code);
    const paid = mine.filter((s) => p1PaidRegs.has(s.registrationId)).length;
    const revenue = mine.reduce((sum, s) => sum + (revenueByReg.get(s.registrationId) ?? 0), 0);
    const rate = Number(c.commissionRate);
    const stats: CodeStats = {
      clicks: c.clicks,
      signups: mine.length,
      paid,
      revenue,
      commission: Math.round(revenue * rate) / 100, // revenue × rate%
    };
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      kind: c.kind,
      platform: c.platform,
      city: c.city,
      phone: c.phone,
      email: c.email,
      commissionRate: rate,
      paidOut: Number(c.paidOut),
      active: c.active,
      createdAt: c.createdAt,
      ...stats,
    };
  });
}

router.get("/referrals", requireAdmin, async (_req, res) => {
  try {
    res.json({ referrals: await computeReferralStats() });
  } catch (e) {
    logger.error({ err: e }, "referral stats failed");
    res.status(500).json({ error: "Failed to load referrals" });
  }
});

const referralBody = z.object({
  name: z.string().trim().min(1).max(100),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{2,30}$/, "Code must be 2-30 letters/numbers")
    .optional(),
  kind: z.enum(["influencer", "agent"]).default("influencer"),
  platform: z.string().trim().max(30).default("Other"),
  city: z.string().trim().max(50).optional().nullable(),
  phone: z.string().trim().max(15).optional().nullable(),
  email: z.string().trim().max(255).optional().nullable(),
  commissionRate: z.coerce.number().min(0).max(100).default(0),
});

router.post("/referrals", requireAdmin, async (req, res) => {
  const parsed = referralBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" });
    return;
  }
  const d = parsed.data;
  let code = (d.code ?? "").toUpperCase();
  if (!code) {
    // Generate from the name: letters/digits only, then a numeric suffix if taken.
    const base =
      d.name.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12) || "REF";
    code = base;
    for (let i = 2; i <= 99; i++) {
      const [hit] = await db
        .select({ id: referralCodesTable.id })
        .from(referralCodesTable)
        .where(eq(referralCodesTable.code, code));
      if (!hit) break;
      code = `${base}${i}`;
    }
  }
  try {
    const [row] = await db
      .insert(referralCodesTable)
      .values({
        code,
        name: d.name,
        kind: d.kind,
        platform: d.platform || "Other",
        city: d.city || null,
        phone: d.phone || null,
        email: d.email || null,
        commissionRate: String(d.commissionRate),
      })
      .returning();
    res.json({ success: true, referral: row });
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      res.status(409).json({ error: `Code "${code}" already exists` });
      return;
    }
    logger.error({ err: e }, "referral create failed");
    res.status(500).json({ error: "Failed to create referral code" });
  }
});

router.put("/referrals/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const parsed = referralBody
    .partial()
    .extend({
      active: z.boolean().optional(),
      paidOut: z.coerce.number().min(0).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" });
    return;
  }
  const [existingRc] = await db
    .select({ kind: referralCodesTable.kind })
    .from(referralCodesTable)
    .where(eq(referralCodesTable.id, id))
    .limit(1);
  if (!existingRc) {
    res.status(404).json({ error: "Referral code not found" });
    return;
  }
  if (existingRc.kind === "player") {
    res.status(400).json({ error: "Player referral codes are managed in Agents & Affiliates → Player Referrals" });
    return;
  }
  const d = parsed.data;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (d.name !== undefined) patch.name = d.name;
  if (d.platform !== undefined) patch.platform = d.platform || "Other";
  if (d.city !== undefined) patch.city = d.city || null;
  if (d.phone !== undefined) patch.phone = d.phone || null;
  if (d.email !== undefined) patch.email = d.email || null;
  if (d.commissionRate !== undefined) patch.commissionRate = String(d.commissionRate);
  if (d.paidOut !== undefined) patch.paidOut = String(d.paidOut);
  if (d.active !== undefined) patch.active = d.active;
  // NOTE: code and kind are immutable after creation (links may be in the wild).

  const [row] = await db
    .update(referralCodesTable)
    .set(patch)
    .where(eq(referralCodesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Referral code not found" });
    return;
  }
  res.json({ success: true, referral: row });
});

router.delete("/referrals/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const [rc] = await db
    .select({ code: referralCodesTable.code, kind: referralCodesTable.kind })
    .from(referralCodesTable)
    .where(eq(referralCodesTable.id, id));
  if (!rc) {
    res.status(404).json({ error: "Referral code not found" });
    return;
  }
  if (rc.kind === "player") {
    res.status(400).json({ error: "Player referral codes are managed in Agents & Affiliates → Player Referrals" });
    return;
  }
  const [cnt] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(referralSignupsTable)
    .where(eq(referralSignupsTable.code, rc.code));
  if ((cnt?.n ?? 0) > 0) {
    res.status(409).json({
      error: `"${rc.code}" has ${cnt!.n} signup(s) attributed — deactivate it instead of deleting`,
    });
    return;
  }
  await db.delete(referralCodesTable).where(eq(referralCodesTable.id, id));
  res.json({ success: true });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Admin: manual marketing campaigns (ad-spend bookkeeping)
 * ──────────────────────────────────────────────────────────────────────────── */
const campaignBody = z.object({
  name: z.string().trim().min(1).max(150),
  channel: z.string().trim().max(40).default("Other"),
  budget: z.coerce.number().min(0).default(0),
  spent: z.coerce.number().min(0).default(0),
  startDate: z.string().trim().max(20).optional().nullable(),
  endDate: z.string().trim().max(20).optional().nullable(),
  goal: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["active", "paused", "completed"]).default("active"),
  notes: z.string().trim().max(2000).optional().nullable(),
});

router.get("/campaigns", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(marketingCampaignsTable)
    .orderBy(desc(marketingCampaignsTable.createdAt));
  res.json({
    campaigns: rows.map((c) => ({ ...c, budget: Number(c.budget), spent: Number(c.spent) })),
  });
});

router.post("/campaigns", requireAdmin, async (req, res) => {
  const parsed = campaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" });
    return;
  }
  const d = parsed.data;
  const [row] = await db
    .insert(marketingCampaignsTable)
    .values({
      name: d.name,
      channel: d.channel || "Other",
      budget: String(d.budget),
      spent: String(d.spent),
      startDate: d.startDate || null,
      endDate: d.endDate || null,
      goal: d.goal || null,
      status: d.status,
      notes: d.notes || null,
    })
    .returning();
  res.json({ success: true, campaign: row });
});

router.put("/campaigns/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const parsed = campaignBody.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" });
    return;
  }
  const d = parsed.data;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (d.name !== undefined) patch.name = d.name;
  if (d.channel !== undefined) patch.channel = d.channel || "Other";
  if (d.budget !== undefined) patch.budget = String(d.budget);
  if (d.spent !== undefined) patch.spent = String(d.spent);
  if (d.startDate !== undefined) patch.startDate = d.startDate || null;
  if (d.endDate !== undefined) patch.endDate = d.endDate || null;
  if (d.goal !== undefined) patch.goal = d.goal || null;
  if (d.status !== undefined) patch.status = d.status;
  if (d.notes !== undefined) patch.notes = d.notes || null;

  const [row] = await db
    .update(marketingCampaignsTable)
    .set(patch)
    .where(eq(marketingCampaignsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json({ success: true, campaign: row });
});

router.delete("/campaigns/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  await db.delete(marketingCampaignsTable).where(eq(marketingCampaignsTable.id, id));
  res.json({ success: true });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Admin: email campaigns (real Brevo sends)
 * ──────────────────────────────────────────────────────────────────────────── */
const audienceFilter = z.object({
  stage: z
    .enum(["all", "registered", "p1_paid", "video", "selected", "p2_paid"])
    .default("all"),
  city: z.string().trim().max(50).optional(),
});
type AudienceFilter = z.infer<typeof audienceFilter>;

async function resolveAudience(f: AudienceFilter): Promise<{ email: string; name: string }[]> {
  const rows = await db
    .select({
      email: usersTable.email,
      name: usersTable.name,
      regId: registrationsTable.id,
      city: registrationsTable.trialCity,
      phase1Status: registrationsTable.phase1Status,
    })
    .from(usersTable)
    .leftJoin(registrationsTable, eq(registrationsTable.userId, usersTable.id));

  let p1PaidRegs: Set<string> | null = null;
  let videoRegs: Set<string> | null = null;
  let p2PaidRegs: Set<string> | null = null;
  if (f.stage === "p1_paid") {
    p1PaidRegs = new Set(
      (
        await db
          .selectDistinct({ r: phase1PaymentsTable.registrationId })
          .from(phase1PaymentsTable)
          .where(inArray(phase1PaymentsTable.status, PAID_STATUSES))
      ).map((x) => x.r),
    );
  } else if (f.stage === "video") {
    videoRegs = new Set(
      (
        await db
          .selectDistinct({ r: phase1VideosTable.registrationId })
          .from(phase1VideosTable)
      ).map((x) => x.r),
    );
  } else if (f.stage === "p2_paid") {
    p2PaidRegs = new Set(
      (
        await db
          .selectDistinct({ r: phase2PaymentsTable.registrationId })
          .from(phase2PaymentsTable)
          .where(inArray(phase2PaymentsTable.status, PAID_STATUSES))
      ).map((x) => x.r),
    );
  }

  const seen = new Set<string>();
  const out: { email: string; name: string }[] = [];
  for (const r of rows) {
    if (!r.email || !r.email.includes("@")) continue;
    if (f.city && r.city !== f.city) continue;
    if (f.stage === "registered" && !r.regId) continue;
    if (f.stage === "p1_paid" && !(r.regId && p1PaidRegs!.has(r.regId))) continue;
    if (f.stage === "video" && !(r.regId && videoRegs!.has(r.regId))) continue;
    if (f.stage === "selected" && r.phase1Status !== "selected") continue;
    if (f.stage === "p2_paid" && !(r.regId && p2PaidRegs!.has(r.regId))) continue;
    const key = r.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ email: r.email, name: r.name });
  }
  return out;
}

/** Branded HTML wrapper for campaign emails. Plain-text body is escaped, so no
 *  broken markup can leak in; blank lines become paragraphs. */
function campaignHtml(bodyText: string): string {
  const esc = bodyText
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = esc
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#F0EDE8;">${p.replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#06101E;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
  <div style="text-align:center;padding:26px 32px 18px;background:#040C18;border-bottom:3px solid #FF7A29;">
    <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">BCPL <span style="color:#FF7A29;">T20</span></div>
    <div style="display:inline-block;margin-top:8px;background:rgba(232,178,61,0.12);border:1px solid rgba(232,178,61,0.4);border-radius:20px;padding:4px 14px;">
      <span style="font-weight:800;font-size:10px;color:#E8B23D;letter-spacing:2px;">SEASON 5 · #OfficeSeStadiumtak</span>
    </div>
  </div>
  <div style="padding:28px 32px;">${paragraphs}</div>
  <div style="padding:18px 32px 22px;background:#040C18;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <p style="color:rgba(255,255,255,0.25);font-size:10px;margin:0;line-height:1.7;">
      BCPL T20 · Kriparti Playing 11 Pvt. Ltd.<br/>India's Corporate Cricket League · bcplt20.com
    </p>
  </div>
</div>`;
}

router.get("/email-campaigns", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(emailCampaignsTable)
    .orderBy(desc(emailCampaignsTable.createdAt))
    .limit(50);
  res.json({ campaigns: rows });
});

router.get("/email-campaigns/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const [row] = await db.select().from(emailCampaignsTable).where(eq(emailCampaignsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json({ campaign: row });
});

router.post("/email-campaigns/preview", requireAdmin, async (req, res) => {
  const parsed = audienceFilter.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid audience filter" });
    return;
  }
  try {
    const audience = await resolveAudience(parsed.data);
    res.json({
      total: audience.length,
      sample: audience.slice(0, 5),
    });
  } catch (e) {
    logger.error({ err: e }, "audience preview failed");
    res.status(500).json({ error: "Failed to preview audience" });
  }
});

router.post("/email-campaigns/test", requireAdmin, async (req, res) => {
  const parsed = z
    .object({
      subject: z.string().trim().min(1).max(280),
      body: z.string().trim().min(1).max(20000),
      toEmail: z.string().trim().email(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Subject, body and a valid test email are required" });
    return;
  }
  const d = parsed.data;
  const result = await sendEmail({
    to: d.toEmail,
    toName: "BCPL Admin",
    subject: `[TEST] ${d.subject}`,
    htmlContent: campaignHtml(d.body),
  });
  if (!result.ok) {
    res.status(502).json({ error: result.error ?? "Test email failed" });
    return;
  }
  res.json({ success: true, sentTo: d.toEmail });
});

async function runEmailCampaign(
  id: string,
  subject: string,
  html: string,
  recipients: { email: string; name: string }[],
): Promise<void> {
  let sent = 0;
  let failed = 0;
  try {
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i]!;
      try {
        const result = await sendEmail({ to: r.email, toName: r.name, subject, htmlContent: html });
        if (result.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
      // Progress update every 10 emails so the admin panel can poll live counts.
      if ((i + 1) % 10 === 0) {
        await db
          .update(emailCampaignsTable)
          .set({ sentCount: sent, failedCount: failed })
          .where(eq(emailCampaignsTable.id, id));
      }
      // Gentle throttle — stay well under Brevo rate limits.
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    await db
      .update(emailCampaignsTable)
      .set({
        sentCount: sent,
        failedCount: failed,
        status: sent > 0 ? "sent" : "failed",
        completedAt: new Date(),
      })
      .where(eq(emailCampaignsTable.id, id));
    logger.info({ id, sent, failed }, "email campaign finished");
  } catch (e) {
    logger.error({ err: e, id }, "email campaign crashed");
    await db
      .update(emailCampaignsTable)
      .set({ sentCount: sent, failedCount: failed, status: "failed", completedAt: new Date() })
      .where(eq(emailCampaignsTable.id, id))
      .catch(() => {});
  }
}

router.post("/email-campaigns/send", requireAdmin, async (req, res) => {
  const parsed = z
    .object({
      subject: z.string().trim().min(1).max(280),
      body: z.string().trim().min(1).max(20000),
      audience: audienceFilter,
      testedEmail: z.string().trim().email({ message: "Send a test email first" }),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Invalid payload — a successful test send is required",
    });
    return;
  }
  const d = parsed.data;
  try {
    // Guard against double-submits / parallel blasts: one campaign at a time.
    // (Crashed runs are marked 'failed' at boot by ensureMarketingTables.)
    const [inFlight] = await db
      .select({ id: emailCampaignsTable.id })
      .from(emailCampaignsTable)
      .where(eq(emailCampaignsTable.status, "sending"))
      .limit(1);
    if (inFlight) {
      res.status(409).json({ error: "Another campaign is still sending — wait for it to finish" });
      return;
    }

    const recipients = await resolveAudience(d.audience);
    if (recipients.length === 0) {
      res.status(400).json({ error: "Audience is empty — nothing to send" });
      return;
    }
    const [row] = await db
      .insert(emailCampaignsTable)
      .values({
        subject: d.subject,
        body: d.body,
        audience: d.audience,
        status: "sending",
        totalRecipients: recipients.length,
        testSentTo: d.testedEmail,
      })
      .returning();

    // Fire-and-forget background loop — the HTTP response returns immediately
    // so nginx/browser timeouts can't kill a long send.
    void runEmailCampaign(row!.id, d.subject, campaignHtml(d.body), recipients);

    res.json({ success: true, campaign: row });
  } catch (e) {
    logger.error({ err: e }, "email campaign start failed");
    res.status(500).json({ error: "Failed to start campaign" });
  }
});

/* ────────────────────────────────────────────────────────────────────────────
 * Admin: bulk SMS / WhatsApp campaigns (real MSG91 Flow + Interakt sends)
 *
 * The SMS/WhatsApp twin of the email campaign tool above — same segment picker
 * (stage + trial city), same preview-count → confirm flow.
 *
 * SAFETY (non-negotiable — real provider keys are LIVE in dev):
 *  1. bulkMessagingEnabled() gate — real sends only in production (or with
 *     BULK_MESSAGING_ENABLED=1). Everywhere else the send runs DRY: it records
 *     what it WOULD send (dry_run=1, would-send count) without calling a
 *     provider or writing per-recipient notification_logs rows. Same env-flag
 *     family as OUTBOX_ENABLED / REMINDERS_ENABLED.
 *  2. SMS bulk goes out ONLY via a DLT-approved MSG91 Flow template id supplied
 *     per campaign — there is NO raw-text bulk send path.
 *  3. WhatsApp bulk goes out via an Interakt template picked from
 *     whatsapp_templates.
 *  4. Reserve-first dedupe on notification_logs.dedupe_key keyed by
 *     campaign+recipient — a re-run (or overlapping worker) can NEVER
 *     double-send.
 *  5. Recipients without a phone are skipped; sends are throttled in small
 *     batches with a short delay; every per-recipient outcome is recorded via
 *     logNotifications; the campaign row records sent/failed/skipped totals.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Real bulk sends only in production unless explicitly overridden via env.
 *  Same gating pattern as outboxEnabled() / remindersEnabled(). */
export function bulkMessagingEnabled(): boolean {
  const env = (process.env["BULK_MESSAGING_ENABLED"] ?? "").trim().toLowerCase();
  if (env === "1" || env === "true") return true;
  if (env === "0" || env === "false") return false;
  return process.env["NODE_ENV"] === "production";
}

/** Mirror the loud console logging that logNotifications does for each attempt
 *  (the row itself is written by the reserve-first update). */
function logBulkOutcome(
  userId: string,
  channel: string,
  template: string,
  status: string,
  detail?: string,
): void {
  if (status !== "sent") {
    console.error(`[NOTIFY-${status.toUpperCase()}] ${channel}/${template} user=${userId}: ${detail ?? "no detail"}`);
  } else if (detail) {
    console.warn(`[NOTIFY-SENT] ${channel}/${template} user=${userId}: ${detail}`);
  }
}

type PhoneRecipient = { userId: string; name: string; phone: string };

/** Resolve a player segment to de-duplicated { userId, name, phone } rows.
 *  Recipients without a usable phone are skipped (not returned). Deduped by
 *  the normalized 10-digit phone so one player is never messaged twice in a
 *  single campaign even if they hold multiple registrations. */
export async function resolvePhoneAudience(f: AudienceFilter): Promise<PhoneRecipient[]> {
  const rows = await db
    .select({
      userId: usersTable.id,
      name: usersTable.name,
      phone: usersTable.phone,
      regId: registrationsTable.id,
      city: registrationsTable.trialCity,
      phase1Status: registrationsTable.phase1Status,
    })
    .from(usersTable)
    .leftJoin(registrationsTable, eq(registrationsTable.userId, usersTable.id));

  let p1PaidRegs: Set<string> | null = null;
  let videoRegs: Set<string> | null = null;
  let p2PaidRegs: Set<string> | null = null;
  if (f.stage === "p1_paid") {
    p1PaidRegs = new Set(
      (
        await db
          .selectDistinct({ r: phase1PaymentsTable.registrationId })
          .from(phase1PaymentsTable)
          .where(inArray(phase1PaymentsTable.status, PAID_STATUSES))
      ).map((x) => x.r),
    );
  } else if (f.stage === "video") {
    videoRegs = new Set(
      (
        await db
          .selectDistinct({ r: phase1VideosTable.registrationId })
          .from(phase1VideosTable)
      ).map((x) => x.r),
    );
  } else if (f.stage === "p2_paid") {
    p2PaidRegs = new Set(
      (
        await db
          .selectDistinct({ r: phase2PaymentsTable.registrationId })
          .from(phase2PaymentsTable)
          .where(inArray(phase2PaymentsTable.status, PAID_STATUSES))
      ).map((x) => x.r),
    );
  }

  const seen = new Set<string>();
  const out: PhoneRecipient[] = [];
  for (const r of rows) {
    const phone = normalizePhone(r.phone);
    if (!phone) continue; // skip recipients without a usable phone
    if (f.city && r.city !== f.city) continue;
    if (f.stage === "registered" && !r.regId) continue;
    if (f.stage === "p1_paid" && !(r.regId && p1PaidRegs!.has(r.regId))) continue;
    if (f.stage === "video" && !(r.regId && videoRegs!.has(r.regId))) continue;
    if (f.stage === "selected" && r.phase1Status !== "selected") continue;
    if (f.stage === "p2_paid" && !(r.regId && p2PaidRegs!.has(r.regId))) continue;
    if (seen.has(phone)) continue;
    seen.add(phone);
    out.push({ userId: r.userId, name: r.name, phone });
  }
  return out;
}

/** Normalize an Indian mobile down to the bare 10 digits (same shape sendSms /
 *  sendWhatsApp take). Returns null when it isn't a plausible 10-digit number. */
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^0-9]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.length === 10 ? digits : null;
}

router.get("/sms-campaigns", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(smsCampaignsTable)
    .orderBy(desc(smsCampaignsTable.createdAt))
    .limit(50);
  res.json({ campaigns: rows, bulkEnabled: bulkMessagingEnabled() });
});

router.post("/sms-campaigns/preview", requireAdmin, async (req, res) => {
  const parsed = audienceFilter.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid audience filter" });
    return;
  }
  try {
    const audience = await resolvePhoneAudience(parsed.data);
    res.json({
      total: audience.length,
      sample: audience.slice(0, 5).map((r) => ({ name: r.name, phone: r.phone })),
      bulkEnabled: bulkMessagingEnabled(),
    });
  } catch (e) {
    logger.error({ err: e }, "sms audience preview failed");
    res.status(500).json({ error: "Failed to preview audience" });
  }
});

const bulkSendBody = z.object({
  channel: z.enum(["sms", "whatsapp"]),
  name: z.string().trim().min(1).max(150),
  body: z.string().trim().max(2000).default(""),
  // SMS: DLT-approved MSG91 Flow template id (required for sms channel).
  flowTemplateId: z.string().trim().max(120).optional(),
  // WhatsApp: Interakt template name (required for whatsapp channel).
  templateName: z.string().trim().max(120).optional(),
  templateVars: z.array(z.string().max(200)).max(10).default([]),
  audience: audienceFilter,
});

/** Small batches + a short delay between them — stay well under provider rate
 *  limits, exactly like runEmailCampaign's per-message throttle. */
const BULK_BATCH_SIZE = 20;
const BULK_BATCH_DELAY_MS = 1000;
const BULK_PER_MSG_DELAY_MS = 120;

export async function runBulkCampaign(
  campaignId: string,
  channel: "sms" | "whatsapp",
  opts: { flowTemplateId?: string; templateName?: string; templateVars: string[]; body: string },
  recipients: PhoneRecipient[],
): Promise<void> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const template = channel === "sms" ? "bulk_sms_campaign" : "bulk_wa_campaign";
  try {
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i]!;
      const dedupeKey = `bulk_${channel}_${campaignId}_${r.userId}`;

      // ── RESERVE-FIRST: claim this campaign+recipient send exactly once. The
      // winner of the insert is the only actor that ever calls the provider, so
      // a re-run / overlapping worker can NEVER double-send. ──
      const reserved = await db
        .insert(notificationLogsTable)
        .values({ userId: r.userId, type: channel, template, dedupeKey })
        .onConflictDoNothing()
        .returning({ id: notificationLogsTable.id });
      if (!reserved.length || !reserved[0]) {
        // Already sent to this recipient for this campaign — skip silently.
        skipped++;
        continue;
      }
      const reservedRowId = reserved[0].id;

      let result: SendResult;
      try {
        if (channel === "sms") {
          // Bulk SMS is DLT-only: always via the campaign's approved MSG91 Flow
          // template id — never the legacy raw-text path.
          result = await sendSmsViaFlowBulk(r.phone, opts.flowTemplateId!, opts.templateVars);
        } else {
          result = await sendWhatsApp({
            phone: r.phone,
            templateName: opts.templateName!,
            bodyValues: opts.templateVars,
          });
        }
      } catch (e) {
        result = { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
      }

      const status = result.skipped ? "skipped" : result.ok ? "sent" : "failed";
      if (status === "sent") sent++;
      else if (status === "skipped") skipped++;
      else failed++;

      // Fold the real per-recipient outcome onto the reserved dedupe row (keeps
      // the dedupe key unique — never a second row for this campaign+recipient)
      // and mirror the loud console logging logNotifications does.
      logBulkOutcome(r.userId, channel, template, status, result.error ?? result.meta);
      await db
        .update(notificationLogsTable)
        .set({ status, error: (result.error ?? result.meta ?? null)?.slice(0, 500) ?? null })
        .where(eq(notificationLogsTable.id, reservedRowId))
        .catch(() => {});

      // Live progress every batch so the admin panel can poll counts.
      if ((i + 1) % 10 === 0) {
        await db
          .update(smsCampaignsTable)
          .set({ sentCount: sent, failedCount: failed, skippedCount: skipped })
          .where(eq(smsCampaignsTable.id, campaignId))
          .catch(() => {});
      }

      await new Promise((resolve) => setTimeout(resolve, BULK_PER_MSG_DELAY_MS));
      if ((i + 1) % BULK_BATCH_SIZE === 0) {
        await new Promise((resolve) => setTimeout(resolve, BULK_BATCH_DELAY_MS));
      }
    }
    await db
      .update(smsCampaignsTable)
      .set({
        sentCount: sent,
        failedCount: failed,
        skippedCount: skipped,
        status: sent > 0 ? "sent" : "failed",
        completedAt: new Date(),
      })
      .where(eq(smsCampaignsTable.id, campaignId));
    logger.info({ campaignId, channel, sent, failed, skipped }, "bulk campaign finished");
  } catch (e) {
    logger.error({ err: e, campaignId }, "bulk campaign crashed");
    await db
      .update(smsCampaignsTable)
      .set({ sentCount: sent, failedCount: failed, skippedCount: skipped, status: "failed", completedAt: new Date() })
      .where(eq(smsCampaignsTable.id, campaignId))
      .catch(() => {});
  }
}

/** Send one bulk SMS through a DLT-approved MSG91 Flow template. Mirrors the
 *  Flow API call in lib/sms.ts — kept here so bulk sends always go through an
 *  explicit per-campaign Flow id and never the legacy raw-text path. */
async function sendSmsViaFlowBulk(
  phone: string,
  templateId: string,
  vars: string[],
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const AUTH_KEY = process.env.MSG91_AUTH_KEY;
  if (!AUTH_KEY) {
    return { ok: false, skipped: true, error: "MSG91_AUTH_KEY not configured on this server" };
  }
  const recipient: Record<string, string> = { mobiles: `91${phone}` };
  vars.forEach((v, i) => { recipient[`var${i + 1}`] = v; });
  try {
    const resp = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: AUTH_KEY, "content-type": "application/json" },
      body: JSON.stringify({ template_id: templateId, short_url: "0", recipients: [recipient] }),
      signal: AbortSignal.timeout(30_000),
    });
    const raw = await resp.text();
    let data: { type?: string; message?: string } = {};
    try { data = JSON.parse(raw); } catch { /* non-JSON error body */ }
    if (resp.ok && data.type === "success") return { ok: true };
    return { ok: false, error: `MSG91 Flow: ${(data.message || raw).slice(0, 280)}` };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
  }
}

router.post("/sms-campaigns/send", requireAdmin, async (req, res) => {
  const parsed = bulkSendBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" });
    return;
  }
  const d = parsed.data;

  // Channel-specific required fields.
  if (d.channel === "sms" && !d.flowTemplateId) {
    res.status(400).json({ error: "A MSG91 Flow Template ID is required for bulk SMS (DLT compliance)" });
    return;
  }
  if (d.channel === "whatsapp" && !d.templateName) {
    res.status(400).json({ error: "Pick a WhatsApp template for the campaign" });
    return;
  }

  try {
    // For WhatsApp, the template must exist in the registry.
    if (d.channel === "whatsapp") {
      const [tpl] = await db
        .select({ id: whatsappTemplatesTable.id })
        .from(whatsappTemplatesTable)
        .where(eq(whatsappTemplatesTable.name, d.templateName!))
        .limit(1);
      if (!tpl) {
        res.status(400).json({ error: `WhatsApp template "${d.templateName}" not found` });
        return;
      }
    }

    // One bulk campaign of this channel at a time — guard double-submits.
    const [inFlight] = await db
      .select({ id: smsCampaignsTable.id })
      .from(smsCampaignsTable)
      .where(and(eq(smsCampaignsTable.channel, d.channel), eq(smsCampaignsTable.status, "sending")))
      .limit(1);
    if (inFlight) {
      res.status(409).json({ error: "Another campaign on this channel is still sending — wait for it to finish" });
      return;
    }

    const recipients = await resolvePhoneAudience(d.audience);
    if (recipients.length === 0) {
      res.status(400).json({ error: "Audience is empty (or no recipients have a phone) — nothing to send" });
      return;
    }

    // ── SAFETY GATE: outside production (and without BULK_MESSAGING_ENABLED=1)
    // run DRY — record what we WOULD send, call no provider, write no
    // per-recipient notification rows. ──
    if (!bulkMessagingEnabled()) {
      const [row] = await db
        .insert(smsCampaignsTable)
        .values({
          channel: d.channel,
          name: d.name,
          body: d.body,
          flowTemplateId: d.channel === "sms" ? d.flowTemplateId ?? null : null,
          templateName: d.channel === "whatsapp" ? d.templateName ?? null : null,
          templateVars: d.templateVars,
          audience: d.audience,
          status: "dry_run",
          totalRecipients: recipients.length,
          dryRun: 1,
          completedAt: new Date(),
        })
        .returning();
      logger.warn(
        { campaignId: row!.id, channel: d.channel, wouldSend: recipients.length },
        "bulk campaign DRY RUN — nothing sent (BULK_MESSAGING_ENABLED not set outside production)",
      );
      res.json({ success: true, dryRun: true, campaign: row });
      return;
    }

    const [row] = await db
      .insert(smsCampaignsTable)
      .values({
        channel: d.channel,
        name: d.name,
        body: d.body,
        flowTemplateId: d.channel === "sms" ? d.flowTemplateId ?? null : null,
        templateName: d.channel === "whatsapp" ? d.templateName ?? null : null,
        templateVars: d.templateVars,
        audience: d.audience,
        status: "sending",
        totalRecipients: recipients.length,
      })
      .returning();

    // Fire-and-forget background loop — respond immediately so proxy/browser
    // timeouts can't kill a long send.
    void runBulkCampaign(
      row!.id,
      d.channel,
      { flowTemplateId: d.flowTemplateId, templateName: d.templateName, templateVars: d.templateVars, body: d.body },
      recipients,
    );

    res.json({ success: true, dryRun: false, campaign: row });
  } catch (e) {
    logger.error({ err: e }, "bulk campaign start failed");
    res.status(500).json({ error: "Failed to start campaign" });
  }
});

export default router;

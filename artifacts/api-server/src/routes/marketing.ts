import { Router } from "express";
import { db } from "@workspace/db";
import {
  referralCodesTable,
  referralSignupsTable,
  marketingCampaignsTable,
  emailCampaignsTable,
  usersTable,
  registrationsTable,
  phase1PaymentsTable,
  phase1VideosTable,
  phase2PaymentsTable,
} from "@workspace/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/adminAuth";
import { sendEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

/* Payment rows that count as money received (webhook writes "success",
 * older reconciliation wrote "paid"). */
const PAID_STATUSES = ["success", "paid"];

/** Postgres unique_violation (23505) — drizzle wraps the pg error in .cause. */
function isUniqueViolation(e: unknown): boolean {
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
    .select({ id: referralCodesTable.id })
    .from(referralCodesTable)
    .where(and(eq(referralCodesTable.code, code), eq(referralCodesTable.active, true)));
  if (!rc) {
    // Unknown/inactive code — ignore silently so the registration flow never breaks.
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
  const codes = await db
    .select()
    .from(referralCodesTable)
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
    .select({ code: referralCodesTable.code })
    .from(referralCodesTable)
    .where(eq(referralCodesTable.id, id));
  if (!rc) {
    res.status(404).json({ error: "Referral code not found" });
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
      BCPL T20 · Kriparti Playing 11 Pvt. Ltd.<br/>India's Biggest Corporate Cricket League · bcplt20.com
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

export default router;

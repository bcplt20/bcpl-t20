/**
 * Sponsorship enquiries — public "become a sponsor" contact form + admin CRM.
 *
 *   POST  /api/sponsors/enquiry            (public)  — website/app lead capture
 *   GET   /api/sponsors/admin/enquiries    (admin)   — list, newest first, ?status=
 *   PATCH /api/sponsors/admin/enquiries/:id (admin)  — { status, adminNote }
 *
 * Design decisions:
 *  - The enquiry ROW is the source of truth. The admin-alert email is strictly
 *    best-effort: a failed/skipped send NEVER fails the API (the outbox handles
 *    retry via sendEmail's queueSendFailure). We also gate real sends behind
 *    remindersEnabled() so no mail fires outside production / without the flag —
 *    same convention as the reminder sweeps (real Brevo keys live in dev).
 *  - Public POST is protected by a per-IP rate limit (3/hour) and a honeypot
 *    field so bots that fill hidden inputs are silently accepted-but-dropped.
 *  - Table is created at startup with the repo's advisory-lock DDL pattern so
 *    PM2×2 boots / parallel vitest workers can't race CREATE TABLE.
 */
import { Router } from "express";
import { db } from "@workspace/db";
import { sql, and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin, requireRole } from "../middlewares/adminAuth";
import { sendEmail, tplSponsorEnquiry, adminAlertRecipient } from "../lib/email";
import { remindersEnabled } from "../lib/reminders";
import { writeAudit } from "../lib/audit";
import { logger } from "../lib/logger";

/** node-postgres returns a QueryResult; unwrap the .rows array. */
const rowsOf = <T,>(out: unknown): T[] => ((out as { rows?: T[] }).rows ?? []);

/* ── DDL (advisory-lock tx; same pattern as ensureSelectionTables) ────────── */
const SPONSOR_ENQUIRY_DDL_LOCK = 74112099;

export async function ensureSponsorEnquiriesTable(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${SPONSOR_ENQUIRY_DDL_LOCK})`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS sponsor_enquiries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(120) NOT NULL,
      company varchar(160) NOT NULL,
      designation varchar(120),
      phone varchar(15) NOT NULL,
      email varchar(255),
      budget_range varchar(20) NOT NULL,
      message text,
      source varchar(20) NOT NULL DEFAULT 'website',
      status varchar(20) NOT NULL DEFAULT 'new',
      admin_note text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS sponsor_enquiries_status_idx ON sponsor_enquiries (status)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS sponsor_enquiries_created_idx ON sponsor_enquiries (created_at DESC)`);
  });
}

/* ── Fixed vocabularies ──────────────────────────────────────────────────── */
export const BUDGET_RANGES = ["under-1L", "1-5L", "5-15L", "15L-plus", "custom"] as const;
export const ENQUIRY_STATUSES = ["new", "contacted", "closed"] as const;
export const ENQUIRY_SOURCES = ["website", "app"] as const;

/* ── Phone normalization → bare 10-digit Indian mobile ───────────────────── */
export function normalizeIndianPhone(raw: string): string | null {
  const digits = String(raw).replace(/[^0-9]/g, "");
  let ten = digits;
  if (ten.length === 12 && ten.startsWith("91")) ten = ten.slice(2);
  else if (ten.length === 11 && ten.startsWith("0")) ten = ten.slice(1);
  return /^[6-9][0-9]{9}$/.test(ten) ? ten : null;
}

/* ── Per-IP rate limit (in-memory, per-process — see otpGuard precedent) ──── */
const ENQUIRY_IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const ENQUIRY_IP_MAX = 3;
const ipHits = new Map<string, number[]>();
function enquiryIpAllowed(ip: string): boolean {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < ENQUIRY_IP_WINDOW_MS);
  if (arr.length >= ENQUIRY_IP_MAX) { ipHits.set(ip, arr); return false; }
  arr.push(now);
  ipHits.set(ip, arr);
  return true;
}
/** Test hook — reset the in-memory rate-limit buckets. */
export function __resetEnquiryRateLimit(): void { ipHits.clear(); }

/** Real client IP behind nginx: the LAST x-forwarded-for entry is proxy-appended. */
function clientIp(req: { headers: Record<string, unknown>; ip?: string }): string {
  const xff = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xff) ? xff[xff.length - 1] : xff;
  if (typeof raw === "string" && raw.trim()) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.ip ?? "unknown";
}

/* ── Validation ──────────────────────────────────────────────────────────── */
const enquiryBody = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
  designation: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("").transform(() => undefined)),
  budgetRange: z.enum(BUDGET_RANGES),
  message: z.string().trim().max(2000).optional(),
  source: z.enum(ENQUIRY_SOURCES).optional().default("website"),
  // Honeypot: a hidden field real users never fill. Any value → bot.
  website_url: z.string().optional(),
});

/* ════════════════════════ PUBLIC ROUTER ════════════════════════ */
const router = Router();

router.post("/enquiry", async (req, res) => {
  const parsed = enquiryBody.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid enquiry", code: "VALIDATION" });
  }
  const data = parsed.data;

  // Honeypot: silently pretend success so a bot doesn't learn it was blocked.
  if (data.website_url && data.website_url.trim() !== "") {
    logger.info({ ip: clientIp(req) }, "sponsor enquiry honeypot tripped — dropped");
    return void res.status(200).json({ ok: true });
  }

  // Per-IP rate limit (before any DB write).
  const ip = clientIp(req);
  if (!enquiryIpAllowed(ip)) {
    return void res.status(429).json({ error: "Too many enquiries — please try again later", code: "RATE_LIMITED" });
  }

  const phone = normalizeIndianPhone(data.phone);
  if (!phone) {
    return void res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number", code: "BAD_PHONE" });
  }

  // Persist the enquiry — this row is the source of truth.
  let id = "";
  try {
    const inserted = rowsOf<{ id: string }>(await db.execute(sql`
      INSERT INTO sponsor_enquiries (name, company, designation, phone, email, budget_range, message, source)
      VALUES (${data.name}, ${data.company}, ${data.designation ?? null}, ${phone},
              ${data.email ?? null}, ${data.budgetRange}, ${data.message ?? null}, ${data.source})
      RETURNING id
    `));
    id = inserted[0]?.id ?? "";
  } catch (e) {
    logger.error({ err: e }, "sponsor enquiry insert failed");
    return void res.status(500).json({ error: "Could not save your enquiry — please try again", code: "SAVE_FAILED" });
  }

  // Best-effort admin alert. NEVER fail the API on email problems — the outbox
  // retries, and the row above is already durable. Gated by remindersEnabled()
  // so no mail fires outside production / without the flag.
  try {
    if (remindersEnabled()) {
      const to = adminAlertRecipient();
      if (to) {
        const tpl = tplSponsorEnquiry({
          name: data.name, company: data.company, designation: data.designation,
          phone, email: data.email, budgetRange: data.budgetRange,
          message: data.message, source: data.source, receivedAt: new Date(),
        });
        void sendEmail(
          { to, toName: "BCPL Admin", subject: tpl.subject, htmlContent: tpl.htmlContent },
          { outboxMeta: { template: "sponsor_enquiry", dedupeKey: id ? "sponsor_enquiry_" + id : null } },
        ).catch((e) => logger.error({ err: e }, "sponsor enquiry alert email failed"));
      } else {
        logger.warn("sponsor enquiry: ADMIN_ALERT_EMAIL not set — alert email NOT sent");
      }
    } else {
      logger.info({ id }, "sponsor enquiry saved — admin alert DRY RUN (reminders disabled)");
    }
  } catch (e) {
    logger.error({ err: e }, "sponsor enquiry alert dispatch failed (ignored)");
  }

  return void res.status(201).json({ ok: true, id });
});

/* ════════════════════════ ADMIN ROUTER ════════════════════════ */
export const adminSponsorEnquiriesRouter = Router();
adminSponsorEnquiriesRouter.use(requireAdmin);
// Sponsorship is a commercial/content function — gate to the content/finance
// desks (SUPER_ADMIN always passes via requireRole).
adminSponsorEnquiriesRouter.use(requireRole("CONTENT_TEAM", "FINANCE_TEAM"));

adminSponsorEnquiriesRouter.get("/enquiries", async (req, res) => {
  try {
    const status = req.query["status"] ? String(req.query["status"]) : null;
    if (status && !(ENQUIRY_STATUSES as readonly string[]).includes(status)) {
      return void res.status(400).json({ error: "Invalid status filter" });
    }
    const out = status
      ? await db.execute(sql`SELECT id, name, company, designation, phone, email,
            budget_range AS "budgetRange", message, source, status,
            admin_note AS "adminNote", created_at AS "createdAt"
          FROM sponsor_enquiries WHERE status = ${status}
          ORDER BY created_at DESC LIMIT 500`)
      : await db.execute(sql`SELECT id, name, company, designation, phone, email,
            budget_range AS "budgetRange", message, source, status,
            admin_note AS "adminNote", created_at AS "createdAt"
          FROM sponsor_enquiries ORDER BY created_at DESC LIMIT 500`);
    res.json({ enquiries: rowsOf(out), statuses: ENQUIRY_STATUSES, budgetRanges: BUDGET_RANGES });
  } catch (e) {
    logger.error({ err: e }, "sponsor enquiries list failed");
    res.status(500).json({ error: "Failed to load enquiries" });
  }
});

const patchBody = z.object({
  status: z.enum(ENQUIRY_STATUSES).optional(),
  adminNote: z.string().trim().max(4000).optional(),
}).refine((v) => v.status !== undefined || v.adminNote !== undefined, {
  message: "Provide status and/or adminNote",
});

adminSponsorEnquiriesRouter.patch("/enquiries/:id", async (req, res) => {
  const id = String(req.params["id"] ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(400).json({ error: "Invalid enquiry id" });
  const parsed = patchBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid update" });

  try {
    const sets = [] as ReturnType<typeof sql>[];
    if (parsed.data.status !== undefined) sets.push(sql`status = ${parsed.data.status}`);
    if (parsed.data.adminNote !== undefined) sets.push(sql`admin_note = ${parsed.data.adminNote}`);
    const updated = rowsOf<{ id: string; status: string; adminNote: string | null }>(await db.execute(sql`
      UPDATE sponsor_enquiries SET ${sql.join(sets, sql`, `)}
      WHERE id = ${id}
      RETURNING id, status, admin_note AS "adminNote"
    `));
    const row = updated[0];
    if (!row) return void res.status(404).json({ error: "Enquiry not found" });

    await writeAudit(req, {
      action: "sponsor_enquiry.update",
      entity: "sponsor_enquiries",
      entityKey: id,
      newValue: { status: parsed.data.status, hasNote: parsed.data.adminNote !== undefined },
    });

    res.json({ ok: true, enquiry: row });
  } catch (e) {
    logger.error({ err: e }, "sponsor enquiry patch failed");
    res.status(500).json({ error: "Failed to update enquiry" });
  }
});

export default router;

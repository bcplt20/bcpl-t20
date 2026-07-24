/**
 * Registration drafts — server-side autosave for incomplete registrations.
 *
 * Public surface (no auth — pre-OTP visitors):
 *   POST /api/drafts/upsert   — debounced autosave from the registration form
 *   GET  /api/drafts/resume   — resume a draft by anonymous clientKey
 *
 * Admin surface (requireAdmin):
 *   GET  /api/admin/drafts                 — list + per-status counts
 *   POST /api/admin/drafts/sweep-abandoned — mark stale drafts ABANDONED
 *
 * Design rules (owner spec):
 *  - OTP values are NEVER stored on drafts.
 *  - mobileVerified / status escalation can NOT be set by the client; the
 *    server derives status, and only the auth OTP-verify hook sets
 *    mobileVerified (see draftOnOtpVerified).
 *  - A draft is NOT a registered player. The final BCPL Player ID is still
 *    assigned only at Phase-1 payment success (payment.ts) — drafts merely
 *    observe the journey (PHASE1_ACTIVE).
 *  - Drafts with unverified phones must never enter any automated
 *    SMS/WhatsApp/email reminder path. reminders.ts selects candidates from
 *    `registrations` (post-OTP users) only — keep it that way.
 */
import { Router } from "express";
import { z } from "zod";
import { randomInt } from "crypto";
import { and, desc, eq, inArray, lt, notInArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { registrationDraftsTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/adminAuth";

/* ── table bootstrap (same pattern as fraud.ts) ─────────────────────────── */

let ensured = false;
export async function ensureDraftsTable(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS registration_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_number varchar(20) UNIQUE NOT NULL,
    client_key varchar(64) NOT NULL,
    full_name varchar(100),
    email varchar(255),
    phone varchar(15),
    dob date,
    calculated_age integer,
    role varchar(20),
    trial_city varchar(50),
    mobile_verified boolean NOT NULL DEFAULT false,
    otp_requested_at timestamptz,
    last_completed_step varchar(20),
    status varchar(20) NOT NULL DEFAULT 'DRAFT_STARTED',
    phase1_payment_status varchar(20) NOT NULL DEFAULT 'NOT_STARTED',
    user_id uuid REFERENCES users(id),
    registration_id uuid REFERENCES registrations(id),
    source jsonb,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    last_activity_at timestamptz NOT NULL DEFAULT NOW(),
    abandoned_at timestamptz
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_drafts_client_key ON registration_drafts(client_key)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_drafts_status ON registration_drafts(status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_drafts_phone ON registration_drafts(phone)`);
  ensured = true;
}
async function ensureOnce(): Promise<void> {
  if (!ensured) await ensureDraftsTable();
}

/* ── helpers ────────────────────────────────────────────────────────────── */

const DRAFT_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L lookalikes
function genDraftNumber(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += DRAFT_ALPHABET[randomInt(DRAFT_ALPHABET.length)];
  return "REG-DRAFT-" + s;
}

function pgCode(e: unknown): string | undefined {
  let c: any = e;
  while (c) {
    if (typeof c.code === "string") return c.code;
    c = c.cause;
  }
  return undefined;
}

function ageFromDob(dob: string): number {
  const d = new Date(dob + "T00:00:00Z");
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

type DraftRow = typeof registrationDraftsTable.$inferSelect;

/** Server-derived status. The client can never set this directly. */
function deriveStatus(d: Partial<DraftRow>): string {
  if (d.phase1PaymentStatus === "SUCCESS") return "PHASE1_ACTIVE";
  if (["INITIATED", "PENDING", "FAILED"].includes(d.phase1PaymentStatus ?? "")) return "PAYMENT_PENDING";
  if (d.registrationId) return "PROFILE_COMPLETE";
  if (d.mobileVerified && d.fullName && d.dob && d.role && d.trialCity) return "PROFILE_COMPLETE";
  if (d.mobileVerified) return "OTP_VERIFIED";
  if (d.otpRequestedAt) return "OTP_PENDING";
  if (d.phone || d.email) return "CONTACT_ENTERED";
  return "DRAFT_STARTED";
}

/* ── tiny in-memory rate limiter (per clientKey) ────────────────────────── */

const buckets = new Map<string, { n: number; reset: number }>();
function allowWrite(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    }
    return true;
  }
  b.n++;
  return b.n <= limit;
}

/* ── public router ──────────────────────────────────────────────────────── */

const router = Router();
router.use(async (_req, _res, next) => {
  try { await ensureOnce(); } catch (e) { console.error("[drafts] ensure failed:", e); }
  next();
});

const CLIENT_KEY_RE = /^[A-Za-z0-9_-]{16,64}$/;

// NOTE: z.object strips unknown keys — any client attempt to send `otp`,
// `mobileVerified`, `status`, `registrationId` etc. is silently discarded.
const upsertSchema = z.object({
  clientKey:         z.string().regex(CLIENT_KEY_RE),
  fullName:          z.string().trim().min(1).max(100).optional(),
  email:             z.string().trim().email().max(255).optional(),
  phone:             z.string().regex(/^[6-9]\d{9}$/).optional(),
  dob:               z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  role:              z.enum(["bat", "bowl", "wk", "ar"]).optional(),
  trialCity:         z.string().trim().min(2).max(50).optional(),
  lastCompletedStep: z.enum(["about", "contact", "cricket", "review"]).optional(),
  otpRequested:      z.boolean().optional(),
  source:            z.record(z.string().max(40), z.string().max(200)).optional()
                       .refine((s) => !s || Object.keys(s).length <= 12, "too many source keys"),
});

// POST /api/drafts/upsert
router.post("/upsert", async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const b = parsed.data;

  if (!allowWrite(b.clientKey)) {
    return void res.status(429).json({ error: "Too many autosave requests. Please slow down." });
  }

  const [existing] = await db.select().from(registrationDraftsTable)
    .where(eq(registrationDraftsTable.clientKey, b.clientKey))
    .orderBy(desc(registrationDraftsTable.startedAt)).limit(1);

  // Already converted to a paid registration — nothing left to autosave.
  if (existing && existing.status === "PHASE1_ACTIVE") {
    return void res.json({
      draftId: existing.id, draftNumber: existing.draftNumber,
      status: existing.status, converted: true,
    });
  }

  const updates: Partial<DraftRow> = {};
  if (b.fullName !== undefined) updates.fullName = b.fullName;
  if (b.email !== undefined) updates.email = b.email;
  if (b.dob !== undefined) { updates.dob = b.dob; updates.calculatedAge = ageFromDob(b.dob); }
  if (b.role !== undefined) updates.role = b.role;
  if (b.trialCity !== undefined) updates.trialCity = b.trialCity;
  if (b.lastCompletedStep !== undefined) updates.lastCompletedStep = b.lastCompletedStep;
  if (b.source !== undefined) updates.source = b.source;
  if (b.phone !== undefined) {
    updates.phone = b.phone;
    // Changing the number invalidates any earlier verification of the OLD number.
    if (existing && existing.mobileVerified && existing.phone !== b.phone) {
      updates.mobileVerified = false;
      updates.otpRequestedAt = null;
    }
  }
  if (b.otpRequested) updates.otpRequestedAt = new Date();

  if (!existing) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const draftNumber = genDraftNumber();
        const candidate = { clientKey: b.clientKey, draftNumber, ...updates } as any;
        candidate.status = deriveStatus(candidate);
        const [row] = await db.insert(registrationDraftsTable).values(candidate).returning();
        return void res.json({
          draftId: row.id, draftNumber: row.draftNumber, status: row.status,
          mobileVerified: row.mobileVerified, lastCompletedStep: row.lastCompletedStep,
        });
      } catch (e) {
        if (pgCode(e) !== "23505") throw e; // retry only on draft_number collision
      }
    }
    return void res.status(500).json({ error: "Could not allocate draft number" });
  }

  const merged = { ...existing, ...updates } as DraftRow;
  const [row] = await db.update(registrationDraftsTable).set({
    ...updates,
    status: deriveStatus(merged),
    abandonedAt: null, // any activity revives an abandoned draft
    lastActivityAt: new Date(),
  }).where(eq(registrationDraftsTable.id, existing.id)).returning();

  res.json({
    draftId: row.id, draftNumber: row.draftNumber, status: row.status,
    mobileVerified: row.mobileVerified, lastCompletedStep: row.lastCompletedStep,
  });
});

// GET /api/drafts/resume?clientKey=…
router.get("/resume", async (req, res) => {
  const clientKey = String(req.query.clientKey ?? "");
  if (!CLIENT_KEY_RE.test(clientKey)) return void res.status(400).json({ error: "Invalid clientKey" });

  const [d] = await db.select().from(registrationDraftsTable)
    .where(eq(registrationDraftsTable.clientKey, clientKey))
    .orderBy(desc(registrationDraftsTable.startedAt)).limit(1);
  if (!d) return void res.status(404).json({ error: "No draft found" });

  if (d.status === "PHASE1_ACTIVE") {
    return void res.json({ converted: true, status: d.status, draftNumber: d.draftNumber });
  }
  res.json({
    draftId: d.id, draftNumber: d.draftNumber, status: d.status,
    mobileVerified: d.mobileVerified,
    fullName: d.fullName, email: d.email, phone: d.phone, dob: d.dob,
    role: d.role, trialCity: d.trialCity,
    lastCompletedStep: d.lastCompletedStep,
    phase1PaymentStatus: d.phase1PaymentStatus,
  });
});

export default router;

/* ── server-side hooks (fire-and-forget; must never break the main flow) ── */

/** send-otp (purpose=register) accepted for a draft's number. */
export async function draftOnOtpRequested(clientKey: string, phone: string): Promise<void> {
  try {
    await ensureOnce();
    const [d] = await db.select().from(registrationDraftsTable)
      .where(eq(registrationDraftsTable.clientKey, clientKey))
      .orderBy(desc(registrationDraftsTable.startedAt)).limit(1);
    if (!d || d.status === "PHASE1_ACTIVE") return;
    const updates = { phone, otpRequestedAt: new Date() };
    const merged = { ...d, ...updates } as DraftRow;
    await db.update(registrationDraftsTable)
      .set({ ...updates, status: deriveStatus(merged), abandonedAt: null, lastActivityAt: new Date() })
      .where(eq(registrationDraftsTable.id, d.id));
  } catch (e) { console.error("[drafts] otp-requested hook:", e); }
}

/** OTP verified — the ONLY path that sets mobileVerified. */
export async function draftOnOtpVerified(clientKey: string | null, phone: string, userId: string): Promise<void> {
  try {
    await ensureOnce();
    const where = clientKey
      ? eq(registrationDraftsTable.clientKey, clientKey)
      : eq(registrationDraftsTable.phone, phone);
    const [d] = await db.select().from(registrationDraftsTable)
      .where(where).orderBy(desc(registrationDraftsTable.startedAt)).limit(1);
    if (!d || d.status === "PHASE1_ACTIVE") return;
    const updates = { phone, mobileVerified: true, userId };
    const merged = { ...d, ...updates } as DraftRow;
    await db.update(registrationDraftsTable)
      .set({ ...updates, status: deriveStatus(merged), abandonedAt: null, lastActivityAt: new Date() })
      .where(eq(registrationDraftsTable.id, d.id));
  } catch (e) { console.error("[drafts] otp-verified hook:", e); }
}

/** /register/phase1 created a registrations row for this user. */
export async function draftOnRegistered(userId: string, registrationId: string): Promise<void> {
  try {
    await ensureOnce();
    const [d] = await db.select().from(registrationDraftsTable)
      .where(eq(registrationDraftsTable.userId, userId))
      .orderBy(desc(registrationDraftsTable.startedAt)).limit(1);
    if (!d || d.status === "PHASE1_ACTIVE") return;
    const updates = { registrationId };
    const merged = { ...d, ...updates } as DraftRow;
    await db.update(registrationDraftsTable)
      .set({ ...updates, status: deriveStatus(merged), abandonedAt: null, lastActivityAt: new Date() })
      .where(eq(registrationDraftsTable.id, d.id));
  } catch (e) { console.error("[drafts] registered hook:", e); }
}

/** Phase-1 payment lifecycle events from payment.ts. */
export async function draftOnPaymentEvent(
  registrationId: string,
  event: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED",
): Promise<void> {
  try {
    await ensureOnce();
    const [d] = await db.select().from(registrationDraftsTable)
      .where(eq(registrationDraftsTable.registrationId, registrationId))
      .orderBy(desc(registrationDraftsTable.startedAt)).limit(1);
    if (!d) return;
    if (d.phase1PaymentStatus === "SUCCESS" && event !== "SUCCESS") return; // never downgrade a success
    const updates = { phase1PaymentStatus: event };
    const merged = { ...d, ...updates } as DraftRow;
    await db.update(registrationDraftsTable)
      .set({ ...updates, status: deriveStatus(merged), abandonedAt: null, lastActivityAt: new Date() })
      .where(eq(registrationDraftsTable.id, d.id));
  } catch (e) { console.error("[drafts] payment hook:", e); }
}

/* ── admin router ───────────────────────────────────────────────────────── */

const DRAFT_STATUSES = [
  "DRAFT_STARTED", "CONTACT_ENTERED", "OTP_PENDING", "OTP_VERIFIED",
  "PROFILE_COMPLETE", "PAYMENT_PENDING", "PHASE1_ACTIVE", "ABANDONED",
] as const;

/* Funnel groups for the "Incomplete Registrations" admin view.
 *  - otp_not_taken: visitor entered contact/name but has not verified OTP.
 *  - otp_done:      OTP verified but Phase-1 payment not yet completed. */
export const DRAFT_GROUPS: Record<string, readonly string[]> = {
  otp_not_taken: ["DRAFT_STARTED", "CONTACT_ENTERED", "OTP_PENDING"],
  otp_done:      ["OTP_VERIFIED", "PROFILE_COMPLETE", "PAYMENT_PENDING"],
};

export const adminDraftsRouter: import("express").Router = Router();
adminDraftsRouter.use(async (_req, _res, next) => {
  try { await ensureOnce(); } catch (e) { console.error("[drafts] ensure failed:", e); }
  next();
});
adminDraftsRouter.use(requireAdmin);

// GET /api/admin/drafts?status=&group=&limit=&offset=
// `group` (otp_not_taken | otp_done) filters by a funnel status-group for the
// Incomplete Registrations view; otp_not_taken additionally requires at least a
// phone or name so blank/bot drafts are not surfaced. `status` still works for
// single-status filtering (takes precedence over group when both are supplied).
adminDraftsRouter.get("/", async (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  const group = req.query.group ? String(req.query.group) : undefined;
  if (status && !DRAFT_STATUSES.includes(status as any)) {
    return void res.status(400).json({ error: "Invalid status filter" });
  }
  if (group && !DRAFT_GROUPS[group]) {
    return void res.status(400).json({ error: "Invalid group filter" });
  }
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "100"), 10) || 100, 1), 500);
  const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);

  const countRows = await db.select({
    status: registrationDraftsTable.status,
    n: sql<number>`count(*)::int`,
  }).from(registrationDraftsTable).groupBy(registrationDraftsTable.status);
  const counts: Record<string, number> = {};
  for (const r of countRows) counts[r.status] = r.n;

  const conds = [];
  if (status) {
    conds.push(eq(registrationDraftsTable.status, status));
  } else if (group) {
    conds.push(inArray(registrationDraftsTable.status, [...DRAFT_GROUPS[group]]));
    if (group === "otp_not_taken") {
      conds.push(sql`(${registrationDraftsTable.phone} IS NOT NULL OR ${registrationDraftsTable.fullName} IS NOT NULL)`);
    }
  }

  const rows = await db.select().from(registrationDraftsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(registrationDraftsTable.lastActivityAt)).limit(limit).offset(offset);

  res.json({ counts, drafts: rows });
});

// POST /api/admin/drafts/sweep-abandoned  { hours?: number }
adminDraftsRouter.post("/sweep-abandoned", async (req, res) => {
  const hours = Math.min(Math.max(Number(req.body?.hours ?? 24) || 24, 1), 24 * 30);
  const cutoff = new Date(Date.now() - hours * 3600_000);
  const marked = await db.update(registrationDraftsTable)
    .set({ status: "ABANDONED", abandonedAt: new Date() })
    .where(and(
      notInArray(registrationDraftsTable.status, ["PHASE1_ACTIVE", "ABANDONED"]),
      lt(registrationDraftsTable.lastActivityAt, cutoff),
    )).returning({ id: registrationDraftsTable.id });
  res.json({ success: true, marked: marked.length, cutoffHours: hours });
});

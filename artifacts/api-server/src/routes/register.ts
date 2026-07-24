import { draftOnRegistered } from "./drafts";
import { Router } from "express";
import { db } from "@workspace/db";
import { registrationsTable, usersTable } from "@workspace/db/schema";
import { eq, and, like, isNull, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { isAgeEligible, AGE_INELIGIBLE_MESSAGE } from "../lib/age";
import { z } from "zod";

const router = Router();

export const FEES: Record<string, { phase1: number; phase2: number }> = {
  bat:  { phase1: 299,  phase2: 2000 },
  bowl: { phase1: 299,  phase2: 2000 },
  wk:   { phase1: 299,  phase2: 2000 },
  ar:   { phase1: 399,  phase2: 3000 },
};

/** First 3 letters of the trial city, uppercased → DEL, MUM, KOL … */
export function cityCode(city: string | null | undefined): string {
  const letters = (city ?? "").replace(/[^A-Za-z]/g, "").toUpperCase();
  return letters.slice(0, 3) || "GEN";
}

/**
 * Assign the next sequential reg number (BCPL-DEL-1, BCPL-DEL-2 …) to a
 * registration AT PAYMENT TIME. Idempotent: returns the existing number if
 * one is already set. A per-city advisory lock serialises concurrent
 * payments so two players can never grab the same number.
 */
export async function assignRegNumber(registrationId: string): Promise<string | null> {
  try {
    const [reg] = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.id, registrationId)).limit(1);
    if (!reg) return null;
    if (reg.regNumber) return reg.regNumber;

    const code   = cityCode(reg.trialCity);
    const prefix = `BCPL-${code}-`;

    return await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`bcpl_regnum_${code}`}))`);
      const rows = await tx.select({ n: registrationsTable.regNumber })
        .from(registrationsTable)
        .where(like(registrationsTable.regNumber, `${prefix}%`));
      let max = 0;
      for (const r of rows) {
        const num = Number((r.n ?? "").slice(prefix.length));
        if (Number.isFinite(num) && num > max) max = num;
      }
      const updated = await tx.update(registrationsTable)
        .set({ regNumber: `${prefix}${max + 1}`, updatedAt: new Date() })
        .where(and(eq(registrationsTable.id, registrationId), isNull(registrationsTable.regNumber)))
        .returning({ regNumber: registrationsTable.regNumber });
      if (updated[0]?.regNumber) return updated[0].regNumber;
      // Someone else assigned it between our first read and the lock — reuse theirs.
      const [now] = await tx.select({ n: registrationsTable.regNumber })
        .from(registrationsTable).where(eq(registrationsTable.id, registrationId)).limit(1);
      return now?.n ?? null;
    });
  } catch (e) {
    console.error("[REGNUM] assignment failed — receipt falls back to short ID", { registrationId, e });
    return null;
  }
}

/**
 * Startup migration (idempotent):
 *  1. reg_number column + unique index + app_flags marker table.
 *  2. ONE-TIME (guarded by the app_flags marker): wipe the numbers that the
 *     old scheme handed out at sign-up time — numbers now belong to PAID
 *     players only.
 *  3. Every boot: number any paid registration still missing one, per city,
 *     ordered by when its Phase 1 payment actually succeeded.
 */
export async function ensureRegNumbers(): Promise<void> {
  // Advisory lock serialises concurrent boots (PM2 cluster ×2, parallel vitest):
  // plain DDL + the renumber backfill below otherwise race (duplicate-column /
  // double-assignment aborting under the unique index).
  await db.transaction(async (tx) => {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl_ensure_reg_numbers'))`);
  await tx.execute(sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS reg_number varchar(30)`);
  await tx.execute(sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS consents jsonb`);
  await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS registrations_reg_number_uniq ON registrations (reg_number)`);
  await tx.execute(sql`CREATE TABLE IF NOT EXISTS app_flags (key varchar(60) PRIMARY KEY, done_at timestamptz NOT NULL DEFAULT now())`);

  const inserted: any = await tx.execute(sql`
    INSERT INTO app_flags (key) VALUES ('reg_number_paid_only_v1')
    ON CONFLICT (key) DO NOTHING
    RETURNING key
  `);
  const firstRun = (Array.isArray(inserted) ? inserted : inserted?.rows ?? []).length > 0;
  if (firstRun) {
    // Old scheme numbered everyone at sign-up. Reset once; the backfill below
    // immediately renumbers all PAID players in payment order.
    await tx.execute(sql`UPDATE registrations SET reg_number = NULL`);
    console.log("[MIGRATE] reg numbers reset — renumbering paid players in payment order");
  }

  // Unpaid registrations never carry a number (payment assigns it).
  await tx.execute(sql`UPDATE registrations SET reg_number = NULL WHERE phase1_status = 'pending' AND reg_number IS NOT NULL`);

  await tx.execute(sql`
    WITH paid AS (
      SELECT r.id,
             COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(COALESCE(r.trial_city,''), '[^A-Za-z]', '', 'g'), 3)), ''), 'GEN') AS code,
             COALESCE(MIN(p.paid_at) FILTER (WHERE p.status = 'success'), r.created_at) AS paid_ts
      FROM registrations r
      LEFT JOIN phase1_payments p ON p.registration_id = r.id
      WHERE r.phase1_status <> 'pending' AND r.reg_number IS NULL
      GROUP BY r.id, r.trial_city, r.created_at
    ),
    existing_max AS (
      SELECT COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(COALESCE(trial_city,''), '[^A-Za-z]', '', 'g'), 3)), ''), 'GEN') AS code,
             MAX(CAST(SPLIT_PART(reg_number, '-', 3) AS integer)) AS max_n
      FROM registrations
      WHERE reg_number IS NOT NULL AND SPLIT_PART(reg_number, '-', 3) ~ '^[0-9]+$'
      GROUP BY 1
    ),
    numbered AS (
      SELECT p.id,
             'BCPL-' || p.code || '-' ||
             (COALESCE(m.max_n, 0) + ROW_NUMBER() OVER (PARTITION BY p.code ORDER BY p.paid_ts, p.id)) AS new_num
      FROM paid p
      LEFT JOIN existing_max m ON m.code = p.code
    )
    UPDATE registrations r
    SET reg_number = n.new_num, updated_at = NOW()
    FROM numbered n
    WHERE r.id = n.id
  `);
  });
}

// POST /api/register/phase1
router.post("/phase1", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    role:      z.enum(["bat", "bowl", "wk", "ar"]),
    trialCity: z.string().min(2).max(50),
    dob:       z.string({ message: "Date of birth required — please refresh the page" })
                .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date of birth"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { role, trialCity, dob } = parsed.data;

  // AGE GATE (18–45 inclusive): stop ineligible players BEFORE any payment.
  if (!isAgeEligible(dob)) {
    return void res.status(403).json({ error: AGE_INELIGIBLE_MESSAGE, code: "AGE_INELIGIBLE" });
  }

  // Check already registered
  const [existing] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);

  if (existing) {
    return void res.status(409).json({
      error: "Already registered",
      registrationId: existing.id,
      phase1Status: existing.phase1Status,
    });
  }

  // Persist DOB on the user record (identity data, reused across seasons).
  await db.update(usersTable)
    .set({ dob, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.userId));

  // Provisional deadline; the real upload window starts at payment success
  // (phase1PaidAt + uploadWindowDays) — see payment.ts.
  const videoDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days

  // NOTE: the sequential reg number (BCPL-DEL-1 …) is NOT assigned here —
  // it is handed out when the Phase 1 payment succeeds (see payment.ts),
  // so numbers always reflect paid players in payment order.
  const [reg] = await db.insert(registrationsTable).values({
    userId: req.user!.userId,
    role,
    trialCity,
    phase1Status: "pending",
    videoDeadline,
  }).returning();

  // Draft autosave journey hook — non-blocking for the player flow.
  await draftOnRegistered(req.user!.userId, reg.id);

  res.json({
    success:        true,
    registrationId: reg.id,
    role,
    trialCity,
    phase1Fee:      FEES[role].phase1,
    videoDeadline:  reg.videoDeadline,
  });
});

// GET /api/register/status  — current user's registration status
router.get("/status", requireAuth, async (req: AuthRequest, res) => {
  const [reg] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);

  if (!reg) return void res.json({ registered: false });

  const [u] = await db.select({ dob: usersTable.dob }).from(usersTable)
    .where(eq(usersTable.id, req.user!.userId)).limit(1);

  res.json({
    registered:     true,
    dob:            u?.dob ?? null,
    ageEligible:    u?.dob ? isAgeEligible(u.dob) : null,
    registrationId: reg.id,
    regNumber:      reg.regNumber,
    role:           reg.role,
    trialCity:      reg.trialCity,
    phase1Status:   reg.phase1Status,
    phase2Status:   reg.phase2Status,
    videoDeadline:  reg.videoDeadline,
    fees:           FEES[reg.role],
  });
});

// PATCH /api/register/dob — DOB backfill for users who registered before the
// age gate existed (they hit code DOB_REQUIRED at payment time).
router.patch("/dob", requireAuth, async (req: AuthRequest, res) => {
  const parsed = z.object({
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date of birth"),
  }).safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  if (!isAgeEligible(parsed.data.dob)) {
    return void res.status(403).json({ error: AGE_INELIGIBLE_MESSAGE, code: "AGE_INELIGIBLE" });
  }
  await db.update(usersTable)
    .set({ dob: parsed.data.dob, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.userId));
  res.json({ success: true });
});

export default router;

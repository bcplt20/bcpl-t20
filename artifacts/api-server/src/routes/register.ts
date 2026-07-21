import { Router } from "express";
import { db } from "@workspace/db";
import { registrationsTable } from "@workspace/db/schema";
import { eq, like, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
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

/** Next sequential reg number for a city: BCPL-DEL-1, BCPL-DEL-2 … */
export async function nextRegNumber(city: string): Promise<string> {
  const prefix = `BCPL-${cityCode(city)}-`;
  const rows = await db.select({ n: registrationsTable.regNumber })
    .from(registrationsTable)
    .where(like(registrationsTable.regNumber, `${prefix}%`));
  let max = 0;
  for (const r of rows) {
    const num = Number((r.n ?? "").slice(prefix.length));
    if (Number.isFinite(num) && num > max) max = num;
  }
  return `${prefix}${max + 1}`;
}

/**
 * One-time idempotent migration, runs at server startup:
 * adds reg_number column and backfills old rows per city in created_at order.
 */
export async function ensureRegNumbers(): Promise<void> {
  await db.execute(sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS reg_number varchar(30)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS registrations_reg_number_uniq ON registrations (reg_number)`);
  await db.execute(sql`
    WITH codes AS (
      SELECT id, created_at,
             COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(COALESCE(trial_city,''), '[^A-Za-z]', '', 'g'), 3)), ''), 'GEN') AS code
      FROM registrations
      WHERE reg_number IS NULL
    ),
    existing_max AS (
      SELECT COALESCE(NULLIF(UPPER(LEFT(REGEXP_REPLACE(COALESCE(trial_city,''), '[^A-Za-z]', '', 'g'), 3)), ''), 'GEN') AS code,
             MAX(CAST(SPLIT_PART(reg_number, '-', 3) AS integer)) AS max_n
      FROM registrations
      WHERE reg_number IS NOT NULL AND SPLIT_PART(reg_number, '-', 3) ~ '^[0-9]+$'
      GROUP BY 1
    ),
    numbered AS (
      SELECT c.id,
             'BCPL-' || c.code || '-' ||
             (COALESCE(m.max_n, 0) + ROW_NUMBER() OVER (PARTITION BY c.code ORDER BY c.created_at)) AS new_num
      FROM codes c
      LEFT JOIN existing_max m ON m.code = c.code
    )
    UPDATE registrations r
    SET reg_number = n.new_num, updated_at = NOW()
    FROM numbered n
    WHERE r.id = n.id
  `);
}

// POST /api/register/phase1
router.post("/phase1", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    role:      z.enum(["bat", "bowl", "wk", "ar"]),
    trialCity: z.string().min(2).max(50),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { role, trialCity } = parsed.data;

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

  const videoDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days

  // Generate sequential reg number; retry on rare unique-collision (concurrent signups)
  let reg;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const regNumber = await nextRegNumber(trialCity);
      [reg] = await db.insert(registrationsTable).values({
        userId: req.user!.userId,
        regNumber,
        role,
        trialCity,
        phase1Status: "pending",
        videoDeadline,
      }).returning();
      break;
    } catch (e: any) {
      // 23505 = Postgres unique_violation (concurrent signup grabbed the same number)
      const isUniqueCollision = e?.code === "23505" || String(e?.message ?? "").includes("reg_number");
      if (attempt === 2 || !isUniqueCollision) throw e;
    }
  }
  if (!reg) return void res.status(500).json({ error: "Registration failed. Please try again." });

  res.json({
    success:        true,
    registrationId: reg.id,
    regNumber:      reg.regNumber,
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

  res.json({
    registered:     true,
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

export default router;

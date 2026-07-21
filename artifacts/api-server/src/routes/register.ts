import { Router } from "express";
import { db } from "@workspace/db";
import { registrationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

export const FEES: Record<string, { phase1: number; phase2: number }> = {
  bat:  { phase1: 299,  phase2: 2000 },
  bowl: { phase1: 299,  phase2: 2000 },
  wk:   { phase1: 299,  phase2: 2000 },
  ar:   { phase1: 399,  phase2: 3000 },
};

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

  const [reg] = await db.insert(registrationsTable).values({
    userId: req.user!.userId,
    role,
    trialCity,
    phase1Status: "pending",
    videoDeadline,
  }).returning();

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

  res.json({
    registered:     true,
    registrationId: reg.id,
    role:           reg.role,
    trialCity:      reg.trialCity,
    phase1Status:   reg.phase1Status,
    phase2Status:   reg.phase2Status,
    videoDeadline:  reg.videoDeadline,
    fees:           FEES[reg.role],
  });
});

export default router;

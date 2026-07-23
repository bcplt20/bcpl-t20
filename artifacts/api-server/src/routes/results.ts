/**
 * BCPL Player Journey — Phase 1 result (100-point scoring system).
 *
 * Player-facing:  GET /api/results/me → own score breakdown, city rank,
 *                 city role rank and evaluated counts. Only revealed once
 *                 BOTH the score exists AND the phase-1 decision
 *                 (selected / rejected) has been announced.
 *
 * Admin scoring lives in admin.ts (PUT /api/admin/registrations/:id/score)
 * so it inherits the panel's JWT guard.
 *
 * ensurePhase1Scores(): idempotent boot migration — this repo ships schema
 * as startup SQL (like ensureRegNumbers) because drizzle-kit push is
 * interactive here.
 */
import { Router } from "express";
import { db } from "@workspace/db";
import { registrationsTable, phase1ScoresTable, usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

/** The 100-point framework. Retune maxima here — schema stays unchanged. */
export const SCORE_CRITERIA = [
  { key: "roleSkill",     max: 35 },
  { key: "technique",     max: 25 },
  { key: "execution",     max: 15 },
  { key: "gameAwareness", max: 10 },
  { key: "movement",      max: 10 },
  { key: "videoEvidence", max: 5  },
] as const;

export async function ensurePhase1Scores(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS phase1_scores (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id uuid NOT NULL UNIQUE REFERENCES registrations(id),
      role_skill      integer NOT NULL,
      technique       integer NOT NULL,
      execution       integer NOT NULL,
      game_awareness  integer NOT NULL,
      movement        integer NOT NULL,
      video_evidence  integer NOT NULL,
      total           integer NOT NULL,
      selector_note   text,
      scored_at       timestamptz NOT NULL DEFAULT now(),
      updated_at      timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS phase1_scores_total_idx ON phase1_scores (total DESC)`);
}

function rowsOf(result: unknown): any[] {
  return Array.isArray(result) ? result : (result as any)?.rows ?? [];
}

// GET /api/results/me — the logged-in player's own Phase 1 result
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [reg] = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);
    if (!reg) return void res.json({ available: false, reason: "not_registered" });

    const [score] = await db.select().from(phase1ScoresTable)
      .where(eq(phase1ScoresTable.registrationId, reg.id)).limit(1);

    const decided = reg.phase1Status === "selected" || reg.phase1Status === "rejected";
    if (!score || !decided) {
      return void res.json({
        available: false,
        // Finer-grained reasons so the UI can route each pre-result state
        // (register → pay → upload → review) instead of collapsing them.
        reason: decided
          ? "score_pending"
          : reg.phase1Status === "pending"      ? "payment_pending"
          : reg.phase1Status === "payment_done" ? "video_pending"
          : "under_review",
        phase1Status: reg.phase1Status,
      });
    }

    // Competition ranking (ties share a rank) among ALL evaluated players
    // of the same trial city; role rank filters to the same playing role.
    const city = reg.trialCity ?? "";
    const rankRes = await db.execute(sql`
      SELECT
        1 + COUNT(*) FILTER (WHERE s.total > ${score.total})                          AS city_rank,
        COUNT(*)                                                                      AS city_count,
        1 + COUNT(*) FILTER (WHERE s.total > ${score.total} AND r.role = ${reg.role}) AS role_rank,
        COUNT(*) FILTER (WHERE r.role = ${reg.role})                                  AS role_count
      FROM phase1_scores s
      JOIN registrations r ON r.id = s.registration_id
      WHERE COALESCE(r.trial_city, '') = ${city}
    `);
    const rank = rowsOf(rankRes)[0] ?? {};

    const [userRow] = await db.select({ name: usersTable.name })
      .from(usersTable).where(eq(usersTable.id, reg.userId)).limit(1);

    const breakdown = SCORE_CRITERIA.map(c => ({
      key: c.key,
      score: (score as any)[c.key] as number,
      max: c.max,
    }));

    res.json({
      available:    true,
      decision:     reg.phase1Status === "selected" ? "qualified" : "not_shortlisted",
      name:         userRow?.name ?? "",
      regNumber:    reg.regNumber,
      role:         reg.role,
      trialCity:    reg.trialCity,
      total:        score.total,
      breakdown,
      selectorNote: score.selectorNote,
      cityRank:     Number(rank.city_rank ?? 1),
      cityCount:    Number(rank.city_count ?? 1),
      roleRank:     Number(rank.role_rank ?? 1),
      roleCount:    Number(rank.role_count ?? 1),
      scoredAt:     score.scoredAt,
    });
  } catch (err: any) {
    console.error("[results/me]", err);
    res.status(500).json({ error: "Could not load your result. Please try again." });
  }
});

export default router;

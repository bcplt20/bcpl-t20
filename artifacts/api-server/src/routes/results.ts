/**
 * BCPL Player Journey — Phase 1 result (100-point scoring system).
 *
 * Player-facing:  GET  /api/results/me       → own score breakdown, city rank,
 *                                              role rank and evaluated counts.
 *                 POST /api/results/feedback → §41 process-clarity rating.
 *
 * TWO result sources, newest wins:
 *   1. AI video-trial pipeline (phase1_evaluations, status result_released) —
 *      breakdown comes from the role rubric + categoryScores, ranks come from
 *      the FROZEN ranking snapshot (§34) so an issued card never shifts.
 *      No AI internals (passes, variance, models) ever leave this endpoint.
 *   2. Legacy manual scoring (phase1_scores) — original selector flow,
 *      live-computed competition ranks. Unchanged behaviour.
 *
 * Results are only revealed once the phase-1 decision (selected / rejected)
 * has been announced — the AI release worker flips that status itself.
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
import {
  registrationsTable, phase1ScoresTable, usersTable,
  phase1EvaluationsTable, rankingSnapshotsTable, phase1FeedbackTable,
  notificationLogsTable,
} from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { getPhase1Rubrics } from "../lib/phase1Config";
import { normalizeRole } from "../lib/phase1Roles";
import { logger } from "../lib/logger";
import { sendEmail, tplPhase1Selected } from "../lib/email";

const router = Router();

/** The legacy 100-point framework (manual selector scoring). */
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
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS phase1_feedback (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id uuid NOT NULL UNIQUE REFERENCES registrations(id),
      rating          text NOT NULL,
      comment         text,
      created_at      timestamptz NOT NULL DEFAULT now(),
      updated_at      timestamptz NOT NULL DEFAULT now()
    )
  `);
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

    const decided = reg.phase1Status === "selected" || reg.phase1Status === "rejected";

    const [fb] = await db.select().from(phase1FeedbackTable)
      .where(eq(phase1FeedbackTable.registrationId, reg.id)).limit(1);
    const myFeedback = fb ? { rating: fb.rating, comment: fb.comment } : null;

    // ── Source 1: AI video-trial pipeline (released results only) ──
    const [released] = await db.select().from(phase1EvaluationsTable)
      .where(and(
        eq(phase1EvaluationsTable.registrationId, reg.id),
        eq(phase1EvaluationsTable.status, "result_released"),
      ))
      .orderBy(desc(phase1EvaluationsTable.attemptNumber)).limit(1);

    if (released && released.finalScore != null && decided) {
      const roleKey = normalizeRole(reg.role);
      const rubrics = await getPhase1Rubrics();
      const rubric = rubrics[roleKey as keyof typeof rubrics] ?? rubrics.bat;
      const cs = (released.categoryScores ?? {}) as Record<string, unknown>;
      const breakdown = rubric.categories.map((c) => ({
        key: c.key,
        label: c.label,
        score: Math.max(0, Math.min(c.max, Number(cs[c.key] ?? 0))),
        max: c.max,
      }));

      const [snap] = await db.select().from(rankingSnapshotsTable)
        .where(eq(rankingSnapshotsTable.registrationId, reg.id)).limit(1);
      const [userRow] = await db.select({ name: usersTable.name, email: usersTable.email })
        .from(usersTable).where(eq(usersTable.id, reg.userId)).limit(1);

      // §83: the congratulations email fires on FIRST VIEW of a qualified
      // result (the release email is outcome-neutral per §82). Reserve-first
      // dedupe makes this exactly-once; fire-and-forget keeps the response fast.
      if (released.result === "qualified" && userRow?.email) {
        const cName = userRow.name ?? "";
        const cEmail = userRow.email;
        void (async () => {
          const reserved = await db.insert(notificationLogsTable)
            .values({ userId: reg.userId, type: "email", template: "phase1_congrats", dedupeKey: "p1_congrats_" + released.id })
            .onConflictDoNothing()
            .returning({ id: notificationLogsTable.id });
          if (reserved.length > 0) {
            await sendEmail({ to: cEmail, toName: cName, ...tplPhase1Selected(cName) });
          }
        })().catch((e) => logger.warn({ err: e, evalId: released.id }, "phase1 congrats email failed"));
      }

      return void res.json({
        available:    true,
        decision:     released.result === "qualified" ? "qualified" : "not_shortlisted",
        name:         userRow?.name ?? "",
        regNumber:    reg.regNumber,
        role:         reg.role,
        trialCity:    reg.trialCity,
        total:        released.finalScore,
        breakdown,
        selectorNote: null,
        cityRank:     snap?.cityRank ?? 1,
        cityCount:    snap?.cityTotal ?? 1,
        roleRank:     snap?.roleRank ?? 1,
        roleCount:    snap?.roleTotal ?? 1,
        scoredAt:     released.resultReleasedAt ?? released.updatedAt,
        myFeedback,
      });
    }

    // ── Source 2: legacy manual scoring ──
    const [score] = await db.select().from(phase1ScoresTable)
      .where(eq(phase1ScoresTable.registrationId, reg.id)).limit(1);

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

    const [userRow] = await db.select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, reg.userId)).limit(1);

    // §83 (legacy path): congratulations on first view — but only for
    // decisions made under the new neutral-release flow (the legacy release
    // log row exists). Players decided before this change already received
    // the old outcome email and must not get a surprise congrats now.
    if (reg.phase1Status === "selected" && userRow?.email) {
      const cName = userRow.name ?? "";
      const cEmail = userRow.email;
      void (async () => {
        const [releaseLog] = await db.select({ id: notificationLogsTable.id })
          .from(notificationLogsTable)
          .where(eq(notificationLogsTable.dedupeKey, "p1_result_legacy_" + reg.id)).limit(1);
        if (!releaseLog) return;
        const reserved = await db.insert(notificationLogsTable)
          .values({ userId: reg.userId, type: "email", template: "phase1_congrats", dedupeKey: "p1_congrats_legacy_" + reg.id })
          .onConflictDoNothing()
          .returning({ id: notificationLogsTable.id });
        if (reserved.length > 0) {
          await sendEmail({ to: cEmail, toName: cName, ...tplPhase1Selected(cName) });
        }
      })().catch((e) => logger.warn({ err: e, regId: reg.id }, "phase1 legacy congrats email failed"));
    }

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
      myFeedback,
    });
  } catch (err) {
    logger.error({ err }, "[results/me] failed");
    res.status(500).json({ error: "Could not load your result. Please try again." });
  }
});

// POST /api/results/feedback — §41 process-clarity rating (both outcomes).
// Only accepted after the decision is announced; upsert allows edits.
const FEEDBACK_RATINGS = ["not_clear", "mostly_clear", "very_clear"];

router.post("/feedback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rating = String(req.body?.rating ?? "");
    const rawComment = typeof req.body?.comment === "string" ? req.body.comment.trim() : "";
    const comment = rawComment ? rawComment.slice(0, 1000) : null;
    if (!FEEDBACK_RATINGS.includes(rating)) {
      return void res.status(400).json({ error: "rating must be one of: " + FEEDBACK_RATINGS.join(", ") });
    }

    const [reg] = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);
    if (!reg) return void res.status(404).json({ error: "Registration not found" });

    const decided = reg.phase1Status === "selected" || reg.phase1Status === "rejected";
    if (!decided) return void res.status(409).json({ error: "Feedback opens once your result is announced" });

    await db.insert(phase1FeedbackTable)
      .values({ registrationId: reg.id, rating, comment })
      .onConflictDoUpdate({
        target: phase1FeedbackTable.registrationId,
        set: { rating, comment, updatedAt: new Date() },
      });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[results/feedback] failed");
    res.status(500).json({ error: "Could not save feedback. Please try again." });
  }
});

export default router;

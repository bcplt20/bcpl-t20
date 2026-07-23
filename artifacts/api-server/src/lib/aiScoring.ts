/**
 * Phase 1 AI pipeline — scoring passes (spec §§24–30).
 *
 *   ai_valid → scoring → scored              (result stored privately, §35)
 *                      → reupload_required   (both passes say footage unusable)
 *                      → integrity_review    (consume-time etag/size mismatch)
 *                      → skipped             (video superseded meanwhile)
 *
 * Rules implemented exactly as specified:
 *   - Pass 1 + Pass 2 always run, independently (stateless calls, §26).
 *   - variance = |p1 − p2|; ≤ maxScoreVariance → final = round(mean).
 *   - variance > maxScoreVariance → Pass 3; final = median(p1,p2,p3) (§28).
 *   - Confidence stored per pass; low final confidence triggers ONE automatic
 *     extra evaluation pass (never an auto-reject, §29); if still low the
 *     evaluation is flagged lowConfidence for monitoring.
 *   - Qualification threshold belongs to BCPL config, never the AI (§30):
 *     result = finalScore >= minScore ? 'qualified' : 'not_shortlisted'.
 *   - Every pass is audited in ai_evaluation_passes (model, prompt version,
 *     latency, raw response, per-category scores).
 *
 * Result release (phase1_status change + notifications) is a LATER stage —
 * nothing here is visible to players (§35 privacy until release).
 */
import { db } from "@workspace/db";
import {
  phase1VideosTable, phase1EvaluationsTable, registrationsTable, aiEvaluationPassesTable,
} from "@workspace/db/schema";
import { eq, and, lt, asc, inArray } from "drizzle-orm";
import { headS3Object } from "./s3";
import { getPhase1Config, getPhase1Rubrics, type Phase1Config, type Phase1Rubric } from "./phase1Config";
import {
  geminiMode, seededInt, mockScorePass, medianScore, realScorePass,
  uploadVideoToGemini, waitGeminiFileActive, deleteGeminiFile,
  type ScorePassResult,
} from "./gemini";
import { buildScoringPrompt, scoringPromptId } from "./prompts";
import { normalizeRole } from "./phase1Roles";
import { getTestOverride, type Phase1TestOverride } from "./testOverrides";
import { failVideoForReupload } from "./videoValidation";
import { logger } from "./logger";

const STALE_SCORING_MIN = 30;
const MAX_TOTAL_PASSES = 4; // 2 base + pass 3 (variance) or confidence retry, hard cap

export type AiScoringRunResult = {
  claimed: number;
  scored: number;
  reuploadRequired: number;
  integrityReview: number;
  skipped: number;
  transientErrors: number;
  gated: boolean;
};

export async function runAiScoringPasses(limit = 10): Promise<AiScoringRunResult> {
  const result: AiScoringRunResult = {
    claimed: 0, scored: 0, reuploadRequired: 0, integrityReview: 0,
    skipped: 0, transientErrors: 0, gated: false,
  };
  const cfg = await getPhase1Config();
  const mode = geminiMode();
  if (mode === "real" && !cfg.aiEnabled) {
    result.gated = true;
    return result;
  }

  const fresh = await db.update(phase1EvaluationsTable)
    .set({ status: "scoring", updatedAt: new Date() })
    .where(and(
      eq(phase1EvaluationsTable.status, "ai_valid"),
      inArray(
        phase1EvaluationsTable.id,
        db.select({ id: phase1EvaluationsTable.id }).from(phase1EvaluationsTable)
          .where(eq(phase1EvaluationsTable.status, "ai_valid"))
          .orderBy(asc(phase1EvaluationsTable.createdAt))
          .limit(limit),
      ),
    ))
    .returning();
  for (const row of fresh) {
    result.claimed += 1;
    await processScoring(row, cfg, mode, result);
  }

  const staleCutoff = new Date(Date.now() - STALE_SCORING_MIN * 60 * 1000);
  const stale = await db.update(phase1EvaluationsTable)
    .set({ updatedAt: new Date() })
    .where(and(
      eq(phase1EvaluationsTable.status, "scoring"),
      lt(phase1EvaluationsTable.updatedAt, staleCutoff),
    ))
    .returning();
  for (const row of stale.slice(0, limit)) {
    result.claimed += 1;
    await processScoring(row, cfg, mode, result);
  }

  return result;
}

type EvalRow = typeof phase1EvaluationsTable.$inferSelect;
type PassRecord = { passNumber: number; result: ScorePassResult; provider: string; startedAt: number; endedAt: number; rawText?: string };

async function processScoring(evalRow: EvalRow, cfg: Phase1Config, mode: "real" | "mock", out: AiScoringRunResult): Promise<void> {
  const startedAt = Date.now();
  try {
    const [video] = await db.select().from(phase1VideosTable)
      .where(and(
        eq(phase1VideosTable.registrationId, evalRow.registrationId),
        eq(phase1VideosTable.attemptNumber, evalRow.attemptNumber),
      )).limit(1);
    if (!video || video.status !== "submitted" || !video.s3Key) {
      await db.update(phase1EvaluationsTable)
        .set({ status: "skipped", reasonCode: "SUPERSEDED", updatedAt: new Date() })
        .where(eq(phase1EvaluationsTable.id, evalRow.id));
      out.skipped += 1;
      return;
    }

    // Consume-time integrity re-verification before any AI spend.
    const head = await headS3Object(video.s3Key);
    if (!head.exists) {
      await failVideoForReupload(evalRow.id, video.id, "CORRUPTED_VIDEO",
        { note: "object missing at scoring time" }, cfg, evalRow.registrationId, startedAt);
      out.reuploadRequired += 1;
      return;
    }
    const expectedEtag = evalRow.videoEtag ?? video.etag;
    const expectedSize = evalRow.videoSizeBytes ?? video.sizeBytes;
    if ((expectedEtag && head.etag && expectedEtag !== head.etag) ||
        (expectedSize && head.sizeBytes && expectedSize !== head.sizeBytes)) {
      await db.update(phase1EvaluationsTable).set({
        status: "integrity_review",
        reasonCode: "ETAG_MISMATCH",
        validation: mergeValidation(evalRow, {
          consumeCheck: {
            expectedEtag, currentEtag: head.etag,
            expectedSize, currentSize: head.sizeBytes,
            at: new Date().toISOString(), stage: "ai_scoring",
          },
        }),
        updatedAt: new Date(),
      }).where(eq(phase1EvaluationsTable.id, evalRow.id));
      logger.warn({ evalId: evalRow.id }, "phase1 scoring consume-time etag mismatch — parked");
      out.integrityReview += 1;
      return;
    }

    const [reg] = await db.select({
      regNumber: registrationsTable.regNumber,
      role: registrationsTable.role,
    }).from(registrationsTable).where(eq(registrationsTable.id, evalRow.registrationId)).limit(1);
    const roleKey = normalizeRole(reg?.role);
    const candidateId = reg?.regNumber || evalRow.registrationId;
    const rubric = (await getPhase1Rubrics())[roleKey];
    const override = await getTestOverride(evalRow.registrationId);

    // Idempotent reprocessing: clear any scoring pass rows from a crashed run.
    await db.delete(aiEvaluationPassesTable).where(and(
      eq(aiEvaluationPassesTable.evaluationId, evalRow.id),
      eq(aiEvaluationPassesTable.kind, "scoring"),
    ));

    const passes: PassRecord[] = [];
    const seedBase = (head.etag ?? evalRow.id) + ":" + evalRow.attemptNumber;
    const useMockEngine = mode === "mock" || override?.score !== undefined || override?.forcePass3 !== undefined || override?.confidence !== undefined;

    let geminiFile: { name: string; uri: string } | null = null;
    const mimeType = evalRow.videoMimeType ?? video.mimeType ?? "video/mp4";
    try {
      const runPass = async (passNumber: number): Promise<ScorePassResult> => {
        const pStart = Date.now();
        let r: ScorePassResult;
        let provider: string;
        let rawText: string | undefined;
        if (useMockEngine) {
          const forced = override?.score !== undefined ? clamp(Math.round(override.score), 0, 100) : undefined;
          let total: number;
          if (passNumber === 2 && override?.forcePass3) {
            total = clamp((passes[0]?.result.totalScore ?? 70) + cfg.maxScoreVariance + 3, 0, 100);
          } else if (forced !== undefined) {
            total = forced;
          } else if (passNumber === 1) {
            total = 62 + seededInt(seedBase + ":p1", 34);
          } else {
            total = clamp((passes[0]?.result.totalScore ?? 70) + (seededInt(seedBase + ":p" + passNumber, 7) - 3), 0, 100);
          }
          const conf = override?.confidence !== undefined
            ? override.confidence
            : Math.min(0.97, 0.84 + seededInt(seedBase + ":c" + passNumber, 12) / 100);
          r = mockScorePass(rubric, seedBase, passNumber, total, conf);
          provider = override && (override.score !== undefined || override.forcePass3 !== undefined || override.confidence !== undefined)
            ? "forced_test_override" : "mock";
        } else {
          if (!geminiFile) {
            geminiFile = await uploadVideoToGemini(video.s3Key!, mimeType, Number(evalRow.videoSizeBytes ?? video.sizeBytes ?? head.sizeBytes ?? 0));
            await waitGeminiFileActive(geminiFile.name);
          }
          const prompt = buildScoringPrompt({
            candidateId, roleKey, rubric,
            minSeconds: cfg.videoMinSeconds, maxSeconds: cfg.videoMaxSeconds,
          });
          const real = await realScorePass({ model: cfg.geminiPrimaryModel, prompt, fileUri: geminiFile.uri, mimeType, rubric });
          r = real.result;
          rawText = real.rawText;
          provider = cfg.geminiPrimaryModel;
        }
        const rec: PassRecord = { passNumber, result: r, provider, startedAt: pStart, endedAt: Date.now(), rawText };
        passes.push(rec);
        await db.insert(aiEvaluationPassesTable).values({
          evaluationId: evalRow.id,
          registrationId: evalRow.registrationId,
          passNumber,
          kind: "scoring",
          status: "done",
          model: provider,
          promptVersion: scoringPromptId(roleKey, cfg.promptVersion),
          requestAt: new Date(rec.startedAt),
          responseAt: new Date(rec.endedAt),
          latencyMs: rec.endedAt - rec.startedAt,
          rawResponse: rawText ? { text: rawText.slice(0, 4000) } : (r as unknown as Record<string, unknown>),
          score: r.totalScore,
          confidence: r.confidence,
          categoryScores: r.scores,
        });
        return r;
      };

      const p1 = await runPass(1);
      const p2 = await runPass(2);

      // Both passes independently say the footage can't support scoring →
      // clearer-video path (§17/§29 — never auto-reject on AI uncertainty).
      if (!p1.videoValid && !p2.videoValid) {
        await failVideoForReupload(evalRow.id, video.id, "ASSESSMENT_NOT_RELIABLE",
          mergeValidation(evalRow, { scoring: { bothPassesInvalid: true } }),
          cfg, evalRow.registrationId, startedAt);
        out.reuploadRequired += 1;
        return;
      }

      const variance = Math.abs(p1.totalScore - p2.totalScore);
      let finalScore: number;
      if (variance <= cfg.maxScoreVariance) {
        finalScore = Math.round((p1.totalScore + p2.totalScore) / 2);
      } else {
        const p3 = await runPass(3);
        finalScore = medianScore([p1.totalScore, p2.totalScore, p3.totalScore]);
      }

      // §29 — low final confidence: run ONE automatic extra pass, recompute.
      let finalConfidence = avg(passes.map((p) => p.result.confidence));
      if (finalConfidence < cfg.minAiConfidence && passes.length < MAX_TOTAL_PASSES) {
        await runPass(passes.length + 1);
        finalScore = medianScore(passes.map((p) => p.result.totalScore));
        finalConfidence = avg(passes.map((p) => p.result.confidence));
      }
      const lowConfidence = finalConfidence < cfg.minAiConfidence;

      // Display categories: the pass whose total sits closest to the final.
      const display = [...passes].sort((a, b) =>
        Math.abs(a.result.totalScore - finalScore) - Math.abs(b.result.totalScore - finalScore))[0].result;

      // §30 — backend-owned qualification. AI never touches the threshold.
      const result = finalScore >= cfg.minScore ? "qualified" : "not_shortlisted";
      const provider = passes[0].provider;

      await db.update(phase1EvaluationsTable).set({
        status: "scored",
        pass1Score: p1.totalScore,
        pass2Score: p2.totalScore,
        pass3Score: passes.find((p) => p.passNumber === 3)?.result.totalScore ?? null,
        scoreVariance: variance,
        finalScore,
        confidence: finalConfidence,
        categoryScores: display.scores,
        strongestArea: display.strongestArea,
        improvementArea: display.improvementArea,
        result,
        resultReleaseAt: new Date(Date.now() + cfg.resultReleaseHours * 60 * 60 * 1000),
        promptVersion: cfg.promptVersion,
        rubricVersion: cfg.rubricVersion,
        assessmentVersion: cfg.assessmentVersion,
        modelVersion: provider,
        validation: mergeValidation(evalRow, {
          scoring: {
            provider,
            passesUsed: passes.length,
            lowConfidence,
            scoredAt: new Date().toISOString(),
          },
        }),
        error: null,
        processingMs: (evalRow.processingMs ?? 0) + (Date.now() - startedAt),
        updatedAt: new Date(),
      }).where(eq(phase1EvaluationsTable.id, evalRow.id));
      out.scored += 1;
    } finally {
      if (geminiFile) await deleteGeminiFile((geminiFile as { name: string }).name);
    }
  } catch (e) {
    out.transientErrors += 1;
    logger.error({ err: e, evalId: evalRow.id }, "ai scoring failed for row — will retry");
    await db.update(phase1EvaluationsTable)
      .set({ error: String(e).slice(0, 500), updatedAt: new Date() })
      .where(eq(phase1EvaluationsTable.id, evalRow.id))
      .catch(() => {});
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
function mergeValidation(evalRow: EvalRow, extra: Record<string, unknown>): Record<string, unknown> {
  const existing = (evalRow.validation && typeof evalRow.validation === "object") ? evalRow.validation as Record<string, unknown> : {};
  return { ...existing, ...extra };
}

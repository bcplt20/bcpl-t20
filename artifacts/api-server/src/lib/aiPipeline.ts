/**
 * Phase 1 AI pipeline — pass zero: video validity (spec §17).
 *
 * Consumes evaluations in status 'validated' (technical checks passed) and
 * decides whether the video can be reliably assessed:
 *   validated → ai_validating → ai_valid            (ready for scoring passes)
 *                             → reupload_required    (player notified, §17 copy)
 *                             → integrity_review     (parked for admin, no accusation)
 *                             → skipped              (video superseded meanwhile)
 *
 * Consume-time integrity contract: before ANY AI spend, the S3 object is
 * re-HEADed and its etag/size compared against what was verified at confirm
 * time. A mismatch parks the row — a still-valid presigned PUT must never
 * smuggle different bytes into the scored pipeline.
 *
 * Gating: real Gemini calls require cfg.aiEnabled (safety default OFF).
 * Mock mode (no GEMINI_API_KEY) costs nothing and always runs so staging
 * exercises the full pipeline.
 */
import { db } from "@workspace/db";
import {
  phase1VideosTable, phase1EvaluationsTable, registrationsTable,
} from "@workspace/db/schema";
import { eq, and, lt, asc, inArray } from "drizzle-orm";
import { headS3Object } from "./s3";
import { getPhase1Config, type Phase1Config } from "./phase1Config";
import { geminiMode, mockValidity, realValidityCheck, validitySchema, type ValidityResult } from "./gemini";
import { buildValidityPrompt, validityPromptId, ALLOWED_VALIDITY_REASONS } from "./prompts";
import { normalizeRole, ROLE_LABELS } from "./phase1Roles";
import { getTestOverride } from "./testOverrides";
import { failVideoForReupload } from "./videoValidation";
import { logger } from "./logger";

const STALE_AI_VALIDATING_MIN = 15;

export type AiValidityRunResult = {
  claimed: number;
  aiValid: number;
  reuploadRequired: number;
  integrityReview: number;
  skipped: number;
  transientErrors: number;
  gated: boolean;
};

export async function runAiValidityChecks(limit = 25): Promise<AiValidityRunResult> {
  const result: AiValidityRunResult = {
    claimed: 0, aiValid: 0, reuploadRequired: 0, integrityReview: 0,
    skipped: 0, transientErrors: 0, gated: false,
  };
  const cfg = await getPhase1Config();
  const mode = geminiMode();

  // Safety gate: real AI spend only when the switch is explicitly on.
  if (mode === "real" && !cfg.aiEnabled) {
    result.gated = true;
    return result;
  }

  // Claim fresh rows (atomic via status recheck in the UPDATE where-clause).
  const fresh = await db.update(phase1EvaluationsTable)
    .set({ status: "ai_validating", updatedAt: new Date() })
    .where(and(
      eq(phase1EvaluationsTable.status, "validated"),
      inArray(
        phase1EvaluationsTable.id,
        db.select({ id: phase1EvaluationsTable.id }).from(phase1EvaluationsTable)
          .where(eq(phase1EvaluationsTable.status, "validated"))
          .orderBy(asc(phase1EvaluationsTable.createdAt))
          .limit(limit),
      ),
    ))
    .returning();
  for (const row of fresh) {
    result.claimed += 1;
    await processOne(row, cfg, mode, result);
  }

  // Retry rows stuck in 'ai_validating' (crashed worker / transient errors).
  const staleCutoff = new Date(Date.now() - STALE_AI_VALIDATING_MIN * 60 * 1000);
  const stale = await db.update(phase1EvaluationsTable)
    .set({ updatedAt: new Date() })
    .where(and(
      eq(phase1EvaluationsTable.status, "ai_validating"),
      lt(phase1EvaluationsTable.updatedAt, staleCutoff),
    ))
    .returning();
  for (const row of stale.slice(0, limit)) {
    result.claimed += 1;
    await processOne(row, cfg, mode, result);
  }

  return result;
}

type EvalRow = typeof phase1EvaluationsTable.$inferSelect;

async function processOne(evalRow: EvalRow, cfg: Phase1Config, mode: "real" | "mock", result: AiValidityRunResult): Promise<void> {
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
      result.skipped += 1;
      return;
    }

    // ── Consume-time integrity re-verification (architect contract) ──
    const head = await headS3Object(video.s3Key);
    if (!head.exists) {
      await failVideoForReupload(evalRow.id, video.id, "CORRUPTED_VIDEO",
        { note: "object missing at AI-validity time" }, cfg, evalRow.registrationId, startedAt);
      result.reuploadRequired += 1;
      return;
    }
    const expectedEtag = evalRow.videoEtag ?? video.etag;
    const expectedSize = evalRow.videoSizeBytes ?? video.sizeBytes;
    const etagChanged = expectedEtag && head.etag && expectedEtag !== head.etag;
    const sizeChanged = expectedSize && head.sizeBytes && expectedSize !== head.sizeBytes;
    if (etagChanged || sizeChanged) {
      await db.update(phase1EvaluationsTable).set({
        status: "integrity_review",
        reasonCode: "ETAG_MISMATCH",
        validation: mergeValidation(evalRow, {
          consumeCheck: {
            expectedEtag, currentEtag: head.etag,
            expectedSize, currentSize: head.sizeBytes,
            at: new Date().toISOString(), stage: "ai_validity",
          },
        }),
        processingMs: Date.now() - startedAt,
        updatedAt: new Date(),
      }).where(eq(phase1EvaluationsTable.id, evalRow.id));
      logger.warn({ evalId: evalRow.id }, "phase1 consume-time etag mismatch — parked for integrity review");
      result.integrityReview += 1;
      return;
    }

    // ── Pseudonymous candidate context (§62) ──
    const [reg] = await db.select({
      regNumber: registrationsTable.regNumber,
      role: registrationsTable.role,
    }).from(registrationsTable).where(eq(registrationsTable.id, evalRow.registrationId)).limit(1);
    const roleKey = normalizeRole(reg?.role);
    const candidateId = reg?.regNumber || evalRow.registrationId;

    // ── Obtain the validity verdict (override → mock → real) ──
    const override = await getTestOverride(evalRow.registrationId);
    let validity: ValidityResult;
    let provider: string;
    if (override?.validity) {
      validity = validitySchema.parse({ ...mockValidity(head.etag ?? evalRow.id, ROLE_LABELS[roleKey]), ...override.validity });
      provider = "forced_test_override";
    } else if (mode === "mock") {
      validity = mockValidity(head.etag ?? evalRow.id, ROLE_LABELS[roleKey]);
      provider = "mock";
    } else {
      validity = await realValidityCheck({
        s3Key: video.s3Key,
        mimeType: evalRow.videoMimeType ?? video.mimeType ?? "video/mp4",
        sizeBytes: evalRow.videoSizeBytes ?? video.sizeBytes ?? head.sizeBytes,
        model: cfg.geminiValidationModel,
        prompt: buildValidityPrompt({
          candidateId, roleKey,
          minSeconds: cfg.videoMinSeconds, maxSeconds: cfg.videoMaxSeconds,
        }),
      });
      provider = cfg.geminiValidationModel;
    }

    const aiValidity = {
      ...validity,
      provider,
      promptId: validityPromptId(cfg.promptVersion),
      checkedAt: new Date().toISOString(),
    };

    const invalid = validity.reuploadRequired || !validity.validCricketVideo || !validity.assessmentPossible;
    if (invalid) {
      const reason = validity.reasonCode && (ALLOWED_VALIDITY_REASONS as readonly string[]).includes(validity.reasonCode)
        ? validity.reasonCode
        : "ASSESSMENT_NOT_RELIABLE";
      await failVideoForReupload(evalRow.id, video.id, reason,
        mergeValidation(evalRow, { aiValidity }), cfg, evalRow.registrationId, startedAt);
      result.reuploadRequired += 1;
      return;
    }

    await db.update(phase1EvaluationsTable).set({
      status: "ai_valid",
      validation: mergeValidation(evalRow, { aiValidity }),
      promptVersion: cfg.promptVersion,
      rubricVersion: cfg.rubricVersion,
      assessmentVersion: cfg.assessmentVersion,
      modelVersion: provider,
      error: null,
      processingMs: (evalRow.processingMs ?? 0) + (Date.now() - startedAt),
      updatedAt: new Date(),
    }).where(eq(phase1EvaluationsTable.id, evalRow.id));
    result.aiValid += 1;
  } catch (e) {
    // Transient (network/Gemini/S3) — keep 'ai_validating', record error,
    // stale sweep retries. Never let one row kill the tick.
    result.transientErrors += 1;
    logger.error({ err: e, evalId: evalRow.id }, "ai validity check failed for row — will retry");
    await db.update(phase1EvaluationsTable)
      .set({ error: String(e).slice(0, 500), updatedAt: new Date() })
      .where(eq(phase1EvaluationsTable.id, evalRow.id))
      .catch(() => {});
  }
}

function mergeValidation(evalRow: EvalRow, extra: Record<string, unknown>): Record<string, unknown> {
  const existing = (evalRow.validation && typeof evalRow.validation === "object") ? evalRow.validation as Record<string, unknown> : {};
  return { ...existing, ...extra };
}

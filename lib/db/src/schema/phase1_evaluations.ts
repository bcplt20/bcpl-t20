import { pgTable, uuid, varchar, integer, real, boolean, bigint, json, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

/**
 * One row per Phase 1 AI evaluation attempt (re-uploads create a new attempt).
 * Pipeline: queued → validating → (reupload_required | integrity_review | ai_pass_1)
 *           → ai_pass_2 → (ai_pass_3) → final_scoring → result_ready → result_released
 * Failures: failed_temporary (retryable) | failed_final (needs admin attention).
 */
export const phase1EvaluationsTable = pgTable("phase1_evaluations", {
  id:               uuid("id").primaryKey().defaultRandom(),
  registrationId:   uuid("registration_id").notNull().references(() => registrationsTable.id),
  attemptNumber:    integer("attempt_number").default(1).notNull(),
  status:           varchar("status", { length: 30 }).default("queued").notNull(),

  // Video technical metadata (captured during validation)
  videoS3Key:       varchar("video_s3_key", { length: 300 }),
  videoDurationSec: real("video_duration_sec"),
  videoMimeType:    varchar("video_mime_type", { length: 60 }),
  videoSizeBytes:   bigint("video_size_bytes", { mode: "number" }),
  videoEtag:        varchar("video_etag", { length: 80 }),
  videoSha256:      varchar("video_sha256", { length: 64 }),
  needsTranscoding: boolean("needs_transcoding").default(false).notNull(),

  // AI pass-0 validity output (structured JSON) + reason when re-upload/integrity flagged
  validation:       json("validation"),
  reasonCode:       varchar("reason_code", { length: 40 }),

  // Scores
  pass1Score:       integer("pass1_score"),
  pass2Score:       integer("pass2_score"),
  pass3Score:       integer("pass3_score"),
  finalScore:       integer("final_score"),
  confidence:       real("confidence"),
  scoreVariance:    integer("score_variance"),
  categoryScores:   json("category_scores"),
  strongestArea:    varchar("strongest_area", { length: 40 }),
  improvementArea:  varchar("improvement_area", { length: 40 }),

  // Outcome (backend-decided, never AI-decided): qualified | not_shortlisted
  result:           varchar("result", { length: 20 }),
  resultReleaseAt:  timestamp("result_release_at", { withTimezone: true }),
  resultReleasedAt: timestamp("result_released_at", { withTimezone: true }),

  // Versioning for auditability of historical scores
  assessmentVersion: varchar("assessment_version", { length: 20 }),
  rubricVersion:     varchar("rubric_version", { length: 20 }),
  promptVersion:     varchar("prompt_version", { length: 20 }),
  modelVersion:      varchar("model_version", { length: 60 }),

  // Cost/observability metadata
  passesUsed:       integer("passes_used"),
  processingMs:     integer("processing_ms"),
  error:            varchar("error", { length: 500 }),

  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Phase1Evaluation = typeof phase1EvaluationsTable.$inferSelect;

import { pgTable, uuid, varchar, integer, real, json, timestamp } from "drizzle-orm/pg-core";
import { phase1EvaluationsTable } from "./phase1_evaluations";
import { registrationsTable } from "./registrations";

/**
 * One row per individual AI call (validation pass or scoring pass).
 * Keeps the full validated JSON response for audit; passes are append-only.
 */
export const aiEvaluationPassesTable = pgTable("ai_evaluation_passes", {
  id:             uuid("id").primaryKey().defaultRandom(),
  evaluationId:   uuid("evaluation_id").notNull().references(() => phase1EvaluationsTable.id),
  registrationId: uuid("registration_id").notNull().references(() => registrationsTable.id),
  passNumber:     integer("pass_number").notNull(),           // 0 = validity, 1..3 = scoring
  kind:           varchar("kind", { length: 20 }).notNull(),  // validation | scoring
  status:         varchar("status", { length: 20 }).default("pending").notNull(), // pending | running | completed | failed
  model:          varchar("model", { length: 60 }),
  promptVersion:  varchar("prompt_version", { length: 20 }),
  providerJobId:  varchar("provider_job_id", { length: 120 }),
  requestAt:      timestamp("request_at",  { withTimezone: true }),
  responseAt:     timestamp("response_at", { withTimezone: true }),
  latencyMs:      integer("latency_ms"),
  rawResponse:    json("raw_response"),
  score:          integer("score"),
  confidence:     real("confidence"),
  categoryScores: json("category_scores"),
  retryCount:     integer("retry_count").default(0).notNull(),
  error:          varchar("error", { length: 500 }),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AiEvaluationPass = typeof aiEvaluationPassesTable.$inferSelect;

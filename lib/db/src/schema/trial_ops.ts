import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb, numeric, text } from "drizzle-orm/pg-core";

/**
 * QR Trial Ops suite (staff mobile app) — attempt-level tracking,
 * locked 100-point evaluations and the supervisor correction workflow.
 *
 * trial_attempts      — one row per delivery/attempt (valid or feeder error)
 * trial_evaluations   — append-only locked evaluations (never overwritten;
 *                       corrections supersede — original row retained forever)
 * trial_correction_requests — evaluator asks, supervisor decides
 */

export const trialAttemptsTable = pgTable("trial_attempts", {
  id:             uuid("id").primaryKey().defaultRandom(),
  allocationId:   uuid("allocation_id").notNull(),
  registrationId: uuid("registration_id").notNull(),
  /** batting | bowling (keeping/fielding drills are technical dims, not attempts) */
  discipline:     varchar("discipline", { length: 20 }).notNull(),
  /** 1..6 for valid attempts; 0 for feeder-error re-bowl rows */
  seq:            integer("seq").notNull(),
  outcome:        varchar("outcome", { length: 30 }).notNull(),
  isValid:        boolean("is_valid").default(true).notNull(),
  recordedBy:     varchar("recorded_by", { length: 160 }).notNull(),
  station:        varchar("station", { length: 40 }),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const trialEvaluationsTable = pgTable("trial_evaluations", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull(),
  allocationId:   uuid("allocation_id"),
  /** 1 = primary evaluation; 2+ reserved for QC second assessments */
  evalRound:      integer("eval_round").default(1).notNull(),
  evaluatorEmail: varchar("evaluator_email", { length: 160 }).notNull(),
  evaluatorName:  varchar("evaluator_name", { length: 120 }),
  playerRole:     varchar("player_role", { length: 30 }).notNull(),
  rubricVersion:  varchar("rubric_version", { length: 40 }).notNull(),
  /** full score breakdown: { objective: {...}, technical: {...}, total } */
  sections:       jsonb("sections").notNull(),
  /** attempt outcomes snapshotted at submit time (audit trail) */
  attemptSummary: jsonb("attempt_summary"),
  totalScore:     numeric("total_score", { precision: 6, scale: 2 }).notNull(),
  notes:          text("notes"),
  /** submitted | superseded (correction approved → row retained, never edited) */
  status:         varchar("status", { length: 30 }).default("submitted").notNull(),
  lockedAt:       timestamp("locked_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const trialCorrectionRequestsTable = pgTable("trial_correction_requests", {
  id:             uuid("id").primaryKey().defaultRandom(),
  evaluationId:   uuid("evaluation_id").notNull(),
  registrationId: uuid("registration_id").notNull(),
  requestedBy:    varchar("requested_by", { length: 160 }).notNull(),
  reason:         text("reason").notNull(),
  /** pending | approved | rejected */
  status:         varchar("status", { length: 20 }).default("pending").notNull(),
  decidedBy:      varchar("decided_by", { length: 160 }),
  decisionNote:   text("decision_note"),
  decidedAt:      timestamp("decided_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TrialAttemptRecord = typeof trialAttemptsTable.$inferSelect;
export type TrialEvaluationRecord = typeof trialEvaluationsTable.$inferSelect;
export type TrialCorrectionRequestRecord = typeof trialCorrectionRequestsTable.$inferSelect;

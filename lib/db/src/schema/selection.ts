import { pgTable, uuid, varchar, integer, jsonb, timestamp, numeric, text } from "drizzle-orm/pg-core";

/**
 * Final 600 selection engine (BCPL T20).
 *
 * selection_batches        — one auditable Selection Batch per generation run.
 *                            Freezes a config snapshot + a population snapshot
 *                            reference so the same batch is deterministic and
 *                            reproducible. Status is a strict state machine:
 *                            draft → generating → preview_ready → approved →
 *                            published (or failed / invalidated).
 * selection_batch_members  — the selected 600 (or fewer on shortfall) for a
 *                            batch. Stores versioned derived/percentile metrics
 *                            per member — raw coach scores are NEVER written here
 *                            or in physical_assessments; the engine only reads them.
 *
 * Population snapshot: rather than copy millions of rows, each batch records the
 * exact SQL-eligibility predicate + a frozen `snapshotAt` cutoff + counts. New
 * or late physical_assessments created after the batch's population snapshot are
 * excluded by the cutoff, so a generated batch never silently absorbs late data.
 */

export const selectionBatchesTable = pgTable("selection_batches", {
  id:               uuid("id").primaryKey().defaultRandom(),
  seasonKey:        varchar("season_key", { length: 60 }).notNull(),
  /** V1, V2 … monotonically increasing per season */
  version:          integer("version").notNull(),
  /** draft | generating | preview_ready | approved | published | failed | invalidated */
  status:           varchar("status", { length: 30 }).default("draft").notNull(),
  /** fine-grained job progress within `generating` (see PROGRESS_STATES) */
  jobPhase:         varchar("job_phase", { length: 40 }),
  jobProgressPct:   integer("job_progress_pct").default(0).notNull(),
  /** CAS claim token — a stale/duplicate worker cannot write over an active run */
  claimToken:       uuid("claim_token"),
  algorithmVersion: varchar("algorithm_version", { length: 20 }).notNull(),
  /** frozen selection_config value at generation time */
  configSnapshot:   jsonb("config_snapshot").$type<Record<string, unknown>>().notNull(),
  /** { snapshotAt, eligiblePredicate, scoreSource } — the frozen population */
  populationSnapshot: jsonb("population_snapshot").$type<Record<string, unknown>>(),
  /** aggregate counts: { populationTotal, eligible, selected, byRole, byZone, wildcards } */
  counts:           jsonb("counts").$type<Record<string, unknown>>(),
  /** SELECTION CONSTRAINT EXCEPTION entries [{ zone, role, required, eligible, shortfall }] */
  exceptionReport:  jsonb("exception_report").$type<Array<Record<string, unknown>>>().default([]).notNull(),
  /** diagnostics on a failed run */
  error:            text("error"),
  createdBy:        varchar("created_by", { length: 120 }),
  approvedBy:       varchar("approved_by", { length: 120 }),
  publishedBy:      varchar("published_by", { length: 120 }),
  generatedAt:      timestamp("generated_at", { withTimezone: true }),
  approvedAt:       timestamp("approved_at", { withTimezone: true }),
  publishedAt:      timestamp("published_at", { withTimezone: true }),
  invalidatedAt:    timestamp("invalidated_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type SelectionBatch = typeof selectionBatchesTable.$inferSelect;

export const selectionBatchMembersTable = pgTable("selection_batch_members", {
  id:              uuid("id").primaryKey().defaultRandom(),
  batchId:         uuid("batch_id").notNull(),
  registrationId:  uuid("registration_id").notNull(),
  role:            varchar("role", { length: 10 }).notNull(),   // bat | bowl | ar | wk
  zone:            varchar("zone", { length: 20 }).notNull(),   // NORTH | SOUTH | EAST | WEST | CENTRAL
  city:            varchar("city", { length: 100 }),
  /** zonal | wildcard — which pool this member was selected into */
  selectionPool:   varchar("selection_pool", { length: 20 }).notNull(),
  /** immutable raw physical trial score (0-100), copied for audit only — source stays canonical */
  rawPhysicalScore: numeric("raw_physical_score", { precision: 6, scale: 2 }).notNull(),
  /** ranks within the frozen snapshot (audit / preview) */
  zoneRoleRank:    integer("zone_role_rank"),
  nationalRoleRank: integer("national_role_rank"),
  overallRank:     integer("overall_rank"),
  /** versioned derived metrics — role/zone/venue percentile, coach deviation etc. */
  derivedMetrics:  jsonb("derived_metrics").$type<Record<string, unknown>>(),
  metricsVersion:  varchar("metrics_version", { length: 20 }),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type SelectionBatchMember = typeof selectionBatchMembersTable.$inferSelect;

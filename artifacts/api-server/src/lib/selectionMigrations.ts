/**
 * Startup migrations for the Final 600 selection engine.
 *
 * Follows the repo convention (staffTrials.ensureTrialOpsTables): a single
 * transaction guarded by pg_advisory_xact_lock so PM2×2 boots and parallel
 * vitest workers cannot race CREATE TABLE IF NOT EXISTS.
 *
 * Also creates the composite indexes the ranking window-function queries need
 * so the engine never sequential-scans physical_assessments at scale:
 *   - (registration_id) unique already exists on physical_assessments; we add
 *     a covering composite that lets the ranking joins/partition + order run
 *     index-only where possible.
 */
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

const SELECTION_DDL_LOCK = 74112077;

export async function ensureSelectionTables(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${SELECTION_DDL_LOCK})`);

    await tx.execute(sql`CREATE TABLE IF NOT EXISTS selection_batches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      season_key varchar(60) NOT NULL,
      version integer NOT NULL,
      status varchar(30) NOT NULL DEFAULT 'draft',
      job_phase varchar(40),
      job_progress_pct integer NOT NULL DEFAULT 0,
      claim_token uuid,
      algorithm_version varchar(20) NOT NULL,
      config_snapshot jsonb NOT NULL,
      population_snapshot jsonb,
      counts jsonb,
      exception_report jsonb NOT NULL DEFAULT '[]'::jsonb,
      error text,
      created_by varchar(120),
      approved_by varchar(120),
      published_by varchar(120),
      generated_at timestamptz,
      approved_at timestamptz,
      published_at timestamptz,
      invalidated_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS selection_batches_season_version_uidx
      ON selection_batches (season_key, version)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS selection_batches_season_status_idx
      ON selection_batches (season_key, status)`);
    // At most ONE approved batch per season (spec §5). Partial unique index.
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS selection_batches_one_approved_uidx
      ON selection_batches (season_key) WHERE status = 'approved'`);

    await tx.execute(sql`CREATE TABLE IF NOT EXISTS selection_batch_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id uuid NOT NULL,
      registration_id uuid NOT NULL,
      role varchar(10) NOT NULL,
      zone varchar(20) NOT NULL,
      city varchar(100),
      selection_pool varchar(20) NOT NULL,
      raw_physical_score numeric(6,2) NOT NULL,
      zone_role_rank integer,
      national_role_rank integer,
      overall_rank integer,
      derived_metrics jsonb,
      metrics_version varchar(20),
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    // A registration appears at most once per batch (uniqueness invariant §7 STEP7).
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS selection_batch_members_batch_reg_uidx
      ON selection_batch_members (batch_id, registration_id)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS selection_batch_members_batch_idx
      ON selection_batch_members (batch_id)`);
    // Server-side drill-down filters: batch + zone + role, ordered by rank.
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS selection_batch_members_filter_idx
      ON selection_batch_members (batch_id, zone, role, overall_rank)`);

    // ── ranking-query support indexes on physical_assessments (engine reads only) ──
    // Composite that serves the window-function partition/order:
    //   WHERE result-eligible & score not null, ORDER BY final_score DESC.
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS physical_assessments_rank_idx
      ON physical_assessments (player_role, city, final_score DESC, registration_id)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS physical_assessments_score_idx
      ON physical_assessments (final_score DESC)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS physical_assessments_created_idx
      ON physical_assessments (created_at)`);
  });

  logger.info("Final 600 selection tables ensured");
}

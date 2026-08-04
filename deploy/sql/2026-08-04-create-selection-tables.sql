-- ============================================================
-- BCPL T20 — Final 600 selection engine tables (catch-up SQL)
--
-- Mirror of ensureSelectionTables() in
--   artifacts/api-server/src/lib/selectionMigrations.ts
-- Runtime boot creates these idempotently (tx + advisory lock), but this
-- file is the deploy/EC2 catch-up path in case an older process boots first
-- or a manual apply is preferred.
--
-- Idempotent — safe to run twice.
--   psql -q "$DATABASE_URL" -f deploy/sql/2026-08-04-create-selection-tables.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS selection_batches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_key        varchar(60) NOT NULL,
  version           integer NOT NULL,
  status            varchar(30) NOT NULL DEFAULT 'draft',
  job_phase         varchar(40),
  job_progress_pct  integer NOT NULL DEFAULT 0,
  claim_token       uuid,
  algorithm_version varchar(20) NOT NULL,
  config_snapshot   jsonb NOT NULL,
  population_snapshot jsonb,
  counts            jsonb,
  exception_report  jsonb NOT NULL DEFAULT '[]'::jsonb,
  error             text,
  created_by        varchar(120),
  approved_by       varchar(120),
  published_by      varchar(120),
  generated_at      timestamptz,
  approved_at       timestamptz,
  published_at      timestamptz,
  invalidated_at    timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS selection_batches_season_version_uidx
  ON selection_batches (season_key, version);
CREATE INDEX IF NOT EXISTS selection_batches_season_status_idx
  ON selection_batches (season_key, status);
CREATE UNIQUE INDEX IF NOT EXISTS selection_batches_one_approved_uidx
  ON selection_batches (season_key) WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS selection_batch_members (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id           uuid NOT NULL,
  registration_id    uuid NOT NULL,
  role               varchar(10) NOT NULL,
  zone               varchar(20) NOT NULL,
  city               varchar(100),
  selection_pool     varchar(20) NOT NULL,
  raw_physical_score numeric(6,2) NOT NULL,
  zone_role_rank     integer,
  national_role_rank integer,
  overall_rank       integer,
  derived_metrics    jsonb,
  metrics_version    varchar(20),
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS selection_batch_members_batch_reg_uidx
  ON selection_batch_members (batch_id, registration_id);
CREATE INDEX IF NOT EXISTS selection_batch_members_batch_idx
  ON selection_batch_members (batch_id);
CREATE INDEX IF NOT EXISTS selection_batch_members_filter_idx
  ON selection_batch_members (batch_id, zone, role, overall_rank);

-- ranking-query support indexes on physical_assessments (engine reads only)
CREATE INDEX IF NOT EXISTS physical_assessments_rank_idx
  ON physical_assessments (player_role, city, final_score DESC, registration_id);
CREATE INDEX IF NOT EXISTS physical_assessments_score_idx
  ON physical_assessments (final_score DESC);
CREATE INDEX IF NOT EXISTS physical_assessments_created_idx
  ON physical_assessments (created_at);

COMMIT;

-- Jaanch (optional):
--   psql "$DATABASE_URL" -c "\dt selection_batches selection_batch_members"

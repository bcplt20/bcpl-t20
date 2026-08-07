-- ============================================================
-- BCPL T20 — Fan Voting (IPL-style polls), schema-only catch-up
--
-- Adds the fan-poll tables read/written by src/routes/polls.ts
-- (public GET /api/polls + admin /api/admin/polls). The API auto-creates
-- these at runtime (advisory-locked ensureTables()); this file mirrors that
-- DDL EXACTLY so a deploy schema push never asks a question about them.
--
-- Idempotent + schema-only (no TRUNCATE) — safe to run twice.
--   psql "$DATABASE_URL" -f deploy/sql/2026-08-07-fan-polls.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS fan_polls (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              varchar(80) NOT NULL UNIQUE,
  title_en          varchar(160) NOT NULL,
  title_hi          varchar(160) NOT NULL DEFAULT '',
  category          varchar(32) NOT NULL DEFAULT 'custom',   -- man_of_series|best_batsman|best_bowler|custom
  status            varchar(12) NOT NULL DEFAULT 'draft',    -- draft|open|closed
  opens_at          timestamptz,
  closes_at         timestamptz,
  show_live_results boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fan_polls_status_idx ON fan_polls (status, created_at DESC);

CREATE TABLE IF NOT EXISTS fan_poll_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid NOT NULL REFERENCES fan_polls(id) ON DELETE CASCADE,
  label       varchar(120) NOT NULL,
  image_url   varchar(600),
  team_name   varchar(80),
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fan_poll_options_poll_idx ON fan_poll_options (poll_id, sort_order ASC);

CREATE TABLE IF NOT EXISTS fan_poll_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid NOT NULL REFERENCES fan_polls(id) ON DELETE CASCADE,
  option_id   uuid NOT NULL REFERENCES fan_poll_options(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)   -- one vote per user per poll
);
CREATE INDEX IF NOT EXISTS fan_poll_votes_option_idx ON fan_poll_votes (option_id);

COMMIT;

-- Jaanch (optional):
--   psql "$DATABASE_URL" -c "\dt fan_poll*"

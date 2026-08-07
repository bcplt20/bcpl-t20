-- ============================================================
-- BCPL T20 — Fan Voting (IPL-style polls), schema-only catch-up
--
-- Adds the fan-poll tables read/written by src/routes/polls.ts
-- (public GET /api/polls + POST /api/polls/:id/vote + admin /api/admin/polls).
-- The API auto-creates/migrates these at runtime (advisory-locked
-- ensureTables()); this file mirrors that DDL EXACTLY so a deploy schema push
-- never asks a question about them.
--
-- Voting is ANONYMOUS-friendly: dedupe is by voter_key ('user:<id>' when a
-- valid player token is present, else 'device:<uuid>'). One vote per
-- (poll_id, voter_key). Raw client IPs are never stored — only ip_hash (used
-- for a soft per-IP-per-poll cap, NOT a hard unique).
--
-- Idempotent + schema-only (no TRUNCATE) — safe to run twice, and safe on a DB
-- that already has the older user_id-NOT-NULL schema (it migrates in place).
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

-- Anonymous-friendly votes. user_id is nullable (guests have none); voter_key
-- carries the dedupe identity; ip_hash is a salted hash for the soft IP cap.
CREATE TABLE IF NOT EXISTS fan_poll_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid NOT NULL REFERENCES fan_polls(id) ON DELETE CASCADE,
  option_id   uuid NOT NULL REFERENCES fan_poll_options(id) ON DELETE CASCADE,
  user_id     uuid,               -- nullable: null for anonymous/device votes
  voter_key   text NOT NULL DEFAULT '',   -- 'user:<id>' | 'device:<uuid>'
  ip_hash     text,               -- sha256(salt|ip); raw IP never stored
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- In-place migration for any pre-existing table that used the older schema
-- (user_id NOT NULL + UNIQUE(poll_id,user_id)). All steps are idempotent.
ALTER TABLE fan_poll_votes ADD COLUMN IF NOT EXISTS voter_key text NOT NULL DEFAULT '';
ALTER TABLE fan_poll_votes ADD COLUMN IF NOT EXISTS ip_hash   text;
ALTER TABLE fan_poll_votes ALTER COLUMN user_id DROP NOT NULL;
UPDATE fan_poll_votes SET voter_key = 'user:' || user_id::text
  WHERE (voter_key IS NULL OR voter_key = '') AND user_id IS NOT NULL;
ALTER TABLE fan_poll_votes DROP CONSTRAINT IF EXISTS fan_poll_votes_poll_id_user_id_key;

-- New uniqueness: one vote per (poll, voter_key).
CREATE UNIQUE INDEX IF NOT EXISTS fan_poll_votes_poll_voter_key_uidx
  ON fan_poll_votes (poll_id, voter_key);
CREATE INDEX IF NOT EXISTS fan_poll_votes_option_idx  ON fan_poll_votes (option_id);
CREATE INDEX IF NOT EXISTS fan_poll_votes_poll_ip_idx ON fan_poll_votes (poll_id, ip_hash);

COMMIT;

-- Jaanch (optional):
--   psql "$DATABASE_URL" -c "\d fan_poll_votes"

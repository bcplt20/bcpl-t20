-- ============================================================
-- BCPL T20 — Community cricket platform, Phase 1 (schema-only catch-up)
--
-- CricHeroes-style community layer on top of the existing community
-- scorer (community_matches / community_innings / community_deliveries).
-- Adds cricket profiles, teams + members, and roster linkage columns.
--
-- The API auto-creates these tables at runtime (ensureTables() in
-- src/routes/community.ts). This file mirrors that DDL EXACTLY so a
-- deploy schema push never asks a question about them.
--
-- Idempotent + schema-only (never destructive) — safe to run twice.
-- Prod (EC2) par ek baar chalana hai:
--   psql "$DATABASE_URL" -f deploy/sql/2026-08-07-community-platform-phase1.sql
-- ============================================================

BEGIN;

-- ── base scorer tables (create first — runtime normally makes these, ──
--    but on a fresh prod deploy this SQL runs BEFORE the new app boots)
CREATE TABLE IF NOT EXISTS community_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  team1 varchar(80) NOT NULL,
  team2 varchar(80) NOT NULL,
  venue varchar(120) NOT NULL DEFAULT '',
  overs_limit int NOT NULL,
  players_per_side int NOT NULL DEFAULT 11,
  status varchar(20) NOT NULL DEFAULT 'live',
  result_desc text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_matches_owner_idx
  ON community_matches (owner_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_innings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES community_matches(id) ON DELETE CASCADE,
  innings_number int NOT NULL,
  batting_team varchar(80) NOT NULL,
  bowling_team varchar(80) NOT NULL,
  total_runs int NOT NULL DEFAULT 0,
  total_wickets int NOT NULL DEFAULT 0,
  overs int NOT NULL DEFAULT 0,
  balls int NOT NULL DEFAULT 0,
  extras int NOT NULL DEFAULT 0,
  target int,
  status varchar(12) NOT NULL DEFAULT 'live',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, innings_number)
);

CREATE TABLE IF NOT EXISTS community_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id uuid NOT NULL REFERENCES community_innings(id) ON DELETE CASCADE,
  over_number int NOT NULL,
  ball_in_over int NOT NULL,
  delivery_in_over int NOT NULL,
  batter_name varchar(80) NOT NULL,
  bowler_name varchar(80) NOT NULL,
  runs_off_bat int NOT NULL DEFAULT 0,
  extras_runs int NOT NULL DEFAULT 0,
  extra_type varchar(10),
  total_runs int NOT NULL DEFAULT 0,
  is_wicket boolean NOT NULL DEFAULT false,
  dismissal_type varchar(24),
  dismissed_batter varchar(80),
  fielder_name varchar(80),
  commentary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_deliveries_innings_idx
  ON community_deliveries (innings_id, created_at DESC);

-- ── cricket profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_profiles (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name  varchar(80) NOT NULL,
  role          varchar(16) NOT NULL,
  batting_style varchar(8)  NOT NULL,
  bowling_style varchar(80),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          varchar(40) NOT NULL,
  short_name    varchar(5)  NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_teams_owner_idx
  ON community_teams (owner_user_id, created_at DESC);

-- ── team members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_team_members (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id  uuid NOT NULL REFERENCES community_teams(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  phone    varchar(15),
  name     varchar(80) NOT NULL,
  role     varchar(24) NOT NULL DEFAULT '',
  added_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_team_members_team_idx
  ON community_team_members (team_id, added_at ASC);
CREATE INDEX IF NOT EXISTS community_team_members_phone_idx
  ON community_team_members (phone);
CREATE INDEX IF NOT EXISTS community_team_members_user_idx
  ON community_team_members (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS community_team_members_team_phone_uq
  ON community_team_members (team_id, phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS community_team_members_team_user_uq
  ON community_team_members (team_id, user_id) WHERE user_id IS NOT NULL;

-- ── roster linkage on existing scorer tables (nullable, backward compatible) ──
ALTER TABLE community_matches
  ADD COLUMN IF NOT EXISTS team_a_id uuid REFERENCES community_teams(id);
ALTER TABLE community_matches
  ADD COLUMN IF NOT EXISTS team_b_id uuid REFERENCES community_teams(id);
ALTER TABLE community_deliveries
  ADD COLUMN IF NOT EXISTS striker_member_id uuid REFERENCES community_team_members(id);
ALTER TABLE community_deliveries
  ADD COLUMN IF NOT EXISTS bowler_member_id uuid REFERENCES community_team_members(id);

COMMIT;

-- Jaanch (optional): nayi tables dikhni chahiye
--   psql "$DATABASE_URL" -c "\dt community_profiles community_teams community_team_members"

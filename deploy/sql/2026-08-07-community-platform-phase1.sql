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

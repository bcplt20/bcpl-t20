-- ============================================================
-- BCPL T20 — Community cricket platform, Phase 2 (schema-only catch-up)
--
-- Adds match officials (owner-appointed scorers / umpires) and the
-- per-match team-verification (OTP) flow on top of the Phase 1 community
-- platform tables.
--
-- The API auto-creates these at runtime (ensureTables() in
-- src/routes/community.ts). This file mirrors that DDL EXACTLY so a deploy
-- schema push never asks a question about them.
--
-- Idempotent + schema-only (never destructive) — safe to run twice.
-- Prod (EC2) par ek baar chalana hai:
--   psql "$DATABASE_URL" -f deploy/sql/2026-08-07-community-platform-phase2.sql
-- (Phase 1 file pehle chalana hai:
--   deploy/sql/2026-08-07-community-platform-phase1.sql)
-- ============================================================

BEGIN;

-- ── match officials (owner appoints scorers / umpires by phone) ──────────────
CREATE TABLE IF NOT EXISTS community_match_officials (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id  uuid NOT NULL REFERENCES community_matches(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      varchar(16) NOT NULL DEFAULT 'scorer',
  added_by  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);
CREATE INDEX IF NOT EXISTS community_match_officials_match_idx
  ON community_match_officials (match_id);
CREATE INDEX IF NOT EXISTS community_match_officials_user_idx
  ON community_match_officials (user_id);

-- ── per-match team verification (OTP) ────────────────────────────────────────
-- A team owned by the match creator is auto-verified at match creation; any
-- other linked team must pass the OTP flow before scoring is allowed.
ALTER TABLE community_matches
  ADD COLUMN IF NOT EXISTS team_a_verified boolean NOT NULL DEFAULT false;
ALTER TABLE community_matches
  ADD COLUMN IF NOT EXISTS team_b_verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS community_team_verifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    uuid NOT NULL REFERENCES community_matches(id) ON DELETE CASCADE,
  team_id     uuid NOT NULL REFERENCES community_teams(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES community_team_members(id) ON DELETE CASCADE,
  code_hash   varchar(64) NOT NULL,  -- sha256 hex; codes never stored in plaintext
  last4       varchar(4)  NOT NULL,
  attempts    int NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  verified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, team_id)
);
CREATE INDEX IF NOT EXISTS community_team_verifications_match_idx
  ON community_team_verifications (match_id);

COMMIT;

-- Jaanch (optional): nayi tables + columns dikhni chahiye
--   psql "$DATABASE_URL" -c "\dt community_match_officials community_team_verifications"
--   psql "$DATABASE_URL" -c "\d community_matches" | grep team_._verified

-- ============================================================
-- BCPL T20 — Community profile/team media (Phase 3), schema-only catch-up
--
-- Adds nullable private-S3-key columns for CricHeroes-style photos:
--   community_profiles.photo_key / cover_key
--   community_teams.logo_key / cover_key
-- Keys point at private objects under the media/ prefix and are only ever
-- served back through a short-lived presigned viewUrl (see src/routes/community.ts).
--
-- The API auto-adds these at runtime (advisory-locked ensureTables()); this
-- file mirrors that DDL EXACTLY. Run the Phase 1 catch-up first (it creates
-- community_profiles / community_teams).
--
-- Idempotent + schema-only (no TRUNCATE) — safe to run twice.
--   psql "$DATABASE_URL" -f deploy/sql/2026-08-07-community-media-phase3.sql
-- ============================================================

BEGIN;

ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS photo_key varchar(300);
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS cover_key varchar(300);

ALTER TABLE community_teams ADD COLUMN IF NOT EXISTS logo_key  varchar(300);
ALTER TABLE community_teams ADD COLUMN IF NOT EXISTS cover_key varchar(300);

COMMIT;

-- Jaanch (optional):
--   psql "$DATABASE_URL" -c "\d community_profiles" | grep _key
--   psql "$DATABASE_URL" -c "\d community_teams"    | grep _key

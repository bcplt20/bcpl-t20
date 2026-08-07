-- ============================================================
-- BCPL T20 — Community profile/team media (Phase 3), schema-only catch-up
--
-- NOTE (fix for prod deploy abort): this file sorts ALPHABETICALLY BEFORE
-- 2026-08-07-community-platform-phase1.sql, so on a fresh prod the community
-- tables may not exist yet when this runs. It now skips silently in that
-- case; the same four columns are ALSO added at the end of
-- 2026-08-07-community-platform-phase2.sql, which runs after the tables exist.
-- Runtime ensureTables() adds them too. Idempotent + schema-only.
-- ============================================================

DO $mediacols$
BEGIN
  IF to_regclass('public.community_profiles') IS NOT NULL THEN
    ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS photo_key varchar(300);
    ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS cover_key varchar(300);
  END IF;
  IF to_regclass('public.community_teams') IS NOT NULL THEN
    ALTER TABLE community_teams ADD COLUMN IF NOT EXISTS logo_key  varchar(300);
    ALTER TABLE community_teams ADD COLUMN IF NOT EXISTS cover_key varchar(300);
  END IF;
END
$mediacols$;

-- ============================================================
-- BCPL T20 — player_profiles jersey/kit sizes (schema-only catch-up)
--
-- Adds trouser / shoe / helmet size columns to player_profiles, collected
-- on the Phase 2 KYC page (after payment) alongside the existing t-shirt
-- size. These are NOT for trials — no kit is given at trials. They are on
-- file only so that if a player is picked into a team via the auction,
-- jersey/kit manufacturing is easy.
--
-- The API auto-creates/patches these at runtime (ensurePlayerProfiles() in
-- src/routes/kyc.ts). This file mirrors that DDL EXACTLY so a deploy schema
-- push never asks a question about them.
--
-- Idempotent + schema-only (never destructive) — safe to run twice. All
-- columns are nullable so existing rows (created before this change) keep
-- working unchanged.
-- Prod (EC2) par ek baar chalana hai:
--   psql "$DATABASE_URL" -f deploy/sql/2026-08-07-player-profiles-jersey-sizes.sql
-- ============================================================

BEGIN;

ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS trouser_size varchar(10);
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS shoe_size    varchar(10);
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS helmet_size  varchar(10);

COMMIT;

-- Jaanch (optional): nayi columns dikhni chahiye
--   psql "$DATABASE_URL" -c "\d player_profiles" | grep -E 'trouser_size|shoe_size|helmet_size'

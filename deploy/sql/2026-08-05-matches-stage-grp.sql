-- Matches: stage (league/semifinal/final) + group letter for schedule display.
-- Idempotent — safe to rerun on every deploy.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stage varchar(20) NOT NULL DEFAULT 'league';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS grp   varchar(20) NOT NULL DEFAULT '';

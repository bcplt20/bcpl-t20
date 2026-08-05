-- Matches: stage (league/semifinal/final) + group letter for schedule display.
-- Idempotent — safe to rerun on every deploy.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stage varchar(20) NOT NULL DEFAULT 'league';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS grp   varchar(20) NOT NULL DEFAULT '';
-- One match number per season — blocks duplicate imports at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS matches_season_match_no_unique ON matches (season, match_no);

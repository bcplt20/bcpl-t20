-- ============================================================
-- BCPL T20 — one-time: scoring tables create (match delete 42P01 fix)
-- Prod DB par live-scoring wali tables (innings, deliveries, match_xi)
-- kabhi bani hi nahi (deploy ka schema push chupchaap atka hua tha).
-- Isi liye admin se match delete karte hi ye error aata tha:
--   Match delete failed [DB 42P01]: relation "deliveries" does not exist
--
-- Ye file wahi 3 tables bana deti hai — bilkul wahi structure aur
-- constraint-naam jo code aur drizzle push expect karte hain (isliye
-- agla deploy push in par koi sawaal nahi puchhega).
--
-- Idempotent hai — do baar chalane par kuch nahi bigadta.
-- Prod (EC2) par ek baar chalana hai:
--   psql "$DATABASE_URL" -f deploy/sql/2026-07-24-create-scoring-tables.sql
-- (Renames wali file alag hai aur wo bhi chalani hai:
--   deploy/sql/2026-07-24-unique-constraint-renames.sql)
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS innings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       uuid NOT NULL,
  innings_number integer NOT NULL,
  batting_team   varchar(80) NOT NULL,
  bowling_team   varchar(80) NOT NULL,
  batting_xi     json NOT NULL DEFAULT '[]'::json,
  bowling_xi     json NOT NULL DEFAULT '[]'::json,
  total_runs     integer NOT NULL DEFAULT 0,
  total_wickets  integer NOT NULL DEFAULT 0,
  overs          integer NOT NULL DEFAULT 0,
  balls          integer NOT NULL DEFAULT 0,
  extras         integer NOT NULL DEFAULT 0,
  target         integer,
  status         varchar(20) NOT NULL DEFAULT 'live',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT innings_match_id_matches_id_fk
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliveries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id       uuid NOT NULL,
  over_number      integer NOT NULL,
  ball_in_over     integer NOT NULL,
  delivery_in_over integer NOT NULL,
  batter_name      varchar(100) NOT NULL,
  bowler_name      varchar(100) NOT NULL,
  runs_off_bat     integer NOT NULL DEFAULT 0,
  extras_runs      integer NOT NULL DEFAULT 0,
  extra_type       varchar(10),
  total_runs       integer NOT NULL,
  is_wicket        boolean NOT NULL DEFAULT false,
  dismissal_type   varchar(30),
  dismissed_batter varchar(100),
  fielder_name     varchar(100),
  commentary       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deliveries_innings_id_innings_id_fk
    FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_xi (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      uuid NOT NULL,
  team          varchar(80) NOT NULL,
  player_name   varchar(100) NOT NULL,
  player_role   varchar(10) NOT NULL,
  batting_order integer NOT NULL,
  is_playing    boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_xi_match_id_matches_id_fk
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

COMMIT;

-- Jaanch (optional): teeno tables dikhni chahiye
--   psql "$DATABASE_URL" -c "\dt innings deliveries match_xi"

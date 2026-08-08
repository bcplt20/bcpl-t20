-- ============================================================
-- BCPL T20 — Growth round tables, schema-only catch-up
--
-- Prod par drizzle push "Is push_tokens table created or renamed?" sawaal
-- par ruk raha tha: growth round ki 3 nayi tables prod par missing thi.
-- Ye file unhe DEV DB ke hu-ba-hu naam/DDL ke saath pehle se bana deti hai
-- (runtime ensurePushTables() ka mirror + drizzle schema) — push ko phir
-- koi nayi table nahi dikhti, sawaal nahi aata.
--
--   push_tokens          — Expo push tokens (mobile app)
--   notifications_inbox  — in-app notification inbox (dedupe_key runtime col)
--   match_moments        — admin-pinned highlight clip per ball
--
-- Idempotent + schema-only (no TRUNCATE, no data touch) — do baar chalna safe.
--   psql "$DATABASE_URL" -f deploy/sql/2026-08-08-growth-push-inbox-moments.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS push_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id),
  expo_token   varchar(200) NOT NULL UNIQUE,
  platform     varchar(10)  NOT NULL DEFAULT 'unknown',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  last_seen_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens (user_id);

CREATE TABLE IF NOT EXISTS notifications_inbox (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id),
  type       varchar(40)  NOT NULL,
  title      varchar(160) NOT NULL,
  body       text         NOT NULL,
  data       jsonb,
  dedupe_key varchar(160),
  read_at    timestamptz,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_inbox_user_idx
  ON notifications_inbox (user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_inbox_dedupe_uq
  ON notifications_inbox (dedupe_key) WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS match_moments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  innings_number integer NOT NULL,
  over_number    integer NOT NULL,
  ball_in_over   integer NOT NULL,
  clip_url       varchar(1000) NOT NULL,
  caption        varchar(200),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, innings_number, over_number, ball_in_over)
);

COMMIT;

-- BCPL T20 — Production RDS Table Creation Script
-- Run via: psql "$DATABASE_URL" -f create_tables.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100)  NOT NULL,
  phone       VARCHAR(15)   NOT NULL UNIQUE,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  is_verified BOOLEAN       NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. registrations
CREATE TABLE IF NOT EXISTS registrations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES users(id),
  role           VARCHAR(20)  NOT NULL,
  trial_city     VARCHAR(50),
  phase1_status  VARCHAR(30)  NOT NULL DEFAULT 'pending',
  phase2_status  VARCHAR(30),
  video_deadline TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. phase1_payments
CREATE TABLE IF NOT EXISTS phase1_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id     UUID          NOT NULL REFERENCES registrations(id),
  amount              NUMERIC(10,2) NOT NULL,
  cashfree_order_id   VARCHAR(100)  NOT NULL UNIQUE,
  cashfree_payment_id VARCHAR(100),
  status              VARCHAR(20)   NOT NULL DEFAULT 'pending',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 4. phase1_videos
CREATE TABLE IF NOT EXISTS phase1_videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID        NOT NULL REFERENCES registrations(id),
  s3_key           VARCHAR(500),
  s3_url           VARCHAR(1000),
  duration_seconds INTEGER,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status           VARCHAR(20) NOT NULL DEFAULT 'submitted'
);

-- 5. phase2_payments
CREATE TABLE IF NOT EXISTS phase2_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id     UUID          NOT NULL REFERENCES registrations(id),
  amount              NUMERIC(10,2) NOT NULL,
  cashfree_order_id   VARCHAR(100)  NOT NULL UNIQUE,
  cashfree_payment_id VARCHAR(100),
  status              VARCHAR(20)   NOT NULL DEFAULT 'pending',
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 6. kyc_records
CREATE TABLE IF NOT EXISTS kyc_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID        NOT NULL REFERENCES registrations(id),
  profession       VARCHAR(100),
  aadhaar_ref      VARCHAR(100),
  pan_ref          VARCHAR(100),
  cashfree_kyc_id  VARCHAR(100),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. trial_venues
CREATE TABLE IF NOT EXISTS trial_venues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city           VARCHAR(100) NOT NULL,
  venue          VARCHAR(255) NOT NULL,
  trial_date     VARCHAR(50)  NOT NULL,
  trial_time     VARCHAR(50)  NOT NULL,
  reporting_time VARCHAR(50)  NOT NULL,
  slots          INTEGER      NOT NULL DEFAULT 100,
  notes          TEXT,
  status         VARCHAR(30)  NOT NULL DEFAULT 'upcoming',
  announced_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 8. innings (depends on matches which already exists)
CREATE TABLE IF NOT EXISTS innings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  innings_number INTEGER     NOT NULL,
  batting_team   VARCHAR(80) NOT NULL,
  bowling_team   VARCHAR(80) NOT NULL,
  batting_xi     JSON        NOT NULL DEFAULT '[]',
  bowling_xi     JSON        NOT NULL DEFAULT '[]',
  total_runs     INTEGER     NOT NULL DEFAULT 0,
  total_wickets  INTEGER     NOT NULL DEFAULT 0,
  overs          INTEGER     NOT NULL DEFAULT 0,
  balls          INTEGER     NOT NULL DEFAULT 0,
  extras         INTEGER     NOT NULL DEFAULT 0,
  target         INTEGER,
  status         VARCHAR(20) NOT NULL DEFAULT 'live',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. match_xi
CREATE TABLE IF NOT EXISTS match_xi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team          VARCHAR(80) NOT NULL,
  player_name   VARCHAR(100) NOT NULL,
  player_role   VARCHAR(10)  NOT NULL,
  batting_order INTEGER      NOT NULL,
  is_playing    BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 10. notification_logs (depends on users)
CREATE TABLE IF NOT EXISTS notification_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id),
  type       VARCHAR(20) NOT NULL,
  template   VARCHAR(50) NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Registration drafts — server-side autosave for incomplete registrations.
-- A draft is NOT a registered player; OTP values are never stored here.
CREATE TABLE IF NOT EXISTS registration_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_number VARCHAR(20) UNIQUE NOT NULL,
  client_key VARCHAR(64) NOT NULL,
  full_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(15),
  dob DATE,
  calculated_age INTEGER,
  role VARCHAR(20),
  trial_city VARCHAR(50),
  mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  otp_requested_at TIMESTAMPTZ,
  last_completed_step VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT_STARTED',
  phase1_payment_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
  user_id UUID REFERENCES users(id),
  registration_id UUID REFERENCES registrations(id),
  source JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  abandoned_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_drafts_client_key ON registration_drafts(client_key);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON registration_drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_phone ON registration_drafts(phone);

\echo 'All tables created successfully!'

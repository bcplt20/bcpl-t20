-- Legacy registrations imported from the old WordPress site (CSV uploads via admin panel).
-- Idempotent: safe to re-run on every deploy.
CREATE TABLE IF NOT EXISTS legacy_registrations (
  id                SERIAL PRIMARY KEY,
  source            VARCHAR(16)  NOT NULL,
  legacy_reg_id     INTEGER      NOT NULL,
  first_name        VARCHAR(120) NOT NULL,
  last_name         VARCHAR(120),
  phone             VARCHAR(15)  NOT NULL,
  email             VARCHAR(255),
  dob               DATE,
  state             VARCHAR(120),
  city              VARCHAR(120),
  trial_city        VARCHAR(120),
  role              VARCHAR(60),
  trial_status      VARCHAR(40),
  payment_status    VARCHAR(40),
  amount_paise      INTEGER      NOT NULL DEFAULT 0,
  payment_date      TIMESTAMPTZ,
  referral_code     VARCHAR(80),
  legacy_updated_at TIMESTAMPTZ,
  imported_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS legacy_registrations_source_regid_uq ON legacy_registrations (source, legacy_reg_id);
CREATE INDEX IF NOT EXISTS legacy_registrations_phone_idx ON legacy_registrations (phone);

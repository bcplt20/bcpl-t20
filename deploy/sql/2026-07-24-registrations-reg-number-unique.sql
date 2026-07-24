-- ============================================================
-- BCPL T20 — one-time: registrations.reg_number par UNIQUE constraint
-- drizzle push isi par "table truncate karein?" wala KHATARNAK sawaal
-- puchh raha tha. Pehle se laga denge to sawaal aayega hi nahi.
-- Data ko koi haath nahi lagta — sirf ek constraint judta hai.
--
-- Idempotent — do baar chalne par kuch nahi bigadta.
-- deploy.sh ise apne aap chalata hai (deploy/sql/*.sql sab).
-- Agar ye FAIL ho: matlab reg_number me duplicate values hain —
-- pura output Replit Agent ko bhejo.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registrations_reg_number_unique'
      AND conrelid = 'registrations'::regclass
  ) THEN
    ALTER TABLE registrations
      ADD CONSTRAINT registrations_reg_number_unique UNIQUE (reg_number);
    RAISE NOTICE 'reg_number unique constraint laga diya';
  ELSE
    RAISE NOTICE 'reg_number unique pehle se hai - skip';
  END IF;
END $$;

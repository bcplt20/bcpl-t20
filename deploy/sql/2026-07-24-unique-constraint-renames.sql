-- ============================================================
-- BCPL T20 — one-time constraint-name alignment (task: db push stuck)
-- Postgres ke default unique-constraint naam (<table>_<col>_key) ko
-- drizzle ke expected naam (<table>_<col>_unique) par rename karta hai.
-- Iske baad `pnpm run push` kabhi purane "teams/whatsapp_templates"
-- sawaal par nahi atkega.
--
-- Idempotent hai — do baar chalane par kuch nahi bigadta.
-- Prod par ek baar chalana hai:
--   psql "$DATABASE_URL" -f deploy/sql/2026-07-24-unique-constraint-renames.sql
-- ============================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conrelid::regclass::text AS tbl, conname
    FROM pg_constraint
    WHERE contype = 'u' AND conname LIKE '%\_key'
  LOOP
    EXECUTE format(
      'ALTER TABLE %s RENAME CONSTRAINT %I TO %I',
      r.tbl, r.conname, regexp_replace(r.conname, '_key$', '_unique')
    );
    RAISE NOTICE 'renamed % on %', r.conname, r.tbl;
  END LOOP;
END $$;

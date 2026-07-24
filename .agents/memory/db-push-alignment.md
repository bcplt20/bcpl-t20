---
name: drizzle push alignment
description: Why drizzle-kit push gets stuck on interactive prompts and how to keep it non-interactive
---

# drizzle-kit push stuck on prompts — root causes & fixes

**Rule:** `pnpm run push` (lib/db) must always run clean with `</dev/null`. Any interactive prompt = DB/schema misalignment to fix at the source, never answered by hand.

**Why:** July 2026 — push was permanently stuck on two classes of drift:
1. **Constraint-name mismatch:** unique constraints created manually/by old SQL get postgres default names (`<table>_<col>_key`), but drizzle-kit expects `<table>_<col>_unique` and proposes re-adding (with a scary truncate question). Fix = RENAME, never re-create: `deploy/sql/2026-07-24-unique-constraint-renames.sql` (idempotent, renames all `*_key` uniques). Ran on dev 2026-07-24; prod needs it once via psql.
2. **Runtime-created tables missing from schema:** tables made by app code at boot (`CREATE TABLE IF NOT EXISTS`, e.g. `app_flags` one-time-migration markers from register.ts) look like "delete me" to push. NEVER accept the delete — dropping app_flags would re-run guarded one-time wipes. Fix = declare the table in lib/db/src/schema with EXACTLY matching column shapes.

**How to apply:** Adding any runtime `ensureX`/`CREATE TABLE IF NOT EXISTS`? Mirror it in lib/db schema in the same change. Seeing a push prompt about `X_key`? Rename to `X_unique` via SQL. Exit code is 0 even when push dies on the TTY error — never trust `$?`, grep output for "Changes applied".

---
name: drizzle push alignment
description: Why drizzle-kit push gets stuck on interactive prompts and how to keep it non-interactive
---

# drizzle-kit push must stay prompt-free

**Rule:** `pnpm run push` (lib/db) must always run clean with `</dev/null`. Any interactive prompt = DB↔schema drift to fix at the source, never answered by hand.

**Why:** Two drift classes silently accumulate and wedge push:
1. **Constraint-name mismatch** — unique constraints created manually or by old SQL carry postgres default names (`<table>_<col>_key`); drizzle expects `<table>_<col>_unique` and proposes destructive re-creation. Fix = `ALTER TABLE … RENAME CONSTRAINT`, never re-create. An idempotent rename script for all affected tables lives in `deploy/sql/` (dev already ran it; prod must run it once via psql before its first push).
2. **Runtime-created tables missing from schema** — tables the app creates at boot (`CREATE TABLE IF NOT EXISTS`, e.g. one-time-migration markers like `app_flags`) look like "delete me" to push. NEVER accept the delete (dropping markers re-runs guarded one-time migrations). Fix = declare the table in lib/db schema with exactly matching columns.

**How to apply:** Adding any runtime `ensureX` table? Mirror it in lib/db schema in the same change. Push prompting about `X_key`? Rename it to `X_unique` via SQL. drizzle-kit exits 0 even when the TTY prompt kills it — never trust `$?`, grep output for "Changes applied".

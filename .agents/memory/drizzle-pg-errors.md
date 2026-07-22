---
name: Drizzle pg error codes
description: How to detect Postgres constraint violations (unique 23505 etc.) through drizzle-orm's error wrapping
---

Drizzle (0.45+, node-postgres driver) wraps database errors in `_DrizzleQueryError`. The wrapper's `.message` is only `Failed query: <sql>\nparams: <params>` — the actual Postgres error ("duplicate key value violates unique constraint …", code `23505`) lives in `.cause`. Pino's err serializer *appears* to show it in `message`, which is misleading when debugging.

**Rule:** to catch a unique violation (or any pg error class), walk the `.cause` chain and check `code === "23505"` / message text on each level; never test only the top-level `error.message`.

**Why:** a `msg.includes("duplicate key")` check on the top-level message silently fails → the API returns 500 instead of the intended 409. Found while building referral-code creation.

**How to apply:** reuse `isUniqueViolation()` in `artifacts/api-server/src/routes/marketing.ts` (walks up to 4 `.cause` levels), or copy that pattern for other constraint handling. Raw-SQL `CREATE TABLE ... UNIQUE` constraints get pg auto-names like `<table>_<col>_key` (not drizzle's `<table>_<col>_unique`), so never match on constraint names either.

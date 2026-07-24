---
name: Concurrent ensureX DDL race
description: CREATE TABLE IF NOT EXISTS races under concurrent boot — advisory-lock the DDL
---

`CREATE TABLE IF NOT EXISTS` (and CREATE INDEX IF NOT EXISTS) is **not** safe under
concurrency: two sessions running it simultaneously can both pass the existence
check and one dies with `23505 duplicate key … pg_type_typname_nsp_index`.

**Where it bites here:** PM2 cluster runs 2 API workers that boot (and run the
startup `ensureX()` migrations) at the same instant on EC2; vitest runs test
files in parallel and multiple files call ensure functions in `beforeAll`.

**Fix pattern (used by `ensureOutboxTable`):**
```ts
await db.transaction(async (tx) => {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:<name>:ddl'))`);
  await tx.execute(sql`CREATE TABLE IF NOT EXISTS …`);
  await tx.execute(sql`CREATE INDEX IF NOT EXISTS …`);
});
```
xact-scoped lock auto-releases at commit and stays on one pooled connection
(session-scoped `pg_advisory_lock` via a pool is a leak trap — different
connections for lock/unlock).

**How to apply:** every NEW ensureX() startup migration should use this wrapper.
Existing ones have survived by luck + the startup retry loop; if one starts
flaking at boot or in tests, this race is the first suspect.

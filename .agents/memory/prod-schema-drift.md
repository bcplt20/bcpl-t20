---
name: Prod schema drift & FK sweep
description: Why prod-only FK 500s happen (silenced deploy push) and how FK discovery must be done (pg_constraint, not information_schema)
---

**Rule 1:** Prod RDS has outlived several schema versions. Root cause (July 2026): the deploy push flag `--yes` never existed in this drizzle-kit — every deploy's push died on a usage error and the `2>/dev/null || true` silencing hid it, so prod schema froze while dev moved on (whole scoring tables missing → match delete 42P01). **Lesson:** a silenced "best-effort" migration step is worse than none — validate the invocation actually runs, gate deploys on its declared success phrases, and abort BEFORE build/reload so a failed push never rolls forward. One-time catch-up SQL for prod lives under deploy/sql/. Any prod-only 500/42P01 on writes/deletes: suspect drift first.

**Rule 2:** FK discovery must key on OIDs via `pg_constraint` (conrelid/confrelid + conkey[1]/confkey[1]). NEVER join `information_schema` FK views by constraint_name — names are not unique across tables and the tuples cross-associate (architect-caught bug; wrong-table deletes).

**Rule 3 (design decision):** Admin force-delete of a match sweeps rows from UNKNOWN child tables referencing matches/innings/deliveries inside the delete transaction (single-column FKs → id). Residual 23503 → 409 naming the blocking table. **Why:** confirmed force-delete promises "everything attached goes"; legacy prod tables would otherwise 500 forever and dev can never reproduce them.

**How to apply:** new parent-entity delete endpoints should reuse this pattern (or extract it) rather than assuming dev schema = prod schema. Global JSON error middleware in app.ts logs the pg cause chain (code/table/constraint/detail) — check pm2 logs for "unhandled route error" entries when prod 500s appear.

## Recursive FK sweep + self-diagnosing errors (July 2026)
Match delete now uses sweepFkDelete (matches.ts): walks pg_constraint edges recursively (post-order, any depth, non-id ref cols, self-FK closure); cross-table cycles/composite FKs degrade to a 409 NAMING the table. Pattern for any "works in dev, blank 500 on prod, logs unreachable" bug: make the endpoint return its real DB error (code+table+message) to the ADMIN — the owner's next attempt becomes the diagnostic. adminReq surfaces the JSON `error` field verbatim, so whatever the API writes there lands on the owner's screen.

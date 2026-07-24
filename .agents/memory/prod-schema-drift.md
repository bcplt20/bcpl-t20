---
name: Prod schema drift & FK sweep
description: Why prod-only FK 500s happen (silenced deploy push) and how FK discovery must be done (pg_constraint, not information_schema)
---

**Rule 1:** Prod RDS has outlived several schema versions. Root cause found July 2026: deploy ran `drizzle-kit push --yes 2>/dev/null || true`, but **`--yes` does not exist in this drizzle-kit** — the push died on a usage error EVERY deploy since day one, and the silencing hid it. So prod schema froze while dev moved on (whole scoring tables missing → match delete 42P01), and prod can also hold legacy tables/columns unknown to the current build. Any prod-only 500/42P01 on writes/deletes: suspect drift first. deploy.sh now runs `pnpm run push-force` (--force, non-interactive), prints the output, and ABORTS the deploy (before build/reload) unless it sees "Changes applied"/"No changes". Catch-up SQL for prod: deploy/sql/2026-07-24-create-scoring-tables.sql (+ the constraint-renames file).

**Rule 2:** FK discovery must key on OIDs via `pg_constraint` (conrelid/confrelid + conkey[1]/confkey[1]). NEVER join `information_schema` FK views by constraint_name — names are not unique across tables and the tuples cross-associate (architect-caught bug; wrong-table deletes).

**Rule 3 (design decision):** Admin force-delete of a match sweeps rows from UNKNOWN child tables referencing matches/innings/deliveries inside the delete transaction (single-column FKs → id). Residual 23503 → 409 naming the blocking table. **Why:** confirmed force-delete promises "everything attached goes"; legacy prod tables would otherwise 500 forever and dev can never reproduce them.

**How to apply:** new parent-entity delete endpoints should reuse this pattern (or extract it) rather than assuming dev schema = prod schema. Global JSON error middleware in app.ts logs the pg cause chain (code/table/constraint/detail) — check pm2 logs for "unhandled route error" entries when prod 500s appear.

## Recursive FK sweep + self-diagnosing errors (July 2026)
Match delete now uses sweepFkDelete (matches.ts): walks pg_constraint edges recursively (post-order, any depth, non-id ref cols, self-FK closure); cross-table cycles/composite FKs degrade to a 409 NAMING the table. Pattern for any "works in dev, blank 500 on prod, logs unreachable" bug: make the endpoint return its real DB error (code+table+message) to the ADMIN — the owner's next attempt becomes the diagnostic. adminReq surfaces the JSON `error` field verbatim, so whatever the API writes there lands on the owner's screen.

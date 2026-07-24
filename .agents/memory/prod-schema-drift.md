---
name: Prod schema drift & FK sweep
description: Why prod-only FK 500s happen (silenced deploy push) and how FK discovery must be done (pg_constraint, not information_schema)
---

**Rule 1:** Prod RDS has outlived several schema versions. `deploy/deploy.sh` runs `drizzle-kit push --yes 2>/dev/null || true` — best-effort AND silenced (a pending interactive "teams" question makes it halt; tracked as a proposed task). So prod can hold legacy tables/columns unknown to the current build. Any prod-only 500 on writes/deletes: suspect drift first.

**Rule 2:** FK discovery must key on OIDs via `pg_constraint` (conrelid/confrelid + conkey[1]/confkey[1]). NEVER join `information_schema` FK views by constraint_name — names are not unique across tables and the tuples cross-associate (architect-caught bug; wrong-table deletes).

**Rule 3 (design decision):** Admin force-delete of a match sweeps rows from UNKNOWN child tables referencing matches/innings/deliveries inside the delete transaction (single-column FKs → id). Residual 23503 → 409 naming the blocking table. **Why:** confirmed force-delete promises "everything attached goes"; legacy prod tables would otherwise 500 forever and dev can never reproduce them.

**How to apply:** new parent-entity delete endpoints should reuse this pattern (or extract it) rather than assuming dev schema = prod schema. Global JSON error middleware in app.ts logs the pg cause chain (code/table/constraint/detail) — check pm2 logs for "unhandled route error" entries when prod 500s appear.

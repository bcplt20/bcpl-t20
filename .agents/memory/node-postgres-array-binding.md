---
name: node-postgres raw-sql array binding
description: drizzle sql template + node-postgres binds JS arrays as one string — malformed array literal; how to write list conditions safely
---
Rule: with drizzle's `sql` template on node-postgres, never interpolate a JS array into raw SQL as `= ANY(${list}::text[])` — the driver binds the array as ONE plain-string parameter and Postgres throws "malformed array literal" at runtime.

**Why:** hit in trial-ops supervisor counters (July 2026); the same latent bug existed at 3 older city-scope filter sites that only "worked" because a truthy guard short-circuited before the query ran. tsc cannot catch it.

**How to apply:** use `IN` with per-element binds: `` sql`col IN (${sql.join(list.map(c => sql`${c}`), sql`, `)})` ``. Handle the empty list explicitly (render `FALSE` when `[]` means blocked scope). A shared city-scope condition helper exists in the trials routes — reuse it instead of writing new raw list conditions.

Related trap (same driver): `db.execute(sql...)` returns a pg `QueryResult` — rows live under `.rows`, the result is NOT iterable/indexable itself.

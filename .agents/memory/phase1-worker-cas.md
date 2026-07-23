---
name: Phase1 worker CAS claims
description: Claim-token compare-and-set pattern for phase1 pipeline workers; how to write terminal states and how tests must assert
---

**Rule:** Every phase1 pipeline worker (validity, scoring, release) generates `runToken = randomUUID()` per run, stamps it into `phase1_evaluations.claim_token` on both fresh claims and stale reclaims, and performs ALL terminal/error writes via `casEvalUpdate(evalId, runToken, set)` (`src/lib/evalClaims.ts`) — never a bare `db.update().where(id)`. Metrics/logs/side-effects only fire when the CAS applied. `failVideoForReupload` takes an optional trailing `claimToken` and returns `false` (skipping video-flip + notify) when the claim was lost.

**Why:** Scheduler tick + admin triggers + stale-reclaim sweeps can process the same row concurrently; last-write-wins overwrote finished evaluations and double-sent notifications. Stale windows are generous (validity 60min, scoring 120min) because CAS makes early reclaim harmless.

**How to apply:**
- New worker or new terminal write → route it through `casEvalUpdate`; count metrics only inside `if (applied)`.
- Notifications stay exactly-once via reserve-first dedupe: `insert notification_logs … onConflictDoNothing().returning()` and bail if no row returned (dedupe keys like `p1_result_<evalId>`).
- `ranking_snapshots` insert uses `.onConflictDoNothing()` — first snapshot is frozen forever (§34); never switch back to upsert.
- **Tests:** the 2-min tick can legitimately race admin triggers, so E2E scripts must assert DB end-state (`SELECT status FROM phase1_evaluations …`), never exact counts from the admin-run JSON — especially after the 31s config-cache sleeps.

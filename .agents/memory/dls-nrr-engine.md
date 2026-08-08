---
name: DLS & NRR engine
description: ICC net run rate auto points table + DLS Standard Edition — where authority lives, contracts, traps.
---

- Points table is AUTO-recomputed from scratch (idempotent) from completed official matches on: innings-2 completion, match status edit, match delete, manual recompute endpoint. Legacy incremental "result" endpoint is deprecated → triggers full recompute. NEVER write standings incrementally.
- NRR denominators: all-out or DLS-shortened innings charges the (revised ?? original ?? 20) allocation, not actual overs; decimal cricket overs converted (17.3 → 17.5).
- DLS = Standard Edition public resource table (Professional is ICC-proprietary — say so in user-facing copy). `lib/dls.ts` + `lib/matchResult.ts`; reduction endpoint POST /api/scoring/:matchId/dls (supports innings 2 pre-creation via matches.dls_innings2_overs "deferred", and applyBothInnings for rain before the chase).
- **Server is sole authority for innings completion, result text ("(DLS method)") and points.** Admin web scorer must sync from ball-response `inningsComplete` and never compute result/points client-side. **Why:** client-side finish flow overwrote DLS results and double-counted standings (caught by review).
- Trap: website admin scoring helpers once pointed at a nonexistent `/scoring/admin/scoring/...` path — comments in scoring.ts say "admin/scoring" but real mounts are `/api/scoring/:matchId/...`. Trust router.use + route defs, not comments.
- All scoring mutations (ball, innings-end, undo, dls) take a match-row FOR UPDATE tx first.
- Flaky in full parallel vitest run: adminLoginRateLimit circuit-breaker + one communityPlatform profile test (shared rate-limit counters / DB contention) — always re-verify in isolation before treating as regressions.

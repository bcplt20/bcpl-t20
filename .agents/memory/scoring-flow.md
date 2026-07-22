---
name: Live scoring flow conventions
description: Client/server parity rules for BCPL ball-by-ball scoring — legality, finalization gating, restart semantics
---

# Live scoring flow conventions

**Rules:**
- Leg-byes/byes are LEGAL deliveries on BOTH client engine and server `/ball` (over advances, batter faces, bowler charged). Wides/no-balls are not. Any change must be made in both places + the undo route + buildScorecard aggregation, or state drifts.
- The admin scoring client keeps a local engine mirroring the server ball-for-ball; every `recordBall` promise resolves a boolean success flag, and ALL finalization side-effects (`endInnings`, `updateMatchStatus`, `recordMatchResult`) are chained on that flag. Never fire finalization if the final ball failed to persist — that corrupts standings.
- `POST .../xi` = clean restart: it wipes existing innings for the match (deliveries cascade). Reopening a live match warns the admin that prior scoring resets. `POST .../innings-end` is idempotent (returns existing innings 2).
- Server `/ball` auto-completes innings and flips match status; client must chain `endInnings`/result calls AFTER the final recordBall resolves or the last ball lands in innings 2.

**Why:** review found finalization ran even when the last ball failed to save (standings corruption), duplicate innings rows from re-setup, and LB/B previously never completing an over server-side.

**How to apply:** any future change to scoring outcomes, extras, dismissals, or match completion — touch client engine + server route + undo + scorecard together, and keep the success-gating intact.

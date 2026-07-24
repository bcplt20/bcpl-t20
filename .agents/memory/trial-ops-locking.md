---
name: Trial-ops write serialization & wave map
description: locking convention for staff trial scoring writes + QR-trial-ops wave status (W1 done, W2-W6 pending)
---
Rule: EVERY write path touching trial attempts or evaluations (record attempt, undo, submit, any future endpoint) must first `SELECT ... FOR UPDATE` the trial_allocations row inside a `db.transaction`, re-check the submitted-eval lock INSIDE the tx, and pass the tx down to helpers (`activeEvaluation` / `attemptState` accept a `dbc` param defaulting to `db`).

**Why:** architect review caught a post-lock mutation race — attempt/undo checked the lock, then wrote without serialization vs submit, so attempts could slip in after finalization and desync the frozen attempt_summary. FOR UPDATE on the allocation row serializes all writers; attempt_summary freezes exactly the snapshot that was scored. Note: 23505 retry loops must wrap the WHOLE transaction (a unique violation aborts the pg tx, no partial retry inside).

**How to apply:** new W2+ endpoints writing attempts/evals copy this pattern. Correction-request authz/listing uses the ALLOCATION (venue) city, not registrations.trial_city (which lags cross-city reallocation). Rubric overrides live in settings key `trial_rubrics_v1` (HEAD_ASSESSOR-only, validated on write with the same rules `activeRubrics()` applies on read).

Wave status (owner's 53-section QR trial-ops spec in attached_assets/Pasted--BCPL-PHASE-2-QR-TRIAL-OPERATIONS-COACH-APP...txt):
- W1 SHIPPED (July 2026): staff app at /staff — gate QR GREEN/RED, check-in, blind coach scoring (no PII), 6-attempt control + undo + feeder-error, locked 100-pt evaluations, correction workflow, rubric override settings key.
- Pending: W2 exit-scan + full supervisor dashboard + wristband QR pool (owner procurement decision needed), W3 second-eval/anomaly/player states, W4 offline sync, W5 zones/freeze/allocation/pool publish, W6 simulation/load.
- E2E: `api-server/e2e/staff-trial-ops.sh` (47 checks incl. post-lock concurrency storm; self-cleaning fixtures on BCPL-DEL-1).

## Wristband QR design (owner, July 2026)
Trial-day check-in: each player's QR is PRE-PRINTED on a wristband with their registration number (both known beforehand — QR encodes the reg ID, nothing dynamic). Wristband is handed out AT THE VENUE on trial day only. So gate check-in = scan QR → lookup by registration ID; no on-the-spot QR generation or player-side screen needed.

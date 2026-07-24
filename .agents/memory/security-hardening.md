---
name: Security hardening lessons
description: Durable rules from the July 2026 security audit/fix round — payment status columns, amount-gate coverage, OTP lockout design, audit-write races
---

## Payment `status` columns are varchar(20)
Long status strings (e.g. "reconciliation_required") overflow and the pg error gets **swallowed by catch-all webhook handlers** — the symptom is a silent no-op, not an error. Use short statuses (`amount_mismatch` is at the edge).
**Why:** cost a full debugging round; webhook handlers deliberately never 5xx, so they eat DB exceptions.
**How to apply:** any new payment/registration status value → check column width first; when a webhook "does nothing", suspect a swallowed DB error before anything else.

## ONE amount-gate for ALL success paths
Every path that can promote a payment to success (verify endpoint, webhook, reconcile sweep, anything future) must run the same `paymentAmountMismatch` gate. The reconcile sweep was a full bypass until an architect review caught it.
**Why:** the sweep exists precisely for payments that missed the gated paths — if it doesn't re-check, the control is decorative.
**How to apply:** grep for `markSuccess`/status-to-success writes when touching payments; new promotion path ⇒ gate + regression test in `reconcileIntegrity.test.ts` style (mock cashfree, call the single-order function, never the whole sweep against the shared dev DB).

## Never key lockouts on the victim's identifier (unauthenticated endpoints)
Counting OTP verify failures per phone regardless of session let anyone lock any phone out of login (lockout-DoS). Correct design: count only when a LIVE otp session exists, and on cap **burn the session** (mark used) instead of locking the phone; add per-IP throttles for bulk abuse.
**Why:** architect review flagged it as severe; classic account-lockout DoS.
**How to apply:** any future rate-limit/lockout on unauthenticated routes — ask "can attacker A make victim B hit this limit?" If yes, redesign (per-session/per-IP, or make the consequence self-healing like session burn).

## writeAudit is fire-and-forget → tests race it
Routes call `void writeAudit(...)` and respond immediately; a test querying the audit table right after the response is flaky under load. Poll briefly (≤2s) for audit rows in tests; don't "fix" by awaiting in routes (non-blocking is intentional).

## Audit/report artifacts
`threat_model.md` + `SECURITY_AUDIT_REPORT.md` live at repo root; master security prompt is in `attached_assets/Pasted--BCPL-COMPLETE-SECURITY-*.txt` (sections A–BP, 20-item output list). Load/stress/backup/monitoring items are OPEN and need the owner's EC2/AWS access — never fabricate those numbers.

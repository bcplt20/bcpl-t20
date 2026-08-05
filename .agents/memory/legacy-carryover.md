---
name: Season-4 paid carryover login
description: Old-site PAID players get free Phase-2 entry on OTP login; unpaid must re-register
---
Rule: a phone matching legacy_registrations source='paid' (last-10-digit match; old exports carry country codes) may OTP-login with no new account; verify-otp auto-provisions user + registration with phase1Status='selected', phase2Status='payment_done' — the exact state after normal Phase-2 payment, so the KYC gate and trial-pass gate work unchanged. Reg number assigned (paid-only rule). Marker: consents.legacyCarryover.

**Why:** owner promised Season-4 paid players trials for TWO seasons on one payment — they skip both Phase-1 and Phase-2 fees this season. Unpaid legacy rows get nothing (must register afresh; a re-register campaign covers messaging them).

**How to apply:** any new stage-conversion/marketing metric keyed on phase1Status='selected' must expect carryover rows with NO phase1/phase2 payment records (finance sums are payment-table based, unaffected). Provisioning is advisory-locked + atomic OTP consumption — keep it exactly-once if touched.

**Upgrade path (Aug'26):** verify-otp always calls provisionLegacyCarryover on login; if the user already has a fresh-season reg in an early phase1 state (pending/payment_pending/payment_done/video_submitted) it is upgraded IN PLACE (selected + payment_done, reg number assigned, atomic consents merge) — never duplicated, never downgrades qualified/rejected/selected. /payment/phase2/create now 409s when phase2Status is already settled, so waived players can't be double-billed.

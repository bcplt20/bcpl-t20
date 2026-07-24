---
name: Player-UI auth testing
description: How to verify authenticated player pages (profile, trial pass) in a real browser — mint player JWT, inject bcpl_auth_v1, seed trial fixtures safely.
---

**Never drive the OTP login flow for verification — real MSG91 keys live in dev and existing users can have real phone numbers. Mint the JWT directly instead.**

## Recipe
1. **Mint player token** (from `artifacts/api-server`, `.env` loaded): payload is exactly `{ userId, phone }`, signed with `process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD"` (see `src/lib/auth.ts`). Use only test users with impossible phones (9999999912, 889722967xx pattern).
2. **Website session injection:** localStorage key `bcpl_auth_v1` = `{ token, user:{id,name,phone,email}, loginTime:Date.now(), lastActivity:Date.now() }` (48h inactivity window; missing token/user → key silently removed). Playwright tester: navigate to the site base path first, `localStorage.setItem`, reload; if a page bounces to logged-out state, re-inject on the current origin and reload once.
3. **Trial fixture seeding:** copy the SQL flow from `api-server/e2e/staff-trial-ops.sh` — trial_venues → trial_slots → trial_allocations (random 64-hex pass_token). Check-in = `trial_checkins` insert. "Assessment recorded" = **`trial_evaluations`** insert (NOT `physical_assessments` — that's only the legacy admin bridge and does not flip `assessmentSubmitted`).
4. **Restore afterwards:** save original registration fields up front, delete seeded rows, restore statuses. Keep IDs in a temp env file while the tester runs.

**Why:** OTP flow risks real SMS sends and burns time; JWT mint + storage injection gives the Playwright tester full authed access to any player state in seconds, letting screenshots/evidence cover states (awaiting check-in / checked-in / completed) that are impossible to reach read-only.

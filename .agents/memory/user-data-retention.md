---
name: User data retention rule
description: Owner's standing rule — NEVER delete player/user data unless he explicitly asks, and destructive SQL must never be a repeatable catch-up file
---

**Rule:** Never delete/truncate player, registration, payment, or user data — in dev or prod — unless the owner explicitly asks *in the current conversation*. When he does ask, do it as a one-time manual action, then confirm.

**Why:** A one-time "wipe test data" TRUNCATE (owner request, 4 Aug 2026) was shipped as a deploy/sql catch-up file. Catch-up files run on EVERY deploy, so every deploy silently wiped all registrations. Owner lost his latest registration and was upset (5 Aug 2026). File removed same day.

**How to apply:**
- deploy/sql catch-up files are re-applied on every deploy → they must be idempotent SCHEMA fixes only. Absolutely no TRUNCATE/DELETE of user data there, ever.
- Any owner-requested data wipe: run it once manually (or gated by a one-time flag), never commit it as a recurring script.
- Owner is trialling with 10–20 real test users now; their data must persist across deploys until he says otherwise.

---
name: Admin localStorage views
description: Which admin views persist where — all admin DATA is now server-backed via site_settings keys; patterns for adding more.
---

# Admin data persistence — all server-backed now

As of July 2026 every admin view that stores DATA uses the server (`site_settings` key-value store via `/settings/admin/:key`, adminReq plumbing). Converted in order: sponsors → AdminSettingsView (admin_users table, Stage 5) → ContractsView + TrialsOps.

Current keys & roles (KEY_ROLES in settings routes; SUPER_ADMIN always allowed):
- `sponsors` — CONTENT_TEAM; public site reads sanitized GET /api/sponsors.
- `founder_signature` — MATCH_OPERATIONS; `{image: dataUrl|""}`; client downscales via canvas (≤600x300 PNG, reject >380K chars; server zod cap 400K, express.json limit 1mb). NOT public. Audit rows redact the payload to `data-url(N chars)` — a test asserts no base64 ever lands in audit.
- `trial_ops_defaults` — TRIAL_CITY_MANAGER; `{staff?, assessor?}` partial saves.

**Atomic partial-merge pattern** (for keys written by concurrent tabs/devices): the PUT branch for `trial_ops_defaults` merges in SQL — `((value)::jsonb || $new::jsonb)::json` in onConflictDoUpdate (column is `json`, so both casts are required). No client GET→merge→PUT (that had a lost-update window).
**Why:** check-in and assessment tabs save different fields at the same time during trial days.
**How to apply:** any new multi-writer settings key should reuse this merge upsert; single-writer keys keep the plain replace upsert.

Client conventions:
- API helpers live in `src/admin/api/*Api.ts`, always via shared adminReq — never duplicate fetch plumbing.
- Legacy-LS rescue: read old key only when server value is empty; offer one-time "save to server" (banner for images/lists, silent prefill for tiny strings); remove the LS key ONLY after a successful server save.
- Fire-and-forget convenience saves (trial defaults) must never block the real action; console.warn on failure.
- Guard the initial GET against clobbering a save the user made while it was in flight (dirty ref).

Remaining localStorage (intentional, NOT data):
- session/prefs keys (admin token, lang, referral).
- legacy `bcpl_co_admins` read in login fallback + migration banner (AdminSettingsView) — auth redesign out of scope; owner informed.

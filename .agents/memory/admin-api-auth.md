---
name: Admin API auth — two client helpers + gated login
description: Which auth helper admin-panel frontend calls must use, why req(...,true) is a trap, and how admin login issues the JWT
---

The website API client (`lib/api.ts` in the website artifact) has TWO ways to authenticate admin calls:

- `adminReq(method, path, body?)` — sends `x-bcpl-admin-token` from the logged-in admin session. **This is the correct helper for anything called from the admin panel UI.**
- `req(method, path, body, true)` — sends static `x-bcpl-admin` from `VITE_ADMIN_KEY` (build-time env).

**Rule:** new admin endpoints called from admin views must use `adminReq`.

**Why:** `VITE_ADMIN_KEY` is a build-time constant. In production builds it is either absent (every admin call 403s → feature silently broken for token-authed admins) or present (the admin master secret ships inside the public JS bundle — leak). The server's `requireAdmin` middleware accepts either header, so dev curl tests with `x-bcpl-admin` pass and hide the problem. Caught by code review on the site-settings feature.

**How to apply:** when adding functions to the API client for admin views, copy the `adminReq` pattern used by the videos/KYC/venues admin functions — not the teams block. KNOWN DEBT: the teams admin functions (create/update/delete team & players) still use `req(..., true)` and predate this rule; if admin team editing "randomly" 403s in prod, this is why.

## Gated login (July 2026)

Super-admin login in AdminShell AWAITS `POST /api/admin/session` (validated server-side against `ADMIN_PANEL_PASSWORD`) and saves the JWT **before** rendering the panel — previously views mounted first, fired token-less requests, got 403s, and cached empty states ("everything shows 0" symptom).

**Failure handling:** if the session call fails, login proceeds ONLY when a legacy `VITE_ADMIN_KEY` is baked into the bundle (`hasLegacyAdminKey()` in api.ts); otherwise it shows an error instead of opening a dead panel. Do NOT make login unconditionally strict — EC2's env may rely on the legacy header, and hard-gating could lock the owner out. Logout clears the token (`clearAdminToken`). Co-admins (localStorage-defined) never get a JWT; they only work where the legacy header exists.

## Sliding admin session (24h)
Admin JWT is 24h; `requireAdmin` re-issues a fresh token via the `x-bcpl-admin-token-renewed` response header past half-life. **Every** admin API client must read that header and persist it — there are FIVE clients (api.ts + four deliberately duplicated: marketingApi, seoApi, adminToolsApi, referralProgramApi). A code review caught the four copies missing the mirror once already.
**Why:** duplication was chosen to avoid merge conflicts between queued tasks; the cost is that ANY admin-auth scheme change must be mirrored in all five or some panel sections silently lose the behavior.
**How to apply:** when touching admin auth (headers, renewal, login), grep `x-bcpl-admin-token` under `src/lib/` and update every match. Login password is server-side only (`ADMIN_PANEL_PASSWORD`, rate-limited) — never reintroduce a frontend-hardcoded password.

## AdminShell NAV ids = permission keys
- Sidebar NAV item `id`s are the co-admin permission keys (stored in localStorage admin accounts). Regroup/relabel freely, but NEVER rename or drop an id, or co-admins lose access to that view.

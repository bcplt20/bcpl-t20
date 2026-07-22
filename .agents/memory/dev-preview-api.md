---
name: Dev preview & API base
description: How the Replit preview reaches the API (vite proxy + BASE fallback), the stale-VITE_API_URL incident, and dev auth/OTP testing shortcuts
---

# Dev preview now mirrors prod

The preview historically 404'd all `/api` calls. Two separate causes, both fixed (July 2026):

1. **Stale `VITE_API_URL` in shared env vars** pointed every frontend fetch at an old Replit deployment (`elite-user-experience.replit.app`) that no longer had the routes. Deleted from shared env.
   **Lesson:** when frontend fetches hit a wrong host or 404 mysteriously, `printenv | grep VITE` FIRST — a workspace-level env var silently outranks code defaults, and vite bakes it in at dev-server start (restart the web workflow after changing env).
2. **No vite proxy / root-relative base.** Now `vite.config.ts` proxies both `${basePath}api` and `/api` → `http://localhost:8080` (mirrors prod nginx), and `lib/api.ts` BASE falls back to `import.meta.env.BASE_URL` when `VITE_API_URL` is unset — `''` in prod builds (base `/`), `/bcpl-website` in preview. Preview login/matches/profile work like live.

**Admin panel in dev:** login fetches the admin JWT (POST `/api/admin/session`) BEFORE rendering the panel. `ADMIN_PANEL_PASSWORD` IS set in the dev workspace and matches the AdminShell hardcoded panel password, so UI login works end-to-end in preview.

**Testing shortcuts (still valid):**
- Direct API: `http://localhost:8080/api/...`; admin header `x-bcpl-admin: $ADMIN_SECRET` works server-to-server.
- OTP in dev: `POST /api/auth/send-otp` returns `devOtp` only when `MSG91_AUTH_KEY` is unset; otherwise read from DB: `SELECT otp_code FROM otp_sessions WHERE phone='…' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`.
- E2E seed data: insert user→registration→phase1_payment(success)→phase1_video via one CTE INSERT; delete in reverse order after.

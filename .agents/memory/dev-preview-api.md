---
name: Dev preview cannot reach the API
description: Frontend API calls 404 in the Replit preview; only prod nginx routes /api — how to test API-dependent flows in dev
---

# Dev preview API gap

The frontend calls `${VITE_API_URL ?? ""}/api/...`. In the Replit dev preview `VITE_API_URL` is unset, so calls go root-relative to `/api/*`, which escapes the `/bcpl-website/` base path and 404s (vite has no `/api` proxy). In production, nginx on EC2 routes `/api` to the Node server, so everything works there.

**Why:** Pages like Home (matches) and PlayerProfile (dashboard) show empty/error states in the dev preview. This is NOT a regression — do not "fix" it mid-task or fail tests because of it.

**How to apply:**
- To exercise the API in dev, hit `http://localhost:8080/api/...` directly (the api-server workflow listens on 8080), or seed localStorage sessions in the browser.
- OTP in dev: `POST /api/auth/send-otp` (needs `{phone, purpose:"login"|"register"}`) returns `devOtp` only when `MSG91_AUTH_KEY` is unset. Reliable alternative: read it from the DB — `SELECT otp_code FROM otp_sessions WHERE phone='…' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1` (`DATABASE_URL` is set in the shell). Admin API: header `x-bcpl-admin: $ADMIN_SECRET` works server-to-server.
- A real fix (vite `/api` proxy) is tracked as a follow-up task — check the task list before starting it.

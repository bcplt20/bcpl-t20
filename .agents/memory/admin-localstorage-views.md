---
name: Admin localStorage views
description: Admin panel views must persist to the server, never localStorage; rescue + save patterns for converting the remaining offenders
---

**Rule:** Admin-panel views must persist through the API (site_settings key or a real table) — never localStorage. LS-only views look like they work but data never reaches the website or other devices; this caused an owner-visible bug (sponsors added in admin never showed on the site).

**Why:** The admin panel's whole point is that changes appear on the public website. localStorage silently breaks that contract per-browser.

**How to apply:**
- Sponsors is FIXED: settings key `sponsors` (CONTENT_TEAM, zod-validated, base64 logos rejected — http(s) URLs only), role-gated `GET /api/settings/admin/:key` for full reads, public `GET /api/sponsors` returns active-only sanitized rows (no amount/contract/status). Tests in api-server tests/sponsors.test.ts.
- Still LS-only (known offenders, fix on request): ContractsView (signature image), TrialsOps (staff/assessor names), AdminSettingsView (misc keys).
- **Rescue pattern** when converting a view: show a one-time import banner when server list is empty && legacy LS key non-empty; sanitize each row client-side to the exact server schema (drop extra keys, clamp lengths, empty non-http URLs / strip `data:` logos); clear the LS key only after a successful save.
- **Single-flight coalescing save** for whole-list PUT views: one request in flight carrying the latest snapshot (pendingRef + inflightRef loop); on failure resync from server — prevents out-of-order PUTs reverting newer edits (architect-flagged race).

# BCPL Player-Operations Platform — Final Handover (Stage 7)

_Date: 23 July 2026 · Companion: `reports/stage7-migration-deploy-report.md` (deploy runbook) and `reports/admin-master-journey-plan.md` (original plan)._

## 1. Architecture summary

pnpm monorepo, three packages:

- `artifacts/bcpl-website` — Vite + React + wouter. Public site **and** the admin panel (`/admin`, single-page shell `src/admin/AdminShell.tsx` with ~30 views). All API calls go through `src/lib/api.ts`; admin calls through the shared `adminReq` in `src/lib/adminHttp.ts` (JWT bearer).
- `artifacts/api-server` — Express + Drizzle ORM (PostgreSQL). Routers under `src/routes/`, mounted in `routes/index.ts`. Startup runs idempotent `ensure*()` migrations, then reminder/AI workers.
- `lib/db` — shared Drizzle schema (`lib/db/src/schema/*`). After schema edits run `pnpm exec tsc --build lib/db --force`.

Prod: EC2 + pm2 + nginx (static HTML with Express injector for SEO meta). Deploys via `deploy/go.sh` after `git push origin main`. Replit is dev/staging.

## 2. Existing modules reused (untouched)

Live Auction, Teams, Contracts, SEO Manager, Media library (S3 presigned), Data Exports, Live Scoring/Matches, Marketing/Affiliates, WhatsApp templates, Banners, Sponsors, registration + payment (Cashfree) + OTP (MSG91) + email (Brevo) + Phase-1 AI video evaluation (Gemini) pipelines.

## 3. New modules created (Stages 1–6)

| Module | Backend | Admin UI |
|---|---|---|
| Player journey aggregation | `GET /api/admin/players/:id/journey` (derived status, no history rewrite) | Master Player Profile view |
| Reminder workers | P1-payment, video day-3/day-6, P2-payment sweeps; `notification_logs` dedupe keys; reserve-first send gating | heartbeats on API Health |
| Ops dashboard | KPI/funnel/city/AI-stats endpoints | Analytics view (Live) |
| Trials suite | slots, auto-allocation, QR pass, check-in, physical assessments | Trial Cities view |
| Finance | refunds lifecycle + reconciliation states | Finance & GST view |
| Server-side RBAC | `admin_users` + JWT roles (replaces localStorage co-admins) | Roles & Access + Admin Management |
| Health | endpoint + job heartbeat monitoring | API Health view |
| CMS homepage config | `site_settings.homepage_config` (strict zod), S3 `cms/` uploads | CMS / Pages view |
| Employment verification | 6 new `kyc_records` columns + `PATCH /api/admin/kyc/:id/employment` | panel inside Phase 2 · KYC |
| Fraud extensions | `fraud_flags` + `/api/admin/fraud` (list/scan/review) | Fraud Detection view |

## 4. Modules modified

Admin sidebar regrouped (journey-ordered); Phase 2 · KYC view (reveal gate, employment); site-settings router (per-key RBAC, image upload types); KYC router (employment ensure-fn); admin router (journey, employment endpoint); `routes/index.ts` mounts (`/admin/fraud` before `/admin`).

## 5. Database migrations

All additive, auto-applied at boot (see deploy report §2): trials tables (4), `admin_users`, refunds + reconciliation, job heartbeats, `kyc_records` employment columns (6), `fraud_flags`. Nothing dropped; `phase1Status`/`phase2Status` history preserved (journey derived server-side).

## 6. New statuses

- **Journey (derived, read-only):** registered → phase1_paid → video_uploaded → ai_evaluated → phase1_selected → phase2_paid → kyc_submitted → kyc_verified → trials → auction → contracted.
- **Employment:** `pending` (default) | `verified` | `failed` (reason mandatory) | `more_information_required`.
- **Fraud flag:** `flagged` | `cleared` | `blocked`; types `duplicate_video` | `duplicate_aadhaar` | `duplicate_pan`. Flags never auto-punish a player — human review only.
- **Refunds:** requested → approved/rejected → processed, plus reconciliation states.
- **Trials:** allocation + check-in states, assessment recorded.

## 7. APIs / integrations

Cashfree (payments; separate `CF_VERIFY_*` for KYC doc verification — stub mode in dev), MSG91 (SMS/OTP via Flow API), Brevo (email), Gemini (Phase-1 AI evaluation; models pinned via stored `phase1_ai_config`), AWS S3 (media + `cms/` + private `media/` with presigned view URLs), GitHub (source of truth for prod pulls).

## 8. Environment variables

Full list + prod checklist in deploy report §3. Critical: `CF_VERIFY_*` (prod-only), `PHASE1_ALLOW_MOCK` (never in prod), `JWT_SECRET`, `ADMIN_SECRET` (static super-admin header for server-to-server), `ADMIN_ALERT_EMAIL/PHONE`.

## 9. Role / permission matrix (server-enforced)

`requireAdmin` = valid admin JWT (or `x-bcpl-admin: ADMIN_SECRET` = SUPER_ADMIN). `requireRole(...)` always passes SUPER_ADMIN. Enforcement is **server-side**; the sidebar additionally hides views client-side.

| Resource | Allowed roles |
|---|---|
| `/api/admin/admin-users` (manage admins) | SUPER_ADMIN only |
| `/api/admin/refunds` | FINANCE_TEAM, PAYMENT_TEAM |
| `/api/admin/fraud` (list/scan/review) | KYC_TEAM |
| `PATCH /api/admin/kyc/:id/employment` | KYC_TEAM |
| KYC document reveal (`?reveal=1`) | SUPER_ADMIN, KYC_TEAM (others always masked) |
| `PUT /api/settings/sample_videos` | VIDEO_AI_OPERATIONS, CONTENT_TEAM |
| `PUT /api/settings/homepage_config` | CONTENT_TEAM |
| Trials endpoints | any admin; TRIAL_CITY_MANAGER scoped to assigned cities |
| Everything else under `/api/admin` | any authenticated admin |

## 10. AI configuration

Gemini via stored `phase1_ai_config` (PATCH to change models/thresholds); `aiEnabled` gates mock **and** real evaluation; mock additionally blocked in prod unless `PHASE1_ALLOW_MOCK=1`. Defaults: primary 3.5-flash, validation 3.1-flash-lite.

## 11. Trial workflow

Venue setup → slot/batch creation → auto-allocation (city + capacity aware) → QR trial pass issued → check-in scan at venue → physical assessment form → results feed selection. City managers only see their assigned cities.

## 12. Notification workflow

All sends go through gated senders (dev keys are real — gating prevents accidental sends). Reminder sweeps use reserve-first dedupe on `notification_logs` keys, so a crashed worker never double-sends. Failures are recorded with error detail (no false "sent" logs).

## 13. Finance / refund workflow

Refund request (with payment linkage) → FINANCE_TEAM/PAYMENT_TEAM approve/reject → processed with reference; reconciliation states track Cashfree settlement matching. All actions audit-logged.

## 14. Security report

- Admin JWT (payload: email/name/role/cities) signed with `JWT_SECRET`; static header path for super-admin ops.
- Per-router and per-route role gates (matrix above); unauth → 403.
- KYC PII masked by default; reveal restricted + audited. Aadhaar/PAN **numbers are never stored** — only provider reference ids.
- Raw-SQL duplicate detectors are static SQL (no user input interpolated). Registration-scoped writes use Drizzle parameterization.
- S3 `media/` prefix private (presigned 1h view URLs); upload URLs validated by MIME allow-list; CSV export formula-injection guarded.
- Copy compliance sweep (no scout/BCCI/superlative claims) enforced by grep gate.

## 15. Audit-log report

Every mutating admin action writes an audit row (actor "name <email>", action, entity, detail JSON): settings PUT, employment PATCH, fraud scan/review, refunds, trials mutations, admin-user management. Fraud reviews additionally stamp `reviewed_by`/`reviewed_at` on the flag.

## 16. Test results

`vitest run`: **105 tests, 7 files, all pass** (final run 23 Jul 2026). Coverage highlights: payment-confirmation spoof blocking, phase-1 worker CAS/claims, reminder dedupe, trials allocation, refunds RBAC, stage-6 CMS validation + employment lifecycle + fraud scan idempotency/review. TypeScript: `api-server` and `bcpl-website` both clean.

## 17. Performance / load-test results

Smoke-level (dev box): 300 requests @ concurrency 20 on a DB-backed public endpoint → 300/300 OK, ~451 req/s, ~1 ms median. Formal high-volume load testing on prod-like infra remains a recommended follow-up before peak registration windows.

## 18. Responsive screenshots

Admin shell and all new views built on the shared responsive shell (sidebar collapses ≤1024px); verified during stages via preview screenshots. Public site unchanged this phase (V4 header system, mobile sticky register bar).

## 19. Staging URL

The Replit dev preview serves as staging: `<repl-dev-domain>/bcpl-website/` (public) and `/bcpl-website/admin` (admin). Walkthrough script in deploy report §5.

## 20. Production deployment checklist

Deploy report §3–§4: verify env vars → `deploy/go.sh` → watch `[MIGRATE]` boot lines → 3-curl smoke → admin UI spot-check. Rollback = `git revert` + redeploy (additive schema keeps old code safe). **Production deploy happens only after owner approval.**

---

### Notable behaviour changes to communicate

1. `PUT /api/settings/sample_videos` is now role-gated (VIDEO_AI_OPERATIONS / CONTENT_TEAM / SUPER_ADMIN) — previously any admin could write it.
2. CMS fee fields are display-only until Phase C wires the public homepage to `homepage_config`.
3. Fraud scan is manual-trigger; flags require human clear/block decisions and never automatically affect players.

# BCPL Admin Platform — Migration & Deployment Report (Stage 7)

_Date: 23 July 2026 · Covers Stages 1–6 of `reports/admin-master-journey-plan.md`_

## मालिक के लिए सारांश (Hindi)

सारा नया admin system GitHub पर push हो चुका है (आख़िरी commit `78facdd`)। Live करने के लिए
आपको सिर्फ़ EC2 पर `deploy/go.sh` चलाना है — database के सारे बदलाव server start होते ही
अपने-आप लग जाते हैं, कोई manual SQL नहीं चलाना। नीचे checklist है।

---

## 1. What ships (commits since last production deploy)

| Stage | Commit | Scope |
|---|---|---|
| 1 | `859af3e` | Journey aggregation endpoint, Master Player Profile page, sidebar regroup |
| 2 | `5720043` | Reminder workers (P1 payment / video day-3+6 / P2 payment), abandoned-registrations segment |
| 3 | `d268445` | Ops dashboard: KPI cards, funnel, city table, AI ops stats, action-required alerts |
| 4 | `564c109` | Trials suite: venues upgrade, slots/batches, auto-allocation, QR pass, check-in, physical assessments |
| 5 | `e9cefff` | Finance refunds + reconciliation, server-side RBAC (admin_users), API/job health pages |
| 6 | `78facdd` | CMS homepage config, employment verification, fraud extensions (dup video/aadhaar/pan scans) |

Production goes live only after the owner runs `deploy/go.sh` on EC2 (git pull → build → pm2 restart).
Replit-side pushes alone do **not** change prod.

## 2. Database migrations

**Mechanism:** every migration is an idempotent `ensure*()` function executed in
`artifacts/api-server/src/index.ts` at boot (raw `CREATE TABLE IF NOT EXISTS` /
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). No migration CLI, no manual step:
**first pm2 restart applies everything**. All changes are additive — nothing drops
or rewrites `phase1Status` / `phase2Status` history (journey status is derived at read time).

New objects by stage:

| Stage | Objects |
|---|---|
| 4 | `trial_slots`, `trial_allocations`, `trial_checkins`, `physical_assessments`; venue upgrade columns |
| 5 | `admin_users`; `refunds` (+ reconciliation state columns); job-heartbeat table for health page |
| 6 | `kyc_records` + 6 employment columns (`employment_status` default `'pending'`, category, method, reference, failure_reason, verified_at); `fraud_flags` (UNIQUE `(registration_id, type)` + status index) |

Backfill behaviour: existing KYC rows silently get `employment_status='pending'` — the
correct starting state; no data rewrite needed. `fraud_flags` starts empty; flags appear
only when an admin presses **Run Duplicate Scan**.

## 3. Environment variables (production checklist)

Already on EC2 (unchanged): `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `ADMIN_SECRET`,
`ADMIN_PANEL_PASSWORD`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION`/`AWS_S3_BUCKET`,
`CASHFREE_APP_ID`/`CASHFREE_SECRET_KEY`/`CASHFREE_ENV`, `MSG91_*`, `BREVO_API_KEY`/`BREVO_FROM_EMAIL`,
`GEMINI_API_KEY`, `SITE_ORIGIN`/`SITE_URL`, `NODE_ENV=production`.

Verify for the new features:

- `CF_VERIFY_APP_ID` / `CF_VERIFY_SECRET` — Cashfree **verification** keys (separate from payment keys). Without them KYC doc verification runs in stub mode.
- `ADMIN_ALERT_EMAIL` / `ADMIN_ALERT_PHONE` — destination for action-required alerts.
- `PHASE1_ALLOW_MOCK` — must stay **unset** in production (mock AI evaluation is blocked without it; that block is intentional).
- Optional model pins: `GEMINI_PRIMARY_MODEL` / `GEMINI_VALIDATION_MODEL` (defaults 3.5-flash / 3.1-flash-lite; stored `phase1_ai_config` overrides).

## 4. Deployment runbook

1. SSH to EC2, run `deploy/go.sh` (does: `git pull`, install, build website + API, pm2 restart).
2. Watch API boot log — expect the `[MIGRATE]` lines including `kyc_records employment columns ready` and `fraud tables ready`.
3. Post-deploy smoke (2 minutes):
   - `curl -s https://<site>/api/settings/homepage_config` → 200 JSON (`value` may be null until CMS is filled).
   - `curl -s -o /dev/null -w "%{http_code}" https://<site>/api/admin/fraud` → **403** (unauthenticated must be blocked).
   - Log into `/admin` → Phase 2 · KYC opens and shows the EMP column; Fraud Detection view loads with zero flags.
4. If anything is wrong: `git revert <commit> && deploy/go.sh`. Old code ignores the new columns/tables (additive), so rollback is safe without DB work.

## 5. Staging walkthrough (already available on the Replit dev preview)

The dev preview is the staging environment (same code now on `main`). Module-by-module check:

1. **Analytics / Forecasting** — KPI cards live, funnel renders, action-required panel lists real items.
2. **Master Player Profile** — open any player: journey timeline, payments, video, KYC, communication log on one page.
3. **Phase 2 · KYC** — reveal gate (masked for non-KYC roles), employment panel: mark verified / failed (reason required) / more-info.
4. **Fraud Detection** — Run Duplicate Scan → flags listed with evidence; clear/block/re-open with note; counts update.
5. **Trials** — venues, slots, auto-allocation, QR pass, check-in, physical assessment forms.
6. **Finance** — refunds lifecycle + reconciliation states; Finance & GST view.
7. **CMS / Pages** — homepage config editor: hero media upload (S3 `cms/`), season, dates, stats, socials. _Fees here are display-only; the public homepage consumes this in Phase C._
8. **Roles & Access / Admin Management** — create co-admin with a role, log in as them, confirm the sidebar and APIs restrict correctly.
9. **API Health** — endpoint latencies + reminder-job heartbeats.

## 6. Test & load evidence (final run, 23 Jul 2026)

- `vitest`: **105 tests / 7 files — all pass** (Stage 6 added ~10: CMS validation/RBAC, employment lifecycle, fraud scan idempotency + review flow).
- `tsc --noEmit`: clean for both `api-server` and `bcpl-website`.
- Load smoke (dev box, DB-backed public endpoint, 300 requests, concurrency 20): **300/300 HTTP 200, ~451 req/s, ~1 ms median latency**. This is a smoke check, not a formal load test; EC2 prod capacity is expected to be of the same order for read endpoints.

## 7. Known deferrals (intentional)

- Public homepage does **not** yet read `homepage_config` — Phase C wires it; until then the CMS editor saves config without changing the live site.
- Checkout amounts remain hard-coded in payment code; CMS fee fields are display copy only.
- Duplicate-video detection uses the S3 ETag (content hash for single-part uploads; multipart uploads produce non-content ETags — documented in `fraud.ts` header).
- Aadhaar/PAN duplicate scan matches Cashfree **reference ids**, not document numbers (real numbers are never stored).

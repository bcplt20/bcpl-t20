# BCPL Admin — Master Player Journey: Implementation Plan
*Prepared 23 July 2026 · per owner's admin master prompt (attached_assets/Pasted-You-are-working-on-my-EXISTING-BCPL-production-admin-pa_1784827504266.txt)*

## 1. What already EXISTS (verified in code — will be REUSED, not rebuilt)

| Spec area | Existing implementation |
|---|---|
| Admin shell | `src/admin/AdminShell.tsx` — sidebar from `NAV` config array, per-view permission filtering, sliding 24h JWT session, rate-limited login |
| 30 admin modules | Dashboard, Users, Finance & GST, Forecasting, Marketing, SEO, Affiliates, Content Calendar, Matches, Live Scoring, Teams, Selection, Live Auction, Leaderboard, Contracts, Phase 1 Registrations, Video Review, Phase 2 · KYC, Player Profiles, WhatsApp Templates, Fraud, Trial Cities, Support, Media, Banners, CMS, Sponsors, Data Export, Roles, Admin Mgmt |
| Player ID | `registrations.regNumber` `BCPL-<CITY>-<seq>` (e.g. BCPL-DEL-1), generated at Phase-1 payment success |
| Phase 1 / Phase 2 payments | **Separate** tables `phase1_payments` / `phase2_payments`, Cashfree order+payment ids, webhook-confirmed (server-side source of truth already) |
| Video pipeline | `phase1_videos` (S3 keys, duration/mime/size/etag, declaration flag) + `phase1_evaluations` (attempts, statuses `queued→validating→ai_pass_1→ai_pass_2→(ai_pass_3)→final_scoring→result_ready→result_released`, `reupload_required`, `integrity_review`, `failed_temporary/final`) |
| AI evaluation | Pass 0 validity + independent Pass 1/2 (+3 on variance) with median, confidence, per-role rubrics, prompt/model/rubric/assessment versions, `ai_evaluation_passes` audit rows (raw JSON kept), CAS worker leases |
| AI config | `phase1Config.ts` → zod-validated, stored in `site_settings`, admin-editable, **audited** (minScore 80, variance 8, releaseHours 48, models, rubrics, role instructions) |
| Result release | Delayed release worker (`resultReleaseAt`), `ranking_snapshots` frozen at release (city/role rank + percentile, competition ranking) |
| KYC | `kyc_records` — Cashfree Aadhaar OTP + PAN, `panVerified` manual-review flag |
| Player essentials | `player_profiles` — company/jobTitle/experience, T-shirt, blood group, emergency contact |
| Communications log | `notification_logs` (email/sms/whatsapp, template, status, error, **dedupeKey idempotency**) |
| Audit | `audit_logs` table + settings-update writes |
| Trials (partial) | `trial_venues` (city, venue, date, times, slots, announce flow) |
| Fraud (partial) | `videoSha256` per evaluation; KYC refs available for duplicate checks |
| Security | Admin JWT + legacy server-to-server header, login circuit breaker, S3 private media w/ presigned URLs |

## 2. REUSE / RENAME / ADD / MIGRATE / DO-NOT-REBUILD

**Reuse as-is:** payments, AI pipeline, result release, rankings, KYC, notification log, media library, exports, auction/teams/contracts, SEO/marketing modules.

**Rename (labels only — ids/permissions stay stable):** sidebar regrouped to spec's groups; "Selection" → "Phase 1 Results", "Leaderboard" → "Rankings".

**Add (in stages, dev-first):**
1. **Stage 1 (now):** Journey aggregation endpoint + **Master Player Profile** page (spec's #1 UX rule) + sidebar regroup. **No DB changes.**
2. **Stage 2:** Reminder workers (P1 payment, video day-3/day-6, P2 payment) on `notification_logs` dedupe keys; Abandoned-registrations segment; communication timeline already surfaced by Stage 1.
3. **Stage 3:** Ops dashboard — KPI cards, visual funnel, city operations table, AI ops stats, Action-Required alerts panel.
4. **Stage 4:** Trials suite — venue upgrade, slots/batches, auto-allocation, QR trial pass, check-in endpoint, physical assessment forms + results. *(new tables: trial_slots, trial_allocations, trial_checkins, physical_assessments)*
5. **Stage 5:** Finance — refunds module + reconciliation states; server-side RBAC (admin_users + roles replacing localStorage co-admins); API-health + job-health pages.
6. **Stage 6:** CMS homepage config (hero media, fees, dates, stats — feeds website Phase C), employment verification statuses, fraud extensions (dup video hash / dup KYC ref scans).
7. **Stage 7:** Tests, staging walkthrough, migration/deployment report, handover doc.

**Migrations:** none until Stage 4; all additive (new tables/columns); never drop or rewrite `phase1Status`/`phase2Status` history — the unified journey status is **derived server-side** from existing truth, so old data needs no rewrite.

**Do NOT rebuild:** everything in section 1. Live Auction, Teams, Contracts, SEO, Media, Exports untouched.

## 3. Decisions / flags for owner
- **Player ID format kept** as `BCPL-DEL-1` (spec example `BCPL-S5-DL-284731` is illustrative; changing format would break issued receipts/SMS).
- **Video window:** public website copy promises **15 days** (Phase A legal sweep); spec text says default 7. Config stays **15** unless owner says otherwise.
- Statuses shown in admin use existing DB values mapped to spec-style labels; no destructive status migration.
- Prod deploy remains manual (EC2 `deploy/go.sh`) — every stage ships to GitHub only after local verification.

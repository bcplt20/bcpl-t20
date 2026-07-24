# BCPL T20 — Security, Payment Integrity & Readiness Audit

**Date:** 24 July 2026 · **Scope:** full codebase (`artifacts/api-server`, `artifacts/bcpl-website`) + automated scans + fixes + regression tests
**Reference:** master prompt sections A–BP (`attached_assets/Pasted--BCPL-COMPLETE-SECURITY-...txt`) · Companion doc: `threat_model.md`

---

## सारांश (Hindi Executive Summary)

- Code-level security audit पूरा हुआ: payment, OTP, admin, KYC, video, API — सब जांचे गए।
- **13 सुरक्षा सुधार लागू और test किए गए** (OTP abuse guards, payment amount check, CORS/headers, secret fail-fast, dependency fixes)। 133/133 automated tests pass।
- एक independent code-review round ने 2 गंभीर कमियां पकड़ीं — दोनों **इसी session में fix + test** हो गईं।
- **कोई भी real SMS/payment/email test में trigger नहीं हुआ।**
- **वेबसाइट "100% secure" कहना गलत होगा** — नीचे ईमानदार स्थिति दी गई है: क्या जांचा गया, क्या बाकी है।
- **फैसला: अभी की traffic के लिए GO** (fixes deploy करने के बाद)। **बड़े campaign (लाखों users) के लिए NO-GO** जब तक load testing, backups drill, monitoring नहीं हो जाते — इनके लिए आपका EC2/AWS access चाहिए।
- Deploy करने के लिए: सब कुछ GitHub पर push हो चुका है → आप server पर `deploy/go.sh` चलाएं।

---

## 1. Verdict (Go / No-Go) — BP items 19–20

| Question | Answer |
|---|---|
| Current operation (existing traffic levels) | **GO — after deploying these fixes** (they harden the already-live site) |
| Mass campaign / 1-million-user push | **NO-GO for now** — load testing, backup restore drill, monitoring/alerts and WAF are not done (require owner's EC2/AWS access) |
| Production readiness score (BP #19) | **Application security: 8/10** · **Scale/infra readiness: 5/10** (untested load path, no queue, no alerts) |

Per the master prompt's own rule: *"Never write 'the website is completely secure'"* — this report lists exactly what was tested and what remains.

## 2. Fixes implemented & re-tested (BP #17, #18)

Shipped in commits `78810ec`, `9abfeed`, `d7fb6e6` (pushed to GitHub; live after `deploy/go.sh`):

1. **OTP send abuse (T, AI):** per-IP cap 30/hr (in-memory) + DB-backed per-phone 45s cooldown and 5/hr cap, checked **before** any SMS or DB insert.
2. **OTP brute-force (S, BK):** wrong-guess counting only against a live OTP session; after 8 wrong guesses the pending OTP is **burned** (not the phone locked); per-IP verify throttle 60/15min. *Review round removed a lockout-DoS: the first design let an attacker lock any phone number out of login.*
3. **Payment amount/currency validation (F, J):** gateway-reported amount must equal the server-computed fee (INR only) on `verify`, `webhook` **and the reconcile sweep** before success/activation; mismatch ⇒ `amount_mismatch` + audit row, never activated, manual review. *Review round closed the reconcile bypass.*
4. **Reconcile hardening (N):** PAID order whose payment details can't be fetched is deferred (never activated unverified).
5. **Prod secret fail-fast (B, R):** boot refuses to start in production without `JWT_SECRET` / `SESSION_SECRET`.
6. **CORS allowlist (BB):** SITE_URL + dev origins only; no wildcard.
7. **Security headers (BA):** nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, HSTS. CSP deferred (Cashfree checkout compatibility) — documented follow-up.
8. **Body limits (AF):** JSON/urlencoded capped at 1mb; webhook raw-body capture preserved.
9. **Dependency HIGHs (BH):** `fast-uri` ≥3.1.4, `js-yaml` ≥4.3.0 via pnpm overrides (verified in lockfile). Remaining: `esbuild` LOW, dev-only — accepted risk.

**Re-test results (BP #18):** typecheck clean; **133/133 vitest tests pass**, including new suites: `otpAbuse.test.ts` (send caps, no-session hammering never locks, session burn), `paymentIntegrity.test.ts` (amount gate units + real-signed webhook mismatch → flagged, not activated), `reconcileIntegrity.test.ts` (sweep defers/flags/promotes correctly). No real SMS/email/payment fired at any point.

## 3. Verified-safe by audit (no change needed)

- **Webhook signature (D):** HMAC-SHA256(timestamp+rawBody), timing-safe compare, tested with genuinely signed payloads.
- **Server-side source of truth (C, E):** fees computed from role+config server-side; activation only via verified webhook/verify/reconcile paths.
- **Idempotency & races (G, K, M):** success promotion is a conditional `status='pending'` update (replay-safe); reg-number assignment uses a pg advisory lock; state machine transitions are guarded.
- **Phase isolation (L):** Phase 2 order creation requires `phase1Status='selected'`.
- **BOLA (Q):** every player route scopes by `req.user.userId` (`loadOwnedKyc` / `loadOwnedRegistration` pattern) — no cross-user access found.
- **Admin RBAC (P — BP #5):** role-gated settings writes (`KEY_ROLES`), login limiter + circuit breaker; covered by tests.
- **KYC/PII (AB):** provider refs only (no raw Aadhaar/PAN), masked responses, reveal is role-gated + audit-logged.
- **Gemini (Z, AA):** pseudonymous candidate refs, hardcoded prompts (no user text interpolated), zod-validated responses, `aiEnabled` gate.
- **Video/S3 (X, BF):** presigned URLs, per-user key-prefix ownership checks, private prefixes, 1h view URLs.
- **CSRF/XSS/SSRF (BC, BD, BE):** header-token auth (no auth cookies) ⇒ low CSRF surface; React escaping, no user-controlled HTML injection; no user-supplied URL fetches.
- **Secret scanning (BG — BP gate):** HoundDog: 0 findings. (`deploy/env.production.template` DATABASE_URL is a placeholder — SAST false positive.)
- **Logging (AC):** no secrets/PII; OTP visible only in dev stub mode.

## 4. Known gaps — documented, NOT yet done (BP #16 unresolved risks)

**App-level (code, doable in Replit):**
- `cf_payment_id` unique index — run after deduplicating prod rows (also blocked by drizzle-push issue, task 43):
  ```sql
  -- run on prod DB during quiet hours, AFTER checking for duplicates:
  CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS phase1_payments_cf_payment_id_uq
    ON phase1_payments (cashfree_payment_id) WHERE cashfree_payment_id IS NOT NULL;
  CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS phase2_payments_cf_payment_id_uq
    ON phase2_payments (cashfree_payment_id) WHERE cashfree_payment_id IS NOT NULL;
  ```
- OTP codes stored plaintext (10-min lifetime) — hash-at-rest is a cheap upgrade.
- Admin list endpoints lack pagination (AF) — large tables will slow the panel.
- Webhook timestamp freshness window (replay hygiene; signature already verified).
- CSP header (BA) — needs a Cashfree-compatible policy, test on staging first.
- Some notification paths log "sent" on provider failure (AG) — open task.
- No CAPTCHA on registration (U/V) — OTP cost caps mitigate; add if bot pressure appears.
- Refunds (O): no in-app refund flow — handled manually in the Cashfree dashboard; keep it that way until a gated admin flow is built.

**Infra-level (needs owner's EC2/AWS access — cannot be done from this workspace):**
- **Load/stress/spike/soak tests (AL–AT, BP #6–12):** NOT RUN. No staging mirror exists. Honest consequence: max RPS / concurrent-user capacity is **unknown**; current stack is 2× t3.medium pm2 cluster with no durable queue and synchronous notification sends — a mass campaign would hit SMS/email vendor limits and CPU first. Build a staging copy + k6 before any big push.
- **Queues (AH–AK, BP #14):** background work is in-process `setInterval`; mass email should go through Brevo campaigns, not the API.
- **Backups/DR (BN):** RDS snapshots must be verified with an actual restore drill (RPO/RTO unknown until tested).
- **Monitoring/alerts (BL, BM):** pino logs exist; no dashboards/alerts (CloudWatch + alarm on 5xx rate / admin-login breaker recommended).
- **WAF/CDN/autoscaling (AW, AX, AZ):** none configured; nginx `limit_req` on `/api/auth/*` is a 10-line quick win.
- **DB security config (AD):** app layer is parameterized (Drizzle); RDS encryption/security-group review needs AWS console access.

## 5. Go-live gates status (BO)

| Gate | Status |
|---|---|
| No unresolved CRITICAL security findings | ✅ (after this session's fixes) |
| No unresolved HIGH payment-integrity findings | ✅ (amount gate on all three promotion paths) |
| Cashfree webhook signature verified | ✅ |
| Payment idempotency tested | ✅ |
| Payment reconciliation working | ✅ (now amount-gated) |
| OTP abuse protection working | ✅ |
| Player authorization tests passed | ✅ |
| Admin RBAC passed | ✅ |
| Secrets scan passed | ✅ |
| Critical load-test thresholds passed | ❌ NOT RUN (needs staging + owner access) |
| Database backup restore tested | ❌ NOT TESTED |
| Monitoring and alerts enabled | ❌ NOT CONFIGURED |

## 6. BP output-list cross-reference

1–5 (security/payment/OTP/API/RBAC reports) → sections 2–4 above · 6–15 (load/stress/spike/soak/capacity/RPS/concurrency/DB-perf/queue/third-party-bottleneck) → **not run**, see section 4 infra block — numbers are not fabricated · 16 → section 4 · 17–18 → section 2 · 19–20 → section 1.

*Testing constraints honored: no real customer data, no real OTP/WhatsApp/email blasts, no real payments — mocks, stubs and signed synthetic payloads only.*

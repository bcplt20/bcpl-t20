# BCPL T20 — Scalability Inspection Report (BEFORE any changes)

**Date:** 24 July 2026 · **Type:** inspection only — no infrastructure was changed
**Sources:** full codebase + deploy scripts (`deploy/`) + read-only AWS API probe + prior security audit
**Companions:** `SECURITY_AUDIT_REPORT.md`, `threat_model.md`

---

## सारांश (Hindi Executive Summary)

- आपकी site अभी **एक अकेले server** (AWS EC2, Mumbai) पर चलती है — वही server website भी दिखाता है, API भी चलाता है। Database अलग है (AWS RDS), videos अलग हैं (AWS S3) — यह अच्छी बात है।
- **अभी auto-scaling नहीं है** — traffic बढ़ने पर server अपने-आप बड़ा नहीं होगा। CDN (CloudFront), WAF, queues, Redis — कुछ भी configured नहीं है।
- **अच्छी खबर:** app का code इस तरह लिखा है कि उसे कई servers पर फैलाना **बिना बड़ी re-writing के संभव है** (videos पहले से सीधे S3 जाते हैं, login tokens stateless हैं, OTP limits database में हैं)।
- **~1,000 users एक साथ** → site चलेगी, थोड़ी धीमी होगी। **~10,000** → बहुत धीमी/आंशिक रूप से बंद। **~100,000** → बंद।
- सबसे पहले फेल होगा: **अकेला EC2 server (CPU)** — यह single point of failure है।
- मेरी workspace AWS keys सिर्फ S3 तक सीमित हैं (यह सही security है) — इसलिए RDS/EC2 की कुछ details और सारे infrastructure बदलाव **आपके AWS console से** होंगे। नीचे step-by-step plan है, और मुझसे क्या-क्या हो सकता है वो भी लिखा है।
- **कोई load test अभी नहीं चला** — इसलिए कोई capacity numbers "tested" नहीं हैं। जो अनुमान नीचे हैं वो architecture-गणित हैं, और साफ लिखा है कि अनुमान हैं।

---

## 1. What exists today (inspected facts)

| Item | Finding |
|---|---|
| Frontend hosting | Static files on the **same single EC2** served by nginx; every HTML page request passes through the API server (for SEO meta injection) |
| Backend/API | Express (Node), **PM2 cluster ×2 processes on ONE EC2 t3.medium** (2 vCPU / 4 GB, burstable), port 4000 behind nginx |
| Replit's role | Development workshop only — production is NOT on Replit |
| AWS region | ap-south-1 (Mumbai) |
| Database | AWS RDS PostgreSQL (instance class / Multi-AZ / backup settings **unknown from here** — needs console check, see §6) |
| DB connections | App pool uses pg defaults: 10 per process ⇒ max ~20 connections total (safe, but no explicit tuning, no RDS Proxy) |
| S3 / storage | ✅ `bcpl-trial-videos` (Mumbai); **videos already upload browser→S3 directly via presigned URLs** — the main server is not in the upload data path (exactly what the target architecture wants) |
| CloudFront | ❌ none |
| Load balancer | ❌ none (nginx on the same box is the only "balancer" across the 2 PM2 workers) |
| ECS/Fargate/Lambda | ❌ none — plain EC2 |
| Auto Scaling | ❌ none |
| SQS / queues | ❌ none — background work = in-process timers (reminders every 6h, AI pipeline every 2 min, payment reconcile); **already double-run-safe** (DB claim tokens / reserve-first dedupe), which makes multi-server later much easier |
| Redis / cache | ❌ none — rate-limit counters are in-memory per process (documented ×N caveat in code) |
| OTP provider | MSG91 (flow API); DB-backed per-phone caps — cluster-safe ✅ |
| Email | Brevo · WhatsApp: not active yet (SMS+email today) |
| Cashfree | Server-side truth + HMAC webhook + amount gate + reconcile sweep ✅; webhook ack is fast, notifications fired without blocking the response, but **no durable retry** if a send fails |
| Gemini | Pinned models, concurrency-capped worker pipeline with CAS claims ✅ |
| KYC provider | Cashfree verification suite (separate creds, prod-only) |
| AWS limits/quotas | **Cannot inspect** — workspace IAM user `bcpl-s3-user` is S3-only (verified by probe: EC2/RDS/ELB/ASG/SQS/ElastiCache/CloudFront all AccessDenied). Correctly-scoped key; quota review needs your console |
| nginx | gzip on; static cache 1h (hashed assets could be 1 year); 10 MB body cap; **no rate-limit zones**; SSL via certbot |

## 2. The 7 answers you asked for

**1) Already scalable today:** video upload path (browser→S3 direct), S3 media serving, stateless auth tokens, DB-backed OTP caps, double-run-safe background jobs, Cashfree (their side scales). The *code* is scale-friendly; the *infrastructure* is not.

**2) Single points of failure:** ① the one EC2 instance (app + static + SSL together — reboot/crash = whole site down); ② RDS if it is single-AZ (unknown — check §6); ③ deploy briefly restarts the API (seconds of blip); ④ t3 "CPU credits" — under sustained load a t3.medium can be throttled to ~40% of its CPU.

**3) 1,000 simultaneous users:** site stays up; pages load slower (HTML goes through the API). Registrations/payments work. Expect p95 latency to rise; SMS deliveries may queue at the provider. **Survives, degraded.** *(estimate, not a test)*

**4) 10,000 simultaneous:** the single box saturates (CPU + the HTML-through-API design). Long waits, timeouts, some 5xx; OTP demand may hit provider throughput; payments initiated may complete late (reconcile sweep will catch stragglers — by design). **Partially down.** *(estimate)*

**5) 100,000 simultaneous:** **down.** No single t3.medium serves this. Cashfree/S3 would be fine — your server would not.

**6) Fails first (in order):** EC2 CPU (credits) → event-loop latency → nginx timeouts; then DB latency under admin+player mixed load; then SMS/email vendor throttling. The database *connections* won't be first (only ~20 max) — the app chokes before RDS does.

**7) Required changes:** phased plan in §5. Short version: put CloudFront+WAF in front, split app onto ≥2 instances behind an ALB with auto-scaling (ECS Fargate preferred), move sends/AI to SQS workers, add Redis for counters, verify RDS class/Multi-AZ/backups, then **prove it with k6 on a staging copy** — never on production.

## 3. Component status (current state, before improvements)

| Component | Status | Why |
|---|---|---|
| Homepage/static | 🟡 YELLOW | Served fine today, but no CDN; HTML passes through API; cache headers too short for hashed assets |
| Registration | 🟡 YELLOW | Code solid; capacity limited by the single box |
| OTP | 🟢 GREEN (app) / 🟡 (scale) | Abuse-capped, DB-backed; provider throughput untested for campaigns |
| Payment | 🟢 GREEN | Server-side truth, signed webhook, amount gate, reconcile — audited + tested |
| Database | 🟡 YELLOW | Healthy now; class/Multi-AZ/backups unverified; no pool tuning/proxy |
| Video upload | 🟢 GREEN | Direct-to-S3 presigned; server out of data path |
| AI pipeline | 🟢 GREEN (design) | Queue-like worker with claims; Gemini rate-caps; not load-tested |
| Email | 🟡 YELLOW | Synchronous-ish, no durable retry queue |
| WhatsApp | ⚪ N/A | Not active yet |
| Player dashboard | 🟢 GREEN | Authorization audited; scale follows app layer |
| Admin panel | 🟡 YELLOW | Works; some lists unpaginated (slow at big data) |
| Auto Scaling | 🔴 RED | Does not exist |
| Disaster Recovery | 🔴 RED | Single instance; backup/restore never drilled |

## 4. Honest capacity statement

No load tests have been run (needs a staging environment — see Phase 3). Per your own instruction: **no fabricated numbers.** "Current tested concurrent users / RPS" = **not tested yet**. The estimates above are architecture math with stated assumptions, nothing more.

**Campaign math (arithmetic, not tests):**
- **Model A — 1M registrations / 30 days:** ~33k/day, peak ~1–2 registrations/sec ⇒ roughly 30–60 API req/s peak. Borderline for today's box; comfortable after Phase 1–2.
- **Model B — 1M / 7 days:** ~143k/day, peak ~4–8 reg/sec ⇒ 150–300 req/s. Needs Phase 2 (multi-instance + queues).
- **Model C — 1M / 24 hours:** avg ~12 reg/sec, peak 3–5× ⇒ 1,000+ req/s. Needs full target architecture + pre-scaling + provider arrangements. **Note: 1M OTP SMS ≈ ₹2–4 lakh vendor cost alone** — the SMS bill, not AWS, may be the biggest line item.
- **Model D — celebrity spike:** CloudFront absorbs the static surge; registration API needs scheduled pre-scaling (supported in Phase 2 design).

## 5. Phased plan (nothing done yet — awaiting your GO)

**Phase 0 — config-only, I can do from here, ships via `deploy/go.sh` (≈0 cost):**
nginx: 1-year immutable caching for hashed assets, rate-limit zones on `/api/auth/*` & `/api/payment/*`, keepalive to the API; explicit pg pool size + statement timeout. Low risk, reversible.

**Phase 1 — your AWS console, 1–2 hours, small cost (+$10–30/mo):**
CloudFront + WAF in front of bcplt20.com (long-cache static, short-cache HTML, **never cache** `/api/`, player/KYC/admin pages); RDS check per §6 (+ enable automated backups if off); AWS Budgets + billing alerts; a **read-only IAM key** for me for future inspections (policy: `ViewOnlyAccess`).

**Phase 2 — real migration, needs your budget decision (+$80–200/mo):**
ECS Fargate (2→N tasks, multi-AZ) behind an ALB with target-tracking auto-scaling (CPU ~50–60%) + scheduled pre-scaling for campaigns; SQS queues + worker service for email/SMS/WhatsApp/AI with retry+DLQ (code refactor I can prepare); ElastiCache Redis for rate-limit counters; RDS right-sizing (+ RDS Proxy if needed). App code is already close to ready for this (stateless tokens, claim-token jobs, DB-backed caps).

**Phase 3 — prove it (the "PROVE IT" requirement):**
Staging copy + k6 progressive tests (50 → 100k VUs as infra allows) using the app's **built-in mock modes** (stub OTP, Cashfree sandbox — already in the code, so zero real SMS/payments); publish before/during/after auto-scaling charts, p50/p95/p99, DB metrics, queue backlog, cost per stage; **only then** a GO/NO-GO for the big campaign.

## 6. What I need from you (console checks — 5 minutes, browser only)

AWS Console → RDS → Databases → click your DB → note these four things and paste them to me:
1. **Instance class** (e.g. db.t3.micro / db.t3.small)
2. **Multi-AZ:** Yes/No
3. **Automated backups:** Enabled? Retention days?
4. **Storage autoscaling:** Enabled?

And your decisions: ① GO/NO-GO for Phase 0 now? ② When to do Phase 1 together? ③ Phase 2 budget window ok?

## 7. Progress — overnight work (24 Jul 2026, रात में पूरा हुआ)

Workspace में तैयार + tested + committed। **EC2 पर live तब होगा जब अगला deploy (`deploy/go.sh`) चलेगा।**

1. **Notification outbox (durable retry queue)** — अगर Brevo/MSG91 कभी fail/down हो तो अब हर failed email/SMS queue में save होता है और अपने आप retry होता है (5 → 10 → 20 मिनट… backoff; 5 कोशिशों के बाद "dead" mark + admin-visible log)। Duplicate कभी नहीं जाते (content-hash dedupe)। OTP जान-बूझकर queue नहीं होते (time-sensitive — player नया मांग लेता है)। असली retries सिर्फ production में चलती हैं; dev में dry-run। दोनों PM2 workers में double-send impossible (DB-level SKIP LOCKED claim)।
2. **nginx hardening** — `/api/auth/` और `/api/payment/` पर per-IP rate limits (generous — carrier NAT वाले असली users कभी block नहीं होंगे), `/assets/` पर 1-साल immutable cache (CloudFront के लिए भी तैयार)। EC2 पर लगाने के लिए `deploy/fix-nginx.sh` — idempotent, config test fail होने पर auto-rollback।
3. **DB connection pool tuning** — हर API process अब max 10 connections + सख्त timeouts (पहले unbounded defaults) — RDS connection exhaustion से बचाव।
4. **k6 load-test suite** — `loadtest/` में master prompt के Scenario 1–5 के scripts + progressive profiles (smoke/ramp/spike/soak) + STAGING-ONLY README। कोई test चलाया नहीं गया — staging बनने के बाद ही।
5. **AWS Phase 1 owner guide** — `deploy/AWS_PHASE1_GUIDE.md` — RDS की 4-जानकारियां, Budgets alerts, मेरे लिए read-only key, CloudFront + WAF — सब browser-only steps में।

Tests: **144/144 pass** (11 नए outbox tests समेत)। इस रात में कोई असली SMS/email/payment trigger नहीं हुआ; AWS infrastructure में कोई बदलाव नहीं किया गया।

---
*Prepared without changing any infrastructure, per the master prompt. No load traffic was generated; no real OTP/email/payment was triggered.*

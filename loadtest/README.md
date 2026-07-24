# BCPL Load Tests (k6) — STAGING ONLY

**⛔ कभी भी production (bcplt20.com) पर ये tests मत चलाओ।**
Master prompt rule: no destructive load on prod, no real OTP/SMS/email/payments.

## Prerequisites
1. A **staging copy** of the stack (EC2/ECS + separate RDS + separate S3 bucket).
2. Staging env vars: **MSG91/Brevo keys UNSET** (app auto-falls back to mock OTP
   — `sendOtp` stub logs the OTP and `/api/auth/send-otp` exposes it in the
   response, exactly for this purpose) and **Cashfree sandbox** credentials.
3. `OUTBOX_ENABLED=0`, `REMINDERS_ENABLED=0` on staging during load runs unless
   the queue-drain behaviour is itself under test (then mock providers only).
4. k6 installed: https://k6.io/docs/get-started/installation/

## Running
```bash
BASE_URL=https://staging.example.com k6 run scenarios/01-public-website.js
BASE_URL=... PROFILE=ramp k6 run scenarios/02-registration.js
```
- `PROFILE=smoke` (default, 5 VUs · 1m) — wiring check
- `PROFILE=ramp` — 50 → 100 → 500 → 1000 VUs progressive stages
- `PROFILE=spike` — sudden 10×/25× burst (target behaviour: CDN absorbs static,
  app auto-scales, DB protected)
- Progress further (5k / 10k / 25k+ VUs) only from a distributed runner
  (AWS Distributed Load Testing solution) — a single laptop cannot generate it.

At each stage record: RPS, p50/p95/p99, error rate, EC2/ECS CPU+memory,
DB connections/latency, queue backlog, autoscaling events, cost — the
"FINAL CAPACITY REPORT" numbers come from these runs, never from estimates.

## Scenarios (map to master prompt §TEST SCENARIO 1–6)
| # | File | Covers |
|---|---|---|
| 1 | `scenarios/01-public-website.js` | homepage/teams/static pages + CDN cache effectiveness |
| 2 | `scenarios/02-registration.js` | send-otp (MOCK) → verify → status |
| 3 | `scenarios/03-payment.js` | order create (sandbox) + **duplicate webhook** replay |
| 4 | `scenarios/04-dashboard.js` | authenticated reads at scale |
| 5 | `scenarios/05-video.js` | presigned upload-url issuance (+ optional tiny PUT) |
| 6 | (approach) | queue throughput: point staging at mock providers, enqueue 1M jobs via a seed script, watch outbox/SQS drain rate + worker scaling. Never real messages. |

## Honesty notes
- Some request BODY fields (marked `TODO-VERIFY` in scripts) must be confirmed
  against the live staging API before big runs — routes are taken from the
  real codebase, bodies may drift.
- Auth-required scenarios need mock OTP mode on staging; there is no way (and
  should be no way) to bulk-generate real logged-in sessions on prod.

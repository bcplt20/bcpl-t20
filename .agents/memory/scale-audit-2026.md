---
name: Scalability audit (Aug 2026)
description: What breaks first under traffic growth and what was already fixed vs deferred
---
Verdict: single EC2 + PM2×2 + RDS t3.micro handles ~300–800 concurrent users on dynamic pages.

Fixed in code (Aug 5 2026): deliveries/innings/otp hot-path indexes (schema + deploy/sql catch-up), scorecard FoW N+1 (running total instead of per-wicket innings read), 60s public cache on sponsors/gallery lists.

Deferred (infra spend, do when traffic demands):
- ~100k users: upsize RDS (t3.small/medium), edge-cache public GETs, reduce Home/MatchCenter polling (30s/10s) — consider SSE for live scores.
- ~1M: Redis for rate limits + hot caches (in-memory otpGuard/seo caches are per-PM2-process), read replica, ALB + 2nd node.
- ~10M: CloudFront, autoscaling, partition deliveries, multi-AZ HA.

**Why:** polling amplification and per-process in-memory rate limits are the next real bottlenecks; code alone can't fix SPOF.
**How to apply:** re-read before any perf/scale request; don't re-add no-store to public list endpoints.

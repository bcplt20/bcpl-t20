# Threat Model — BCPL T20 Platform

## Project Overview

BCPL T20 is a cricket-league player registration and trials platform. Players register with phone-OTP auth, pay a Phase 1 trial fee (Cashfree), upload trial videos (private S3), get AI-assisted evaluation (Gemini), complete KYC, and — if selected — pay Phase 2. Admins manage registrations, KYC review, scoring, auction/squads, finance and CMS through a role-gated panel.

Stack: React/Vite website (`artifacts/bcpl-website`) + Express/Drizzle API (`artifacts/api-server`) in a pnpm monorepo. Production: EC2 (pm2 cluster ×2, t3.medium) behind nginx, AWS RDS Postgres, S3 for media. The website is served as static files by nginx; the API also serves SEO-injected HTML for page requests. Deploys ship via `git push origin main` + `deploy/go.sh` on the server (not Replit deploys).

## Assets

- **Player accounts & JWTs** — phone-verified identities; 30-day HS256 JWTs held in browser localStorage. Compromise allows impersonation, payment initiation and access to KYC progress.
- **OTP codes** — `otp_sessions` rows (plaintext, 10-min expiry, single-use). Abuse burns real SMS money (MSG91) and enables account takeover if brute-forced.
- **Payment records** — `phase1_payments` / `phase2_payments` with server-computed fees (incl. 18% GST) and Cashfree order/payment ids. Integrity failures = revenue loss or fake activations.
- **KYC identity data** — only provider references (`aadhaar_ref`, `pan_ref`) are stored, never raw Aadhaar/PAN numbers. Masked in admin responses; unmasking requires SUPER_ADMIN/KYC_TEAM `?reveal=1` and is audit-logged.
- **Trial videos** — private S3 keys under `videos/{userId}/{regId}/`, displayed only via 1-hour signed URLs.
- **Admin access** — `ADMIN_PANEL_PASSWORD` login → short-lived session tokens signed with `SESSION_SECRET`; per-key RBAC (`KEY_ROLES`) gates settings writes.
- **Application secrets** — `JWT_SECRET`, `SESSION_SECRET`, Cashfree keys (payment + separate CF_VERIFY_*), MSG91, Brevo, AWS, Gemini. All env-provided; boot fails in production if JWT/SESSION secrets are unset.
- **Audit trail** — `writeAudit` records sensitive admin/payment events; needed for dispute resolution.

## Trust Boundaries

- **Browser → API** — untrusted client to Express behind nginx; public routes (content, send-otp) vs authenticated routes (Bearer JWT) vs admin routes (session token + roles).
- **API → Postgres (RDS)** — all queries via Drizzle (parameterized).
- **Cashfree → API webhook** — external callback; HMAC-SHA256(timestamp+rawBody) verified timing-safe before any state change; amount/currency re-validated against server records.
- **API → SMS/Email vendors** — MSG91/Brevo; real keys exist in dev too, so stub/gating rules matter (tests must never trigger sends).
- **API → S3** — presigned PUT/GET; `media/` and `videos/` prefixes private; key prefixes enforce per-user ownership on confirm.
- **API → Gemini** — only pseudonymous `candidateId` + role in hardcoded prompt templates; user text never interpolated; responses zod-validated.
- **Player ↔ Admin** — two separate auth systems; player endpoints scope every lookup by `req.user.userId` (e.g. `loadOwnedKyc`, `loadOwnedRegistration`).
- **Dev (Replit) ↔ Prod (EC2/RDS)** — separate DBs and env; Cashfree runs stub mode in dev (no keys ⇒ no amount in status responses ⇒ amount validation intentionally skipped).

## Scan Anchors

- Entry/middleware: `artifacts/api-server/src/app.ts` (CORS allowlist, security headers, 1mb body limit, raw-body capture), routes mounted in `src/routes/index.ts`.
- Auth & OTP: `src/routes/auth.ts`, `src/lib/auth.ts` (JWT), `src/lib/otpGuard.ts` (rate limits/lockout), `src/middlewares/auth.ts`.
- Payments: `src/routes/payment.ts` (verify + webhook + amount-mismatch guard), `src/lib/cashfree.ts`, `src/lib/reconcilePayments.ts` (24h sweep).
- Admin: `src/routes/admin.ts` (login limiter + circuit breaker, session issue), settings RBAC via `KEY_ROLES`.
- KYC/PII: `src/routes/kyc.ts` (`loadOwnedKyc` ownership helper, masking, reveal audit).
- Media: video upload/confirm routes (S3 presign, prefix ownership check).
- SEO/HTML: `src/routes/seo.ts` (server-side meta injection — crawler-visible content must go through it).
- Dev-only surfaces: stub modes for SMS/email/Cashfree, `tests/` and `e2e/` suites — not reachable in production.

## Threat Categories

### Spoofing

Phone OTP is the only player credential. Guarantees: OTPs MUST be single-use with a short expiry (10 min, enforced); verify attempts MUST lock temporarily after repeated failures; sends MUST be capped per phone (DB-backed, cluster-safe) and per IP. JWTs MUST be signed with a production-only secret — the server MUST refuse to boot in production without `JWT_SECRET`/`SESSION_SECRET`. Cashfree webhooks MUST pass timing-safe HMAC verification (timestamp + raw body) before any state change. Admin login MUST stay behind the per-IP limiter + global circuit breaker with alerting.

### Tampering

All fees are computed server-side from role + config (client never supplies an amount). The gateway-reported paid amount and currency MUST match the server-recorded expectation before a payment is marked success or a registration is activated; mismatches MUST be flagged (`status='amount_mismatch'` + audit) and MUST NOT activate anything, while still 200-acking the webhook. Phase 2 orders MUST only be creatable for registrations with `phase1Status='selected'`. Draft autosave input MUST NOT be able to set `otp`, `mobileVerified` or `status` (zod strips them). S3 upload confirms MUST verify the key prefix belongs to the authenticated user.

### Repudiation

Payment mismatches, KYC PII reveals, and sensitive admin mutations MUST call `writeAudit` with actor, action, entity and values. Payment state changes rely on Cashfree ids (`cf_payment_id`) stored alongside rows for provider-side correlation.

### Information Disclosure

Raw Aadhaar/PAN MUST never be stored or returned — provider refs only, masked by default in admin, reveal audit-logged and role-gated. Videos and media MUST be served only via short-lived signed URLs. Secrets MUST stay in env (never in frontend bundles or logs); the OTP value may appear in logs ONLY in dev stub mode. Error responses MUST NOT leak stack traces or SQL details. CORS MUST stay on the origin allowlist (site is same-origin in prod; wildcard is forbidden).

### Denial of Service

OTP sends are the main cost surface: per-IP and per-phone caps + resend cooldown MUST stay in place. Request bodies are capped at 1mb. Admin login has a global circuit breaker. Known accepted gaps (documented, not yet mitigated): admin list endpoints lack pagination; notifications are sent synchronously in-request; background jobs are in-process `setInterval` (no durable queue) — a crash drops in-flight work. Load beyond ~2× t3.medium capacity needs infra work (see audit report), not app code.

### Elevation of Privilege

Every player-facing route MUST scope queries by `req.user.userId` (pattern: `loadOwnedKyc` / `loadOwnedRegistration` — verified across kyc/video/results/payment routes). Admin settings writes MUST be gated by `KEY_ROLES` per key; new settings keys MUST get an entry before use. All DB access goes through Drizzle parameterized queries; raw SQL string interpolation is forbidden. Gemini prompts MUST remain hardcoded templates — user-supplied text MUST NOT be interpolated into prompts.

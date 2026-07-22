---
name: Cashfree verification suite quirks
description: KYC (PAN/Aadhaar) verification env split, stub mode, and how vendor errors surface
---

# Cashfree verification suite quirks

**Rules:**
- KYC verification uses SEPARATE creds `CF_VERIFY_APP_ID`/`CF_VERIFY_SECRET` (not the payment `CASHFREE_APP_ID`/`CASHFREE_SECRET_KEY`). They exist ONLY in the EC2 prod `.env` — dev has neither, so dev always runs verification in stub mode (mock success). Vendor-side failures can NOT be reproduced from dev; diagnose from redacted `[CF]` logs on EC2 or from the official docs.
- Verification endpoints are hardcoded to `api.cashfree.com` (prod) regardless of `CF_ENV` (which only switches the payment-gateway base).
- The offline-Aadhaar API contract (ref_id field name, VALID vs SUCCESS status) is locked by a unit test with mocked fetch; trust that test over memory of the API shape.
- Player-facing "verification service unavailable" 502s mean the vendor call returned null — check field names/payload against telr-docs.cashfree.com BEFORE assuming an outage or account/product issue.

**Why:** Aadhaar OTP verify failed in prod for every player ("service unavailable") while PAN worked — the cause was a wrong request field name, not an outage, and it was invisible from dev because of stub mode.

**How to apply:** any change to KYC verification calls → update the contract test alongside; when the owner reports vendor errors, reproduce via docs + mocked tests, not dev API calls.

**Webhook auth rule:** every state-mutating Cashfree webhook must carry the same guard as the payment one — base64 HMAC-SHA256(timestamp + rawBody) via x-webhook-signature, timingSafeEqual. KYC webhook accepts CF_VERIFY_SECRET or CASHFREE_SECRET_KEY (verification-suite hooks sign with the verify secret). Unsigned → 401. When adding any new webhook route, copy this guard — an architect review caught the KYC one shipping without it.

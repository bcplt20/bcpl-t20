# BCPL T20 — Legal Content Overhaul (Staging) — Review Pack
**Date:** 24 July 2026 · **Status:** LEGAL APPROVAL PENDING — implemented on staging only, NOT deployed to production.

## What was done
All player-facing legal/policy pages were rewritten to the mandated legal implementation spec, and consent capture was added to the registration/payment flows. Every legal page now carries a version header (version · effective date · last updated), an amber **LEGAL APPROVAL PENDING** banner, and a Print/Download-PDF button. The banner and "draft" markers are controlled by a single flag (`LEGAL_APPROVAL_PENDING` in `artifacts/bcpl-website/src/lib/legalMeta.tsx`) — flipped off in one line upon approval.

## Documents & versions
| Page | URL | Version |
|---|---|---|
| Terms & Conditions | /terms | v2.0 |
| Privacy Policy | /privacy | v2.0 |
| Refund & Cancellation Policy | /refunds | v2.0 |
| Eligibility Criteria | /eligibility | v2.0 |
| How Selection Works | /trust | v2.0 |
| Phase 2 Physical Trial Rules | /trial-rules | v1.1 |
| Code of Conduct | /code-of-conduct | v2.0 |
| BCPL Cricket Rulebook (tournament only) | /cricket-rulebook | v1.1 |
| FAQ | /faq | v2.0 |
| Phase 1 video rules (in upload flow) | /register/upload-video | v1.1 |

## Mandated wordings implemented verbatim
1. **Auction Pool definition** — "Qualification for the BCPL Auction Pool means eligibility to participate in the applicable player-auction process. Auction Pool qualification does not guarantee purchase by a team, a player contract, remuneration, squad selection or tournament participation."
2. **Payment disclaimer** — "Payment of Phase 1 or Phase 2 fees does not guarantee qualification, final selection, Auction Pool entry, auction purchase, team allocation, player contract, remuneration or tournament participation."
3. **Ranking/allocation** — "BCPL may apply published playing-role allocations, regional representation requirements, minimum assessment standards, national merit ranking and applicable tie-break rules when determining advancement to the Auction Pool for the relevant season."
4. **Phase 2 results timing** — "After completing your physical trial, your assessment is recorded. Advancement results may be finalised after completion of the applicable BCPL trial window so eligible candidates can be ranked under the applicable season rules."
5. **Standardisation** — "BCPL seeks to use the same published role-specific assessment framework, scoring structure and applicable attempt rules across authorised Phase 2 venues." (Never "identical conditions".)

## Key policy positions now consistent site-wide
- **Fees:** Phase 1 ₹299 + GST (Bat/Bowl/WK) / ₹399 + GST (AR); Phase 2 role-based ₹2,000 + GST / ₹3,000 + GST (AR). "GST inclusive" wording removed everywhere; GST is always additional and shown before payment.
- **Automated assessment disclosure:** BCPL *may* use automated, digital, technology-assisted systems and third-party providers for video validation, scoring, ranking, fraud checks and administration. No "every video manually reviewed by a panel" claims anywhere.
- **No fixed-score promises** (no 95+/98+ cutoffs), no "scouts", no BCCI-affiliation implications, no superlatives, no absolute promises.
- **Refunds** restructured into scenarios A–H; existing player entitlements preserved (15-day pre-video-upload full refund; full refund if Phase 1 result not delivered within 15 working days); "no questions asked"/"we guarantee" phrasing replaced with policy-entitlement language; non-selection ≠ automatic refund.
- **Trial framework:** 6 valid deliveries/attempts by role, FEEDER ERROR / RE-BOWL rule, no discretionary extra balls, digital locked scoring with audited corrections, blind evaluator statement, evaluators do not decide final selection, 100-point framework without published weights.
- **Code of Conduct:** full misconduct catalogue + 4-level *fair* escalation (notice → response opportunity → proportionate sanction → final subject to grievance process).

## Consent capture (new, live in staging)
- **Phase 1 (registration payment):** required checkbox now covers T&C + Refund Policy + Eligibility + **Privacy Notice**; separate **optional** marketing checkbox (never gates payment); transactional-messages note shown. On "Pay", the client sends `{ termsVersion, privacyVersion, marketingOptIn }`; the server stamps `acceptedAt` and stores it at `registrations.consents.phase1` (JSONB).
- **Phase 2 (onboarding):** four declarations (added: "payment of the Phase 2 fee does not guarantee Auction Pool entry, auction purchase, team allocation, a player contract, remuneration or tournament participation"). Accepted declaration texts + version are sent with the Phase 2 payment call and stored at `registrations.consents.phase2` with server-stamped `acceptedAt`.
- Backward compatible: consent payloads are optional in the API, so older cached clients keep working.
- DB: `registrations.consents jsonb` added via idempotent startup DDL (no drizzle push required).

## Verification performed
- API typecheck ✅ · Website typecheck ✅ · API test suite 231/231 ✅
- Visual check of legal pages (desktop + mobile) with pending banner, version header, print button ✅

## Go-live procedure (after owner/legal approval)
1. Flip `LEGAL_APPROVAL_PENDING = false` in `legalMeta.tsx` (set the real effective date).
2. Commit + push to GitHub, then owner runs `bash deploy/go.sh` on the server.
3. Until then, production continues to serve the previous versions.

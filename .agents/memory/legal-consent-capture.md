---
name: Legal consent capture
description: How versioned legal consent is stored and the traps around entry points, merges, and the approval flag
---

# Legal consent capture (BCPL)

**Rules:**
1. `registrations.consents` (jsonb) is written ONLY via `recordConsentKey()` (exported from the payment routes) — an atomic SQL jsonb merge (`consents || jsonb_build_object(key, value)`). Never JS-spread-merge a previously read row back in: racing phase1/phase2 requests clobber each other's key.
2. Every payment ENTRY POINT must submit the consent payload — not just the main form flow. The logged-in resume/"Complete Payment" path was silently skipping consent capture until review caught it. When adding any new pay/retry/deep-link entry point, it needs the consent checkbox UI + payload.
3. Consent versions live in `legalMeta.tsx` (`CONSENT_VERSIONS`); server stamps `acceptedAt`. Bump versions when legal copy changes materially.
4. `LEGAL_APPROVAL_PENDING` flag in `legalMeta.tsx` gated the draft banners on all legal pages — owner approved and it was flipped to false on 24 July 2026 (effective date July 24, 2026). If legal copy changes materially again: bump CONSENT_VERSIONS, re-gate behind the flag, and get fresh owner approval before push.

**Why:** consent records are a legal audit trail — a missed entry point or clobbered key means "we cannot prove this player accepted v2.0", which defeats the whole feature.

**How to apply:** touching payment initiation, adding pay buttons anywhere, or editing legal pages → check all three: entry-point coverage, atomic merge, version bump.

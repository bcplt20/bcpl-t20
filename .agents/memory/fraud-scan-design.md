---
name: Fraud dup-scan design
description: Constraints behind the fraud_flags duplicate detectors (video etag, aadhaar/pan refs) and review flow
---

# Fraud duplicate-scan design constraints

- **Video duplicates match S3 ETag.** ETag == MD5 only for single-part uploads; multipart uploads yield non-content ETags (documented in fraud router header). If uploads ever switch to multipart, detector needs a real content hash instead.
- **Aadhaar/PAN duplicates match provider reference ids** (`aadhaar_ref`/`pan_ref` from Cashfree verification), NOT document numbers — real numbers are never stored. Synthetic refs (`manual_review%`, `kept_%`) are excluded from the scan.
- **Scan is manual-trigger only** (admin button), inserts are idempotent via UNIQUE `(registration_id, type)` + `onConflictDoNothing`.
- **Flags never auto-punish**: clear/block/reflag are human decisions, reviewer-stamped and audited. PATCH returns 409 when re-applying the same status.

**Why:** compliance stance (no automatic player consequences) + Cashfree only exposes refs, not numbers; storing numbers would be a PII liability.

**How to apply:** any new duplicate detector should follow the same pattern — static SQL GROUP BY, exclude synthetic values, idempotent insert per (registration, type), human review flow.

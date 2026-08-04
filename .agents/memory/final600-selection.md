---
name: Final 600 selection engine
description: Zone/role rank-based national selection engine — batches, config invariants, CAS ownership, publish semantics
---

- Engine lives in api-server lib/selectionEngine.ts + routes/selection.ts + SelectionView.tsx admin view; tables selection_batches / selection_batch_members (catch-up SQL in deploy/sql/2026-08-04-*).
- Authoritative physical score = physical_assessments.final_score (0-100). trial_evaluations.total_score is a raw staff-app feed, NOT source of truth. Engine reads, never writes, coach scores.
- selection_config settings key (SUPER_ADMIN via KEY_ROLES) holds pool/quota/tie-breaker/zone-map; superRefine rejects configs where totalPool ≠ zones×zoneQuotas + wildcards ("OWNER DECISION REQUIRED" message). Never hard-code quotas.
- All ranking is single-pass SQL window functions over the frozen snapshot; INSERT…SELECT member writes; never loads population into Node. 100k eligible ranked in ~709ms (seq scan is inherent — jsonb tie-breakers unindexable); drill-down uses selection_batch_members_filter_idx.
- **Every mutating step must be claim-guarded** (WHERE claim_token AND status='generating', check affected rows, throw OwnershipLostError on 0) and the final preview_ready flip lives INSIDE the same tx as member writes. Architect caught this gap once — don't reintroduce.
- Approve/publish are conditional UPDATE … RETURNING; 0 rows ⇒ 409. One approved batch per season via partial unique index.
- PUBLISH only flips status — player notification wiring is a deliberate follow-up (task proposed). Unmapped trial cities are excluded + flagged in exception report, never defaulted to a zone.
- **Why:** owner spec demands deterministic, auditable, population-independent selection with no silent substitution and no auto-publish.

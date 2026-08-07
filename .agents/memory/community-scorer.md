---
name: Community scorer
description: Any-user match scorer (app /scorer + /api/community) — engine rules, tx locking, mobile gating
---
Separate from official scoring: raw-SQL tables community_matches/innings/deliveries, any OTP user (30 matches/day).

**Rules:** all mutations (ball/undo/innings-end/finish) run in one db.transaction that locks the match row FOR UPDATE first — keep that when editing, or concurrent taps corrupt totals. retired_hurt is NOT a wicket in totals; byes/leg-byes are never charged to the bowler. finish without a scored 2nd innings is rejected unless body `{abandon:true}`.

**Mobile:** active innings = LAST element of scorecard innings array (API orders ascending); pad shown only if match id appears in the user's `mine` list (never trust nav params); scorecard GET is public → guest read-only view.

**Why:** review found concurrency data-loss + innings-2 flow bugs on first pass; these invariants were the fixes.

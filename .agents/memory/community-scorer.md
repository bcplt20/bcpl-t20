---
name: Community scorer
description: Any-user match scorer (app /scorer + /api/community) — engine rules, tx locking, mobile gating
---
Separate from official scoring: raw-SQL tables community_matches/innings/deliveries, any OTP user (30 matches/day).

**Rules:** all mutations (ball/undo/innings-end/finish) run in one db.transaction that locks the match row FOR UPDATE first — keep that when editing, or concurrent taps corrupt totals. retired_hurt is NOT a wicket in totals; byes/leg-byes are never charged to the bowler. finish without a scored 2nd innings is rejected unless body `{abandon:true}`.

**Mobile:** active innings = LAST element of scorecard innings array (API orders ascending); pad shown only if match id appears in the user's `mine` list (never trust nav params); scorecard GET is public → guest read-only view.

**Mobile UX:** striker/nonStriker/bowler is client-side only (server just stores names). Every ball push snapshots identity to a history stack; undo MUST pop/restore it. Over-end wicket = queued prompts (batter first, then bowler). bye/legbye picker starts at 1 (server coerces min 1).

**Web:** public page /scorecard/:id on website; SEO title via Express injector raw-sql lookup (community tables aren't in drizzle schema). finalizeResult runs INSIDE the locked tx (ball + finish) — never move it out.

**Why:** two review rounds found concurrency data-loss, innings-2 flow bugs, undo identity corruption; these invariants were the fixes. Engine has 29 vitest tests (tests/communityScorer.test.ts).

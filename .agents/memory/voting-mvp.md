---
name: Fan voting & MVP fantasy engine
description: Poll/vote system and automatic MVP points computed from official scorecards; car-prize finalist rule
---
- Public: GET /api/polls, POST /api/polls/:id/vote (player JWT, one vote/user, UNIQUE constraint, 409 dup). Admin CRUD under /api/admin/polls* (CONTENT_TEAM). No voter PII ever in responses.
- MVP: GET /api/mvp/leaderboard aggregates COMPLETED official matches' deliveries by name+team (deliveries carry no playerId); 60s in-memory cache. Points config = site_settings `mvp_points_config` (KEY_ROLES: MATCH_OPERATIONS), Dream11-style defaults.
- **Car rule:** Man of the Series eligibility = only players of teams in the matches.stage='final' fixture; finalists=null → nobody eligible. UIs (web /vote,/mvp; app vote.tsx/mvp.tsx) show All vs Car-Race toggle.
- Vote response is {success,totalVotes,options} — NOT {poll}; clients must merge, not replace.
- Community media presign routes end in `/upload-url` (not /presign).

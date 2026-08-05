---
name: Match cards & reveal animations
description: IPL-style MatchCard conventions and the site-wide reveal-animation ban
---
- Shared `MatchCard` (+`MatchCountdown`, `stageMeta`, `TeamLogoBadge`) is the ONE card used on Home/Schedule; MatchCenter reuses countdown+stage badge. Team colors/logos come from the module-cached `useTeamMeta()` hook (`lib/teamMeta.ts`) — never re-fetch getTeams per card.
- **Why:** owner rejected plain navy cards (Aug 2026): cards must be colorful (team-color gradients + side bars), show team logos, group-stage/semi(purple)/final(gold) badges, running countdown. TBD playoff teams show the BCPL ball logo, never initials.
- Reveal/scroll-fade animations are DISABLED site-wide (index.css + Home CSS): owner saw a blank navy page for seconds on back-navigation. Never reintroduce hidden-until-reveal styles; content must render instantly.
- Home shows only 3 matches in a slider (`.mc-slider`, horizontal snap on mobile) + zero-filled Group A/B mini tables (normalized team-name join of matches.grp with points table).
- Visible season branding = "Season 4" everywhere even though DB season number is 5.

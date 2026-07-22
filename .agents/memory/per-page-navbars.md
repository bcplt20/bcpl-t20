---
name: Per-page navbars on BCPL site
description: Every page embeds its own copy of the navbar; nav changes must be applied file-by-file and it is easy to miss pages
---

# Per-page navbars

The BCPL website has NO shared navbar component. Every page under `src/pages/` embeds its own copy of the desktop nav (`.desk-nav`) AND its own mobile hamburger overlay. Several pages also keep the nav links in a local `links` array while others inline the array in JSX — the markup drifts slightly per page.

**Why:** During the "name in header" task, 16 pages were updated and a review still found 3 more public pages (TeamDetail, CodeOfConduct, CricketRulebook) plus 4 pages whose mobile menus were missed even though their desktop navs were updated.

**How to apply:** For any nav-wide change, enumerate ALL render sites first:
- `grep -l "desk-nav" src/pages/*.tsx` for desktop navs
- separately check each page's mobile overlay (`open&&(` / `menuOpen` blocks) — desktop and mobile are separate copies
- journey/auction pages (Phase1*, Phase2*, Auction*, TeamSelected) have purpose-built headers — decide explicitly whether they are in scope, and say so.

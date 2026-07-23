---
name: Subagent brief endings
description: How to word multi-page DESIGN subagent briefs so they finish instead of pausing
---

Multi-file DESIGN subagents may stop mid-cluster and ask "want me to continue?" — burning a full followup round-trip to say "yes".
**Why:** happened during the V3 A-to-Z redesign (one cluster delivered 2 of 4 pages, then paused for approval despite an autonomous mandate).
**How to apply:** end every multi-item brief with an explicit completion clause: "Complete ALL N items. Do not stop to ask questions or offer options — finish, verify tsc passes, then report DONE." Also verify delivery against `git status` (files actually modified), not the subagent's own summary — reports can claim more than was written.

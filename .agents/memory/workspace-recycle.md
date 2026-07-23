---
name: Workspace recycle wipes uncommitted edits
description: Mid-session environment recycle/reset can erase uncommitted working-tree changes; git history survives
---

Rule: after a multi-file fix passes typecheck, git-commit it locally RIGHT AWAY (push can wait for review). 
**Why:** an environment recycle mid-session erased two applied-but-uncommitted file edits (July 2026) — the review subagent then saw a clean tree; the re-apply cost a full round. Pushed and locally committed work both survived.
**How to apply:** treat "edits applied + tsc pass" as the commit trigger; never leave verified work uncommitted while waiting on reviews/screenshots. Re-check file contents (grep a marker) before re-applying scripted edits.

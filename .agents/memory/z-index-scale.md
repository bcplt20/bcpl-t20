---
name: Site z-index scale
description: Fixed stacking order for the BCPL website; where each layer type must sit
---

# BCPL website z-index scale

The rule: **header 200 < page floating CTAs / sticky bars ≤ 1000 < mobile menu 1500 < LoginModal 2000.**

**Why:** Legacy pages shipped `.float-reg-btn` at z-index 9999 (copy-pasted into ~12 page files), which sat ON TOP of the full-screen mobile menu — menu looked broken on Teams/Schedule/PointsTable/etc. Registration's own bottom bar legitimately uses 1000, so the menu was bumped to 1500 rather than fighting page bars.

**How to apply:** Any new floating/sticky page element gets ≤ 1000. Any new overlay (menu, drawer) 1500. Modals 2000+. The `.float-reg-btn` CSS block is duplicated per page — if it's edited, sweep ALL pages (`grep -rl 'float-reg-btn' src/pages/`), not just one. Watch for both `zIndex: N` (JSX) and `z-index:N` (CSS-in-string) spellings when sweeping — sed on one spelling misses the other.

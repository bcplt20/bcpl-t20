---
name: Site header — shared SiteHeader component
description: All pages now use one shared header; how it works and what to watch when touching it
---

**Current state:** every page (31 files incl. not-found) renders `<SiteHeader active="..." />` from `src/components/SiteHeader.tsx`. The old copy-pasted per-page navbars/AnnouncementBars are GONE. Header = orange ticker + sticky navbar (60px) + mobile hamburger overlay; CSS is self-contained with `sh-` prefixed classes and a `shTicker` keyframe to avoid collisions with page-local styles.

Watch-outs:
- `active` prop must be one of the NAV labels (Home, Match Center, Teams, Sponsors, Photos, Videos, About, FAQ, Contact); flow/legal pages pass none.
- Page-local sticky elements must offset `top:60` (navbar height). TeamDetail's tab bar had `top:64` and left a 4px gap.
- On <640px the navbar CTA is hidden (`sh-cta-desk`) so the hamburger fits in 402px viewports; the mobile overlay menu carries its own Register button. Don't re-add a visible CTA on mobile without checking 402px width.
- Old unused header CSS rules (`.desk-nav`, `.ham-btn`, ticker keyframes) intentionally remain inside many pages' `<style>` blocks — harmless; don't "fix" them into new markup.
- Login entry is `NavUser` inside SiteHeader; pages should not import NavUser directly anymore.

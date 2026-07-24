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


## UPDATE July 2026 — SiteHeader V4 (spec Part 4)
- Height is now var(--sh-h): 64px mobile / 68px desktop (was fixed 60px). `:root` var is defined inside SiteHeader's CSS. Any page sticky element must offset with `top:'var(--sh-h, 64px)'` — never a magic number.
- Initial state fully transparent over hero; glass + blur + hairline only after scrollY>8.
- Mobile bar: logo LEFT, right cluster = NavUser variant="icon" (SVG person / avatar initial) + REGISTER + hamburger. SEASON 5 badge hides <400px (.sh-s5).
- Desktop: logo left / centered links (Teams Players Trials Matches Auction Media About — Trials→/trust, Auction→/auction/live, Media→/photos) / lang+login+CTA right.
- Mobile menu (z1500): links incl. Standings→/points-table, then NavUser row, big "Register for Phase 1" CTA, LangToggle, Help(/faq)+WhatsApp support row.
- Player logout entry points: mobile ☰ menu Sign Out row (NavUser mobile variant, hard redirect to BASE_URL) + profile hero card on default home tab + MY ACCOUNT fallback on profile tab when unregistered. Profile page is mobile-tabbed (.mob-tab-content gating) — any new section must be assigned to a tab or it is invisible on mobile; keep Sign Out reachable on the DEFAULT tab.

## Register CTAs are auth-gated (July 2026)
- SiteHeader gates its 3 register buttons (desktop, mobile top-bar, menu sheet) on `!useAuthUser()`.
- SiteHeader also toggles `html.bcpl-authed` class + CSS `html.bcpl-authed .float-reg-btn{display:none!important}` — hides every per-page floating register button site-wide for logged-in users. No unmount cleanup ON PURPOSE (avoids flash during route transitions; every .float-reg-btn page mounts SiteHeader, logout only happens via NavUser inside SiteHeader).
- **How to apply:** any NEW register CTA must either use class `float-reg-btn` or be wrapped in `{!user && ...}`. Never show register nudges to logged-in players (owner rule).
- AuctionLive (/auction/live) is now an honest static info page — the old fake live-bid simulation is deleted; never reintroduce simulated bids/results (compliance).

---
name: V3 design language decisions
description: Deliberate V3 conventions — emoji icons allowed, internal link rule, audit greps
---

**Emojis-as-icons are deliberate** in the V3 redesign (journey timeline, role chips, trust rows, section icons across all pages).
**Why:** the approved & pushed Home.tsx reference uses them; direction docs never ban them; stripping would churn ~30 internally-consistent pages.
**How to apply:** don't flag or remove emoji icons in website pages; don't add "no emojis" to future page briefs. Headless screenshots may render some (🏏) as tofu — that's a screenshot font issue, not a bug.

**Internal links must be wouter `<Link href>`**, never plain `<a href="/...">` — plain anchors escape the dev-preview base path (/bcpl-website/). External (https/mailto/tel/wa.me) stay `<a>`.
**Audit tip:** grep `<a [^>]*href="/` (else `<Link` contaminates counts); for true emoji use range U+1F000–1FAFF (U+2600–27BF over-counts benign ✓ ★ glyphs). Most anchors are single-line and safely script-convertible; multi-line ones need manual edits.

## UPDATE July 2026 — partly superseded
The 80-part "Complete Production Upgrade" master spec mandates a premium sports-league look and explicitly bans childish graphics. The old "emoji icons are deliberate" rule no longer holds — an emoji→premium-icon sweep is planned in the homepage/design phase. Wouter-Link and audit-grep guidance still applies.

## UPDATE 24 Jul 2026 — hero/type unification DONE
All public + player-flow pages now use the ONE v3 pattern: centered hero (gold kicker, Barlow Condensed clamp() head, Inter subcopy), var(--container) 1200 w/ 20/32/48 padding, section rhythm clamp(56px,9vw,110px). Canonical reference = Players.tsx hero. Montserrat remains ONLY in: Registration.tsx (deliberately unchurned), Home.tsx small `.mont` labels, and the frozen print-receipt HTML string in Phase1PaymentReceipt. New pages MUST copy the v3 hero — never Montserrat, never left-aligned hero bands. Sponsors render ONLY in footer strip + /sponsors page (owner call; SponsorWall removed from Home). Kicker badges carry no emojis.

## Aug 2026 — REJECTED: ivory/white theme (reverted same day)
Owner rejected Midnight Emerald (reverted). Current theme: ivory #F6F3EC / #EDE8DC bg, white cards (border rgba(12,29,51,.10)), navy ink #0C1D33, orange #FF7A29 CTAs (white text), gold small-text on light = #B8892B. Dark navy anchors: footer + heros marked `data-hero-dark` (Home, MatchCenter, PointsTable only). SiteHeader is context-aware: light-ink at top unless [data-hero-dark] present on the page. Admin panel = light #F5F6F8 dashboard, dark slate sidebar. New dark-hero pages MUST add data-hero-dark or header goes white-on-ivory.


## Aug 2026 — FINAL: LIGHTENED DARK theme (current)
Owner rejected BOTH Midnight Emerald and the ivory/white theme. "Light theme" for him = the ORIGINAL dark navy theme lightened for readability, NOT white. Current palette: page navy #1B2E52 (was #0C1D33), deep #16223C, panels #24396B/#2C3A5E, borders rgba(255,255,255,.16-.20), reading text >= .88 white alpha (never below .70). Orange #FF7A29 CTA + gold #E8B23D unchanged. Admin: content bg #243050, sidebar #1F2B49, cards #2C3A5E, text .92 white. MatchCenter/PointsTable = premium IPL-style (broadcast strips, LIVE pulse, full scorecard tables) on this palette. LESSON: when owner says "light", ask/assume lighten-the-existing-dark, not a white redesign.

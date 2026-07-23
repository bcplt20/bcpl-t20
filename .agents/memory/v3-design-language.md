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

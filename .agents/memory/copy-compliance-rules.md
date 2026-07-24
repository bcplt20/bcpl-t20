---
name: Copy compliance rules
description: Editorial rulebook from the July 2026 legal copy sweep — wording every future page/email/WhatsApp template must follow
---

# Copy compliance rules (post-sweep, July 2026)

**The rules** (all user-facing surfaces: pages, emails, SMS, WhatsApp, SEO, receipts):
1. Phase 1 video evaluation is NEVER described as human/scout/team review → "evaluated against BCPL's Phase 1 assessment criteria" / "BCPL's Phase 1 evaluation process".
2. No BCCI affiliation claims. Sole exception: "Former President, BCCI" as Sourav Ganguly's factual title.
3. Result timing in marketing copy: "within 48 hours". Refunds page keeps "15 working days or refund" as a deliberate safe outer bound — do NOT "fix" it to 48h.
4. Video length: 30–60 seconds. Upload window: 15 days (Home journey, receipts, FAQ all standardized to this).
5. League descriptor: "India's Corporate Cricket League" — never biggest/largest/world's/most trusted. Aspirations must be clearly visionary, not factual.
6. No absolute promises: no "zero hidden fees ever", "or full refund", "pay & get shortlisted". Phase 2 fee: "payable only if you qualify and choose to proceed."
7. No unverified statistics (cities/player counts). Don't invent numbers; verified: 10 franchise teams, ₹6 crore prize pool.
8. Ground-trial humans are real: use "franchise selectors"/"experienced coaches" (never BCCI-certified). KYC manual review copy is factual — keep.
9. Every EN change needs its Hindi twin updated (t(en,hi), aHi, descHi).

**Why:** owner's 80-part master spec (Parts 12/13/19/74) + misrepresentation risk; full OLD→NEW log in reports/legal-copy-change-report-2026-07-23.md.
**How to apply:** any new template or page copy (email/WhatsApp phases!) must pass the sweep grep: `bcci|scout|working days|most trusted|hidden charges|india's (biggest|largest)|full refund|2.minute`. Legal pages (Terms/Privacy/Refunds/CoC): factual corrections only, never change commitments/windows without owner+legal sign-off.

**Fee amounts in copy:** user-facing copy must NEVER hardcode fee amounts (₹99/₹299/₹2,000 all slipped in at different times); fees are config-driven (/api/fees, useFees). When touching copy, grep `₹[0-9]` in the page/component. Why: stale amounts confuse the owner and can misquote real prices.

## Refund-implication ban (owner rule, repeated many times)
NEVER write copy implying "not selected = you pay nothing / your money is safe" — users read it as a refund promise for Phase 1 and demand refunds. Banned patterns: "pay nothing", "nothing more", "एक रुपया भी नहीं", "कुछ नहीं देना", "Ever.", money-back vibes (green + shield styling on fee cards counts).
**Correct framing:** "Phase 2 fee is charged only on selection — a separate payment at that stage. All fees, once paid, are non-refundable." (mirrors Terms/Refund Policy).
**Grep gate before shipping any pricing/fee copy:** `pay nothing|nothing more|एक रुपया|कुछ नहीं देना|money.back|पैसे वापस`

## League numbers (July 2026, owner-set) + legacy grep gate
Current claims: **15+ trial cities · 10 teams (10 franchise cities OK on Teams page) · ₹15 Cr+ prize pool · ₹2L–₹20L auction value (always the RANGE, never "max ₹20L" — the ₹2L floor is the point)**.
Legacy phrases are BANNED sitewide (en+hi, incl. index.html static meta + seo.ts injector): grep gate `₹6 [Cc]r|6 करोड़|10 [Cc]ities(?! squads)|10 शहर|Max Auction|अधिकतम Auction|₹20L [Mm]ax`. index.html metas are easy to miss — check them on every numbers change.

---
name: Master spec 2026 progress
description: Owner's serial upgrade docs (42-part, 36-section, 51-section July '26) — what pre-existed, wave trackers, copy rules. Check before building any spec part.
---

Spec file (1st, 42-part): `attached_assets/Pasted--BCPLT20-COM-COMPLETE-WEBSITE-UI-UX-CONTENT-LEGAL-CONVE_1784879016037.txt` (PART markers listed at lines 59–1302).

**Lesson: every spec so far was written against an OUTDATED view of the site — ~half already existed. Always audit code + live JS bundle (curl bcplt20.com assets, grep phrases) before building a spec part.**

## Already satisfied BEFORE spec (do not rebuild)
- B/C: role-based fees ₹299/₹399 (P1), ₹2000/₹3000 (P2) + 18% GST — single source `api-server/src/routes/register.ts` FEES + client `lib/fees.ts`; checkout shows Fee/GST/Total + "PAY ₹X SECURELY" (Registration.tsx ~1028); receipts have GST breakup.
- F: language toggle real & persisted (`lib/i18n.tsx`, localStorage `bcpl_lang`, ?lang param) — NO simultaneous duplication (only intentional legal "authoritative in English" footer lines).
- G/H: header contextual CTAs = NEXT_CTA map in SiteHeader.tsx driven by getNextAction(); mobile header V4.
- I/L/M: hero copy/CTAs, authority stats, 4-step journey already compliant.

## Wave tracker
- **Wave 1 DONE (pushed 24 Jul 2026, commits db88c90+2bf24bd):** banned copy removed (Home "forever ₹0"→"no additional tournament participation fee*"+footnote; "No fine print"; FAQ FREE-forever×2; Refunds "scout review"→"Phase 1 evaluation", "fine print tricks"; Registration "send one video"); payment≠selection disclaimer at Home fees + P1 pay step + P2 pay page; P2 consent fixed ("non-refundable" flatly contradicted Refund Policy — now "except situations in Refund Policy"); NEW `/trial-rules` page (TrialRules.tsx, parts P–AA: 6-attempt, feeder-error, standardised framework, 100-pt rubrics, blind assessment, locked scoring, results-not-immediate, auction-pool meaning, tie-breaks, complaints) + footer link + seo.ts meta.
- **Remaining queue:** N (Trust→12-step journey), AI (FAQ ~23 Q&As, spec lines 1120–1172), AB (eligibility expand), AC/AD/AE/AF/AG (legal pages — LEGAL REVIEW flags, don't push without owner OK), AJ (complaint flow beyond mailto), K (homepage reorder — low value), J (hero video — blocked on Drive footage answer), AK/AL (sponsor/stories data — blocked on owner data), AM/AN/AO (responsive/perf/live-verify passes).

## Copy rules added by this spec (on top of copy-compliance-rules.md)
- Never "₹0 forever"/"play for FREE": use "no additional BCPL tournament participation fee" + "subject to applicable Season 5 rules and expressly disclosed exceptions".
- Payment≠selection disclaimer required at every payment decision point.
- Phase 1 review: "evaluation process against assessment criteria" — never panel/scout/manual-review claims; never display Gemini brand player-facing.
- Trial rules wording: no absolute claims (identical deliveries, immutable scores, fixed cutoffs); Auction Pool = eligibility only; rubric weights "initial/versioned, finalised by Cricket Operations"; "final published rulebook prevails" caveat everywhere.

## July 2026 — second premium spec (36 sections)
- Pattern repeated: ~half the asks already existed (odometer countdown, ticker, auth-aware CTAs, 18–45 age copy, clean API templates). ALWAYS audit before building.
- Journey desktop "empty space" complaint root cause: 4 cards in a `repeat(7,1fr)` grid — a stale column count, not a design gap. Check grid math before redesigning.
- Official team logos: replacing files under the SAME filenames in public/bcpl-assets/logos/ upgraded every call site with zero code churn — keep this pattern for future asset swaps.
- 15+→50+ trial cities lived in exactly 3 files (Home ticker, About timeline, Registration comment); hero stats now data-driven (single array).
- Copy rule reinforced (architect caught a leftover in Home FAQ): ANY "non-refundable" mention must carry "except where expressly provided in the Refund & Cancellation Policy" — EN and HI both; grep "refundable" on every copy change.
- New-string i18n trap: don't ship English as the Hindi variant for NEW labels (Devanagari transliteration is fine house style).
- Emoji→SVG sweep done on Home (StepIcon inline-stroke pattern) + fees ℹ️; other pages may still carry emojis — sweep remains open elsewhere.

## July 2026 — third spec (51-section "final production finishing") — main wave DONE
Spec file: `attached_assets/Pasted-BCPLT20-COM-FINAL-PRODUCTION-FINISHING-UI-UX-CONSISTENC_1784895091571.txt`. Pre-existed (audited, not rebuilt): §7–16, §26–28, §43, §48.
- Shipped: shared `bcpl-website/src/lib/format.ts` (canonical role/date/time/batch formatters — local ROLE_LABELS maps in pages are now banned, import formatRole); dashboard `trial` block + VIEW_TRIAL_PASS next-action; trial-completion email (reserve-first dedupe); TrialPass boarding-pass rewrite (status strip / journey strip / completed-dims-QR); PlayerProfile trial states + §24 encouraging rejected copy; cohort-explicit rank labels; §34 raw-error render fixes; footer emoji sweep.
- **deriveStep trap (durable):** profile journey derivation must trust the STRONGEST server signal first (dashboard trial block / kyc_done) — old accounts and e2e fixtures legally miss early rows (video/payment), and early-row checks placed first drag trial-stage players back to "upload video".
- **Rank semantics (server `computeRanks`):** cityRank = within city ALL roles; roleRank = within city SAME role (NOT national). Any rank label must name the cohort explicitly ("Delhi Rank — All Roles", "Delhi Batsman Rank").
- **assessmentSubmitted truth = `trial_evaluations` (status submitted), NOT `physical_assessments`** (that table is only the legacy admin bridge).
- Evidence pattern for authed-page verification: see player-ui-auth-testing.md.


## Third spec — finishing wave 2 (session of 24 Jul 2026)
- §36 DONE: pictorial emoji fully swept from public UI (~34 files). Shared icon lib now at `bcpl-website/src/lib/icons.tsx` (~55 stroke-SVG exports) — ALL public pages import from it; NEVER define per-page icon components again. Only intentional emoji left: WhatsApp share-message strings (5 lines) — message content, keep.
- Emoji-scan recipe UPGRADED: old ranges missed ⏱(U+2300-23FF) and ⬇(U+2B00-2BFF); scan must cover 1F000-1FAFF, 2300-23FF, 2600-26FF, 2700-27BF, 2B00-2BFF and whitelist glyphs ✓✔✕✗☰. Bare ⚠ renders as colored emoji on mobile — treat as pictorial (→IcoWarn).
- Print-HTML receipt templates + share-card canvas: React icon components CANNOT go inside document.write/template-string HTML — plain text or ✓ glyph only.
- §42 DONE (lazy loading="lazy" decoding="async" on below-fold img grids; skipped hero/LCP imgs). §5 DONE (tabular-nums on rank chips + trial-slot cells). §45 label align DONE (wicketkeeper_batsman → 'Wicketkeeper' web+server both).
- /trial-pass response contract pinned by api-server/src/routes/trials.trialPass.test.ts (express ephemeral port + fetch pattern — first HTTP-style route test in the suite; copy it for future route contracts).
- Still open: §30 full page redesigns (deferred), §42 LCP/CLS measurement, §46 full A–L matrix, §49 prod verification (blocked until owner deploys EC2).

- §49 UPDATE (24 Jul 2026 shaam): owner ne EC2 deploy chala diya — prod par healthz 6/6, OG meta, naya icon-look LIVE verified. Deploy saga (SSL + truncate-prompt) ke sabak deploy-pipeline.md me.

## July 2026 — fourth spec (78-part "FINAL 10/10 PRODUCTION POLISH") — main wave DONE
- Spec file: `attached_assets/Pasted-BCPLT20-COM-FINAL-10-10-PRODUCTION-POLISH-QUALITY-ASSUR_1784912681353.txt` (owner: audit combined with 51-part). Audit-first confirmed AGAIN: ~70% pre-existed (drafts lifecycle, finance view, notification logs+journey tab, QR security, payment UX, trial-pass polish).
- Shipped (commit 4457b79): PlayerProfile 11-step data-driven journeyNodes (deriveStep trap honored — trialStage forces early nodes done; rejected ⇒ paused, no active pulse; journeyPct computed, no hardcoded %); global `.skel` shimmer + `components/Skel.tsx` — 9 pages off plain "Loading…" (MatchCenter/Photos were BLANK); `lib/season.ts` = single source for marketing facts (Home/Teams/AuctionLive/FAQ/JsonLd/Eligibility/Contracts/CMS); Phase-2 fee fallbacks now import FALLBACK_FEES; buttons: radius→var(--r), .btn-fire min-height 44, Phase2Registration 18×24→16×32.
- Registration `.btn-primary` 4px radius + clip-path = INTENTIONAL angular wizard design — do not "fix" to var(--r).
- Dev preview root `/favicon.ico` 404 = base-path artifact only (prod serves at root) — ignore, don't chase.
- Still open (deliberate): P41/42 static-page typography depth, P50/51 srcset/WebP + LCP/CLS, P53 full a11y audit, P72 Lighthouse. Bundle note: main chunk 2.37MB (574KB gzip) — code-split candidate.

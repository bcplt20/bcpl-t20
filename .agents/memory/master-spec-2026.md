---
name: Master spec 2026 progress
description: Owner's 42-part website upgrade doc (parts A–AP) — what pre-existed, wave tracker, new copy rules. Check before building any spec part.
---

Spec file: `attached_assets/Pasted--BCPLT20-COM-COMPLETE-WEBSITE-UI-UX-CONTENT-LEGAL-CONVE_1784879016037.txt` (PART markers listed at lines 59–1302).

**Lesson: the spec was written against an OUTDATED view of the site — ~60% already existed. Always audit code + live JS bundle (curl bcplt20.com assets, grep phrases) before building a spec part.**

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

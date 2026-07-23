# BCPL Website — Legal-Compliance Copy Change Report
**Date:** 23 July 2026 · **Scope:** Phase A of the Complete Production Upgrade (master spec Parts 12, 13, 19, 30, 31, 72, 74, 75)
**Status:** Applied in code (dev). Live only after next production deploy.

## Why these changes were made (reason codes)
- **[HR]** Human-review claim removed — Phase 1 videos are evaluated by BCPL's automated, criteria-based assessment system, not by human scouts. Claiming otherwise is a misrepresentation risk.
- **[BCCI]** Unverified BCCI affiliation/certification claim removed — BCPL has no BCCI certification for evaluators; implying association risks trademark/misrepresentation issues.
- **[SUP]** Unverifiable superlative removed ("India's Biggest", "world's largest", "most trusted").
- **[PROMISE]** Absolute promise / refund guarantee / payment→selection implication removed or reworded (e.g. "or full refund", "No hidden charges", "pay… get selected").
- **[STAT]** Unverified statistic removed (75+ cities, 5,000+ players, 50+ cities, 120–150 selected, etc.). No new numbers invented.
- **[OLD]** Outdated content corrected — video length is 30–60 seconds (not "2 minutes"); Phase 1 result is released within 48 hours (not "15 working days" / "7 days"); upload window standardised to 15 days.
- **[DOMAIN]** Legacy-domain dependency removed — images previously hot-linked from the old `bcpl-t20.com` WordPress site are now self-hosted.

## Standard replacement language
- Video evaluation: *"Your video is evaluated against BCPL's Phase 1 assessment criteria."* / *"…goes through BCPL's Phase 1 evaluation process."*
- Result timing (marketing copy): *"Result within 48 hours."*
- Fees: *"Phase 2 fee is payable only if you qualify and choose to proceed."*
- League descriptor: *"India's Corporate Cricket League"* (no "biggest/largest").
- Physical-trial evaluators: *"experienced coaches" / "franchise selectors"* (humans at ground trials are real; only the BCCI claim is removed).

## Items intentionally KEPT (factual / owner-verified)
- "Former President, BCCI" — Sourav Ganguly's factual title (Home page ambassador section).
- "10 franchise teams", "₹6 crore prize pool" — verified league format figures.
- KYC copy stating documents are manually verified — KYC review **is** human; factual.
- Refund policy windows (see LEGAL REVIEW section).

---

## Changes by file (public website)

### Home.tsx
| Old | New | Code |
|---|---|---|
| Journey step "Scout Review / 15 working days / BCCI-certified scouts review every video — or full refund" | "Phase 1 Result / Within 48 hours / evaluated against BCPL's Phase 1 assessment criteria" | HR, BCCI, OLD, PROMISE |
| "Upload a 2-minute cricket clip… / Within 7 days" | "Upload a 30–60 second cricket clip… / Within 15 days" | OLD |
| "live trials in 50+ cities" | "live trials across cities in India" | STAT |
| FAQ hidden costs: "Zero." | "The Phase 2 fee is payable only if you qualify and choose to proceed." | PROMISE |
| FAQ "BCCI-certified cricket scouts review… 15 working days" | criteria-based evaluation… within 48 hours | HR, BCCI, OLD |
| "Phase 1 fee covers the scout review" | "covers registration and the Phase 1 video assessment" | HR |
| Hero: "real scouts, franchise auction…" | "a structured selection process, franchise auction…" | HR |
| Guarantee chips: "Zero hidden costs — ever" / "15-day result — or full refund" | "Transparent Fee Structure" / "Result within 48 hours" | PROMISE, OLD |
| "Includes: Scout review slot · …" | "Includes: Phase 1 assessment · …" | HR |

### FAQ.tsx
| Old | New | Code |
|---|---|---|
| "75 trial cities" | "trial cities" | STAT |
| "scouting team… within 15 working days" | "BCPL's Phase 1 evaluation process… within 48 hours" | HR, OLD |
| "60-second video… reviewed by BCCI-certified scouts within 15 working days" | "30–60 second video… evaluated against BCPL's Phase 1 assessment criteria… within 48 hours" | HR, BCCI, OLD |
| "2-minute cricket skills video" (post-registration answer) | "30–60 second cricket skills video" | OLD |
| "BCCI-certified coaches" (trials) | "experienced coaches" | BCCI |
| "12–15 players per franchise… 120–150 total… 5–8%" | numberless "select group… criteria-based assessment system" | STAT |
| Cashfree "India's most trusted payment gateway" | superlative dropped; SSL/PCI-DSS facts kept | SUP |
| "No other league offers this" | removed | SUP |

### Trust.tsx
| Old | New | Code |
|---|---|---|
| "reviewed by BCCI-certified cricket scouts… anonymously" | "evaluated against BCPL's Phase 1 assessment criteria… role-specific and criteria-based — your name, city and personal details play no part in your score" | HR, BCCI |
| "BCCI-certified coaches" / "BCCI-certified coaching evaluation" (trials) | "Experienced coaches" / "professional coaching evaluation" | BCCI |
| Eligibility: "No active contracts with BCCI/state cricket associations" | "…with state or national cricket associations" | BCCI |

### About.tsx
| Old | New | Code |
|---|---|---|
| "The world's largest corporate cricket league." (hero) | "India's corporate cricket league." | SUP |
| Founder bio "— the world's largest corporate cricket tournament" | clause removed | SUP |
| Stat card "75+ Trial Cities" | "Pan-India / Trial Network / growing every season" | STAT |
| Timeline superlatives + unverified counts (25,000+, 1 Lakh+, 2 Lakh+, 500+, 75+, 50+, 5 cities) | rephrased without numbers | SUP, STAT |
| Chips "BCCI-Connected Scouting" / "Zero Hidden Fees" | "Structured Assessment Process" / "Transparent Fee Structure" | BCCI, PROMISE |
| "video scouting" | "criteria-based video assessment" | HR |
| Team photos hot-linked from `bcpl-t20.com` (6 images) | self-hosted at `public/bcpl-assets/people/` | DOMAIN |

### Registration.tsx
| Old | New | Code |
|---|---|---|
| "India's biggest corporate T20 league… BCCI-certified scouts. You send one video — we decide your future." | "India's corporate T20 cricket league for working professionals… compete for your place" | SUP, BCCI, HR |
| "7-Day Result / BCCI scouts evaluate" | "48-Hour Result / Criteria-based evaluation" | OLD, BCCI, HR |
| "received by our BCPL scouts… 15 working days" | "going through BCPL's evaluation process… within 48 hours" | HR, OLD |
| "Scouts evaluate you specifically for this role…" | "Your video is assessed against role-specific criteria…" | HR |
| "50+ cities across India" | "Cities across India" | STAT |
| "No hidden charges. Phase 2 fee payable only if selected." | "Phase 2 fee is payable only if you qualify and choose to proceed." | PROMISE |
| "✅ BCCI-certified scout evaluation" / "✅ Result guarantee (or full refund)" | "✅ Criteria-based video assessment" / "✅ Transparent result process" | BCCI, PROMISE |

### Phase1PaymentReceipt.tsx
| Old | New | Code |
|---|---|---|
| "Scout Review" / "BCCI-CERTIFIED EVALUATORS" / "Our trained scouts review every submission" | "Phase 1 Evaluation" / "CRITERIA-BASED ASSESSMENT" / criteria wording | HR, BCCI |
| "If selected by scouts… Pay ₹2,000 only after selection — not before." | "The Phase 2 fee becomes payable only if you qualify through Phase 1 and choose to proceed." | HR, PROMISE |
| "India's Biggest Corporate Cricket League" (screen + print + WhatsApp share) | "India's Corporate Cricket League" | SUP |
| "Pending scout review" / "Await Scout Review" | "Pending evaluation" / "Evaluation In Progress" | HR |
| "Record your 2-minute… video" (screen + print) | "Record your 30–60 second… video" | OLD |

### Phase1Result.tsx · Phase1VideoUpload.tsx · PlayerProfile.tsx
- All "BCCI-certified scouts" evaluation copy (qualified & not-qualified blocks, upload screens, profile status) → criteria-based evaluation wording; "15 working days" → "within 48 hours"; "UPLOAD TO BCPL SCOUTS" button → "SUBMIT FOR EVALUATION"; WhatsApp share superlative dropped. **[HR, BCCI, OLD, SUP]**

### Phase 2 pages (Phase2Payment, Phase2Registration, Phase2KYC, Phase2KYCApproved, Phase2PaymentReceipt)
- "after scout selection in Phase 1" → "after qualifying in Phase 1"; "Scout Selected" badge → "Phase 1 Qualified" **[HR]**
- Ground-trial copy: "Franchise scouts/Scouts" → "Franchise selectors/Selectors" (humans at trials are real; consistent vocabulary) **[BCCI-adjacent hygiene]**
- "BCCI compliance and franchise records" → "compliance and franchise records" **[BCCI]**

### Other pages
- **Sponsors.tsx:** "India's biggest… movement" → "India's corporate cricket movement"; "5,000+ active cricketers across 75 cities" → numberless reach copy; stats grid values "5,000+"/"75" → "Nationwide"/"Multi-City" **[SUP, STAT]**
- **EligibilityCriteria.tsx:** "when scouts call" → "when the BCPL team contacts you" **[HR]**
- **Photos.tsx:** placeholder gallery titles "Scout evaluation session" / "BCCI coach masterclass" → "Trial evaluation session" / "Coaching masterclass" **[HR, BCCI]**
- **BCPLFooter.tsx:** "India's Biggest Corporate Cricket League." → "India's Corporate Cricket League." **[SUP]**

## Changes by file (backend — emails, SMS, SEO)
- **email.ts:** footer superlative; "2-minute video" → "30–60 seconds"; subject "Result in 15 Days" → "Result within 48 Hours"; "BCCI-certified scouts will review within 15 working days" → criteria wording + 48h (EN + Hindi mirrors); "Online Scout Review & Video Submission" → "Online Video Submission & Evaluation" **[HR, BCCI, OLD, SUP]**
- **video.ts:** post-upload SMS "Our scouts will review it…" → "It will now go through BCPL's Phase 1 evaluation. We'll notify you when your result is ready." **[HR]**
- **marketing.ts:** footer superlative removed **[SUP]**
- **seo.ts:** all page titles/descriptions — "India's biggest", "50+ cities", "pay ₹299… get selected" removed; "₹6 crore prize pool" and "10 franchise teams" kept (verified) **[SUP, STAT, PROMISE]**

---

## ⚖️ LEGAL REVIEW REQUIRED (legal pages — factual corrections applied, commitments untouched)
These pages contain binding policy language. Only **factually false operational descriptions** were corrected; **no commitment, window, or entitlement was changed**. Owner's legal counsel should review:

| Page | What changed | What was deliberately NOT changed |
|---|---|---|
| **Terms.tsx** | "assessed by BCPL-appointed scouts" → "assessed through the BCPL Phase 1 evaluation process"; "registration fee is for scouting access" → "for Phase 1 evaluation access" | 15-day cooling-off refund right (before video upload) — kept as-is |
| **Privacy.tsx** | "Sharing your cricket profile with authorised BCPL scouts for video evaluation" → "Processing your trial video and cricket profile through the BCPL Phase 1 evaluation system"; "shared with franchise team scouts" → "shared with franchise team management" | All other clauses. **Note:** a fuller privacy update (AI/automated processing disclosure, spec Part 35/36) is planned as a separate proposal. |
| **Refunds.tsx** | "scout review has begun" → "Phase 1 evaluation has begun" | Refund case 3 — "result within 15 working days or full refund" **kept**: it is a safe outer bound (results now release in ~48h). Optional: tighten later. 15-day cooling-off copy kept. |
| **CodeOfConduct.tsx** | "follows all BCCI and WADA anti-doping guidelines" → "follows recognised anti-doping principles aligned with WADA guidelines" | Rest of the code of conduct. |

## Open items for the owner
1. Verified numbers needed for the planned authority-stats strip (cities, registered players, corporate partners) — currently all unverified numbers removed rather than replaced.
2. Legacy domain `bcpl-t20.com`: no remaining code references. If the old domain still runs a website, set up a 301 redirect to bcplt20.com at the domain/hosting level (spec Part 30).
3. These changes are live on the **dev/staging preview** now; production requires the usual EC2 deploy.

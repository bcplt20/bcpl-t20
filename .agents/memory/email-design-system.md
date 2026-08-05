---
name: Email design system
description: emailTheme.ts master components, sponsor strip hydration, preview route, compliance gates
---

- All transactional emails build on lib/emailTheme.ts components (EmailShell 600px tables, inline CSS, inline-SVG icons — NO emoji anywhere in subjects/bodies; tests enforce codepoint grep). email.ts template signatures unchanged; send plumbing/outbox/dedupe untouched.
- Sponsor strip: sendEmail() calls hydrateSponsors() just before the Brevo POST; templates stay synchronous. Outbox stores UN-hydrated HTML so retries re-hydrate. Strip = active + email-visible sponsors, white tiles, private-bucket logos rewritten to https://bcplt20.com/api/sponsors/logo?key=cms/<file>. Fetch failure ⇒ no strip, never throw.
- S3 lesson: the whole bucket (incl. cms/) blocks public reads — any stored "public" bucket URL 403s. Serve via presign (public /api/sponsors GET rewrites) or the stable redirect route GET /api/sponsors/logo?key= (302 to fresh presign, key restricted to cms/ images).
- Admin preview: GET /api/admin-tools/email-preview[/:template] (admin-gated, sample data, no sends). No test-send exists on purpose (real Brevo keys in dev).
- Language rule: one language per email; English primary. Legal entity footer "Kriparthi Playing 11 Pvt. Ltd."; GST invoice keeps statutory "Kriparti Playing11" with LEGAL ENTITY COPY REVIEW REQUIRED comment — do not "fix" the spelling.
- Known flagged debt: adminTools.ts WhatsApp CODE_TEMPLATES still contain "scouts"/"SELECTED" (follow-up task proposed).


## Aug 2026 premium redesign
Templates rebuilt to premium standard on lightened-navy palette (header band #16223C, card #1B2E52, orange CTA w/ MSO VML fallback). Header logo = BALL_LOGO_URL built from PUBLIC_API_BASE (NOT SITE_URL — dev SITE_URL carries /bcpl-website prefix and 404s) using bcpl-ball-transparent.png (bcpl-ball-clean.png is RGB with baked white bg — never use in emails). Shared components: StepProgress (Register→Video→Result→Phase2→Trials), TicketBlock receipts, venue card. Copy stays compliance-clean incl. subjects ("Phase 1 Cleared", no "Congratulations", no "selected"). Preview: admin route /api/admin-tools/email-preview/:key (dev ADMIN_SECRET works); sender avatar in Gmail needs BIMI+VMC (none set; DMARC p=reject exists) — logo-in-header is the practical answer.


## Light premium restyle (Aug 2026, round 2 — owner approved direction)
- Palette: navy #16223C ONLY as header/footer bookends; body light — outer #EEF1F7, white card, navy ink #16223C text, hairlines #E3E8F2, orange #FF7A29 CTA, gold accents. COLORS tokens in emailTheme.ts carry it; templates mostly token-driven, so re-skin = change tokens.
- Header logo: SITE_LOGO_URL = PUBLIC_API_BASE + /bcpl-assets/bcpl-logo-white.png (same asset SiteHeader uses; transparent RGBA). bcpl-logo.png has a BAKED background ("brand manual" crop) — never use in emails.

## GST invoice PDF attachments
- src/lib/invoicePdf.ts (pdfkit) builds A4 invoice; ALL tax rows via gstFromGross; numbering BCPL/25-26/<txnId> same as admin HTML invoice; statutory constants live only in src/lib/companyInfo.ts.
- sendEmail supports attachments[{name,contentBase64}] → Brevo attachment[{name,content}]; outbox retry queues WITHOUT attachments (never put base64 in jsonb).
- pdfkit MUST stay in build.mjs external list — bundling breaks fontkit/brotli (@swc/helpers cjs shim missing at runtime).
- Payment wiring: buildInvoiceAttachment in payment.ts, try/catch → receipt always sends even if PDF fails.

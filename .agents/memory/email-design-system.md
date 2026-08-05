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

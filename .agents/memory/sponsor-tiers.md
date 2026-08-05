---
name: Sponsor tiers & logo processing
description: IPL-style sponsor tier system, auto white-background logo processing, admin group reordering
---
- Sponsors live in site_settings key `sponsors` (jsonb array); ARRAY ORDER = tier hierarchy (contiguous category runs = tiers). Admin SponsorsView groups by contiguous runs; moveGroup swaps adjacent blocks by index ranges — never merge non-contiguous same-label runs.
- Logo uploads go through POST /api/admin-tools/sponsor-logo (multipart, sharp): flatten→white, trim (fallback on throw), fit 800x400, +40px white pad, PNG to cms/ via putObject. DoS guards: limitInputPixels 40e6, reject >10000px side or >30MP, SVG density capped to ~2000px longest side.
- **Why:** owner wants every sponsor logo auto-cleaned onto white chips, IPL-style tier wall (Title Sponsor big on top, then Powered By, Kit, Outdoor Partner, Consultant Partner...).
- adminUpload (multipart) helper lives beside adminReq in bcpl-website src/lib/adminHttp.ts — reuse it, never re-add auth plumbing.

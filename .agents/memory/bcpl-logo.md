---
name: BCPL Logo Extraction
description: How to extract the official BCPL logo from the brand book PDF using PyMuPDF
---

## Method
`uv run --with pymupdf python3 -c "import fitz; ..."` — no pip install needed, uv handles it.

## Key pages in brand book PDF
- Page 1: cover with full logo on dark blue/brush background
- Page 14 (index 13): Logo Introduction — full horizontal logo on white background (best quality)
- Page 15 (index 14): Horizontal + Stacked on Light and Dark bases
- Page 16 (index 15): Icon Mark (circular symbol) on white background — tightest crop

## Clip coordinates (pts, 850×613 page)
- Ball icon only (page 16): `fitz.Rect(22, 252, 234, 432)` at 5× zoom → bcpl-ball-clean.png

## Saved assets
- `artifacts/bcpl-website/public/bcpl-assets/bcpl-ball-clean.png` — circular icon on white, 1060×900px
- `artifacts/bcpl-website/public/bcpl-assets/bcpl-logo-dark.png` — full horizontal logo on dark bg
- `artifacts/bcpl-website/public/bcpl-assets/bcpl-logo-final.png` — full horizontal logo on white bg

**Why:** The brand book PDF is 107MB (too large for ReadFile), so PyMuPDF renders pages as bitmaps at configurable zoom.

**How to apply:** In navbars, use the ball icon with `objectFit: cover`, `objectPosition: top center`, inside a round container (`borderRadius: 50%`) to clip the "B/W Logo" label at the bottom of the image.

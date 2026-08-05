---
name: Chromium PDF image bloat & safe compression
description: Why chromium --print-to-pdf makes huge PDFs and the pattern-safe way to shrink them
---

Chromium `--print-to-pdf` re-encodes ALL images as lossless FlateDecode — even small source JPEGs. A photo-rich deck balloons to 20 MB+ regardless of source-image compression, and phones then fail to open it.

**Why:** shrinking source images or converting webp→jpg does NOT help; the bloat happens at print time.

**How to apply (safe recipe):** post-process with pymupdf, replacing each large image stream in-place:
- iterate xrefs with `Subtype == /Image`, skip streams <150 KB and any with an `SMask` (transparency);
- `fitz.Pixmap(d, xref)` → `tobytes('jpeg', jpg_quality≈68)` → `d.update_stream(xref, jpg, compress=False)`; set `Filter=/DCTDecode`, `ColorSpace`, `BitsPerComponent=8`, `DecodeParms=null`;
- save with `deflate=True` but **NO `garbage=`**.

**Do NOT** use `Document.rewrite_images()` + `garbage=4` — it drops Pattern resources (CSS gradients render as "cannot find Pattern resource" and shading overlays vanish silently). Always re-render a few pages via pymupdf pixmaps and eyeball them after compressing.

Result on the BCPL sponsorship deck: 23.7 MB → 7.7 MB with gradients intact.

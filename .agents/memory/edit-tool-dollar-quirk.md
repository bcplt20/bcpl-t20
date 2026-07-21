---
name: Edit tool $-in-replacement corruption
description: String replacements containing `$` sequences (regex anchors in SQL) can corrupt the file
---

An Edit replacement whose new text contained a SQL regex `'^[0-9]+$'` got mangled — content after the `$` was torn out and appended elsewhere in the file, silently corrupting it.

**Why:** `$` followed by text in replacement strings can be interpreted as a substitution pattern.

**How to apply:** When inserting content containing `$` sequences (regex anchors, template literals in SQL strings), prefer WriteFile (full-file rewrite) over Edit, and always re-read/build-check the file afterward.

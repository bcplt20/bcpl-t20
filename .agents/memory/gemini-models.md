---
name: Gemini model selection & real-mode verification
description: Which Gemini models work for the Phase 1 pipeline, how model config is resolved, and what the real-key smoke test proved
---

# Gemini models (Phase 1 pipeline)

- **The gemini-2.5 family 404s for new API keys** ("no longer available to new
  users", observed July 2026) even though `models?list` still shows them.
  Listing ≠ usable. Current pinned defaults: scoring `gemini-3.5-flash`,
  validity `gemini-3.1-flash-lite` (both verified working with the project key).
- **Model resolution order:** env `GEMINI_PRIMARY_MODEL`/`GEMINI_VALIDATION_MODEL`
  → stored `site_settings.phase1_ai_config` row → code defaults. Any admin
  config PATCH persists the FULL config snapshot, which **pins the then-current
  model names in the DB forever** — code-default changes won't take effect on
  an environment whose config row already exists. Fix via PATCH
  `/api/admin-tools/phase1/config` or env vars.
  **Why:** dev's stored row kept serving the dead 2.5 models after the code
  default was already updated; cost a confused debugging round.
- **Real-key smoke verified (dev, July 2026):** Files API upload + validity
  (`NOT_CRICKET_VIDEO` on a synthetic clip — correct §73 rejection) + 2 real
  scoring passes (parsed, persisted with latency/confidence; scored absurd
  content 0/100 → routed to reupload, not published). 503 "high demand" spikes
  on `gemini-3.5-flash` are classified transient and retried — expect them.
- GEMINI_API_KEY now exists in dev Replit secrets; EC2 prod still needs it set
  at deploy time. Real validity/scoring on genuine cricket footage remains the
  only unexercised case (impossible with synthetic clips).

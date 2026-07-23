---
name: Phase1 AI gate
description: aiEnabled config gates BOTH mock and real Gemini modes; mock blocked in production; what tests must do
---

**Rule:** `aiGate(cfg.aiEnabled)` in `src/lib/gemini.ts` is the single master gate for the AI validity + scoring workers. It gates BOTH modes (default `aiEnabled=false`), and additionally blocks mock mode when `NODE_ENV=production` unless `PHASE1_ALLOW_MOCK=1` (reason `mock_blocked_in_production`, workers log an error telling ops to set GEMINI_API_KEY).

**Why:** Previously only real mode checked `aiEnabled`; a missing GEMINI_API_KEY in prod would have silently published mock (random) results to real players.

**How to apply:**
- Never bypass with `mode === "real" && !cfg.aiEnabled` checks — call `aiGate`.
- E2E scripts must `PATCH /api/admin-tools/phase1/config {"aiEnabled":true}` + `sleep 31` (config cache TTL 30s) before exercising workers, and reset `aiEnabled:false` in their cleanup traps (otherwise the dev tick keeps mock-scoring real rows).
- EC2 handover: prod needs GEMINI_API_KEY set (or the pipeline pauses loudly); staging can use PHASE1_ALLOW_MOCK=1.

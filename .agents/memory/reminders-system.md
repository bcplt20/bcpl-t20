---
name: Reminder sweeps & outbound send gating
description: How automated reminders stay safe (dedupe, windows, prod gate) and the 7-vs-15-day window mismatch
---

**Rule:** Every NEW outbound send path (email/SMS/WA) must gate itself — real Brevo/MSG91 keys are live in dev. Reminder sweeps gate on `remindersEnabled()` (lib/reminders.ts): prod = real, elsewhere dry-run; `REMINDERS_ENABLED=1/0` overrides. `sendEmail`/`sendSms` themselves have NO gate.

**Why:** Dev tick or a manual admin trigger would otherwise text/email real players from the dev DB.

**How to apply:** New scheduled/manual send features: reuse `remindersEnabled()` or accept `{dryRun}`; admin trigger endpoints default `dryRun:true` (POST /api/admin/jobs/run-reminders pattern). Idempotency = reserve-first insert on `notification_logs.dedupe_key` (partial unique index) — only the insert winner sends; total-failure rows get status `failed` and are deliberately never retried.

**Window mismatch (open product issue):** public copy promises a 15-day video window but `phase1Config.uploadWindowDays` defaults to **7** (payment.ts overwrites register.ts's provisional 15-day deadline at payment success). Video nudge checkpoints now derive from the config (`windowDays-3`, `windowDays-6`, urgent 1-left) so they fire for any window. Raised with owner July 2026 — check stored `phase1_ai_config` before assuming either number.

**Anti-blast:** payment reminders only fire inside hard age windows (P1: 24h–7d from registration, SQL-bounded; P2: 2–10d from result release, legacy rows without `resultReleasedAt` skipped) — deploys can never mass-message old rows.

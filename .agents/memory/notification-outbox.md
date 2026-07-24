---
name: Notification outbox
description: Durable retry queue for failed email/SMS sends — design rules and gating
---

Rule set for the `notification_outbox` retry queue (api-server `src/lib/outbox.ts`):

- **Enqueue only on real provider failure** (`ok:false && !skipped`). Missing-key "skipped" sends and **OTPs are NEVER queued** (OTPs are time-sensitive; player requests a fresh one).
- **Why:** master-prompt requirement "provider down → messages stay queued, no duplicates"; queuing OTPs would deliver stale codes.
- Senders accept `opts?: SendOpts`; the sweep calls them with `{noOutbox:true}` — this flag is the only thing preventing infinite self-requeue. Any new sender/wrapper must propagate it.
- Cycle safety: sms.ts/email.ts reach outbox via `await import("./outbox")` in failure branches only; outbox imports senders inside the sweep body (deferred). Never convert these to top-level static imports.
- Dedupe = partial unique index on dedupe_key **WHERE status IN ('pending','sending')** — same content can re-queue after success/dead. 23505 (in `.cause` chain) on insert = silent merge, expected.
- Sweep gating mirrors reminders: real claims/sends only when prod or `OUTBOX_ENABLED=1`; otherwise dry-run (counts due rows only). **Real MSG91/Brevo keys live in dev** — testing the real sweep path locally requires mocked senders (vi.mock) or stubbed fetch, never the gate flipped on.
- Claim = `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED) RETURNING` with attempts++ at claim time; stuck 'sending' rows auto-reclaim after 15 min; backoff 5min·2^(n-1) cap 6h; dead after max_attempts + notification_logs entry (only when user_id present — that FK is NOT NULL).

**How to apply:** any new notification type that must survive provider outages → pass `outboxMeta {userId, template}` to sendSms/sendEmail and it inherits retry for free. Never bypass by inserting outbox rows for successful sends.

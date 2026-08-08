---
name: Growth features (push/referral/badges/moments)
description: Aug'26 growth round — push+inbox, incomplete-reg reminders, refer & earn, badges, live-now, match moments. Gating and design decisions.
---

- Push: `lib/push.ts`, Expo push API, gated by `PUSH_ENABLED` (dry-run outside prod). Every push ALSO writes a `notifications_inbox` row (partial unique on dedupe_key → `ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL`). Remote push does NOT work in Expo Go — inbox screen is the dev-visible surface; real push needs the production build.
- Reminders: incomplete-registration sweep (24h/72h buckets, max 2, reserve-first) + trial-day morning; both under `REMINDERS_ENABLED`. Trial slot_date is free text → best-effort Date.parse, unparseable skipped.
- Referral: EVERY registered player is eligible for a code (`/referral/me` no longer requires payment — covers carryover players); only referred friends' PAID registrations count as qualified (3 → reward eligible, admin grants manually). Anti-abuse: same-user AND same-normalized-phone (last 10 digits) cross-account attribution blocked in `/api/marketing/attribute`.
- Badges: computed on read (`GET /api/user/badges`), 9 badges, icon names MUST be valid Feather names (mobile renders `<Feather name={icon}>` — invalid names show "?").
- Match moments: derived from deliveries (wicket/six/fifty/hundred/hat-trick); fours excluded as noise; admin can PATCH a clipUrl per moment. No real video exists unless admin attaches one.
- **Why:** owner prioritized push + incomplete-reg reminders for revenue; referral for corporate colleague growth.
- **Mobile trap:** `{cond && React.useMemo(...)}` in JSX is a Rules-of-Hooks violation that crashes the whole screen ("dep array changed size") — always `React.useMemo(() => cond ? ... : null, [...])`.

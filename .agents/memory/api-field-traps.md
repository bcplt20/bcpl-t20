---
name: API field-name traps
description: Silent-failure field conventions between api-server responses and website consumers
---

# API field-name traps

**Rules:**
- API responses return drizzle rows in camelCase (`matchNo`, `scheduledAt`, `tossWinner`). Reading snake_case (`m.match_no`) renders `undefined` silently in JSX — no error, just "Match undefined" in the UI. Grep consumers for snake_case when touching a route.
- `createMatch` (and any zod `z.string().datetime()` field) rejects raw `<input type="datetime-local">` values; convert with `new Date(v).toISOString()` client-side. The failure mode was silent: the form appeared to save but no row was created.

**Why:** both bit the owner — homepage showed "Match undefined" and his first match never saved, with no visible error.

**How to apply:** when wiring any admin form or public page to api-server, check field casing against the route's actual response and ISO-format all datetime strings; surface API errors in the UI instead of console.error.

---
name: Brevo IP allowlist 401s
description: Brevo account-level "Authorised IPs" security makes valid API keys return 401 — looks like a bad key but isn't
---

Brevo (email provider for this project) has an optional account security feature: **Authorised IPs** (app.brevo.com/security/authorised_ips). When it is enabled, a perfectly valid API key still gets `401 unauthorized` from every endpoint, with body "We have detected you are using an unrecognised IP address <ip>...".

**Why:** During receipt-email debugging, two stacked causes were found: the old key was genuinely dead ("Key not found"), and the replacement key then 401'd because the account had the IP allowlist on. Easy to misdiagnose as another bad key.

**How to apply:**
- A Brevo 401 with "unrecognised IP address" = allowlist problem, NOT a key problem; don't ask the owner for yet another key.
- Replit workspace egress IPs are dynamic — whitelisting today's IP breaks later. The durable fix is deactivating the restriction (or whitelisting the static EC2 prod IP and accepting dev can't send).
- A 401 "Key not found" = the key itself is invalid/rotated.

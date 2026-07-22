---
name: MSG91 SMS integration
description: Which MSG91 APIs this project uses, how to dry-run them safely, and quirks (balance.php 418, legacy env fallback)
---

SMS/OTP goes through MSG91 (owner's DLT templates + balance). Two endpoints, both verified working from a Replit egress IP with the owner's authkey:

- OTP: `POST https://control.msg91.com/api/v5/otp?template_id=..&mobile=91<10digit>&otp=..` with `authkey` header → `{type:"success",request_id}` .
- Transactional: `POST https://api.msg91.com/api/v2/sendsms` with `authkey` header, body `{sender, route:"4", country:"91", sms:[{message,to:[<10digit>]}]}` → `{type:"success",message:<requestId>}`.

**Quirks / lessons:**
- Legacy `balance.php?type=4` returns `{"msg":"418","msgType":"error"}` even when the key works on v5/v2 — do NOT treat 418 as a broken key; it's a legacy-endpoint red herring.
- Env: `MSG91_OTP_TEMPLATE_ID` (new) falls back to legacy `MSG91_TEMPLATE_ID` (old-era EC2 .env may still carry it). `MSG91_SENDER_ID` ≈ KRIPLA. OTP needs authkey+template; transactional needs authkey+sender.
- **Real MSG91 keys are set in the dev workspace** — any payment/notify test with a plausible 10-digit number can send a REAL SMS. For shape tests use impossible recipients like `123` (MSG91 queues then drops; nobody receives).
- MSG91 accepts sends even for garbage numbers (`type:"success"`), so API acceptance ≠ delivery; delivery failures (DLT text mismatch, blocked IP on prod) appear in MSG91 DLR + our `[SMS-FAILED]`/`[MSG91-OTP-FAILED]` logs.
- Receipt SMS text must match the owner's DLT-approved templates or operators silently drop at delivery stage.

## Minting a test login WITHOUT sending real SMS
`POST /auth/send-otp` fires a REAL MSG91 SMS in dev (keys are live) — never call it with a plausible number. To get a real user token for e2e/curl tests, bypass it: `INSERT INTO otp_sessions (phone, otp_code, purpose, expires_at) VALUES ('9998887771','123456','register', now() + interval '10 minutes')` then `POST /auth/verify-otp` with that phone/otp (+ name/email for register) — verify-otp only checks the table. Clean up users/otp_sessions rows after.

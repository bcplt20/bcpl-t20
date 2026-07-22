---
name: MSG91 SMS integration
description: How OTP/SMS delivery actually works in this account — flow API route, template/DLT gotchas, testing rules
---

# MSG91 SMS integration (BCPL)

## THE core lesson: OTP delivery goes through the FLOW API, not the OTP API
- This account's only DLT-approved template is a **flow template**: "Your OTP is ##var1## … Team, Kriparti", sender **KRIPLA**, dlt_verified=10.
- The dedicated OTP API (`/api/v5/otp?template_id=…&mobile=…&otp=…`) **accepts** that template ID (`type:success` + request_id) but the delivery report then fails with **"Template ID Missing or Invalid Template"** — it only takes OTP-section templates. No SMS arrives despite success logs.
- Fix that works (verified live 22 Jul 2026): `POST /api/v5/flow/` with `{template_id, short_url:"0", recipients:[{mobiles:"91XXXXXXXXXX", var1:"<otp>"}]}` — same env `MSG91_OTP_TEMPLATE_ID`, delivers via the approved DLT mapping. `sendOtp()` in sms.ts now does this; the var name is **var1**, not otp.
- We generate + verify OTPs ourselves in `otp_sessions`; MSG91 is delivery-only, so any SMS route works.

## Why: accept-time success ≠ delivery
MSG91 queues first, validates template/DLT at delivery. **Never trust `type:success`** — confirm on the phone or in dashboard delivery report. Report/panel APIs (delivery logs, `otp/templates` list, balance.php → 418) are panel-auth only → 401/junk with authkey; delivery status is dashboard-only.

## Useful authkey-readable endpoints (worked!)
- `GET /api/v5/flows` — lists all flow templates (id + name).
- `GET /api/v5/sms/getTemplateVersions?template_id=<id>` — full template text, sender, DLT_ID, `dlt_verified` (10=approved; 5 + dlt_reason "Template not matched on DLT" = unusable).

## Account facts
- Approved: "Otp" flow (68395f49…, KRIPLA header, Kriparti wording) = current `MSG91_OTP_TEMPLATE_ID`.
- "BCPL" flow (68306c2d…) is **DLT-rejected** ("Template not matched on DLT") — players see sender KRIPLA/"Team, Kriparti" until owner gets a BCPL-worded template approved on the DLT portal, then update env.
- IP Security setting silently drops accepted messages ("IP not whitelisted" in dashboard) — keep it OFF (Replit/EC2 IPs vary). Same class of issue as Brevo allowlist.

## How to apply / test safely
- Workspace dev has REAL keys → flow API sends REAL SMS. Shape-test only with impossible numbers like `91123`; end-to-end test only to owner's phone (8368444754) with his OK. Dev OTP readable from `otp_sessions` — delivery not needed for flow testing.
- Notification SMS (`sendSms`, v2 sendsms route 4, MSG91_SENDER_ID) still unproven for delivery — same DLT matching risk; verify on dashboard when it matters.

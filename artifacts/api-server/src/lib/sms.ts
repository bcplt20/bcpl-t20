// MSG91 SMS/OTP service — https://msg91.com
// Switched back from 2Factor (task: owner's approved DLT templates + balance are
// in MSG91; MSG91 blocks API calls from non-whitelisted IPs — the EC2 server IP
// must be whitelisted in MSG91 dashboard → Settings → IP Security).
import { queueSendFailure, type SendOpts, type SendResult } from "./notify";

const AUTH_KEY = process.env.MSG91_AUTH_KEY;
// New explicit name first; falls back to the legacy env name from the earlier
// MSG91 era so an existing server .env keeps working.
const OTP_TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID || process.env.MSG91_TEMPLATE_ID;
const SENDER_ID = process.env.MSG91_SENDER_ID; // 6-char DLT-approved sender ID

/**
 * Per-message-type MSG91 Flow template IDs (task #44 — DLT compliance).
 *
 * MSG91 accepts a legacy raw-text send even when the body does NOT match a
 * DLT-approved template — but the telecom operators then SILENTLY DROP it, so
 * the player never gets the SMS while our log says "sent". The fix is to send
 * through a MSG91 Flow template (same mechanism the OTP path already uses):
 * the template is DLT-mapped, so operators deliver it.
 *
 * Each transactional SMS type maps to an env var holding its approved Flow
 * template id. When the id is configured we send via the Flow API; otherwise
 * we FALL BACK to the legacy raw send (so nothing breaks on a server that
 * hasn't configured the ids yet) and stamp a loud "legacy_raw (DLT risk)"
 * note into the notification log so the gap is visible.
 *
 * Env var names (document for the ops team — set each to the MSG91 Flow
 * template id approved for that message type):
 *   MSG91_FLOW_PHASE1_RECEIPT   — Phase 1 registration receipt
 *   MSG91_FLOW_PHASE2_RECEIPT   — Phase 2 payment receipt
 *   MSG91_FLOW_VIDEO_SUBMITTED  — trial video received
 *   MSG91_FLOW_VIDEO_REMINDER   — trial video upload reminder
 *   MSG91_FLOW_PHASE1_RESULT    — Phase 1 result ready
 *   MSG91_FLOW_KYC_COMPLETE     — KYC verified
 *   MSG91_FLOW_KYC_REJECTED     — KYC rejected / resubmission
 *   MSG91_FLOW_REFERRAL_MILESTONE — player hit a referral reward milestone
 */
export const SMS_FLOW_ENV = {
  phase1_receipt:      "MSG91_FLOW_PHASE1_RECEIPT",
  phase2_receipt:      "MSG91_FLOW_PHASE2_RECEIPT",
  video_submitted:     "MSG91_FLOW_VIDEO_SUBMITTED",
  video_reminder:      "MSG91_FLOW_VIDEO_REMINDER",
  phase1_result:       "MSG91_FLOW_PHASE1_RESULT",
  kyc_complete:        "MSG91_FLOW_KYC_COMPLETE",
  kyc_rejected:        "MSG91_FLOW_KYC_REJECTED",
  referral_milestone:  "MSG91_FLOW_REFERRAL_MILESTONE",
} as const;

export type SmsFlowType = keyof typeof SMS_FLOW_ENV;

/** Resolve the configured MSG91 Flow template id for a message type, if any. */
function flowTemplateIdFor(type?: SmsFlowType): string | undefined {
  if (!type) return undefined;
  const v = process.env[SMS_FLOW_ENV[type]]?.trim();
  return v ? v : undefined;
}

/** True when real OTP delivery is configured — auth route uses this to decide
 *  whether to expose the dev OTP in the API response (dev stub mode only). */
export const otpConfigured = Boolean(AUTH_KEY && OTP_TEMPLATE_ID);

type Msg91Response = { type?: string; message?: string };

/**
 * Single source of truth for where admin alert SMSes go (lockdown alerts etc.).
 * Returns null when no admin phone is configured — callers should then skip
 * sending and log loudly instead.
 * Expected format: 10-digit Indian mobile (same shape sendSms takes).
 */
export function adminAlertPhone(): string | null {
  const raw = process.env.ADMIN_ALERT_PHONE?.trim();
  if (!raw) return null;
  // Normalize common prefixes (+91 / 91 / 0) down to the bare 10 digits.
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.length === 10 ? digits : null;
}

/** Send login OTP via MSG91's dedicated OTP API (we generate + verify the OTP
 *  ourselves in otp_sessions; MSG91 only delivers it). */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  if (!AUTH_KEY || !OTP_TEMPLATE_ID) {
    console.warn(`[SMS-STUB] OTP for ${phone}: ${otp} (MSG91_AUTH_KEY / MSG91_OTP_TEMPLATE_ID not set)`);
    (globalThis as any).__lastDevOtp = otp;
    return true;
  }

  try {
    // MSG91 Flow API — NOT the dedicated OTP API. The owner's DLT-approved
    // template in this account is a FLOW template ("Your OTP is ##var1## …"),
    // and the OTP API only accepts OTP-section templates: it ACCEPTS the send
    // (type:success) but the delivery report then fails with "Template ID
    // Missing or Invalid Template" and no SMS arrives. The Flow API delivers
    // through the same approved template + DLT mapping (verified live 22 Jul).
    // We generate + verify OTPs ourselves (otp_sessions); MSG91 only delivers.
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: AUTH_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        template_id: OTP_TEMPLATE_ID,
        short_url: "0",
        recipients: [{ mobiles: `91${phone}`, var1: otp }], // template var is ##var1##
      }),
      // Hard cap: a hung provider must never block the login response.
      signal: AbortSignal.timeout(30_000),
    });
    const raw = await res.text();
    let data: Msg91Response = {};
    try { data = JSON.parse(raw); } catch { /* non-JSON error body */ }

    if (data.type === "success") {
      console.log(`[MSG91-OTP-SENT] to=${phone} | ${raw.slice(0, 150)}`);
      return true;
    }
    // Loud: full MSG91 error (blocked IP, template mismatch, balance) visible in PM2 logs
    console.error(`[MSG91-OTP-FAILED] to=${phone} | HTTP ${res.status} | ${raw.slice(0, 300)}`);
    return false;
  } catch (e) {
    console.error(`[MSG91-OTP-FAILED] exception | to=${phone}`, e);
    return false;
  }
}

/** Send transactional SMS via MSG91.
 *
 *  Task #44: when a DLT-approved MSG91 Flow template id is configured for this
 *  message type (opts.smsType → SMS_FLOW_ENV), deliver via the Flow API so the
 *  operators actually deliver it. Otherwise fall back to the legacy raw-text
 *  route (kept so nothing breaks on an un-migrated server) and stamp a loud
 *  "legacy_raw (DLT risk)" note into the returned result → notification log. */
export async function sendSms(phone: string, message: string, opts?: SendOpts): Promise<SendResult> {
  const flowId = flowTemplateIdFor(opts?.smsType as SmsFlowType | undefined);

  if (flowId) {
    if (!AUTH_KEY) {
      console.warn(`[SMS-SKIPPED] MSG91_AUTH_KEY not set — Flow SMS NOT sent | to=${phone}`);
      return { ok: false, skipped: true, error: "MSG91_AUTH_KEY not configured on this server" };
    }
    return sendViaFlow(phone, flowId, opts?.smsFlowVars ?? [], message, opts);
  }

  if (!AUTH_KEY || !SENDER_ID) {
    console.warn(`[SMS-SKIPPED] MSG91_AUTH_KEY / MSG91_SENDER_ID not set — SMS NOT sent | to=${phone}`);
    return { ok: false, skipped: true, error: "MSG91_AUTH_KEY / MSG91_SENDER_ID not configured on this server" };
  }

  // Legacy raw-text path — DLT risk: operators may silently drop this if the
  // text does not match an approved template. Surface it in the log meta.
  const dltNote = `legacy_raw (DLT risk): no ${opts?.smsType ? SMS_FLOW_ENV[opts.smsType as SmsFlowType] ?? "MSG91_FLOW_* env" : "MSG91_FLOW_* env"} configured — operators may drop this SMS`;
  if (opts?.smsType) {
    console.warn(`[SMS-LEGACY-RAW] DLT risk | type=${opts.smsType} to=${phone} — set ${SMS_FLOW_ENV[opts.smsType as SmsFlowType] ?? "the flow template id"} to deliver via a DLT-approved MSG91 Flow template`);
  }

  try {
    const res = await fetch("https://api.msg91.com/api/v2/sendsms", {
      method: "POST",
      headers: { authkey: AUTH_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        sender: SENDER_ID,
        route: "4", // transactional
        country: "91",
        sms: [{ message, to: [phone] }],
      }),
      // Hard cap (30s << 15-min outbox reclaim lease): a hung provider can
      // never keep a claimed outbox row "in flight" long enough for another
      // worker to reclaim it → no double-send window.
      signal: AbortSignal.timeout(30_000),
    });
    const raw = await res.text();
    let data: Msg91Response = {};
    try { data = JSON.parse(raw); } catch { /* non-JSON error body */ }

    if (res.ok && data.type === "success") {
      console.log(`[SMS-SENT] MSG91 (legacy raw) to=${phone} | ${raw.slice(0, 150)}`);
      return { ok: true, meta: dltNote };
    }
    console.error(`[SMS-FAILED] MSG91 rejected | to=${phone} | HTTP ${res.status} | ${raw.slice(0, 300)}`);
    const fail: SendResult = { ok: false, error: `MSG91: ${(data.message || raw).slice(0, 300)}` };
    await queueSendFailure("sms", phone, null, { message }, fail.error, opts);
    return fail;
  } catch (e) {
    console.error(`[SMS-FAILED] exception | to=${phone}`, e);
    const fail: SendResult = { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
    await queueSendFailure("sms", phone, null, { message }, fail.error, opts);
    return fail;
  }
}

/** Deliver a transactional SMS through a DLT-approved MSG91 Flow template. */
async function sendViaFlow(
  phone: string,
  templateId: string,
  vars: string[],
  fallbackMessage: string,
  opts?: SendOpts,
): Promise<SendResult> {
  // Flow templates take positional variables (var1, var2 …). Callers that only
  // have the composed text still work: MSG91 delivers the mapped template.
  const recipient: Record<string, string> = { mobiles: `91${phone}` };
  vars.forEach((v, i) => { recipient[`var${i + 1}`] = v; });
  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: AUTH_KEY!, "content-type": "application/json" },
      body: JSON.stringify({ template_id: templateId, short_url: "0", recipients: [recipient] }),
      signal: AbortSignal.timeout(30_000),
    });
    const raw = await res.text();
    let data: Msg91Response = {};
    try { data = JSON.parse(raw); } catch { /* non-JSON error body */ }

    if (res.ok && data.type === "success") {
      console.log(`[SMS-SENT] MSG91 Flow template=${templateId} to=${phone} | ${raw.slice(0, 150)}`);
      return { ok: true };
    }
    console.error(`[SMS-FAILED] MSG91 Flow rejected | template=${templateId} to=${phone} | HTTP ${res.status} | ${raw.slice(0, 300)}`);
    const fail: SendResult = { ok: false, error: `MSG91 Flow: ${(data.message || raw).slice(0, 300)}` };
    // Queue the composed text for durable retry (the sweep re-sends raw).
    await queueSendFailure("sms", phone, null, { message: fallbackMessage }, fail.error, opts);
    return fail;
  } catch (e) {
    console.error(`[SMS-FAILED] Flow exception | template=${templateId} to=${phone}`, e);
    const fail: SendResult = { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
    await queueSendFailure("sms", phone, null, { message: fallbackMessage }, fail.error, opts);
    return fail;
  }
}

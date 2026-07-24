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

/** Send transactional SMS via MSG91 (route 4). Message text must match one of
 *  the owner's DLT-approved templates — MSG91/operators match it automatically. */
export async function sendSms(phone: string, message: string, opts?: SendOpts): Promise<SendResult> {
  if (!AUTH_KEY || !SENDER_ID) {
    console.warn(`[SMS-SKIPPED] MSG91_AUTH_KEY / MSG91_SENDER_ID not set — SMS NOT sent | to=${phone}`);
    return { ok: false, skipped: true, error: "MSG91_AUTH_KEY / MSG91_SENDER_ID not configured on this server" };
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
    });
    const raw = await res.text();
    let data: Msg91Response = {};
    try { data = JSON.parse(raw); } catch { /* non-JSON error body */ }

    if (res.ok && data.type === "success") {
      console.log(`[SMS-SENT] MSG91 to=${phone} | ${raw.slice(0, 150)}`);
      return { ok: true };
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

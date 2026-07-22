// 2Factor OTP service — https://2factor.in
import type { SendResult } from "./notify";

const API_KEY = process.env.TWOFACTOR_API_KEY;

/** Send OTP via 2Factor */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  if (!API_KEY) {
    console.warn(`[SMS-STUB] OTP for ${phone}: ${otp}`);
    (globalThis as any).__lastDevOtp = otp;
    return true;
  }

  try {
    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/${otp}/AUTOGEN`;
    const res  = await fetch(url);
    const data = (await res.json()) as { Status: string; Details: string };
    console.log("[2Factor] sendOtp response:", JSON.stringify(data));
    return data.Status === "Success";
  } catch (e) {
    console.error("[2Factor] sendOtp exception:", e);
    return false;
  }
}

/** Send transactional SMS (non-OTP) */
export async function sendSms(phone: string, message: string): Promise<SendResult> {
  if (!API_KEY) {
    console.warn(`[SMS-SKIPPED] TWOFACTOR_API_KEY not set — SMS NOT sent | to=${phone}`);
    return { ok: false, skipped: true, error: "TWOFACTOR_API_KEY not configured on this server" };
  }
  try {
    const url = `https://2factor.in/API/V1/${API_KEY}/ADDON_SERVICES/SEND/TSMS?To=${phone}&Msg=${encodeURIComponent(message)}`;
    const res  = await fetch(url);
    const raw  = await res.text();
    let data: { Status?: string; Details?: string } = {};
    try { data = JSON.parse(raw); } catch { /* non-JSON error body */ }
    if (data.Status === "Success") {
      console.log(`[SMS-SENT] to=${phone} | ${raw.slice(0, 150)}`);
      return { ok: true };
    }
    console.error(`[SMS-FAILED] 2Factor rejected | to=${phone} | HTTP ${res.status} | ${raw.slice(0, 300)}`);
    return { ok: false, error: `2Factor: ${(data.Details || raw).slice(0, 300)}` };
  } catch (e) {
    console.error(`[SMS-FAILED] exception | to=${phone}`, e);
    return { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
  }
}

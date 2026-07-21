// 2Factor OTP service — https://2factor.in

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
export async function sendSms(phone: string, message: string): Promise<boolean> {
  if (!API_KEY) {
    console.warn(`[SMS-STUB] To ${phone}: ${message}`);
    return true;
  }
  try {
    const url = `https://2factor.in/API/V1/${API_KEY}/ADDON_SERVICES/SEND/TSMS?To=${phone}&Msg=${encodeURIComponent(message)}`;
    const res  = await fetch(url);
    const data = (await res.json()) as { Status: string };
    console.log("[2Factor] sendSms response:", JSON.stringify(data));
    return data.Status === "Success";
  } catch (e) {
    console.error("[2Factor] sendSms failed:", e);
    return false;
  }
}

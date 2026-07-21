// MSG91 OTP service — https://msg91.com

const AUTH_KEY    = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

/** Send OTP via MSG91 OTP API (dedicated OTP endpoint) */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  if (!AUTH_KEY || !TEMPLATE_ID) {
    console.warn(`[SMS-STUB] OTP for ${phone}: ${otp}`);
    (globalThis as any).__lastDevOtp = otp;
    return true;
  }

  try {
    // MSG91 expects 91XXXXXXXXXX (no + sign)
    const mobile = `91${phone}`;

    const url = `https://api.msg91.com/api/v5/otp?template_id=${TEMPLATE_ID}&mobile=${mobile}&authkey=${AUTH_KEY}&otp=${otp}`;

    const res = await fetch(url, { method: "POST" });
    const data = (await res.json()) as { type?: string; message?: string };
    console.log("[MSG91-OTP] response:", JSON.stringify(data));

    if (data.type === "success") return true;

    console.error("[MSG91-OTP] failed:", data);
    return false;
  } catch (e) {
    console.error("[MSG91-OTP] exception:", e);
    return false;
  }
}

/** Send transactional SMS via MSG91 */
export async function sendSms(phone: string, message: string): Promise<boolean> {
  if (!AUTH_KEY) {
    console.warn(`[SMS-STUB] To ${phone}: ${message}`);
    return true;
  }
  try {
    const mobile = `91${phone}`;
    const res = await fetch(
      `https://api.msg91.com/api/sendhttp.php?authkey=${AUTH_KEY}&mobiles=${mobile}&message=${encodeURIComponent(message)}&sender=KRIPLA&route=4`,
    );
    const text = await res.text();
    console.log("[MSG91-SMS] response:", text);
    return true;
  } catch (e) {
    console.error("[MSG91-SMS] failed:", e);
    return false;
  }
}

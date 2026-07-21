// MSG91 SMS service — https://msg91.com

const AUTH_KEY  = process.env.MSG91_AUTH_KEY;
const SENDER_ID = process.env.MSG91_SENDER_ID || "KRIPLA";

/** Send OTP via MSG91 transactional SMS (route 4) */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  if (!AUTH_KEY) {
    console.warn(`[SMS-STUB] OTP for ${phone}: ${otp}`);
    (globalThis as any).__lastDevOtp = otp;
    return true;
  }

  try {
    const mobile  = `91${phone}`;
    // DLT-registered template content with OTP substituted
    const message = `Your OTP is ${otp} Please enter this to verify your mobile. Thank you for choosing us. Team, Kriparti`;

    const url = `https://api.msg91.com/api/sendhttp.php?authkey=${AUTH_KEY}&mobiles=${mobile}&message=${encodeURIComponent(message)}&sender=${SENDER_ID}&route=4&country=91`;

    const res  = await fetch(url);
    const text = await res.text();
    console.log("[MSG91] sendOtp response:", text);

    // MSG91 returns a hex request ID on success, or an error message
    const isError = text.toLowerCase().includes("error") || text.trim() === "";
    return !isError;
  } catch (e) {
    console.error("[MSG91] sendOtp exception:", e);
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
    const url    = `https://api.msg91.com/api/sendhttp.php?authkey=${AUTH_KEY}&mobiles=${mobile}&message=${encodeURIComponent(message)}&sender=${SENDER_ID}&route=4&country=91`;
    const res    = await fetch(url);
    const text   = await res.text();
    console.log("[MSG91] sendSms response:", text);
    return true;
  } catch (e) {
    console.error("[MSG91] sendSms failed:", e);
    return false;
  }
}

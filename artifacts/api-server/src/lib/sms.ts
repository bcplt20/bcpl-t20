// 2Factor SMS / OTP service — https://2factor.in
const API_KEY = process.env.TWOFACTOR_API_KEY;

/** Send OTP via 2Factor */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  if (!API_KEY) {
    console.warn(`[SMS-STUB] OTP for ${phone}: ${otp}`);
    return true; // dev stub
  }
  try {
    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/${otp}/AUTOGEN`;
    const res = await fetch(url);
    const data = (await res.json()) as { Status: string };
    return data.Status === "Success";
  } catch (e) {
    console.error("[SMS] sendOtp failed", e);
    return false;
  }
}

/** Send transactional SMS via 2Factor */
export async function sendSms(phone: string, message: string, templateId?: string): Promise<boolean> {
  if (!API_KEY) {
    console.warn(`[SMS-STUB] To ${phone}: ${message}`);
    return true;
  }
  try {
    const encoded = encodeURIComponent(message);
    const tid = templateId ? `&TemplateID=${templateId}` : "";
    const url = `https://2factor.in/API/V1/${API_KEY}/ADDON_SERVICES/SEND/TSMS?To=${phone}&Msg=${encoded}${tid}`;
    const res = await fetch(url);
    const data = (await res.json()) as { Status: string };
    return data.Status === "Success";
  } catch (e) {
    console.error("[SMS] sendSms failed", e);
    return false;
  }
}

// MSG91 SMS / OTP service — https://msg91.com

const AUTH_KEY   = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
const SENDER_ID  = process.env.MSG91_SENDER_ID || "KRIPLA";

/** Send OTP via MSG91 Flow API */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  if (!AUTH_KEY || !TEMPLATE_ID) {
    console.warn(`[SMS-STUB] OTP for ${phone}: ${otp}`);
    (globalThis as any).__lastDevOtp = otp;
    return true; // dev stub — no keys set
  }

  try {
    // MSG91 expects 91XXXXXXXXXX format (no + sign)
    const mobile = `91${phone}`;

    const body = {
      template_id: TEMPLATE_ID,
      short_url: "0",
      recipients: [
        {
          mobiles: mobile,
          "##var1##": otp,
        },
      ],
    };

    const res = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: AUTH_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { type?: string; message?: string };
    console.log("[MSG91] sendOtp response:", data);

    return data.type === "success";
  } catch (e) {
    console.error("[MSG91] sendOtp failed", e);
    return false;
  }
}

/** Send transactional SMS via MSG91 (for non-OTP messages) */
export async function sendSms(phone: string, message: string): Promise<boolean> {
  if (!AUTH_KEY) {
    console.warn(`[SMS-STUB] To ${phone}: ${message}`);
    return true;
  }
  try {
    const mobile = `91${phone}`;
    const res = await fetch(
      `https://api.msg91.com/api/sendhttp.php?authkey=${AUTH_KEY}&mobiles=${mobile}&message=${encodeURIComponent(message)}&sender=${SENDER_ID}&route=4`,
    );
    const text = await res.text();
    console.log("[MSG91] sendSms response:", text);
    return true;
  } catch (e) {
    console.error("[MSG91] sendSms failed", e);
    return false;
  }
}

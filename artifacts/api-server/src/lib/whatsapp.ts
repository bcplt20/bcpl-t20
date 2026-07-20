// Interakt WhatsApp Business API — https://interakt.ai
// Recommend: Sign up at https://www.interakt.ai — ₹999/month, easy India setup
const API_KEY = process.env.INTERAKT_API_KEY;

interface WaMessage {
  phone: string;
  templateName: string;
  bodyValues: string[];
  headerValues?: string[];
}

export async function sendWhatsApp({ phone, templateName, bodyValues, headerValues }: WaMessage): Promise<boolean> {
  if (!API_KEY) {
    console.warn(`[WA-STUB] Template: ${templateName} | To: ${phone} | Values: ${bodyValues.join(", ")}`);
    return true;
  }
  try {
    const cleanPhone = phone.replace(/\D/g, "").replace(/^91/, "");
    const res = await fetch("https://api.interakt.ai/v1/public/message/", {
      method: "POST",
      headers: {
        Authorization: `Basic ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: cleanPhone,
        callbackData: "bcpl",
        type: "Template",
        template: {
          name: templateName,
          languageCode: "en",
          headerValues: headerValues || [],
          bodyValues,
        },
      }),
    });
    const data = (await res.json()) as { result: boolean };
    return data.result === true;
  } catch (e) {
    console.error("[WA] sendWhatsApp failed", e);
    return false;
  }
}

// WhatsApp template names — create these in Interakt dashboard
export const WA = {
  PHASE1_RECEIPT:    "bcpl_phase1_receipt",     // {{1}}=name {{2}}=role {{3}}=city {{4}}=amount
  VIDEO_REMINDER:    "bcpl_video_reminder",      // {{1}}=name {{2}}=days_left
  VIDEO_SUBMITTED:   "bcpl_video_submitted",     // {{1}}=name
  PHASE1_SELECTED:   "bcpl_phase1_selected",     // {{1}}=name
  PHASE1_REJECTED:   "bcpl_phase1_rejected",     // {{1}}=name
  PHASE2_RECEIPT:    "bcpl_phase2_receipt",      // {{1}}=name {{2}}=amount
  KYC_COMPLETE:      "bcpl_kyc_complete",        // {{1}}=name {{2}}=city
};

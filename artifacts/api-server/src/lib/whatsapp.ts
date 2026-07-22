// Interakt WhatsApp Business API — https://interakt.ai
// Recommend: Sign up at https://www.interakt.ai — ₹999/month, easy India setup
import type { SendResult } from "./notify";

const API_KEY = process.env.INTERAKT_API_KEY;

interface WaMessage {
  phone: string;
  templateName: string;
  bodyValues: string[];
  headerValues?: string[];
}

export async function sendWhatsApp({ phone, templateName, bodyValues, headerValues }: WaMessage): Promise<SendResult> {
  if (!API_KEY) {
    console.warn(`[WA-SKIPPED] INTERAKT_API_KEY not set — WhatsApp NOT sent | template=${templateName} | to=${phone}`);
    return { ok: false, skipped: true, error: "INTERAKT_API_KEY not configured on this server" };
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
    const raw = await res.text();
    let data: { result?: boolean; message?: string } = {};
    try { data = JSON.parse(raw); } catch { /* non-JSON error body */ }
    if (data.result === true) {
      console.log(`[WA-SENT] template=${templateName} | to=${phone}`);
      return { ok: true };
    }
    console.error(`[WA-FAILED] Interakt rejected | template=${templateName} | to=${phone} | HTTP ${res.status} | ${raw.slice(0, 300)}`);
    return { ok: false, error: `Interakt: ${(data.message || raw).slice(0, 300)}` };
  } catch (e) {
    console.error(`[WA-FAILED] exception | template=${templateName} | to=${phone}`, e);
    return { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
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

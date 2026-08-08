/**
 * Event → notification copy (English + Hindi) for the growth notification layer.
 *
 * Every helper calls notify() which (a) always writes an in-app inbox row and
 * (b) best-effort pushes to the player's devices — gated + reserve-first deduped
 * inside notify(). Copy rules (compliance): no "48h" promise, no "scout",
 * no superlatives; the result promise is always "within 15 days".
 *
 * Body carries both languages ("EN · HI") so a single inbox row serves both;
 * the mobile app can split on the middle dot if it wants language selection.
 */
import { notify, type NotifyResult } from "./push";
import { logger } from "./logger";

function bilingual(en: string, hi: string): string {
  return `${en}\n${hi}`;
}

/** KYC approved. */
export async function notifyKycApproved(userId: string, registrationId: string): Promise<NotifyResult> {
  return notify({
    userId,
    type: "kyc_approved",
    title: "KYC verified ✅ / KYC सत्यापित",
    body: bilingual(
      "Your KYC is verified. You're all set for the trial round — details will be shared soon.",
      "आपका KYC सत्यापित हो गया है। आप ट्रायल राउंड के लिए तैयार हैं — जानकारी जल्द साझा की जाएगी।",
    ),
    data: { registrationId, screen: "kyc" },
    dedupeKey: `kyc_approved:${registrationId}`,
  }).catch((e) => { logger.warn({ err: e }, "notifyKycApproved failed"); return { inboxWritten: false, push: null }; });
}

/** KYC rejected / needs more info. */
export async function notifyKycRejected(userId: string, registrationId: string, reason?: string): Promise<NotifyResult> {
  const en = reason
    ? `Your KYC needs attention: ${reason}. Please update your details at bcplt20.com.`
    : "Your KYC needs attention. Please review and update your details at bcplt20.com.";
  const hi = reason
    ? `आपके KYC पर ध्यान देने की ज़रूरत है: ${reason}. कृपया bcplt20.com पर अपनी जानकारी अपडेट करें।`
    : "आपके KYC पर ध्यान देने की ज़रूरत है। कृपया bcplt20.com पर अपनी जानकारी की समीक्षा करके अपडेट करें।";
  return notify({
    userId,
    type: "kyc_rejected",
    title: "KYC needs attention / KYC पर ध्यान दें",
    body: bilingual(en, hi),
    data: { registrationId, screen: "kyc" },
    dedupeKey: `kyc_rejected:${registrationId}`,
  }).catch((e) => { logger.warn({ err: e }, "notifyKycRejected failed"); return { inboxWritten: false, push: null }; });
}

/** Phase-1 result declared (selected / not selected). Outcome-neutral title. */
export async function notifyPhase1Result(userId: string, registrationId: string, qualified: boolean): Promise<NotifyResult> {
  const en = qualified
    ? "Great news — you've cleared Phase 1! Complete your Phase 2 payment at bcplt20.com to move ahead."
    : "Your Phase 1 result is ready. Please check your result at bcplt20.com.";
  const hi = qualified
    ? "बधाई हो — आपने Phase 1 पास कर लिया है! आगे बढ़ने के लिए bcplt20.com पर अपना Phase 2 भुगतान पूरा करें।"
    : "आपका Phase 1 परिणाम तैयार है। कृपया bcplt20.com पर अपना परिणाम देखें।";
  return notify({
    userId,
    type: "phase1_result",
    title: "Phase 1 result is ready / Phase 1 परिणाम तैयार है",
    body: bilingual(en, hi),
    data: { registrationId, screen: "results", qualified },
    dedupeKey: `phase1_result:${registrationId}`,
  }).catch((e) => { logger.warn({ err: e }, "notifyPhase1Result failed"); return { inboxWritten: false, push: null }; });
}

/** Phase-2 payment confirmed. */
export async function notifyPhase2Paid(userId: string, registrationId: string): Promise<NotifyResult> {
  return notify({
    userId,
    type: "phase2_paid",
    title: "Phase 2 payment received ✅ / Phase 2 भुगतान प्राप्त",
    body: bilingual(
      "We've received your Phase 2 payment. Next up is KYC — complete it at bcplt20.com.",
      "हमें आपका Phase 2 भुगतान मिल गया है। अगला कदम KYC है — इसे bcplt20.com पर पूरा करें।",
    ),
    data: { registrationId, screen: "kyc" },
    dedupeKey: `phase2_paid:${registrationId}`,
  }).catch((e) => { logger.warn({ err: e }, "notifyPhase2Paid failed"); return { inboxWritten: false, push: null }; });
}

/** Video validation failed — a re-upload is needed. */
export async function notifyVideoValidationFailed(userId: string, registrationId: string, reason?: string): Promise<NotifyResult> {
  const en = reason
    ? `Your trial video couldn't be processed: ${reason}. Please re-upload at bcplt20.com.`
    : "Your trial video couldn't be processed. Please re-upload it at bcplt20.com.";
  const hi = reason
    ? `आपका ट्रायल वीडियो प्रोसेस नहीं हो सका: ${reason}. कृपया bcplt20.com पर दोबारा अपलोड करें।`
    : "आपका ट्रायल वीडियो प्रोसेस नहीं हो सका। कृपया इसे bcplt20.com पर दोबारा अपलोड करें।";
  return notify({
    userId,
    type: "video_reupload",
    title: "Re-upload your trial video / वीडियो दोबारा अपलोड करें",
    body: bilingual(en, hi),
    data: { registrationId, screen: "video" },
    // Include reason in key so a NEW failure reason can re-notify the player.
    dedupeKey: `video_reupload:${registrationId}:${(reason ?? "").slice(0, 40)}`,
  }).catch((e) => { logger.warn({ err: e }, "notifyVideoValidationFailed failed"); return { inboxWritten: false, push: null }; });
}

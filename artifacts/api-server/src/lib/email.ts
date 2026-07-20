// Brevo (Sendinblue) email service — https://brevo.com
const API_KEY   = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "noreply@bcplt20.com";
const FROM_NAME  = "BCPL T20";
const SITE_URL   = process.env.SITE_URL || "https://elite-user-experience.replit.app/bcpl-website";

interface SendEmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, toName, subject, htmlContent }: SendEmailParams): Promise<boolean> {
  if (!API_KEY) {
    console.warn(`[EMAIL-STUB] To: ${to} | Subject: ${subject}`);
    return true;
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": API_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent,
      }),
    });
    if (!res.ok) console.error("[EMAIL] Failed:", await res.text());
    return res.ok;
  } catch (e) {
    console.error("[EMAIL] sendEmail error", e);
    return false;
  }
}

// ── Email Templates ──────────────────────────────────────────────────────────

const wrap = (body: string) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#06101E;color:#F0EDE8;padding:32px;border-radius:12px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:28px;font-weight:900;color:#FF7A29;">BCPL</span><span style="font-size:28px;font-weight:900;color:#fff;">T20</span>
    <div style="font-size:11px;color:#E8B23D;letter-spacing:2px;margin-top:4px;">SEASON 5 · #OfficeSeStadiumtak</div>
  </div>
  ${body}
  <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center;margin-top:28px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
    BCPL T20 · Kriparti Playing 11 Pvt. Ltd. · India's Biggest Corporate Cricket League
  </p>
</div>`;

const btn = (text: string, href: string, color = "#FF7A29") =>
  `<a href="${href}" style="display:inline-block;margin-top:16px;background:${color};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;">${text}</a>`;

export function tplPhase1Receipt(name: string, role: string, amount: number, regId: string, city: string) {
  return {
    subject: "🏏 BCPL T20 Season 5 — Registration Confirmed!",
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid #22C55E;margin-bottom:20px;">
        <h2 style="color:#22C55E;margin:0 0 8px;">✅ Registration Confirmed!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;">Dear ${name}, you are registered for BCPL Season 5 Phase 1 trials.</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);">Registration ID</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.07);color:#fff;font-weight:bold;">${regId.slice(0,8).toUpperCase()}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);">Role</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.07);color:#FF7A29;font-weight:bold;">${role.toUpperCase()}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);">Trial City</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.07);color:#fff;">${city}</td></tr>
        <tr><td style="padding:10px;color:rgba(255,255,255,0.5);">Amount Paid</td><td style="padding:10px;color:#22C55E;font-weight:bold;font-size:20px;">₹${amount}</td></tr>
      </table>
      <div style="background:rgba(255,122,41,0.08);border:1px solid rgba(255,122,41,0.25);border-radius:12px;padding:20px;">
        <h3 style="color:#FF7A29;margin:0 0 8px;">📹 Next Step — Upload Your Trial Video</h3>
        <p style="color:rgba(255,255,255,0.65);margin:0;">You have <strong style="color:#fff;">7 days</strong> to upload your 2-minute trial video. Login with your phone number anytime to upload.</p>
        ${btn("UPLOAD VIDEO NOW →", `${SITE_URL}/register/upload-video`)}
      </div>`),
  };
}

export function tplVideoSubmitted(name: string) {
  return {
    subject: "🎬 BCPL T20 — Video Received! Result in 7 Days",
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid #3B82F6;">
        <h2 style="color:#3B82F6;margin:0 0 8px;">📹 Video Received!</h2>
        <p style="color:rgba(255,255,255,0.7);">Dear ${name}, your trial video has been submitted successfully.</p>
        <p style="color:rgba(255,255,255,0.5);">Our BCCI-certified scouts will review it within <strong style="color:#fff;">7 working days</strong>. We'll notify you on email, SMS and WhatsApp.</p>
      </div>`),
  };
}

export function tplVideoReminder(name: string, daysLeft: number) {
  return {
    subject: `⏰ BCPL T20 — ${daysLeft} Day${daysLeft > 1 ? "s" : ""} Left to Upload Your Trial Video!`,
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid #F59E0B;">
        <h2 style="color:#F59E0B;margin:0 0 8px;">⏰ Reminder: Upload Your Video!</h2>
        <p style="color:rgba(255,255,255,0.7);">Dear ${name}, only <strong style="color:#F59E0B;">${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong> left to upload your trial video.</p>
        <p style="color:rgba(255,255,255,0.5);">After the deadline your registration expires and you cannot upload. Please upload now!</p>
        ${btn("UPLOAD NOW →", `${SITE_URL}/register/upload-video`)}
      </div>`),
  };
}

export function tplPhase1Selected(name: string) {
  return {
    subject: "🎉 BCPL T20 — Congratulations! You are Selected for Phase 2!",
    htmlContent: wrap(`
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:24px;">
        <h2 style="color:#22C55E;margin:0 0 8px;">🎉 You are Selected for Phase 2!</h2>
        <p style="color:rgba(255,255,255,0.7);">Dear ${name}, our BCCI-certified scouts have reviewed your video and selected you for <strong style="color:#22C55E;">Phase 2 Physical Trials!</strong></p>
        <p style="color:rgba(255,255,255,0.5);">Proceed to pay for Phase 2 and complete your KYC to confirm your trial slot.</p>
        ${btn("PROCEED TO PHASE 2 →", `${SITE_URL}/register/phase2`, "#22C55E")}
      </div>`),
  };
}

export function tplPhase1Rejected(name: string) {
  return {
    subject: "BCPL T20 Season 5 — Phase 1 Result",
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid rgba(255,255,255,0.15);">
        <h2 style="color:#fff;margin:0 0 8px;">Phase 1 Result</h2>
        <p style="color:rgba(255,255,255,0.7);">Dear ${name}, thank you for participating in BCPL Season 5 Phase 1 trials.</p>
        <p style="color:rgba(255,255,255,0.5);">After careful evaluation, you were not selected for Phase 2 this time. Don't be disheartened — keep practicing and try again in Season 6!</p>
        <p style="color:#FF7A29;font-weight:bold;">#OfficeSeStadiumtak</p>
      </div>`),
  };
}

export function tplPhase2Receipt(name: string, amount: number) {
  return {
    subject: "🏟️ BCPL T20 — Phase 2 Payment Confirmed!",
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid #E8B23D;">
        <h2 style="color:#E8B23D;margin:0 0 8px;">🏟️ Phase 2 Payment Confirmed!</h2>
        <p style="color:rgba(255,255,255,0.7);">Dear ${name}, your Phase 2 payment of <strong style="color:#22C55E;">₹${amount}</strong> has been received.</p>
        <p style="color:rgba(255,255,255,0.5);">Please complete your KYC verification to confirm your trial slot. Trial venue and date will be announced soon.</p>
      </div>`),
  };
}

export function tplKycComplete(name: string, city: string) {
  return {
    subject: "✅ BCPL T20 — KYC Verified! Trial Details Coming Soon",
    htmlContent: wrap(`
      <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.18);border-radius:12px;padding:24px;">
        <h2 style="color:#22C55E;margin:0 0 8px;">✅ KYC Verified!</h2>
        <p style="color:rgba(255,255,255,0.7);">Dear ${name}, your KYC is complete. Trial city: <strong style="color:#fff;">${city}</strong>.</p>
        <p style="color:rgba(255,255,255,0.5);">We will announce the trial venue, date, and time very soon. You'll receive an email, SMS and WhatsApp notification. You can also check status by logging in.</p>
        ${btn("CHECK MY STATUS →", `${SITE_URL}/register/result`)}
      </div>`),
  };
}

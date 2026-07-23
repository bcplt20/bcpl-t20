// Brevo (Sendinblue) email service — https://brevo.com
import type { SendResult } from "./notify";
import { inr, type GstBreakup } from "./gst";

const API_KEY    = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "info@bcplt20.com";
const FROM_NAME  = "BCPL T20";
const SITE_URL   = process.env.SITE_URL || "https://elite-user-experience.replit.app/bcpl-website";
const LOGO_URL   = `${SITE_URL}/bcpl-assets/bcpl-logo-white.png`;

// Social handles & links
const INSTAGRAM       = "@bcpl.t20";
const INSTAGRAM_URL   = "https://www.instagram.com/bcpl.t20";
const FACEBOOK_URL    = "https://www.facebook.com/bhartiyacorporatepremierleague";
const TWITTER_URL     = "https://x.com/BCPLT20League";
const YOUTUBE_URL     = "https://www.youtube.com/@bcplt20league";
const YOUTUBE         = "@bcplt20league";
const WEBSITE         = "bcplt20.com";

/**
 * Single source of truth for where admin alert emails go
 * (lockdown alerts, KYC manual-review alerts, etc.).
 * Returns null when no dedicated admin inbox is configured — callers
 * should then skip sending and log loudly instead of mailing the
 * sender address (which nobody monitors).
 */
export function adminAlertRecipient(): string | null {
  const to = process.env.ADMIN_ALERT_EMAIL?.trim();
  return to ? to : null;
}

interface SendEmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, toName, subject, htmlContent }: SendEmailParams): Promise<SendResult> {
  if (!API_KEY) {
    console.warn(`[EMAIL-SKIPPED] BREVO_API_KEY not set — email NOT sent | to=${to} | subject="${subject}"`);
    return { ok: false, skipped: true, error: "BREVO_API_KEY not configured on this server" };
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
    if (!res.ok) {
      const body = await res.text();
      console.error(`[EMAIL-FAILED] Brevo HTTP ${res.status} | to=${to} | subject="${subject}" | ${body}`);
      return { ok: false, error: `Brevo HTTP ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { messageId?: string };
    console.log(`[EMAIL-SENT] to=${to} | messageId=${data.messageId ?? "?"} | subject="${subject}"`);
    return { ok: true };
  } catch (e) {
    console.error(`[EMAIL-FAILED] exception | to=${to}`, e);
    return { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
  }
}

// ── Shared header with actual BCPL logo ──────────────────────────────────────
const header = `
  <div style="text-align:center;padding:28px 32px 20px;background:#040C18;border-radius:12px 12px 0 0;border-bottom:3px solid #FF7A29;">
    <img src="${LOGO_URL}" alt="BCPL T20" style="height:52px;width:auto;object-fit:contain;display:block;margin:0 auto 10px;" />
    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(232,178,61,0.12);border:1px solid rgba(232,178,61,0.4);border-radius:20px;padding:4px 14px;">
      <span style="font-size:11px;">🏆</span>
      <span style="font-family:Arial,sans-serif;font-weight:800;font-size:10px;color:#E8B23D;letter-spacing:2px;">SEASON 5 · #OfficeSeStadiumtak</span>
    </div>
  </div>`;

// ── Shared footer ─────────────────────────────────────────────────────────────
const footer = `
  <div style="padding:20px 32px 24px;background:#040C18;border-radius:0 0 12px 12px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <div style="margin-bottom:14px;display:flex;justify-content:center;gap:18px;flex-wrap:wrap;">
      <a href="${INSTAGRAM_URL}" style="display:inline-flex;align-items:center;gap:5px;color:rgba(255,255,255,0.45);text-decoration:none;font-family:Arial,sans-serif;font-size:11px;">
        <span style="font-size:15px;">📸</span> ${INSTAGRAM}
      </a>
      <a href="${FACEBOOK_URL}" style="display:inline-flex;align-items:center;gap:5px;color:rgba(255,255,255,0.45);text-decoration:none;font-family:Arial,sans-serif;font-size:11px;">
        <span style="font-size:15px;">👥</span> /bhartiyacorporatepremierleague
      </a>
      <a href="${TWITTER_URL}" style="display:inline-flex;align-items:center;gap:5px;color:rgba(255,255,255,0.45);text-decoration:none;font-family:Arial,sans-serif;font-size:11px;">
        <span style="font-size:15px;">🐦</span> @BCPLT20League
      </a>
      <a href="${YOUTUBE_URL}" style="display:inline-flex;align-items:center;gap:5px;color:rgba(255,255,255,0.45);text-decoration:none;font-family:Arial,sans-serif;font-size:11px;">
        <span style="font-size:15px;">▶️</span> ${YOUTUBE}
      </a>
    </div>
    <p style="color:rgba(255,255,255,0.2);font-size:10px;margin:0;line-height:1.7;">
      BCPL T20 · Kriparti Playing 11 Pvt. Ltd.<br/>
      India's Corporate Cricket League<br/>
      <span style="color:rgba(255,255,255,0.12);">${FROM_EMAIL} · ${WEBSITE}</span>
    </p>
  </div>`;

// ── Wrapper ───────────────────────────────────────────────────────────────────
const wrap = (body: string) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#06101E;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
  ${header}
  <div style="padding:28px 32px;color:#F0EDE8;">
    ${body}
  </div>
  ${footer}
</div>`;

const btn = (text: string, href: string, color = "#FF7A29") =>
  `<a href="${href}" style="display:inline-block;margin-top:16px;background:${color};color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:bold;font-size:14px;letter-spacing:.5px;">${text}</a>`;

// ── Template 1: Phase 1 Registration Confirmed ────────────────────────────────
export function tplPhase1Receipt(name: string, role: string, amount: number, regNo: string, city: string) {
  return {
    subject: "🏏 BCPL T20 Season 5 — Registration Confirmed!",
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid #22C55E;margin-bottom:20px;">
        <h2 style="color:#22C55E;margin:0 0 8px;font-size:20px;">✅ Registration Confirmed!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:14px;">Dear <strong>${name}</strong>, you are registered for BCPL Season 5 Phase 1 trials.</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);font-size:13px;">Registration No.</td><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:#fff;font-weight:bold;font-family:monospace;font-size:13px;">${regNo}</td></tr>
        <tr><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);font-size:13px;">Role</td><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:#FF7A29;font-weight:bold;font-size:13px;">${role.toUpperCase()}</td></tr>
        <tr><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);font-size:13px;">Trial City</td><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:#fff;font-size:13px;">${city}</td></tr>
        <tr><td style="padding:11px;color:rgba(255,255,255,0.5);font-size:13px;">Amount Paid</td><td style="padding:11px;color:#22C55E;font-weight:bold;font-size:22px;">₹${amount}</td></tr>
      </table>
      <div style="background:rgba(255,122,41,0.08);border:1px solid rgba(255,122,41,0.25);border-radius:12px;padding:20px;margin-bottom:16px;">
        <h3 style="color:#FF7A29;margin:0 0 8px;font-size:15px;">📹 Next Step — Upload Your Trial Video</h3>
        <p style="color:rgba(255,255,255,0.65);margin:0 0 6px;font-size:13px;">You have <strong style="color:#fff;">15 days</strong> to upload your 30–60 second trial video. Login with your phone number anytime to upload.</p>
        <p style="color:rgba(255,255,255,0.4);margin:0;font-size:12px;">⏰ Deadline: 15 days from registration &nbsp;|&nbsp; ❌ Late uploads NOT accepted</p>
        ${btn("UPLOAD VIDEO NOW →", `${SITE_URL}/register/upload-video`)}
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;">Important Notes</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.9;">🎬 Video: 30–60 seconds — batting, bowling or fielding<br/>📱 Login with the same phone number used during registration<br/>📩 Phase 1 result is typically released within <strong style="color:rgba(255,255,255,0.7);">48 hours</strong> of video submission</div>
      </div>`),
  };
}

// ── Template 2: Video Submitted ────────────────────────────────────────────────
export function tplVideoSubmitted(name: string) {
  return {
    subject: "🎬 BCPL T20 — Video Received! Result within 48 Hours",
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid #3B82F6;margin-bottom:20px;">
        <h2 style="color:#3B82F6;margin:0 0 10px;font-size:20px;">📹 Video Received!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0 0 8px;font-size:14px;">Dear <strong>${name}</strong>, your trial video has been submitted successfully.</p>
        <p style="color:rgba(255,255,255,0.5);margin:0;font-size:13px;">Your video will be evaluated against BCPL's Phase 1 assessment criteria. Your result is typically released within <strong style="color:#fff;">48 hours</strong> — we'll notify you on Email, SMS and WhatsApp.</p>
      </div>
      <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:12px;padding:20px;margin-bottom:16px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:14px;letter-spacing:1px;text-transform:uppercase;">What Happens Next</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;gap:12px;"><div style="min-width:28px;height:28px;background:rgba(59,130,246,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">🔍</div><div style="font-size:13px;color:rgba(255,255,255,0.65);">आपका video BCPL के Phase 1 assessment criteria पर evaluate होगा</div></div>
          <div style="display:flex;align-items:center;gap:12px;"><div style="min-width:28px;height:28px;background:rgba(59,130,246,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">📊</div><div style="font-size:13px;color:rgba(255,255,255,0.65);">Technique, fitness और potential को rate किया जाएगा</div></div>
          <div style="display:flex;align-items:center;gap:12px;"><div style="min-width:28px;height:28px;background:rgba(59,130,246,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">📩</div><div style="font-size:13px;color:rgba(255,255,255,0.65);">Result Email + SMS + WhatsApp पर 48 hours में आएगा</div></div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px 16px;">
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="font-size:12px;color:rgba(255,255,255,0.4);">Status</span><span style="font-size:12px;color:#22C55E;font-weight:700;">✅ Under Review</span></div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;"><span style="font-size:12px;color:rgba(255,255,255,0.4);">Expected Result By</span><span style="font-size:12px;color:#FF7A29;font-weight:700;">Soon — via SMS + Email</span></div>
      </div>`),
  };
}

// ── Template 3: Video Upload Reminder (7-day window: mid nudge + final-day urgent) ─
export function tplVideoReminder(name: string, daysLeft: number) {
  if (daysLeft <= 1) {
    return {
      subject: "🚨 BCPL T20 — FINAL DAY: Upload Your Trial Video Now",
      htmlContent: wrap(`
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:24px;margin-bottom:20px;">
          <h2 style="color:#EF4444;margin:0 0 8px;font-size:20px;">🚨 URGENT — Only 1 Day Left!</h2>
          <p style="color:rgba(255,255,255,0.7);margin:0 0 8px;font-size:14px;">Dear <strong>${name}</strong>, your video upload window closes in less than 24 hours.</p>
          <p style="color:rgba(255,255,255,0.5);margin:0;font-size:13px;">⚠️ <strong style="color:#EF4444;">If you don't upload before the deadline, your trial slot expires</strong> and no further extensions will be granted.</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:16px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="font-size:40px;">🏏</div>
            <div>
              <div style="font-size:14px;color:#fff;font-weight:700;margin-bottom:4px;">Don't Miss Your Chance!</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.5);">You've already paid. Upload your 30–60 second skill video now — it takes less than 5 minutes.</div>
            </div>
          </div>
        </div>
        <div style="text-align:center;">
          ${btn("🚨 UPLOAD NOW →", `${SITE_URL}/register/upload-video`, "#EF4444")}
          <div style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:8px;">This is your final reminder.</div>
        </div>`),
    };
  }
  return {
    subject: `⏰ BCPL T20 — ${daysLeft} Days Left! Upload Your Trial Video`,
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid #F59E0B;margin-bottom:20px;">
        <h2 style="color:#F59E0B;margin:0 0 8px;font-size:20px;">⏰ ${daysLeft} Days Left — Upload Your Video!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0 0 8px;font-size:14px;">Dear <strong>${name}</strong>, your payment is confirmed but your trial video hasn't been uploaded yet.</p>
        <p style="color:rgba(255,255,255,0.5);margin:0;font-size:13px;">You have <strong style="color:#F59E0B;">${daysLeft} more days</strong> to upload. After the deadline your trial slot expires and you cannot upload.</p>
      </div>
      <div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:18px;margin-bottom:16px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase;">Video Requirements</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.9;">🎬 Duration: 30–60 seconds<br/>📱 Format: MP4, MOV, AVI or WEBM<br/>🏏 Content: skills for YOUR selected role — see instructions on the upload page<br/>💡 Good lighting, clear frame — no filters or editing</div>
      </div>
      <div style="text-align:center;">
        ${btn("UPLOAD VIDEO NOW →", `${SITE_URL}/register/upload-video`, "#F59E0B")}
      </div>`),
  };
}

// ── Template 3c: Video re-upload required (validation failed) ────────────────
export function tplVideoReuploadRequired(name: string, reasonLine: string) {
  return {
    subject: "📹 BCPL T20 — We Need a New Video Upload",
    htmlContent: wrap(`
      <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#F59E0B;margin:0 0 8px;font-size:20px;">📹 We Need a New Upload</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0 0 8px;font-size:14px;">Dear <strong>${name}</strong>, we could not accept your Phase 1 trial video.</p>
        <p style="color:rgba(255,255,255,0.6);margin:0;font-size:13px;background:rgba(255,255,255,0.04);border-radius:8px;padding:10px 12px;">${reasonLine}</p>
      </div>
      <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 16px;line-height:1.8;">Your upload window and remaining attempts are shown on the upload page. Please record and upload a new video as soon as possible — your deadline has not changed.</p>
      <div style="text-align:center;">
        ${btn("UPLOAD NEW VIDEO →", `${SITE_URL}/register/upload-video`, "#F59E0B")}
      </div>`),
  };
}

// ── Template 6: Phase 1 Result Ready (§82 — outcome-neutral release email) ───
export function tplPhase1ResultReady(name: string) {
  return {
    subject: "Your BCPL Phase 1 Result Is Ready",
    htmlContent: wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:50%;background:rgba(232,178,61,0.12);border:2px solid #E8B23D;font-size:38px;margin-bottom:12px;">📊</div>
        <div style="font-size:28px;font-weight:900;color:#E8B23D;letter-spacing:-0.5px;font-family:Arial,sans-serif;">YOUR RESULT IS READY</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">BCPL Season 5 · Phase 1 Video Trial</div>
      </div>
      <div style="background:rgba(232,178,61,0.06);border:1px solid rgba(232,178,61,0.2);border-radius:12px;padding:24px;margin-bottom:20px;">
        <p style="color:rgba(255,255,255,0.75);margin:0 0 8px;font-size:14px;">Hi <strong>${name}</strong>,</p>
        <p style="color:rgba(255,255,255,0.6);margin:0 0 8px;font-size:14px;">Your BCPL Season 5 Phase 1 assessment is complete.</p>
        <p style="color:rgba(255,255,255,0.6);margin:0;font-size:14px;">Your result is now available in your <strong style="color:#fff;">BCPL Player Dashboard</strong>.</p>
      </div>
      <div style="text-align:center;margin-bottom:8px;">${btn("VIEW MY RESULT →", `${SITE_URL}/register/result`, "#E8B23D")}</div>
      <p style="text-align:center;color:rgba(255,255,255,0.3);font-size:12px;margin:12px 0 0;">Prepared under the BCPL Season 5 selection methodology.</p>`),
  };
}

// ── Template 7: Phase 1 Qualified (§83 — sent on first view of the result) ───
export function tplPhase1Selected(name: string) {
  return {
    subject: "Congratulations — You've Cleared BCPL Phase 1",
    htmlContent: wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:50%;background:rgba(34,197,94,0.15);border:2px solid #22C55E;font-size:42px;margin-bottom:12px;">🎉</div>
        <div style="font-size:30px;font-weight:900;color:#22C55E;letter-spacing:-1px;font-family:Arial,sans-serif;">PHASE 1 CLEARED!</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">Next Milestone — Phase 2 Physical Trials</div>
      </div>
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:24px;margin-bottom:20px;">
        <p style="color:rgba(255,255,255,0.7);margin:0 0 8px;font-size:14px;">Dear <strong>${name}</strong>, your Phase 1 video assessment is complete and <strong style="color:#22C55E;">you have qualified for Phase 2 Physical Trials!</strong></p>
        <p style="color:rgba(255,255,255,0.5);margin:0;font-size:13px;">Your detailed score card and city ranking are waiting in your Player Dashboard.</p>
      </div>
      <div style="background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.12);border-radius:12px;padding:18px;margin-bottom:20px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:14px;letter-spacing:1px;text-transform:uppercase;">Next Milestone — Phase 2</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;gap:14px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;"><span style="font-size:20px;">✅</span><div><div style="font-size:13px;color:#fff;font-weight:700;margin-bottom:2px;">Eligibility Declarations confirm करें</div><div style="font-size:12px;color:rgba(255,255,255,0.5);">Working-professional rules और terms accept करें</div></div></div>
          <div style="display:flex;gap:14px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;"><span style="font-size:20px;">💰</span><div><div style="font-size:13px;color:#fff;font-weight:700;margin-bottom:2px;">Phase 2 Fee Pay करें</div><div style="font-size:12px;color:rgba(255,255,255,0.5);">आपके role के अनुसार fee payment page पर दिखेगी</div></div></div>
          <div style="display:flex;gap:14px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;"><span style="font-size:20px;">📋</span><div><div style="font-size:13px;color:#fff;font-weight:700;margin-bottom:2px;">KYC Complete करें</div><div style="font-size:12px;color:rgba(255,255,255,0.5);">Aadhaar + PAN — trial slot confirm होगा</div></div></div>
          <div style="display:flex;gap:14px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;"><span style="font-size:20px;">🏟️</span><div><div style="font-size:13px;color:#fff;font-weight:700;margin-bottom:2px;">Physical Trial Attend करें</div><div style="font-size:12px;color:rgba(255,255,255,0.5);">Venue + Date जल्द announce होगा</div></div></div>
        </div>
      </div>
      <div style="text-align:center;">${btn("CONTINUE TO PHASE 2 →", `${SITE_URL}/register/phase2`, "#22C55E")}</div>`),
  };
}

// ── Template 8: Phase 2 Payment Confirmed ─────────────────────────────────────
export function tplPhase2Receipt(name: string, amount: number) {
  return {
    subject: "🏟️ BCPL T20 — Phase 2 Payment Confirmed!",
    htmlContent: wrap(`
      <div style="background:#0A1727;border-radius:12px;padding:24px;border-left:4px solid #E8B23D;margin-bottom:20px;">
        <h2 style="color:#E8B23D;margin:0 0 10px;font-size:20px;">🏟️ Phase 2 Payment Confirmed!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0 0 8px;font-size:14px;">Dear <strong>${name}</strong>, your Phase 2 payment of <strong style="color:#22C55E;">₹${amount}</strong> has been received.</p>
        <p style="color:rgba(255,255,255,0.5);margin:0;font-size:13px;">Please complete your KYC to confirm your trial slot. Trial venue and date will be announced soon.</p>
      </div>
      <div style="background:rgba(232,178,61,0.05);border:1px solid rgba(232,178,61,0.15);border-radius:12px;padding:18px;margin-bottom:16px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:12px;letter-spacing:1px;text-transform:uppercase;">Next Steps</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:2;">1️⃣ Complete KYC — Aadhaar + PAN verification<br/>2️⃣ Trial venue &amp; date announcement का इंतजार करें<br/>3️⃣ Physical trial में attend करें<br/>4️⃣ Franchise auction में draft होने का मौका</div>
      </div>`),
  };
}

// ── Template 9: Trial Venue Announced (Phase 2) ────────────────────────────────
export function tplTrialVenueAnnounced(name: string, city: string, venue: string, date: string, time: string, reportingTime: string) {
  return {
    subject: `🏟️ BCPL T20 — Phase 2 Trial Details for ${city}!`,
    htmlContent: wrap(`
      <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;background:rgba(232,178,61,0.15);border:2px solid #E8B23D;font-size:36px;margin-bottom:10px;">🏟️</div>
        <div style="font-size:22px;font-weight:900;color:#E8B23D;font-family:Arial,sans-serif;">TRIAL VENUE ANNOUNCED!</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">${city} — Phase 2 Physical Trials</div>
      </div>
      <div style="background:rgba(232,178,61,0.08);border:1px solid rgba(232,178,61,0.25);border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="color:rgba(255,255,255,0.7);margin:0 0 16px;font-size:14px;">Dear <strong>${name}</strong>, your Phase 2 trial details are confirmed. Be there on time!</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:rgba(255,255,255,0.04);border-radius:8px;">
            <td style="padding:12px;font-size:12px;color:rgba(255,255,255,0.45);width:40%;">📍 Venue</td>
            <td style="padding:12px;font-size:14px;color:#fff;font-weight:700;">${venue}</td>
          </tr>
          <tr>
            <td style="padding:12px;font-size:12px;color:rgba(255,255,255,0.45);">📅 Trial Date</td>
            <td style="padding:12px;font-size:14px;color:#E8B23D;font-weight:700;">${date}</td>
          </tr>
          <tr style="background:rgba(255,255,255,0.04);">
            <td style="padding:12px;font-size:12px;color:rgba(255,255,255,0.45);">⏰ Trial Time</td>
            <td style="padding:12px;font-size:14px;color:#fff;font-weight:700;">${time}</td>
          </tr>
          <tr>
            <td style="padding:12px;font-size:12px;color:rgba(255,255,255,0.45);">🕐 Reporting Time</td>
            <td style="padding:12px;font-size:14px;color:#22C55E;font-weight:700;">${reportingTime} <span style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:400;">(30 min before trial)</span></td>
          </tr>
          <tr style="background:rgba(255,255,255,0.04);">
            <td style="padding:12px;font-size:12px;color:rgba(255,255,255,0.45);">🏙️ City</td>
            <td style="padding:12px;font-size:14px;color:#fff;font-weight:700;">${city}</td>
          </tr>
        </table>
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:10px;letter-spacing:1px;text-transform:uppercase;">What to Bring</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.9;">🪪 Aadhaar Card (original)<br/>📄 PAN Card (original)<br/>🏏 Your cricket kit (optional — kit available on site)<br/>💧 Water bottle &amp; light refreshments<br/>👕 BCPL T20 jersey (if received)</div>
      </div>
      <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;padding:12px 16px;margin-bottom:16px;">
        <div style="font-size:12px;color:rgba(239,68,68,0.8);font-weight:700;">⚠️ Important: Late arrivals may not be accommodated. Please reach 30 minutes before the trial time.</div>
      </div>
      <div style="text-align:center;">${btn("CHECK MY PROFILE →", `${SITE_URL}/register/result`, "#E8B23D")}</div>`),
  };
}

// ── Template 10: KYC Complete ──────────────────────────────────────────────────
export function tplKycComplete(name: string, city: string) {
  return {
    subject: "✅ BCPL T20 — KYC Verified! Trial Details Coming Soon",
    htmlContent: wrap(`
      <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.18);border-radius:12px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#22C55E;margin:0 0 8px;font-size:20px;">✅ KYC Verified!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0 0 8px;font-size:14px;">Dear <strong>${name}</strong>, your KYC is complete. Trial city: <strong style="color:#fff;">${city}</strong>.</p>
        <p style="color:rgba(255,255,255,0.5);margin:0;font-size:13px;">Trial venue, date and time will be announced soon. You'll receive an Email, SMS and WhatsApp notification.</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div style="text-align:center;padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.07);">
          <div style="font-size:28px;margin-bottom:6px;">📍</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:4px;letter-spacing:1px;">TRIAL CITY</div>
          <div style="font-size:14px;color:#fff;font-weight:700;">${city}</div>
        </div>
        <div style="text-align:center;padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.07);">
          <div style="font-size:28px;margin-bottom:6px;">📅</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:4px;letter-spacing:1px;">TRIAL DATE</div>
          <div style="font-size:14px;color:#FF7A29;font-weight:700;">Coming Soon</div>
        </div>
      </div>
      ${btn("CHECK MY STATUS →", `${SITE_URL}/register/result`)}`),
  };
}

// ── Admin alert: global login circuit breaker tripped ────────────────────────
export function tplAdminLoginLockdown(p: { failCount: number; trippedAt: Date; lockedUntil: Date }) {
  const fmt = (d: Date) =>
    d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST";
  return {
    subject: "🚨 BCPL Admin ALERT — Login locked down: possible brute-force attack",
    htmlContent: wrap(`
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#EF4444;margin:0 0 8px;font-size:20px;">🚨 Admin Login Locked Down</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:14px;">The global admin-login circuit breaker has <strong style="color:#EF4444;">TRIPPED</strong>. Too many failed admin login attempts across all IPs — this looks like a distributed brute-force attack. Admin login is temporarily blocked for everyone.</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);font-size:13px;">Tripped at</td><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:#fff;font-weight:bold;font-size:13px;">${fmt(p.trippedAt)}</td></tr>
        <tr><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.5);font-size:13px;">Failed attempts (15 min)</td><td style="padding:11px;border-bottom:1px solid rgba(255,255,255,0.07);color:#EF4444;font-weight:bold;font-size:13px;">${p.failCount}</td></tr>
        <tr><td style="padding:11px;color:rgba(255,255,255,0.5);font-size:13px;">Lockout ends</td><td style="padding:11px;color:#22C55E;font-weight:bold;font-size:13px;">${fmt(p.lockedUntil)}</td></tr>
      </table>
      <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;">What this means</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.9;">🔒 All admin login attempts are blocked until the lockout ends — including yours.<br/>🛡️ No action is required to restore access; the lockout lifts automatically.<br/>🔑 If attacks continue, consider rotating the admin panel password.</div>
      </div>`),
  };
}

// ── Admin alert: KYC parked for manual review ────────────────────────────────
export function tplKycManualReview(p: {
  playerName: string;
  playerPhone: string;
  regIdShort: string;
  trialCity: string;
  panVerified: boolean;
  aadhaarVerified: boolean;
  reason: string;
  flaggedAt: Date;
}) {
  const fmt = (d: Date) =>
    d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST";
  const status = (ok: boolean) =>
    ok
      ? `<span style="color:#22C55E;font-weight:bold;">✓ Verified</span>`
      : `<span style="color:#F59E0B;font-weight:bold;">⏳ Needs manual review</span>`;
  const row = (label: string, value: string, last = false) =>
    `<tr><td style="padding:11px;${last ? "" : "border-bottom:1px solid rgba(255,255,255,0.07);"}color:rgba(255,255,255,0.5);font-size:13px;">${label}</td><td style="padding:11px;${last ? "" : "border-bottom:1px solid rgba(255,255,255,0.07);"}color:#fff;font-weight:bold;font-size:13px;">${value}</td></tr>`;
  return {
    subject: `📋 BCPL Admin — KYC needs manual review: ${p.playerName} (${p.regIdShort})`,
    htmlContent: wrap(`
      <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#F59E0B;margin:0 0 8px;font-size:20px;">📋 KYC Needs Manual Review</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:14px;">A paying player's KYC could not be auto-verified and is now <strong style="color:#F59E0B;">waiting for your review</strong>. The player was promised verification within <strong style="color:#fff;">24–48 hours</strong>.</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${row("Player", p.playerName)}
        ${row("Phone", p.playerPhone)}
        ${row("Registration ID", `<span style="font-family:monospace;">${p.regIdShort}</span>`)}
        ${row("Trial City", p.trialCity)}
        ${row("PAN", status(p.panVerified))}
        ${row("Aadhaar", status(p.aadhaarVerified))}
        ${row("Why flagged", `<span style="font-weight:400;color:rgba(255,255,255,0.75);">${p.reason}</span>`)}
        ${row("Flagged at", fmt(p.flaggedAt), true)}
      </table>
      <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px;margin-bottom:8px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;">What to do</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.9;">1️⃣ Open the admin panel → KYC section<br/>2️⃣ Check the player's PAN/Aadhaar details<br/>3️⃣ Press Verify — the player gets SMS + email automatically</div>
      </div>
      <div style="text-align:center;">${btn("OPEN ADMIN PANEL →", `${SITE_URL}/admin`, "#F59E0B")}</div>`),
  };
}

// ── Template 11: GST Tax Invoice ──────────────────────────────────────────────
const BCPL_GSTIN = "07AAHCK4053D1ZS";
const BCPL_ADDR  = "Kriparti Playing11 Private Limited, 2nd Floor Back Side, RZ-108, Indra Park, Uttam Nagar, West Delhi, Delhi - 110059";

export function tplInvoice(p: {
  name: string;
  invoiceNo: string;
  phase: 1 | 2;
  txnId: string;
  paidAt: Date | string;
  breakup: GstBreakup;
}) {
  const { base, cgst, sgst, total } = p.breakup;
  const dateStr = new Date(p.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const desc = p.phase === 1
    ? "Online Video Submission &amp; Evaluation"
    : "Physical Trial Entry &amp; Franchise Auction Eligibility";
  const row = (l: string, v: string, strong = false) =>
    `<div style="display:flex;justify-content:space-between;padding:${strong ? "10px 0 0" : "6px 0"};${strong ? "margin-top:4px;border-top:2px solid rgba(255,122,41,0.35);" : "border-bottom:1px solid rgba(255,255,255,0.07);"}">
      <span style="font-size:${strong ? 14 : 12}px;color:${strong ? "#F0EDE8" : "rgba(255,255,255,0.5)"};font-weight:${strong ? 800 : 400};">${l}</span>
      <span style="font-size:${strong ? 16 : 12}px;color:${strong ? "#FF7A29" : "#F0EDE8"};font-weight:${strong ? 900 : 600};">${v}</span>
    </div>`;
  return {
    subject: `📄 BCPL T20 — Tax Invoice ${p.invoiceNo}`,
    htmlContent: wrap(`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid rgba(255,122,41,0.4);">
        <div>
          <div style="display:inline-block;background:#FF7A29;color:#fff;padding:5px 14px;border-radius:6px;font-weight:900;font-size:11px;letter-spacing:1px;margin-bottom:8px;">TAX INVOICE</div>
          <div style="font-size:13px;color:#fff;font-weight:700;">Invoice No: <span style="font-family:monospace;">${p.invoiceNo}</span></div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;">Payment Date: ${dateStr}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px;">HSN/SAC: 999299 — Sports Event Services · GST 18% (CGST 9% + SGST 9%)</div>
        </div>
      </div>
      <div style="background:#0A1727;border-radius:12px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Issued By (Supplier)</div>
        <div style="font-size:13px;color:#fff;font-weight:700;">Kriparti Playing11 Pvt. Ltd.</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px;line-height:1.6;">GSTIN: <strong style="color:#E8B23D;">${BCPL_GSTIN}</strong><br/>${BCPL_ADDR}</div>
      </div>
      <div style="background:#0A1727;border-radius:12px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Bill To (Recipient)</div>
        <div style="font-size:13px;color:#fff;font-weight:700;">${p.name}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px;">TXN ID: <span style="font-family:monospace;">${p.txnId}</span> · Method: Cashfree</div>
      </div>
      <div style="background:rgba(255,122,41,0.06);border:1px solid rgba(255,122,41,0.2);border-radius:12px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-size:12px;color:#F0EDE8;font-weight:700;margin-bottom:2px;">BCPL T20 Season 5 — Phase ${p.phase} Registration</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:12px;">${desc}</div>
        ${row("Taxable Value (Base)", `₹${inr(base)}`)}
        ${row("CGST @ 9%", `₹${inr(cgst)}`)}
        ${row("SGST @ 9%", `₹${inr(sgst)}`)}
        ${row("Total Paid", `₹${inr(total)}`, true)}
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px 14px;font-size:10px;color:rgba(255,255,255,0.3);line-height:1.6;">
        This is a computer-generated invoice and does not require a physical signature. Amount is inclusive of GST. Subject to Delhi jurisdiction.
      </div>`),
  };
}

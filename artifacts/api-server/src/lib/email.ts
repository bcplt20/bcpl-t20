// Brevo (Sendinblue) email service — https://brevo.com
import { queueSendFailure, type SendOpts, type SendResult } from "./notify";
import { inr, gstFromGross, type GstBreakup } from "./gst";
import { BCPL_GSTIN, BCPL_ADDR } from "./companyInfo";
import {
  EmailShell,
  HeroStatus,
  Greeting,
  Paragraph,
  InfoCard,
  KeyValueTable,
  NextSteps,
  Timeline,
  SuccessBanner,
  ScoreCardPanel,
  StatusCard,
  StepProgress,
  TicketBlock,
  CountdownBand,
  VenueCard,
  PrimaryCTA,
  NoteBox,
  hydrateSponsors,
  esc,
  formatRole,
  ICONS,
  COLORS,
  SITE_URL,
  FROM_EMAIL,
} from "./emailTheme";

const API_KEY    = process.env.BREVO_API_KEY;
const FROM_NAME  = "Bhartiya Corporate Premier League";

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

/** Configured Phase 1 result window, human copy. Kept in sync with the
 *  phase1Config resultReleaseHours default (48h) — fixes the old
 *  "Expected Result BySoon" bug by always rendering a real window. */
const RESULT_WINDOW = "Within 15 Days";

/** One PDF/document attachment for Brevo — content is base64-encoded bytes. */
export interface EmailAttachment {
  name: string;
  contentBase64: string;
}

interface SendEmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
  /**
   * Optional file attachments (e.g. a GST invoice PDF). Mapped to Brevo's
   * `attachment: [{ name, content }]` payload. Kept OUT of the outbox retry
   * payload so a queued retry never drags a large base64 blob through jsonb
   * (and never crashes the queue) — a retried receipt simply goes out without
   * the attachment; the attachment is best-effort on the first send only.
   */
  attachments?: EmailAttachment[];
}

export async function sendEmail({ to, toName, subject, htmlContent, attachments }: SendEmailParams, opts?: SendOpts): Promise<SendResult> {
  if (!API_KEY) {
    console.warn(`[EMAIL-SKIPPED] BREVO_API_KEY not set — email NOT sent | to=${to} | subject="${subject}"`);
    return { ok: false, skipped: true, error: "BREVO_API_KEY not configured on this server" };
  }
  // Hydrate the dynamic sponsor strip just before send. Never throws — a
  // sponsor-fetch failure simply omits the strip. This keeps every template
  // function synchronous (unchanged signatures) while the strip stays live.
  const finalHtml = await hydrateSponsors(htmlContent);
  // Only attach a well-formed, non-empty attachment array; anything else is
  // silently dropped so a bad attachment can never break a receipt send.
  const validAttachments = Array.isArray(attachments)
    ? attachments.filter((a) => a && typeof a.name === "string" && typeof a.contentBase64 === "string" && a.contentBase64.length > 0)
    : [];
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": API_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: finalHtml,
        ...(validAttachments.length
          ? { attachment: validAttachments.map((a) => ({ name: a.name, content: a.contentBase64 })) }
          : {}),
      }),
      // Hard cap (30s << 15-min outbox reclaim lease) — no hung request can
      // block callers or open a reclaim double-send window.
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[EMAIL-FAILED] Brevo HTTP ${res.status} | to=${to} | subject="${subject}" | ${body}`);
      const fail: SendResult = { ok: false, error: `Brevo HTTP ${res.status}: ${body.slice(0, 300)}` };
      await queueSendFailure("email", to, toName, { subject, htmlContent }, fail.error, opts);
      return fail;
    }
    const data = (await res.json().catch(() => ({}))) as { messageId?: string };
    console.log(`[EMAIL-SENT] to=${to} | messageId=${data.messageId ?? "?"} | subject="${subject}"`);
    return { ok: true };
  } catch (e) {
    console.error(`[EMAIL-FAILED] exception | to=${to}`, e);
    const fail: SendResult = { ok: false, error: String((e as Error)?.message ?? e).slice(0, 300) };
    await queueSendFailure("email", to, toName, { subject, htmlContent }, fail.error, opts);
    return fail;
  }
}

/* ════════════════════════════════════════════════════════════════════════════
 * TEMPLATES — every template is composed from the emailTheme design system.
 * Subjects and bodies contain NO emoji. Copy is English-primary with an
 * optional single short Hindi line where a deliberate bilingual hierarchy
 * helps player comprehension (never mid-sentence mixing).
 * ══════════════════════════════════════════════════════════════════════════ */

// ── Template 1: Phase 1 Registration Confirmed ────────────────────────────────
export function tplPhase1Receipt(name: string, role: string, amount: number, regNo: string, city: string) {
  // Real GST breakup extracted from the gross amount paid (prices are
  // GST-inclusive) — never hardcoded tax numbers.
  const g = gstFromGross(amount);
  return {
    subject: "Bhartiya Corporate Premier League Season 5 — Registration Confirmed",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.check(COLORS.green), ring: COLORS.green, titleColor: COLORS.green, title: "REGISTRATION CONFIRMED", subtitle: "BCPL Season 5 · Phase 1 Trials", iconAlt: "Registration confirmed" })}
      ${StepProgress(0)}
      ${SuccessBanner("You are registered for Phase 1 Trials", "Your payment has been received and your place in BCPL Season 5 Phase 1 is secured.")}
      ${Greeting(name, ["Welcome to BCPL Season 5. Here is your registration receipt."])}
      ${TicketBlock({
        title: "Phase 1 Registration Receipt",
        amount: `&#8377;${esc(amount)}`,
        accent: COLORS.green,
        rows: [
          ["Registration No.", `<span style="font-family:monospace;">${esc(regNo)}</span>`],
          ["Role", `<span style="color:${COLORS.orange};">${esc(formatRole(role))}</span>`],
          ["Trial City", esc(city)],
          ["Taxable Value", `&#8377;${inr(g.base)}`],
          ["CGST @ 9%", `&#8377;${inr(g.cgst)}`],
          ["SGST @ 9%", `&#8377;${inr(g.sgst)}`],
          ["Total Paid (incl. GST)", `&#8377;${inr(g.total)}`],
        ],
      })}
      ${InfoCard({
        accent: COLORS.orange,
        children: `
          <div style="font-family:inherit;font-size:15px;color:${COLORS.ink};font-weight:700;margin-bottom:6px;">Next Step — Upload Your Trial Video</div>
          <p style="font-size:13px;color:${COLORS.inkSoft};margin:0 0 6px;line-height:1.6;">You have <strong>15 days</strong> to upload a 30–90 second trial video. Sign in with your registered phone number any time to upload.</p>
          <p style="font-size:12px;color:${COLORS.inkFaint};margin:0;">Deadline: 15 days from registration &nbsp;·&nbsp; Late uploads are not accepted.</p>`,
      })}
      ${PrimaryCTA("UPLOAD VIDEO", `${SITE_URL}/register/upload-video`)}
      ${NoteBox("Video: 30–90 seconds of batting, bowling or fielding. Sign in with the same phone number used during registration. Your Phase 1 result will be shared within 15 days of video submission.")}
    `),
  };
}

// ── Template 2: Video Submitted (redesigned per spec §11) ─────────────────────
export function tplVideoSubmitted(name: string) {
  return {
    subject: "Bhartiya Corporate Premier League — Video Received",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.video(COLORS.blue), ring: COLORS.blue, titleColor: COLORS.blue, title: "VIDEO RECEIVED", subtitle: "Your Phase 1 trial video has been submitted successfully." })}
      ${StepProgress(1)}
      ${Greeting(name, [
        "We have successfully received your BCPL Season 5 Phase 1 trial video.",
        "Your submission will now proceed through BCPL's Phase 1 assessment process.",
      ])}
      ${Timeline([
        { title: "Submission Received", body: "Your trial video has been securely received.", state: "done" },
        { title: "Assessment In Progress", body: "Your submission is evaluated against the applicable BCPL Phase 1 assessment criteria.", state: "active" },
        { title: "Result Within 15 Days", body: "Once your result is ready, we will notify you on the channels registered with your BCPL account — Email, SMS and WhatsApp.", state: "todo" },
      ])}
      ${StatusCard([
        { label: "Current Status", value: "Under Review", color: COLORS.blue },
        { label: "Expected Result", value: RESULT_WINDOW, color: COLORS.orange },
      ])}
      ${PrimaryCTA("OPEN PLAYER DASHBOARD", `${SITE_URL}/register/result`, COLORS.blue)}
    `),
  };
}

// ── Template 3: Video Upload Reminder (mid nudge + final-day urgent) ──────────
export function tplVideoReminder(name: string, daysLeft: number) {
  if (daysLeft <= 1) {
    return {
      subject: "Bhartiya Corporate Premier League — Final Day to Upload Your Trial Video",
      htmlContent: EmailShell(`
        ${HeroStatus({ iconUrl: ICONS.alert(COLORS.red), ring: COLORS.red, titleColor: COLORS.red, title: "FINAL DAY", subtitle: "Only 1 day left to upload your trial video." })}
        ${StepProgress(1)}
        ${CountdownBand({ big: "Aaj Aakhri Din", caption: "Your upload window closes in less than 24 hours. Aaj hi upload karein.", accent: COLORS.red })}
        ${Greeting(name, [
          "Your video upload window closes in less than 24 hours.",
          "If you do not upload before the deadline, your trial slot expires and no further extension will be granted.",
        ])}
        ${InfoCard({
          accent: COLORS.red,
          children: `
            <div style="font-size:15px;color:${COLORS.ink};font-weight:700;margin-bottom:4px;">Do not miss your chance</div>
            <p style="font-size:13px;color:${COLORS.inkSoft};margin:0;line-height:1.6;">You have already paid. Upload your 30–90 second skill video now — it takes less than 5 minutes.</p>`,
        })}
        ${PrimaryCTA("UPLOAD VIDEO", `${SITE_URL}/register/upload-video`, COLORS.red)}
        ${NoteBox("This is your final reminder.")}
      `),
    };
  }
  return {
    subject: `Bhartiya Corporate Premier League — ${daysLeft} Days Left to Upload Your Trial Video`,
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.clock(COLORS.amber), ring: COLORS.amber, titleColor: COLORS.amber, title: `${daysLeft} DAYS LEFT`, subtitle: "Upload your Phase 1 trial video." })}
      ${StepProgress(1)}
      ${CountdownBand({ big: `${daysLeft} Din Baaki`, caption: `Only ${daysLeft} days left to upload your trial video. Paise pehle hi ho chuke — bas video upload karna baaki hai.`, accent: COLORS.amber })}
      ${Greeting(name, [
        "Your payment is confirmed, but your trial video has not been uploaded yet.",
        `You have <strong>${daysLeft} more days</strong> to upload. After the deadline your trial slot expires and uploads are no longer accepted.`,
      ])}
      ${InfoCard({
        accent: COLORS.amber,
        children: `
          <div style="font-size:10px;color:${COLORS.inkFaint};letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Video Requirements</div>
          <div style="font-size:13px;color:${COLORS.inkSoft};line-height:1.9;">Duration: 30–90 seconds<br/>Format: MP4, MOV, AVI or WEBM<br/>Content: skills for your registered role — see instructions on the upload page<br/>Good lighting and a clear frame — no filters or editing</div>`,
      })}
      ${PrimaryCTA("UPLOAD VIDEO", `${SITE_URL}/register/upload-video`, COLORS.amber)}
    `),
  };
}

// ── Template 3c: Video re-upload required (validation failed) ────────────────
export function tplVideoReuploadRequired(name: string, reasonLine: string) {
  return {
    subject: "Bhartiya Corporate Premier League — A New Video Upload Is Needed",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.video(COLORS.amber), ring: COLORS.amber, titleColor: COLORS.amber, title: "NEW UPLOAD NEEDED", subtitle: "We could not accept your Phase 1 trial video." })}
      ${Greeting(name, ["We were unable to accept your Phase 1 trial video."])}
      ${NoteBox(esc(reasonLine), COLORS.line)}
      ${Paragraph("Your upload window and remaining attempts are shown on the upload page. Please record and upload a new video as soon as possible — your deadline has not changed.")}
      ${PrimaryCTA("UPLOAD NEW VIDEO", `${SITE_URL}/register/upload-video`, COLORS.amber)}
    `),
  };
}

// ── Template 6: Phase 1 Result Ready (outcome-neutral release email, §12) ────
export function tplPhase1ResultReady(name: string) {
  return {
    subject: "Your BCPL Phase 1 Result Is Ready",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.chart(COLORS.gold), ring: COLORS.gold, titleColor: COLORS.gold, title: "YOUR RESULT IS READY", subtitle: "BCPL Season 5 · Phase 1 Video Trial" })}
      ${Greeting(name, [
        "Your BCPL Season 5 Phase 1 assessment has been completed.",
        "Your result is now available securely in your BCPL Player Dashboard.",
      ])}
      ${ScoreCardPanel({
        title: "Phase 1 Score Card",
        caption: "Available securely in your Player Dashboard.",
        rows: [
          ["Assessment", "Completed"],
          ["Score Card", "Ready to View"],
          ["Where", "Player Dashboard"],
        ].map(([label, value]) => ({ label, value, color: label === "Assessment" ? COLORS.green : COLORS.gold })),
      })}
      ${PrimaryCTA("VIEW MY RESULT", `${SITE_URL}/register/result`, COLORS.gold)}
      ${NoteBox("Sign in using your registered BCPL account to view your result and next steps.")}
    `),
  };
}

// ── Template 7: Phase 1 Qualified (sent on first view of the result) ─────────
export function tplPhase1Selected(name: string) {
  return {
    subject: "Bhartiya Corporate Premier League — Phase 1 Cleared, Phase 2 Awaits",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.trophy(COLORS.green), ring: COLORS.green, titleColor: COLORS.green, title: "PHASE 1 CLEARED", subtitle: "Next Milestone — Phase 2 Physical Trials" })}
      ${StepProgress(2)}
      ${SuccessBanner("Phase 1 cleared — you have qualified for Phase 2", "Your detailed score card and city ranking are ready in your Player Dashboard.")}
      ${Greeting(name, [
        "Your Phase 1 video assessment is complete and <strong>you have qualified for Phase 2 Physical Trials.</strong>",
        "Your detailed score card and city ranking are waiting in your Player Dashboard.",
      ])}
      ${NextSteps([
        { title: "Confirm Eligibility Declarations", body: "Accept the working-professional rules and terms." },
        { title: "Pay the Phase 2 Fee", body: "Your fee is shown on the payment page based on your role." },
        { title: "Complete KYC", body: "Aadhaar and PAN verification confirms your trial slot." },
        { title: "Attend the Physical Trial", body: "Venue and date will be announced soon." },
      ])}
      ${PrimaryCTA("CONTINUE TO PHASE 2", `${SITE_URL}/register/phase2`, COLORS.green)}
    `),
  };
}

// ── Template 8: Phase 2 Payment Confirmed ─────────────────────────────────────
export function tplPhase2Receipt(name: string, amount: number, regNo?: string) {
  // Real GST breakup extracted from the gross amount paid (prices are
  // GST-inclusive) — never hardcoded tax numbers.
  const g = gstFromGross(amount);
  return {
    subject: "Bhartiya Corporate Premier League — Phase 2 Payment Confirmed",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.check(COLORS.gold), ring: COLORS.gold, titleColor: COLORS.gold, title: "PHASE 2 PAYMENT CONFIRMED", subtitle: "BCPL Season 5 · Physical Trials" })}
      ${StepProgress(3)}
      ${SuccessBanner("Phase 2 payment received", "Your place in the Phase 2 Physical Trials is being finalised. Complete KYC to confirm your slot.", COLORS.gold)}
      ${Greeting(name, [
        "Your Phase 2 payment has been received. Here is your receipt.",
      ])}
      ${TicketBlock({
        title: "Phase 2 Payment Receipt",
        amount: `&#8377;${esc(amount)}`,
        accent: COLORS.gold,
        rows: [
          ...(regNo
            ? [["Player ID", `<span style="font-family:monospace;">${esc(regNo)}</span>`] as [string, string]]
            : []),
          ["Stage", "Phase 2 — Physical Trials"],
          ["Taxable Value", `&#8377;${inr(g.base)}`],
          ["CGST @ 9%", `&#8377;${inr(g.cgst)}`],
          ["SGST @ 9%", `&#8377;${inr(g.sgst)}`],
          ["Total Paid (incl. GST)", `&#8377;${inr(g.total)}`],
        ],
      })}
      ${InfoCard({
        accent: COLORS.orange,
        children: `
          <div style="font-family:inherit;font-size:15px;color:${COLORS.ink};font-weight:700;margin-bottom:6px;">Next Step — Complete Your KYC</div>
          <p style="font-size:13px;color:${COLORS.inkSoft};margin:0 0 6px;line-height:1.6;">Complete Aadhaar and PAN verification to confirm your Phase 2 trial slot. Your trial venue and date will be announced soon.</p>
          <p style="font-size:12px;color:${COLORS.inkFaint};margin:0;">Verification is usually completed within 24–48 hours.</p>`,
      })}
      ${PrimaryCTA("COMPLETE KYC", `${SITE_URL}/register/phase2`, COLORS.gold)}
      ${NextSteps([
        { title: "Complete KYC", body: "Aadhaar and PAN verification." },
        { title: "Await Venue & Date", body: "You will be notified once your trial city schedule is confirmed." },
        { title: "Attend the Physical Trial", body: "Report on time at your assigned venue." },
        { title: "Franchise Auction", body: "Perform well for a chance to be drafted." },
      ])}
    `),
  };
}

// ── Template 9: Trial Venue Announced (Phase 2) ────────────────────────────────
export function tplTrialVenueAnnounced(name: string, city: string, venue: string, date: string, time: string, reportingTime: string) {
  return {
    subject: `Bhartiya Corporate Premier League — Phase 2 Trial Details for ${city}`,
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.pin(COLORS.gold), ring: COLORS.gold, titleColor: COLORS.gold, title: "TRIAL VENUE ANNOUNCED", subtitle: `${esc(city)} — Phase 2 Physical Trials` })}
      ${StepProgress(4)}
      ${Greeting(name, ["Your Phase 2 trial details are confirmed. Please arrive on time."])}
      ${VenueCard([
        { label: "Venue", value: esc(venue) },
        { label: "City", value: esc(city) },
        { label: "Date", value: esc(date), color: COLORS.gold },
        { label: "Trial Time", value: esc(time) },
        { label: "Reporting", value: `<span style="color:${COLORS.green};">${esc(reportingTime)}</span> <span style="font-weight:400;color:${COLORS.inkFaint};font-size:12px;">(30 min before trial)</span>` },
      ])}
      ${InfoCard({
        accent: COLORS.gold,
        children: `
          <div style="font-size:10px;color:${COLORS.inkFaint};letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">What to Bring</div>
          <div style="font-size:13px;color:${COLORS.inkSoft};line-height:1.9;">Aadhaar Card (original)<br/>PAN Card (original)<br/>Your cricket kit (optional — kit available on site)<br/>Water bottle and light refreshments<br/>Bhartiya Corporate Premier League jersey (if received)</div>`,
      })}
      ${NoteBox("Late arrivals may not be accommodated. Please reach 30 minutes before the trial time.", COLORS.red)}
      ${PrimaryCTA("VIEW VENUE DETAILS", `${SITE_URL}/register/result`, COLORS.gold)}
    `),
  };
}

// ── Template: Physical Trial Completed ────────────────────────────────────────
export function tplTrialCompleted(p: { firstName: string; roleLabel: string; trialCity: string; venueName: string; trialDate: string; trialId: string }) {
  return {
    subject: "BCPL Physical Trial Completed Successfully",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.check(COLORS.green), ring: COLORS.green, titleColor: COLORS.green, title: "PHYSICAL TRIAL COMPLETED", subtitle: "Season 5 — Phase 2 Physical Trials" })}
      ${Greeting(p.firstName, ["You have successfully completed your BCPL physical trial. Your on-ground assessment has been recorded by the evaluation team."])}
      ${KeyValueTable([
        ["Player Trial ID", `<span style="color:${COLORS.gold};">${esc(p.trialId)}</span>`],
        ["Playing Role", esc(formatRole(p.roleLabel))],
        ["Trial City", esc(p.trialCity)],
        ["Venue", esc(p.venueName)],
        ["Trial Date", esc(p.trialDate)],
      ])}
      ${NoteBox("Results will be announced after trials are completed across all cities. No further action is needed from you right now — you can track your status any time from your BCPL dashboard.")}
      ${PrimaryCTA("VIEW MY TRIAL PASS", `${SITE_URL}/trial-pass`, COLORS.green)}
    `),
  };
}

// ── Template 10: KYC Complete ──────────────────────────────────────────────────
export function tplKycComplete(name: string, city: string) {
  return {
    subject: "Bhartiya Corporate Premier League — KYC Verified",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.check(COLORS.green), ring: COLORS.green, titleColor: COLORS.green, title: "KYC VERIFIED", subtitle: "Your identity verification is complete." })}
      ${Greeting(name, [
        `Your KYC is complete. Trial city: <strong>${esc(city)}</strong>.`,
        "Your trial venue, date and time will be announced soon. You will receive an Email, SMS and WhatsApp notification.",
      ])}
      ${StatusCard([
        { label: "Trial City", value: esc(city), color: COLORS.ink },
        { label: "Trial Date", value: "To Be Announced", color: COLORS.orange },
      ])}
      ${PrimaryCTA("CHECK MY STATUS", `${SITE_URL}/register/result`, COLORS.green)}
    `),
  };
}

// ── Template 10b: KYC Rejected — resubmission guidance ───────────────────────
export function tplKycRejected(name: string, reason?: string) {
  return {
    subject: "Bhartiya Corporate Premier League — Action Needed: Your KYC Could Not Be Verified",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.alert(COLORS.red), ring: COLORS.red, titleColor: COLORS.red, title: "KYC NOT VERIFIED", subtitle: "Your KYC has been marked for re-submission." })}
      ${Greeting(name, ["We were unable to verify your KYC and it has been marked for re-submission."])}
      ${reason ? NoteBox(`Reason: ${esc(reason)}`, COLORS.red) : ""}
      ${NextSteps([
        { title: "Sign In", body: "Log in at bcplt20.com with your registered phone number." },
        { title: "Open KYC", body: "Open the KYC section and re-submit your details." },
        { title: "Match Your Documents", body: "Enter the exact PAN and Aadhaar as printed on your documents." },
        { title: "Complete Your Profile", body: "Make sure your emergency contact and T-shirt size are filled." },
      ])}
      ${Paragraph("Your Phase 2 payment is safe — you only need to complete KYC again. If you need help, reply to this email or contact our support team.")}
      ${PrimaryCTA("RE-SUBMIT KYC", `${SITE_URL}/register/phase2`, COLORS.red)}
    `),
  };
}

// ── Admin alert: global login circuit breaker tripped ────────────────────────
export function tplAdminLoginLockdown(p: { failCount: number; trippedAt: Date; lockedUntil: Date }) {
  const fmt = (d: Date) =>
    d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST";
  return {
    subject: "BCPL Admin ALERT — Login Locked Down: possible brute-force attack",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.shield(COLORS.red), ring: COLORS.red, titleColor: COLORS.red, title: "ADMIN LOGIN LOCKED DOWN", subtitle: "Possible distributed brute-force attack" })}
      ${InfoCard({
        accent: COLORS.red,
        children: `<p style="font-size:14px;color:${COLORS.inkSoft};margin:0;line-height:1.6;">The global admin-login circuit breaker has <strong style="color:${COLORS.red};">TRIPPED</strong>. Too many failed admin login attempts across all IPs. Admin login is temporarily blocked for everyone.</p>`,
      })}
      ${KeyValueTable([
        ["Tripped at", esc(fmt(p.trippedAt))],
        ["Failed attempts (15 min)", `<span style="color:${COLORS.red};">${esc(p.failCount)}</span>`],
        ["Lockout ends", `<span style="color:${COLORS.green};">${esc(fmt(p.lockedUntil))}</span>`],
      ])}
      ${NoteBox("All admin login attempts are blocked until the lockout ends — including yours. No action is required to restore access; the lockout lifts automatically. If attacks continue, consider rotating the admin panel password.")}
    `),
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
      ? `<span style="color:${COLORS.green};">Verified</span>`
      : `<span style="color:${COLORS.amber};">Needs manual review</span>`;
  return {
    subject: `BCPL Admin — KYC needs manual review: ${p.playerName} (${p.regIdShort})`,
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.doc(COLORS.amber), ring: COLORS.amber, titleColor: COLORS.amber, title: "KYC NEEDS MANUAL REVIEW", subtitle: "A paying player's KYC could not be auto-verified." })}
      ${InfoCard({
        accent: COLORS.amber,
        children: `<p style="font-size:14px;color:${COLORS.inkSoft};margin:0;line-height:1.6;">This KYC is now <strong style="color:${COLORS.amber};">waiting for your review</strong>. The player was promised verification within <strong style="color:${COLORS.ink};">24–48 hours</strong>.</p>`,
      })}
      ${KeyValueTable([
        ["Player", esc(p.playerName)],
        ["Phone", esc(p.playerPhone)],
        ["Registration ID", `<span style="font-family:monospace;">${esc(p.regIdShort)}</span>`],
        ["Trial City", esc(p.trialCity)],
        ["PAN", status(p.panVerified)],
        ["Aadhaar", status(p.aadhaarVerified)],
        ["Why flagged", `<span style="font-weight:400;color:${COLORS.inkSoft};">${esc(p.reason)}</span>`],
        ["Flagged at", esc(fmt(p.flaggedAt))],
      ])}
      ${NoteBox("Open the admin panel → KYC section, check the player's PAN/Aadhaar details, then press Verify — the player gets SMS and email automatically.")}
      ${PrimaryCTA("OPEN ADMIN PANEL", `${SITE_URL}/admin`, COLORS.amber)}
    `),
  };
}

// ── Template 11: GST Tax Invoice ──────────────────────────────────────────────
// Statutory supplier identity lives in ONE shared place (lib/companyInfo) so
// the HTML invoice below and the attached PDF (lib/invoicePdf) can never drift.
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
    `<tr>
      <td style="padding:${strong ? "12px 0 0" : "8px 0"};${strong ? `border-top:2px solid rgba(255,122,41,0.35);` : `border-bottom:1px solid ${COLORS.line};`}font-family:inherit;font-size:${strong ? 14 : 12}px;color:${strong ? COLORS.ink : COLORS.inkFaint};font-weight:${strong ? 800 : 400};">${l}</td>
      <td align="right" style="padding:${strong ? "12px 0 0" : "8px 0"};${strong ? `border-top:2px solid rgba(255,122,41,0.35);` : `border-bottom:1px solid ${COLORS.line};`}font-family:inherit;font-size:${strong ? 16 : 12}px;color:${strong ? COLORS.orange : COLORS.ink};font-weight:${strong ? 900 : 600};">${v}</td>
    </tr>`;
  return {
    subject: `Bhartiya Corporate Premier League — Tax Invoice ${p.invoiceNo}`,
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.doc(COLORS.orange), ring: COLORS.orange, titleColor: COLORS.orange, title: "TAX INVOICE", subtitle: `Invoice No: ${esc(p.invoiceNo)} · ${esc(dateStr)}` })}
      <p style="font-family:inherit;font-size:11px;color:${COLORS.inkFaint};text-align:center;margin:0 0 18px;">HSN/SAC: 999299 — Sports Event Services · GST 18% (CGST 9% + SGST 9%)</p>
      ${InfoCard({
        accent: COLORS.gold,
        children: `
          <div style="font-size:10px;color:${COLORS.inkFaint};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Issued By (Supplier)</div>
          <div style="font-size:13px;color:${COLORS.ink};font-weight:700;">Kriparti India Pvt. Ltd.</div>
          <div style="font-size:11px;color:${COLORS.inkSoft};margin-top:3px;line-height:1.6;">GSTIN: <strong style="color:${COLORS.gold};">${BCPL_GSTIN}</strong><br/>${BCPL_ADDR}</div>`,
      })}
      ${InfoCard({
        accent: COLORS.orange,
        children: `
          <div style="font-size:10px;color:${COLORS.inkFaint};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Bill To (Recipient)</div>
          <div style="font-size:13px;color:${COLORS.ink};font-weight:700;">${esc(p.name)}</div>
          <div style="font-size:11px;color:${COLORS.inkSoft};margin-top:3px;">TXN ID: <span style="font-family:monospace;">${esc(p.txnId)}</span> · Method: Cashfree</div>`,
      })}
      <div style="background:${COLORS.surface};border:1px solid ${COLORS.line};border-radius:12px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-family:inherit;font-size:12px;color:${COLORS.ink};font-weight:700;margin-bottom:2px;">Bhartiya Corporate Premier League Season 5 — Phase ${p.phase} Registration</div>
        <div style="font-family:inherit;font-size:11px;color:${COLORS.inkFaint};margin-bottom:12px;">${desc}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${row("Taxable Value (Base)", `&#8377;${inr(base)}`)}
          ${row("CGST @ 9%", `&#8377;${inr(cgst)}`)}
          ${row("SGST @ 9%", `&#8377;${inr(sgst)}`)}
          ${row("Total Paid", `&#8377;${inr(total)}`, true)}
        </table>
      </div>
      ${NoteBox("This is a computer-generated invoice and does not require a physical signature. Amount is inclusive of GST. Subject to Delhi jurisdiction.")}
    `),
  };
}

// ── Payment reminders (factual copy only, no promises) ───────────────────────
export function tplPhase1PaymentReminder(name: string, city: string, urgent: boolean) {
  return {
    subject: urgent
      ? "Your Bhartiya Corporate Premier League registration is still incomplete"
      : "Complete your Bhartiya Corporate Premier League registration — payment pending",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.clock(COLORS.orange), ring: COLORS.orange, titleColor: COLORS.orange, title: "PAYMENT PENDING", subtitle: "Your Bhartiya Corporate Premier League registration is not complete yet." })}
      ${Greeting(name, [
        `Your Bhartiya Corporate Premier League Season 5 registration${city ? ` for <strong>${esc(city)}</strong>` : ""} is saved, but the Phase 1 payment is still pending.`,
        "Complete the payment to receive your Player ID and start your 15-day video window.",
      ])}
      ${NoteBox("Sign in with your registered phone number — your details are already filled in.")}
      ${PrimaryCTA("COMPLETE PAYMENT", `${SITE_URL}/register`)}
    `),
  };
}

export function tplPhase2PaymentReminder(name: string) {
  return {
    subject: "Phase 1 cleared — your Phase 2 payment is pending",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.trophy(COLORS.green), ring: COLORS.green, titleColor: COLORS.green, title: "PHASE 1 CLEARED", subtitle: "Your Phase 2 payment is still pending." })}
      ${Greeting(name, [
        "Your Phase 1 result is out and you have qualified.",
        "Complete the Phase 2 payment to proceed to identity verification (KYC) and the physical trial round.",
      ])}
      ${PrimaryCTA("COMPLETE PHASE 2", `${SITE_URL}/register`, COLORS.green)}
    `),
  };
}

// ── Template: Referral Reward Milestone reached ──────────────────────────────
export function tplReferralMilestone(name: string, paidCount: number, reward: string) {
  return {
    subject: "You have unlocked a BCPL referral reward",
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.trophy(COLORS.orange), ring: COLORS.orange, titleColor: COLORS.orange, title: "REWARD UNLOCKED", subtitle: "BCPL Season 5 — Player Referral Program" })}
      ${Greeting(name, [
        `<strong>${esc(paidCount)}</strong> of the players you referred have completed their Phase 1 payment — and that just unlocked your next referral reward:`,
      ])}
      ${InfoCard({
        accent: COLORS.gold,
        children: `<div style="text-align:center;font-size:15px;color:${COLORS.gold};font-weight:800;">${esc(reward)}</div>`,
      })}
      ${Paragraph("Our team will reach out to hand over your reward. Keep sharing your referral link to climb the leaderboard and unlock more.")}
      ${PrimaryCTA("VIEW MY REFERRALS", `${SITE_URL}/referrals`)}
    `),
  };
}

// ── Template: Trial Pass Allocated ───────────────────────────────────────────
export function tplTrialPass(name: string, venue: string, city: string, date: string, reportingTime: string, batch: string) {
  return {
    subject: `Bhartiya Corporate Premier League — Your Trial Pass Is Ready (${city})`,
    htmlContent: EmailShell(`
      ${HeroStatus({ iconUrl: ICONS.ticket(COLORS.green), ring: COLORS.green, titleColor: COLORS.green, title: "TRIAL PASS READY", subtitle: `${esc(city)} — Physical Trials` })}
      ${StepProgress(4)}
      ${SuccessBanner("Your trial slot is confirmed", "Your digital Trial Pass with QR code is ready on the website.", COLORS.green)}
      ${Greeting(name, ["Your physical trial slot is confirmed. Your digital Trial Pass (with QR code) is now available on the website."])}
      ${VenueCard([
        { label: "Venue", value: esc(venue) },
        { label: "City", value: esc(city) },
        { label: "Date", value: esc(date), color: COLORS.gold },
        { label: "Reporting", value: `<span style="color:${COLORS.green};">${esc(reportingTime)}</span>` },
        { label: "Batch", value: esc(batch) },
      ])}
      ${NoteBox("Show the QR code on your Trial Pass at the venue gate for check-in. Please carry your original Aadhaar card.")}
      ${PrimaryCTA("VIEW MY TRIAL PASS", `${SITE_URL}/trial-pass`, COLORS.green)}
    `),
  };
}

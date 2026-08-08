/**
 * BCPL transactional email design-system tests.
 *
 * Pure-function unit tests over lib/email.ts templates and lib/emailTheme.ts
 * components — NO DB, NO network, NO provider calls. sendEmail() is never
 * invoked, so no email can ever go out from this suite.
 *
 * Guards:
 *  - every template renders without throwing
 *  - NO emoji codepoints anywhere in subject or body (the whole point of the
 *    redesign)
 *  - sponsor strip appears when eligible sponsors exist, and is omitted when
 *    none are eligible
 *  - one-language rule spot checks (no Devanagari mid-copy in redesigned
 *    English templates)
 *  - the old "Expected Result BySoon" concatenation bug is gone
 *  - player-facing compliance grep (no scout / BCCI / guarantee / 100% /
 *    selected by / Gemini)
 */
import { describe, it, expect } from "vitest";

// Set a deterministic public base before importing the module.
process.env.PUBLIC_API_BASE = "https://bcplt20.com";

import * as E from "../src/lib/email";
import {
  renderSponsorStrip,
  SPONSOR_TOKEN,
  emailLogoUrl,
  isEmailVisible,
  EmailShell,
  SocialBar,
  EMAIL_ICON_BASE,
  SOCIAL,
  formatRole,
} from "../src/lib/emailTheme";

/** Build one representative render of every exported template. */
function renderAll(): Array<{ key: string; subject: string; html: string }> {
  const t: Array<{ key: string; out: { subject: string; htmlContent: string } }> = [
    { key: "phase1_receipt", out: E.tplPhase1Receipt("Saurabh Kumar", "bat", 599, "BCPL-DEL-1", "Delhi") },
    { key: "video_submitted", out: E.tplVideoSubmitted("Saurabh Kumar") },
    { key: "video_reminder_mid", out: E.tplVideoReminder("Saurabh Kumar", 5) },
    { key: "video_reminder_final", out: E.tplVideoReminder("Saurabh Kumar", 1) },
    { key: "video_reupload", out: E.tplVideoReuploadRequired("Saurabh Kumar", "Your video was shorter than 30 seconds.") },
    { key: "phase1_result_ready", out: E.tplPhase1ResultReady("Saurabh Kumar") },
    { key: "phase1_selected", out: E.tplPhase1Selected("Saurabh Kumar") },
    { key: "phase2_receipt", out: E.tplPhase2Receipt("Saurabh Kumar", 2999, "BCPL-DEL-1") },
    { key: "trial_venue", out: E.tplTrialVenueAnnounced("Saurabh Kumar", "Delhi", "Feroz Shah Kotla Ground", "12 Aug 2027", "9:00 AM", "8:30 AM") },
    { key: "trial_completed", out: E.tplTrialCompleted({ firstName: "Saurabh", roleLabel: "Batsman", trialCity: "Delhi", venueName: "Feroz Shah Kotla Ground", trialDate: "12 Aug 2027", trialId: "BCPL-DEL-1" }) },
    { key: "kyc_complete", out: E.tplKycComplete("Saurabh Kumar", "Delhi") },
    { key: "kyc_rejected", out: E.tplKycRejected("Saurabh Kumar", "PAN name did not match Aadhaar.") },
    { key: "admin_login_lockdown", out: E.tplAdminLoginLockdown({ failCount: 42, trippedAt: new Date(0), lockedUntil: new Date(3_600_000) }) },
    { key: "kyc_manual_review", out: E.tplKycManualReview({ playerName: "Saurabh Kumar", playerPhone: "98XXXXXX10", regIdShort: "BCPL-DEL-1", trialCity: "Delhi", panVerified: true, aadhaarVerified: false, reason: "Aadhaar OTP not completed", flaggedAt: new Date(0) }) },
    { key: "invoice", out: E.tplInvoice({ name: "Saurabh Kumar", invoiceNo: "BCPL-INV-0001", phase: 1, txnId: "cf_txn_sample", paidAt: new Date(0), breakup: { base: 507.63, gst: 91.37, cgst: 45.69, sgst: 45.68, total: 599 } }) },
    { key: "phase1_payment_reminder", out: E.tplPhase1PaymentReminder("Saurabh Kumar", "Delhi", false) },
    { key: "phase2_payment_reminder", out: E.tplPhase2PaymentReminder("Saurabh Kumar") },
    { key: "referral_milestone", out: E.tplReferralMilestone("Saurabh Kumar", 3, "Official BCPL Jersey") },
    { key: "trial_pass", out: E.tplTrialPass("Saurabh Kumar", "Feroz Shah Kotla Ground", "Delhi", "12 Aug 2027", "8:30 AM", "Batch A") },
    { key: "sponsor_enquiry", out: E.tplSponsorEnquiry({ name: "Anita Sharma", company: "Acme Retail Pvt Ltd", designation: "Marketing Head", phone: "9876543210", email: "anita@example.com", budgetRange: "5-15L", message: "Interested in a jersey partnership.", source: "website", receivedAt: new Date(0) }) },
  ];
  return t.map((x) => ({ key: x.key, subject: x.out.subject, html: x.out.htmlContent }));
}

// Emoji / pictographic codepoint ranges. Deliberately EXCLUDES ordinary
// typography (en/em dashes, ellipsis, middots) and Devanagari — dashes are
// legitimate copy, and Hindi is checked separately. Covers every emoji the
// spec named (📊📹🦆▶️✅⚠️🎬🏆🎫📄 etc.) plus flags and variation selectors.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2705}\u{26A0}\u{25B6}]/u;
// A narrower "definitely emoji" check (pictographs + variation selectors)
const PICTO_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{25FE}\u{25B6}\u{2705}\u{26A0}]/u;
const DEVANAGARI_RE = /[\u0900-\u097F]/u;

const rendered = renderAll();

describe("every template renders without throwing", () => {
  for (const r of rendered) {
    it(`renders ${r.key}`, () => {
      expect(r.subject.length).toBeGreaterThan(3);
      expect(r.html).toContain("<!DOCTYPE html>");
      expect(r.html).toContain("BCPL");
    });
  }
});

describe("NO emoji codepoints in subjects or bodies", () => {
  for (const r of rendered) {
    it(`no emoji in ${r.key}`, () => {
      // Strip out inline SVG data-URIs (they legitimately contain arrows in
      // encoded markup but are not emoji glyphs) — the SVG icons are
      // URL-encoded so they contain no raw pictographic codepoints anyway.
      expect(PICTO_RE.test(r.subject)).toBe(false);
      expect(PICTO_RE.test(r.html)).toBe(false);
      expect(EMOJI_RE.test(r.subject)).toBe(false);
    });
  }
});

describe("one-language rule (no Hindi/English mid-copy mixing)", () => {
  // Player-facing redesigned templates are English-primary; assert none of the
  // previously mixed-language bodies contain Devanagari script anymore.
  const englishOnly = [
    "video_submitted",
    "phase1_selected",
    "phase2_receipt",
    "kyc_rejected",
    "phase1_receipt",
  ];
  for (const key of englishOnly) {
    it(`${key} contains no Devanagari`, () => {
      const r = rendered.find((x) => x.key === key)!;
      expect(DEVANAGARI_RE.test(r.html)).toBe(false);
    });
  }
});

describe('the "Expected Result BySoon" bug is gone', () => {
  const vs = rendered.find((x) => x.key === "video_submitted")!;
  it("no BySoon concatenation", () => {
    expect(vs.html).not.toMatch(/BySoon/);
    expect(vs.html).not.toMatch(/By\s*<[^>]*>\s*Soon/);
  });
  it("shows a real expected window", () => {
    expect(vs.html).toContain("Expected Result");
    expect(vs.html).toContain("Within 15 Days");
  });
});

describe("sponsor strip slot + dynamic rendering", () => {
  it("every template embeds the sponsor placeholder token", () => {
    for (const r of rendered) expect(r.html).toContain(SPONSOR_TOKEN);
  });

  it("renders a strip when eligible sponsors exist", () => {
    const strip = renderSponsorStrip([
      { name: "Acme Corp", logo: "https://cdn.example.com/acme.png", website: "https://acme.example", status: "active", visibility: "All Platforms" },
    ]);
    expect(strip).toContain("Official Partners");
    expect(strip).toContain("acme.example"); // clickable website
    expect(strip).toContain("background:#FFFFFF"); // light tile so logos stay visible
  });

  it("omits the strip entirely when no eligible sponsors", () => {
    expect(renderSponsorStrip([])).toBe("");
    // active but not email-visible
    expect(renderSponsorStrip([{ name: "X", logo: "https://x/y.png", status: "active", visibility: "Website Only" }])).toBe("");
    // email-visible but inactive
    expect(renderSponsorStrip([{ name: "X", logo: "https://x/y.png", status: "expired", visibility: "All Platforms" }])).toBe("");
    // active + visible but no usable logo
    expect(renderSponsorStrip([{ name: "X", logo: "", status: "active", visibility: "Email" }])).toBe("");
  });

  it("private-bucket logos are rewritten to the presign redirect route", () => {
    const url = emailLogoUrl("https://mybucket.s3.ap-south-1.amazonaws.com/cms/logo_123.png");
    expect(url).toBe("https://bcplt20.com/api/sponsors/logo?key=cms%2Flogo_123.png");
  });

  it("email visibility rule accepts All Platforms and Email, rejects others", () => {
    expect(isEmailVisible({ status: "active", visibility: "All Platforms" })).toBe(true);
    expect(isEmailVisible({ status: "active", visibility: "Website + Email" })).toBe(true);
    expect(isEmailVisible({ status: "active", visibility: "Website Only" })).toBe(false);
    expect(isEmailVisible({ status: "expired", visibility: "All Platforms" })).toBe(false);
  });
});

/** Extract human-visible text from email HTML — drop all tags/attributes so
 *  CSS like width:100% never trips the marketing-claim grep. */
function visibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ") // drop CSS (media queries etc.)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ") // remove tags (and their style attributes)
    .replace(/&[a-z]+;|&#\d+;/gi, " ") // decode-ish: drop entities
    .replace(/\s+/g, " ")
    .trim();
}

describe("player-facing compliance grep", () => {
  // Player-facing templates only (admin alerts are internal ops mail).
  const adminOnly = new Set(["admin_login_lockdown", "kyc_manual_review", "sponsor_enquiry"]);
  const banned = [/scout/i, /BCCI/i, /guarantee/i, /100\s*%/, /selected by/i, /Gemini/i];
  for (const r of rendered) {
    if (adminOnly.has(r.key)) continue;
    it(`${r.key} has no banned marketing/compliance terms`, () => {
      const text = visibleText(r.html);
      for (const re of banned) {
        expect(re.test(r.subject), `subject matched ${re}`).toBe(false);
        expect(re.test(text), `visible text matched ${re}`).toBe(false);
      }
    });
  }
});

describe("sponsor enquiry template — compliance grep (internal ops mail)", () => {
  const tpl = E.tplSponsorEnquiry({ name: "Anita Sharma", company: "Acme Retail Pvt Ltd", designation: "Marketing Head", phone: "9876543210", email: "anita@example.com", budgetRange: "5-15L", message: "Interested in a jersey partnership.", source: "website", receivedAt: new Date(0) });
  const banned = [/scout/i, /BCCI/i, /guarantee/i, /100\s*%/, /\bbest\b/i, /No\.?\s*1\b/i, /world-?class/i];
  it("has no scout / BCCI / superlative / absolute-promise copy", () => {
    const text = visibleText(tpl.htmlContent);
    for (const re of banned) {
      expect(re.test(text), `visible text matched ${re}`).toBe(false);
      expect(re.test(tpl.subject), `subject matched ${re}`).toBe(false);
    }
  });
  it("subject follows the required Hindi format", () => {
    expect(tpl.subject).toBe("नई sponsorship enquiry — Acme Retail Pvt Ltd");
  });
});

describe("shell structure integrity", () => {
  it("EmailShell contains header, sponsor token, social bar and legal footer", () => {
    const html = EmailShell("<p>body</p>");
    expect(html).toContain("SEASON 5");
    expect(html).toContain("#OfficeSeStadiumTak");
    expect(html).toContain(SPONSOR_TOKEN);
    expect(html).toContain("Follow BCPL");
    expect(html).toContain("Kriparti India Pvt. Ltd.");
  });

  it("footer is responsive (stack hook + media query)", () => {
    const html = EmailShell("<p>body</p>");
    expect(html).toContain("bcpl-stack");
    expect(html).toContain("@media only screen and (max-width:480px)");
  });
});

describe("social bar uses hosted PNG icons (no blank-square data-URI SVG)", () => {
  const bar = SocialBar();

  it("references absolute hosted PNG URLs, not data-URI SVG", () => {
    expect(bar).not.toContain("data:image/svg");
    expect(EMAIL_ICON_BASE).toBe("https://bcplt20.com/email-icons");
  });

  it("renders one PNG per platform that has a configured URL", () => {
    for (const kind of ["instagram", "facebook", "x", "youtube", "website"] as const) {
      expect(bar).toContain(`${EMAIL_ICON_BASE}/${kind}.png`);
    }
    // every icon has width/height (spec §32: 28-36px display) + alt + a link
    expect(bar).toMatch(/width="30" height="30"/);
    expect(bar).toContain('alt="Instagram"');
    expect(bar).toContain('alt="Website"');
    expect(bar).toContain(SOCIAL.website as string);
  });

  it("omits LinkedIn because no URL is configured (never guessed)", () => {
    expect(SOCIAL.linkedin).toBeUndefined();
    expect(bar).not.toContain("linkedin.png");
  });
});

describe("hero/status icons are hosted PNGs (Gmail/Outlook safe)", () => {
  it("every template's hero medallion references a hosted PNG, not data-URI SVG", () => {
    for (const r of rendered) {
      expect(r.html).not.toContain("data:image/svg");
      expect(r.html).toMatch(new RegExp(`${EMAIL_ICON_BASE.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}/hero-[a-z]+-[a-z]+\\.png`));
    }
  });
});

describe("role formatter (single source of truth — no raw codes reach players)", () => {
  it("maps every code (any case) to the approved player-facing label", () => {
    expect(formatRole("bat")).toBe("Batsman");
    expect(formatRole("BAT")).toBe("Batsman");
    expect(formatRole("bowl")).toBe("Bowler");
    expect(formatRole("BOWL")).toBe("Bowler");
    expect(formatRole("ar")).toBe("All-Rounder");
    expect(formatRole("AR")).toBe("All-Rounder");
    expect(formatRole("wk")).toBe("Wicketkeeper");
    expect(formatRole("WK")).toBe("Wicketkeeper");
  });
  it("maps historic long forms too", () => {
    expect(formatRole("Batsman")).toBe("Batsman");
    expect(formatRole("all-rounder")).toBe("All-Rounder");
    expect(formatRole("wicketkeeper_batsman")).toBe("Wicketkeeper");
  });
  it("falls back to title-cased input; empty yields Player", () => {
    expect(formatRole("keeper")).toBe("Keeper");
    expect(formatRole("")).toBe("Player");
    expect(formatRole(null)).toBe("Player");
  });
  it("registration receipt never renders a raw role code", () => {
    const r = rendered.find((x) => x.key === "phase1_receipt")!;
    // seeded with role "bat" — must render the label, never the code
    expect(r.html).toContain("Batsman");
    expect(r.html).toMatch(/Role<\/td>\s*<td[^>]*><span[^>]*>Batsman<\/span>/);
    expect(r.html).not.toMatch(/>BAT</);
  });
  it("registration hero graphic has meaningful alt text (spec §31)", () => {
    const r = rendered.find((x) => x.key === "phase1_receipt")!;
    expect(r.html).toContain('alt="Registration confirmed"');
  });
});

describe("premium upgrades", () => {
  it("registration email uses the premium success banner", () => {
    const r = rendered.find((x) => x.key === "phase1_receipt")!;
    expect(r.html).toContain("Confirmed");
    expect(r.html).toContain("secured");
  });

  it("video received email uses a stylized timeline (received -> review -> 15 days)", () => {
    const r = rendered.find((x) => x.key === "video_submitted")!;
    expect(r.html).toContain("Submission Received");
    expect(r.html).toContain("Assessment In Progress");
    expect(r.html).toContain("Result Within 15 Days");
  });

  it("result ready email uses a premium score-card panel and stays outcome-neutral", () => {
    const r = rendered.find((x) => x.key === "phase1_result_ready")!;
    expect(r.html).toContain("Phase 1 Score Card");
    expect(r.html).toContain("Ready to View");
    // outcome-neutral: no numeric score, no pass/fail verdict, no foul copy
    expect(visibleText(r.html)).not.toMatch(/\b\d{1,3}\s*\/\s*100\b/);
    expect(r.html).not.toMatch(/passed|failed|rejected|not selected/i);
  });
});

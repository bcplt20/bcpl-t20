/**
 * BCPL T20 — Master transactional email design system.
 *
 * ONE source of truth for every transactional email component. Every template
 * in lib/email.ts is built from these email-safe, table-based, inline-CSS
 * components so that ~20 different emails still look like they came from ONE
 * organisation.
 *
 * Design constraints (see the owner's MASTER PROMPT):
 *  - 600–640px centered container, fluid on mobile with side padding.
 *  - Email-safe: tables + inline CSS only, no JS, no hover-dependent info.
 *  - Dark-mode-safe: explicit backgrounds/colours so client dark-mode inversion
 *    cannot destroy contrast; sponsor logos sit on light tiles so white/dark
 *    artwork never disappears.
 *  - NO emoji anywhere. Icons are simple styled table cells / inline SVG.
 *  - One language per block or a deliberate bilingual hierarchy (English
 *    primary, short Hindi secondary line) — never mid-sentence mixing.
 */
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

/* ── Brand palette (LIGHT premium restyle — round 2) ────────────────────────
 * Owner feedback: emails read too dark / words hard to read. Dark navy is now
 * ONLY the bookends (header band + footer). The BODY is light and airy:
 *   - outer page background #EEF1F7 (soft blue-grey)
 *   - main card pure white #FFFFFF with a soft #E3E8F2 border + rounded corners
 *   - text navy ink #16223C (secondary #5A6B8C), hairlines #E3E8F2
 * Orange #FF7A29 stays the primary CTA (white text); gold #E8B23D for accents.
 * Success strips use a soft green tint (#EAF9F0 / #16A34A); urgency bands use
 * soft amber/red tints. The look targets Apple / Amazon / IPL receipt polish. */
export const COLORS = {
  outer: "#EEF1F7",       // soft page background behind the card
  header: "#16223C",      // deep navy header band (bookend)
  footerBand: "#16223C",  // deep navy footer band (bookend)
  surface: "#F5F7FB",     // light inner panel surface (info/status/steps)
  card: "#FFFFFF",         // primary body card surface — pure white
  ink: "#16223C",         // primary navy ink (high contrast on white)
  inkSoft: "#5A6B8C",      // secondary body text (readable navy-grey)
  inkFaint: "#8592AC",     // metadata / eyebrows
  // Footer sits on the navy band, so it keeps light text.
  footer: "#B7C1D2",       // readable footer body / metadata on navy
  footerLink: "#E2E8F2",   // footer links — brighter on navy
  gold: "#B8860B",         // premium gold that stays readable on white
  goldSoft: "#E8B23D",     // brighter gold for use ON the dark header band
  orange: "#FF7A29",       // primary accent / CTA
  green: "#16A34A",        // success text (readable on white)
  greenTint: "#EAF9F0",    // success strip background tint
  blue: "#2563EB",
  amber: "#B45309",        // amber text readable on white
  amberTint: "#FEF6E7",    // amber urgency tint
  red: "#DC2626",          // red text readable on white
  redTint: "#FDECEC",      // red urgency tint
  // Hairline border on the light theme.
  line: "#E3E8F2",
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";

/* ── Config / links ───────────────────────────────────────────────────────── */
// Where players click through. Prod default is the real domain; overridable
// for staging via SITE_URL (kept identical to the historical email.ts const).
export const SITE_URL =
  process.env.SITE_URL || "https://elite-user-experience.replit.app/bcpl-website";

// Absolute base for asset/redirect URLs referenced *inside* emails (logos,
// sponsor logo redirect route). Must be absolute — email clients cannot
// resolve relative URLs. Prod default is the real domain per the owner spec.
export const PUBLIC_API_BASE =
  process.env.PUBLIC_API_BASE?.replace(/\/+$/, "") ||
  process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") ||
  "https://bcplt20.com";

export const LOGO_URL = `${SITE_URL}/bcpl-assets/bcpl-logo-white.png`;

// Full website header logo — the SAME asset SiteHeader renders on the dark
// navy band (artifacts/bcpl-website/public/bcpl-assets/bcpl-logo-white.png, a
// transparent-background white wordmark). Owner explicitly asked for the full
// website logo in emails and to drop the "BCPL T20" font-text wordmark. The
// asset is served from PUBLIC_API_BASE + "/bcpl-assets/..." (same pattern the
// dynamic ball logo already used). Its native ratio is 1600x469, so at a 48px
// display height the width is ~164px.
export const SITE_LOGO_URL = `${PUBLIC_API_BASE}/bcpl-assets/bcpl-logo.png`;

// Official social URLs. SINGLE source of truth — never guess a missing one.
// (These are the verified URLs already present in the historical email.ts.)
// SOCIAL URL MISSING — flag: LinkedIn has no configured URL, so it is
// intentionally omitted below. Add `linkedin: "<official-url>"` here (and the
// matching PNG under bcpl-website/public/email-icons/linkedin.png) once a
// verified LinkedIn URL exists — never guess one.
export const SOCIAL: {
  instagram?: string;
  facebook?: string;
  x?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
} = {
  instagram: "https://www.instagram.com/bcpl.t20",
  facebook: "https://www.facebook.com/bhartiyacorporatepremierleague",
  x: "https://x.com/BCPLT20League",
  youtube: "https://www.youtube.com/@bcplt20league",
  website: "https://bcplt20.com",
};

// Absolute base for hosted email icon PNGs. Gmail/Outlook block inline
// data-URI SVGs (they render as blank squares), so social icons MUST be
// hosted raster images referenced by absolute https URLs. These deploy from
// artifacts/bcpl-website/public/email-icons → https://bcplt20.com/email-icons.
export const EMAIL_ICON_BASE = `${PUBLIC_API_BASE}/email-icons`;

export const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "info@bcplt20.com";
export const WEBSITE = "bcplt20.com";

// Legal entity — approved wording per the owner spec.
// LEGAL ENTITY COPY REVIEW REQUIRED: the GST invoice template (tplInvoice) uses
// "Kriparti Playing11 Pvt. Ltd." (as printed on the registered GSTIN record).
// That existing statutory wording is intentionally preserved there; the
// marketing footer uses the spec wording below.
export const LEGAL_ENTITY = "Kriparthi Playing 11 Pvt. Ltd.";
export const HASHTAG = "#OfficeSeStadiumTak";

/* ── Role formatting (SINGLE source of truth) ─────────────────────────────── */
// One shared player-facing role formatter used by email templates (and safe to
// reuse from any SMS/WhatsApp sender). Maps every historic role value — codes
// (bat/bowl/ar/wk, any case) and long forms ("Batsman", "wicketkeeper_batsman")
// — to the approved player-facing label. Never lets a raw internal code such as
// AR / WK / BAT / BOWL reach a player. Unknown values fall back to a title-cased
// version of the input (so it is at least readable), and empty/nullish input
// yields a neutral "Player".
const ROLE_DISPLAY: Record<string, string> = {
  bat: "Batsman", batsman: "Batsman",
  bowl: "Bowler", bowler: "Bowler",
  ar: "All-Rounder", allrounder: "All-Rounder", all_rounder: "All-Rounder", "all-rounder": "All-Rounder",
  wk: "Wicketkeeper", wicketkeeper: "Wicketkeeper", wicket_keeper: "Wicketkeeper", wicketkeeper_batsman: "Wicketkeeper",
};
function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}
export function formatRole(role: unknown): string {
  const raw = String(role ?? "").trim();
  if (!raw) return "Player";
  const key = raw.toLowerCase();
  return ROLE_DISPLAY[key] ?? titleCase(raw);
}

/* ── Small helpers ────────────────────────────────────────────────────────── */
/** Escape untrusted dynamic values before interpolation into email HTML. */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ── Icon system (hosted PNGs — Gmail/Outlook safe, no data-URI SVG) ───────── */
// Gmail and Outlook block inline data-URI SVG images (they render as blank
// squares), so hero/status icons are hosted @2x PNGs referenced by absolute
// https URLs. Each icon is pre-rendered per accent colour under
// public/email-icons/hero-<icon>-<color>.png. The color name is resolved from
// the hex the templates already pass in.
const COLOR_NAME: Record<string, string> = {
  [COLORS.gold]: "gold",
  [COLORS.green]: "green",
  [COLORS.blue]: "blue",
  [COLORS.amber]: "amber",
  [COLORS.red]: "red",
  [COLORS.orange]: "orange",
};
function heroIcon(name: string, hex: string): string {
  const col = COLOR_NAME[hex] ?? "gold";
  return `${EMAIL_ICON_BASE}/hero-${name}-${col}.png`;
}
export const ICONS = {
  check: (c = COLORS.green) => heroIcon("check", c),
  clock: (c = COLORS.gold) => heroIcon("clock", c),
  alert: (c = COLORS.red) => heroIcon("alert", c),
  video: (c = COLORS.blue) => heroIcon("video", c),
  doc: (c = COLORS.gold) => heroIcon("doc", c),
  pin: (c = COLORS.gold) => heroIcon("pin", c),
  trophy: (c = COLORS.gold) => heroIcon("trophy", c),
  ticket: (c = COLORS.green) => heroIcon("ticket", c),
  chart: (c = COLORS.gold) => heroIcon("chart", c),
  shield: (c = COLORS.gold) => heroIcon("shield", c),
};

/** A round medallion holding an icon — the premium hero glyph. Table-based so
 *  it stays vertically centered in Outlook (no line-height/flex reliance).
 *  The icon is displayed at an explicit 40px inside a 76px ring (spec §31:
 *  a reliable, clearly-sized hero graphic — never an empty circle). Source
 *  PNGs are 88px @2x so the glyph stays crisp on Retina. `alt` gives the hero
 *  graphic meaningful alternative text so the meaning survives image blocking. */
export function medallion(iconUrl: string, ring = COLORS.gold, alt = ""): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
      <tr><td width="76" height="76" align="center" valign="middle" style="width:76px;height:76px;border-radius:50%;background:rgba(232,178,61,0.10);border:2px solid ${ring};">
        <img src="${iconUrl}" width="40" height="40" alt="${esc(alt)}" style="display:block;width:40px;height:40px;border:0;" />
      </td></tr>
    </table>`;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
// Deep navy band (#16223C — the ONLY dark band at the top now) carrying the
// FULL website logo image (the same white wordmark SiteHeader shows on navy)
// and, below it, the identical "SEASON 5" gold pill the site uses. The old
// "BCPL T20" font-text wordmark is removed per owner feedback. A thin gold rule
// closes the band. Table-based (Outlook-safe) so everything stays centered.
export const Header = `
  <tr><td style="padding:28px 32px 22px;background:${COLORS.header};border-bottom:2px solid ${COLORS.goldSoft};text-align:center;">
    <img src="${SITE_LOGO_URL}" alt="BCPL — Bhartiya Corporate Premier League" width="164" height="48" style="width:auto;height:48px;max-height:48px;display:block;margin:0 auto 10px;border:0;" />
    <div style="margin-top:6px;">
      <span style="display:inline-block;background:rgba(232,178,61,0.14);border:1px solid rgba(232,178,61,0.45);border-radius:20px;padding:5px 16px;">
        <span style="font-family:${FONT};font-weight:800;font-size:10px;color:${COLORS.goldSoft};letter-spacing:2.5px;">SEASON 5 &nbsp;&middot;&nbsp; ${HASHTAG}</span>
      </span>
    </div>
  </td></tr>`;

/* ── Hero status ──────────────────────────────────────────────────────────── */
export function HeroStatus(opts: {
  iconUrl: string;
  ring?: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  /** Meaningful alt text for the hero graphic (spec §31). Falls back to the
   *  visible title so the meaning survives image blocking. */
  iconAlt?: string;
}): string {
  const ring = opts.ring ?? COLORS.gold;
  const titleColor = opts.titleColor ?? COLORS.gold;
  const iconAlt = opts.iconAlt ?? opts.title;
  return `
    <div style="text-align:center;margin-bottom:24px;">
      ${medallion(opts.iconUrl, ring, iconAlt)}
      <div class="bcpl-title" style="font-family:${FONT};font-size:24px;line-height:1.2;font-weight:800;color:${titleColor};letter-spacing:-0.3px;margin-top:14px;">${opts.title}</div>
      ${opts.subtitle ? `<div style="font-family:${FONT};font-size:13px;color:${COLORS.inkFaint};margin-top:6px;">${opts.subtitle}</div>` : ""}
    </div>`;
}

/* ── Greeting block ───────────────────────────────────────────────────────── */
export function Greeting(name: string, lines: string[]): string {
  const body = lines
    .map(
      (l) =>
        `<p style="font-family:${FONT};color:${COLORS.inkSoft};margin:0 0 8px;font-size:15px;line-height:1.6;">${l}</p>`,
    )
    .join("");
  return `
    <p style="font-family:${FONT};color:${COLORS.ink};margin:0 0 10px;font-size:15px;">Hi <strong>${esc(name)}</strong>,</p>
    ${body}`;
}

/** A standalone body paragraph (no greeting). */
export function Paragraph(text: string): string {
  return `<p style="font-family:${FONT};color:${COLORS.inkSoft};margin:0 0 14px;font-size:14px;line-height:1.6;">${text}</p>`;
}

/* ── Info card (accent-bordered surface) ──────────────────────────────────── */
export function InfoCard(opts: { accent?: string; children: string }): string {
  const accent = opts.accent ?? COLORS.orange;
  return `
    <div style="background:${COLORS.surface};border-radius:12px;padding:20px 22px;border-left:4px solid ${accent};margin-bottom:18px;">
      ${opts.children}
    </div>`;
}

/* ── Key/value table (long values wrap, never break layout) ───────────────── */
export function KeyValueTable(rows: Array<[string, string]>): string {
  const trs = rows
    .map(
      ([k, v], i) => `
      <tr>
        <td style="padding:12px 16px;${i ? `border-top:1px solid ${COLORS.line};` : ""}font-family:${FONT};font-size:12px;letter-spacing:.3px;color:${COLORS.inkFaint};width:42%;vertical-align:top;">${k}</td>
        <td style="padding:12px 16px;${i ? `border-top:1px solid ${COLORS.line};` : ""}font-family:${FONT};font-size:14px;color:${COLORS.ink};font-weight:700;word-break:break-word;vertical-align:top;">${v}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin-bottom:18px;background:${COLORS.surface};border:1px solid ${COLORS.line};border-radius:12px;overflow:hidden;">${trs}</table>`;
}

/* ── Numbered "what happens next" steps ───────────────────────────────────── */
export function NextSteps(steps: Array<{ title: string; body: string }>): string {
  const items = steps
    .map(
      (s, i) => `
      <tr>
        <td width="40" valign="top" style="padding:0 12px 14px 0;">
          <div style="width:32px;height:32px;line-height:32px;border-radius:8px;background:rgba(232,178,61,0.14);color:${COLORS.gold};font-family:${FONT};font-weight:800;font-size:13px;text-align:center;">${String(i + 1).padStart(2, "0")}</div>
        </td>
        <td valign="top" style="padding:0 0 14px 0;">
          <div style="font-family:${FONT};font-size:14px;color:${COLORS.ink};font-weight:700;margin-bottom:2px;">${s.title}</div>
          <div style="font-family:${FONT};font-size:13px;color:${COLORS.inkSoft};line-height:1.55;">${s.body}</div>
        </td>
      </tr>`,
    )
    .join("");
  return `
    <div style="background:${COLORS.surface};border:1px solid ${COLORS.line};border-radius:12px;padding:18px 20px;margin-bottom:18px;">
      <div style="font-family:${FONT};font-size:10px;color:${COLORS.inkFaint};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">What Happens Next</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
    </div>`;
}

/* ── Status card (label / value pairs, e.g. Under Review + window) ────────── */
export function StatusCard(rows: Array<{ label: string; value: string; color?: string }>): string {
  const cells = rows
    .map(
      (r) => `
      <td style="padding:14px 16px;font-family:${FONT};vertical-align:top;">
        <div style="font-size:10px;color:${COLORS.inkFaint};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;">${r.label}</div>
        <div style="font-size:15px;font-weight:800;color:${r.color ?? COLORS.ink};line-height:1.3;">${r.value}</div>
      </td>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${COLORS.surface};border:1px solid ${COLORS.line};border-radius:12px;margin-bottom:18px;">
      <tr>${cells}</tr>
    </table>`;
}

/* ── Vertical timeline (stylized steps with connecting spine) ─────────────── */
// Table-based: a left rail cell holds a coloured node; a faux "spine" is drawn
// with a right border on the rail cell so consecutive nodes look connected.
// No CSS animation / pseudo-elements (Outlook-safe) — the premium feel comes
// from the node dots + spine + generous spacing.
export function Timeline(
  steps: Array<{ title: string; body: string; state?: "done" | "active" | "todo" }>,
  heading = "What Happens Next",
): string {
  const rows = steps
    .map((s, i) => {
      const last = i === steps.length - 1;
      const state = s.state ?? (i === 0 ? "done" : "todo");
      const dot =
        state === "done" ? COLORS.green : state === "active" ? COLORS.goldSoft : COLORS.inkFaint;
      const fill =
        state === "todo"
          ? `background:${COLORS.card};border:2px solid ${dot};`
          : `background:${dot};border:2px solid ${dot};`;
      const num = String(i + 1).padStart(2, "0");
      return `
      <tr>
        <td width="34" valign="top" style="padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td width="34" height="34" align="center" valign="middle" style="width:34px;height:34px;">
              <div style="width:26px;height:26px;line-height:26px;border-radius:50%;${fill}text-align:center;">
                <span style="font-family:${FONT};font-size:11px;font-weight:800;color:${state === "todo" ? dot : "#FFFFFF"};">${num}</span>
              </div>
            </td>
          </tr></table>
          ${last ? "" : `<div style="width:2px;height:26px;background:${COLORS.line};margin:0 auto;"></div>`}
        </td>
        <td valign="top" style="padding:2px 0 ${last ? "0" : "16px"} 14px;">
          <div style="font-family:${FONT};font-size:14px;color:${COLORS.ink};font-weight:700;margin-bottom:3px;">${s.title}</div>
          <div style="font-family:${FONT};font-size:13px;color:${COLORS.inkSoft};line-height:1.55;">${s.body}</div>
        </td>
      </tr>`;
    })
    .join("");
  return `
    <div style="background:${COLORS.surface};border:1px solid ${COLORS.line};border-radius:12px;padding:20px 22px;margin-bottom:18px;">
      <div style="font-family:${FONT};font-size:10px;color:${COLORS.inkFaint};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">${heading}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </div>`;
}

/* ── Success banner (one-line status strip — green check for payments) ────── */
// A premium confirmation strip: a coloured left rail, a tick-mark chip, an
// uppercase "Confirmed" eyebrow, the title, and a supporting subtitle. Used as
// the single status strip spec calls for at the top of receipt-style emails.
export function SuccessBanner(title: string, subtitle: string, accent = COLORS.green): string {
  // Soft tint background matched to the accent (green success by default; gold
  // for milestone confirmations) so the strip reads as an airy, premium
  // "confirmed" badge on the white card rather than a dark block.
  const tint =
    accent === COLORS.gold || accent === COLORS.goldSoft
      ? "rgba(232,178,61,0.12)"
      : COLORS.greenTint;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${tint};border:1px solid ${accent};border-radius:12px;margin-bottom:18px;">
      <tr>
        <td width="6" style="background:${accent};border-radius:12px 0 0 12px;">&nbsp;</td>
        <td width="52" valign="middle" align="center" style="padding:16px 0 16px 16px;">
          <div style="width:34px;height:34px;line-height:34px;border-radius:50%;background:${accent};text-align:center;">
            <span style="font-family:${FONT};font-size:17px;font-weight:900;color:#FFFFFF;">&#10003;</span>
          </div>
        </td>
        <td style="padding:16px 20px 16px 12px;">
          <div style="font-family:${FONT};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${accent};font-weight:800;margin-bottom:4px;">Confirmed</div>
          <div style="font-family:${FONT};font-size:16px;color:${COLORS.ink};font-weight:800;line-height:1.3;">${title}</div>
          <div style="font-family:${FONT};font-size:13px;color:${COLORS.inkSoft};line-height:1.5;margin-top:4px;">${subtitle}</div>
        </td>
      </tr>
    </table>`;
}

/* ── Score-card panel (premium result panel — outcome-neutral, no scores) ─── */
// A framed "score card" surface with a gold header rule and a masked result
// row. It intentionally shows NO number/verdict — the value stays behind the
// dashboard sign-in. Purely a premium visual container.
export function ScoreCardPanel(opts: {
  title: string;
  caption: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}): string {
  const trs = opts.rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:12px 0;${i ? `border-top:1px solid ${COLORS.line};` : ""}font-family:${FONT};font-size:13px;color:${COLORS.inkSoft};">${r.label}</td>
        <td align="right" style="padding:12px 0;${i ? `border-top:1px solid ${COLORS.line};` : ""}font-family:${FONT};font-size:14px;font-weight:800;color:${r.color ?? COLORS.ink};">${r.value}</td>
      </tr>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${COLORS.surface};border:1px solid rgba(232,178,61,0.30);border-radius:14px;margin-bottom:18px;">
      <tr><td style="padding:18px 22px 0;border-bottom:2px solid rgba(232,178,61,0.30);">
        <div style="font-family:${FONT};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.gold};font-weight:800;">${opts.title}</div>
        <div style="font-family:${FONT};font-size:12px;color:${COLORS.inkFaint};margin:4px 0 14px;">${opts.caption}</div>
      </td></tr>
      <tr><td style="padding:6px 22px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${trs}</table>
      </td></tr>
    </table>`;
}

/* ── Primary CTA (bulletproof button — Gmail/Apple Mail/Outlook) ──────────── */
export function PrimaryCTA(text: string, href: string, color = COLORS.orange): string {
  // Bulletproof button: MSO VML round-rect fallback for Outlook (which drops
  // border-radius + padding on anchors), a padded anchor everywhere else.
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
      <tr><td align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:50px;v-text-anchor:middle;width:280px;" arcsize="20%" strokecolor="${color}" fillcolor="${color}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:${FONT};font-size:15px;font-weight:800;letter-spacing:.4px;">${text}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-family:${FONT};font-weight:800;font-size:15px;letter-spacing:.4px;padding:15px 36px;border-radius:10px;mso-padding-alt:0;">${text}</a>
        <!--<![endif]-->
      </td></tr>
    </table>`;
}

/* ── Note box (soft advisory, one accent) ─────────────────────────────────── */
export function NoteBox(text: string, accent = COLORS.line): string {
  return `
    <div style="background:${COLORS.surface};border:1px solid ${accent};border-radius:10px;padding:14px 16px;margin-bottom:18px;">
      <p style="font-family:${FONT};font-size:13px;color:${COLORS.inkSoft};margin:0;line-height:1.6;">${text}</p>
    </div>`;
}

/* ── Step-progress bar (Register → Video → Result → Phase 2 → Trials) ─────── */
// Table-based horizontal stepper. The five lifecycle stages render as numbered
// nodes joined by a thin rule; the `current` stage (0-based index) is
// highlighted in orange, everything before it reads as done (gold), everything
// after as upcoming (muted). Used across templates to give players a single
// consistent "where am I in the journey" map. No emoji — pure styled cells.
const STEP_LABELS = ["Register", "Video", "Result", "Phase 2", "Trials"] as const;
export function StepProgress(current: number): string {
  const cells = STEP_LABELS.map((label, i) => {
    const state = i < current ? "done" : i === current ? "active" : "todo";
    const nodeBg =
      state === "active" ? COLORS.orange : state === "done" ? COLORS.goldSoft : "#FFFFFF";
    const nodeBorder =
      state === "active" ? COLORS.orange : state === "done" ? COLORS.goldSoft : COLORS.inkFaint;
    const numColor = state === "todo" ? COLORS.inkFaint : "#FFFFFF";
    const labelColor =
      state === "active" ? COLORS.orange : state === "done" ? COLORS.gold : COLORS.inkFaint;
    const num = String(i + 1);
    const connector =
      i < STEP_LABELS.length - 1
        ? `<td width="18" valign="middle" style="padding:0 1px 18px;"><div style="height:2px;background:${
            i < current ? COLORS.goldSoft : COLORS.line
          };line-height:2px;font-size:0;">&nbsp;</div></td>`
        : "";
    return `
      <td align="center" valign="top" style="padding:0;">
        <div style="width:26px;height:26px;line-height:26px;border-radius:50%;background:${nodeBg};border:2px solid ${nodeBorder};margin:0 auto;text-align:center;">
          <span style="font-family:${FONT};font-size:11px;font-weight:800;color:${numColor};">${num}</span>
        </div>
        <div style="font-family:${FONT};font-size:9px;letter-spacing:.5px;text-transform:uppercase;color:${labelColor};font-weight:700;margin-top:6px;">${label}</div>
      </td>${connector}`;
  }).join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${COLORS.surface};border:1px solid ${COLORS.line};border-radius:12px;margin-bottom:18px;">
      <tr><td style="padding:18px 16px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${cells}</tr></table>
      </td></tr>
    </table>`;
}

/* ── Ticket block (receipt-style stub — amount, order id, GST breakdown) ───── */
// A premium boarding-pass / ticket-stub surface for payment receipts. A gold
// header strip carries the title; the amount sits large; optional detail rows
// (order id, GST breakdown as passed in) render as label/value pairs. A dashed
// separator + notch styling gives the "torn ticket" feel without images.
export function TicketBlock(opts: {
  title: string;
  amount: string;
  rows?: Array<[string, string]>;
  accent?: string;
}): string {
  // Amount reads in navy ink for maximum readability (spec: "big navy amount");
  // the accent tints only the gold header label + total emphasis.
  const rows = (opts.rows ?? [])
    .map(
      ([k, v], i) => `
      <tr>
        <td style="padding:9px 0;${i ? `border-top:1px dashed ${COLORS.line};` : ""}font-family:${FONT};font-size:12px;color:${COLORS.inkFaint};">${k}</td>
        <td align="right" style="padding:9px 0;${i ? `border-top:1px dashed ${COLORS.line};` : ""}font-family:${FONT};font-size:13px;font-weight:700;color:${COLORS.ink};word-break:break-word;">${v}</td>
      </tr>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#FFFFFF;border:1px solid ${COLORS.line};border-radius:14px;margin-bottom:18px;overflow:hidden;">
      <tr><td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:14px 22px;background:rgba(232,178,61,0.10);border-bottom:2px dashed ${COLORS.line};">
            <div style="font-family:${FONT};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.gold};font-weight:800;">${opts.title}</div>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:18px 22px 6px;text-align:center;">
        <div style="font-family:${FONT};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${COLORS.inkFaint};margin-bottom:4px;">Amount Paid</div>
        <div style="font-family:${FONT};font-size:32px;line-height:1.1;font-weight:900;color:${COLORS.ink};letter-spacing:-.5px;">${opts.amount}</div>
      </td></tr>
      ${rows ? `<tr><td style="padding:8px 22px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table></td></tr>` : ""}
    </table>`;
}

/* ── Countdown band (urgency strip for reminders — "5 din baaki" style) ────── */
export function CountdownBand(opts: {
  big: string;
  caption: string;
  accent?: string;
}): string {
  const accent = opts.accent ?? COLORS.amber;
  // Soft urgency tint keyed to the accent (red = danger, amber = warning) so
  // the band reads warm and premium on white, never a heavy solid block.
  const tint = accent === COLORS.red ? COLORS.redTint : COLORS.amberTint;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${tint};border:1px solid ${accent};border-radius:12px;margin-bottom:18px;">
      <tr>
        <td width="6" style="background:${accent};">&nbsp;</td>
        <td style="padding:16px 20px;text-align:center;">
          <div style="font-family:${FONT};font-size:26px;line-height:1.1;font-weight:900;color:${accent};letter-spacing:-.3px;">${opts.big}</div>
          <div style="font-family:${FONT};font-size:13px;color:${COLORS.inkSoft};margin-top:5px;line-height:1.5;">${opts.caption}</div>
        </td>
        <td width="6" style="background:${accent};">&nbsp;</td>
      </tr>
    </table>`;
}

/* ── Venue card (date / time / address rows for the trial venue email) ─────── */
export function VenueCard(rows: Array<{ label: string; value: string; color?: string }>): string {
  const trs = rows
    .map(
      (r, i) => `
      <tr>
        <td width="120" valign="top" style="padding:12px 14px;${i ? `border-top:1px solid ${COLORS.line};` : ""}font-family:${FONT};font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:${COLORS.inkFaint};font-weight:700;">${r.label}</td>
        <td valign="top" style="padding:12px 14px;${i ? `border-top:1px solid ${COLORS.line};` : ""}font-family:${FONT};font-size:14px;color:${r.color ?? COLORS.ink};font-weight:700;line-height:1.5;word-break:break-word;">${r.value}</td>
      </tr>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${COLORS.surface};border:1px solid rgba(232,178,61,0.30);border-radius:14px;margin-bottom:18px;overflow:hidden;">
      <tr><td style="padding:14px 22px;background:rgba(232,178,61,0.12);border-bottom:2px solid rgba(232,178,61,0.30);">
        <div style="font-family:${FONT};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.gold};font-weight:800;">Trial Venue &amp; Schedule</div>
      </td></tr>
      <tr><td style="padding:4px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${trs}</table>
      </td></tr>
    </table>`;
}

/* ── Sponsor strip (dynamic) ──────────────────────────────────────────────── */
type SponsorRecord = {
  name?: unknown;
  logo?: unknown;
  website?: unknown;
  status?: unknown;
  visibility?: unknown;
};

const BUCKET_URL_RE =
  /^https?:\/\/[a-z0-9.-]+\.s3[.-][a-z0-9-]+\.amazonaws\.com\/(cms\/[A-Za-z0-9._-]+)$/i;

/** Return a stable, absolute, email-safe logo URL.
 *  Private-bucket URLs are rewritten to the on-demand presign redirect route
 *  (GET /api/sponsors/logo?key=cms/<file>); external URLs pass through. */
export function emailLogoUrl(logo: unknown): string {
  if (typeof logo !== "string" || logo.trim() === "") return "";
  const url = logo.trim();
  const m = BUCKET_URL_RE.exec(url);
  if (m) return `${PUBLIC_API_BASE}/api/sponsors/logo?key=${encodeURIComponent(m[1])}`;
  if (/^https?:\/\//i.test(url)) return url; // external absolute URL
  return "";
}

/** Email-visible = active AND visibility says "All Platforms" or contains "Email". */
export function isEmailVisible(s: SponsorRecord): boolean {
  if (!s || s.status !== "active") return false;
  const vis = typeof s.visibility === "string" ? s.visibility.toLowerCase() : "";
  return vis.includes("all platform") || vis.includes("email") || vis === "all";
}

/** Build the sponsor strip HTML from a list of eligible records. Returns "" if
 *  none, so the strip is omitted entirely. Pure — never touches the DB. */
export function renderSponsorStrip(list: SponsorRecord[]): string {
  const eligible = (Array.isArray(list) ? list : [])
    .filter((s) => s && typeof s.name === "string" && (s.name as string).trim() !== "" && isEmailVisible(s))
    .map((s) => ({
      name: String(s.name).trim(),
      logoUrl: emailLogoUrl(s.logo),
      website: typeof s.website === "string" && /^https?:\/\//i.test(s.website) ? s.website : "",
    }))
    .filter((s) => s.logoUrl !== "");

  if (eligible.length === 0) return "";

  const tiles = eligible
    .map((s) => {
      const img = `<img src="${s.logoUrl}" alt="${esc(s.name)}" width="120" style="display:block;max-width:120px;max-height:44px;width:auto;height:auto;margin:0 auto;object-fit:contain;" />`;
      // Light tile so white OR dark logos stay visible on a dark email body.
      const tile = `<div style="background:#FFFFFF;border-radius:8px;padding:12px 14px;text-align:center;">${img}</div>`;
      const cell = s.website
        ? `<a href="${s.website}" target="_blank" rel="noopener" style="text-decoration:none;">${tile}</a>`
        : tile;
      // inline-block cells reflow to multiple rows on narrow clients (and the
      // .bcpl-sponsor media rule forces clean stacking where media queries run)
      // so a long partner list never overflows horizontally (spec §33/§36).
      return `<td class="bcpl-sponsor" width="150" valign="middle" style="padding:6px 8px;display:inline-block;">${cell}</td>`;
    })
    .join("");

  return `
    <tr><td style="padding:22px 32px 4px;background:${COLORS.footerBand};text-align:center;">
      <div style="font-family:${FONT};font-size:11px;color:${COLORS.footer};letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Official Partners</div>
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
        <tr>${tiles}</tr>
      </table>
    </td></tr>`;
}

/** Placeholder token injected by wrap(); hydrated at send time. */
export const SPONSOR_TOKEN = "<!--BCPL_SPONSOR_STRIP-->";

/** Fetch eligible sponsors from site_settings and render the strip.
 *  MUST NEVER THROW — any failure yields an empty strip (no strip). */
export async function fetchSponsorStrip(): Promise<string> {
  try {
    const rows = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, "sponsors"))
      .limit(1);
    const raw = rows[0]?.value;
    const list = Array.isArray(raw) ? (raw as SponsorRecord[]) : [];
    return renderSponsorStrip(list);
  } catch (e) {
    console.error("[EMAIL] sponsor strip fetch failed — omitting strip", e);
    return "";
  }
}

/** Replace the sponsor placeholder in composed HTML with the live strip.
 *  Called just before the provider send. Never throws. */
export async function hydrateSponsors(html: string): Promise<string> {
  if (!html.includes(SPONSOR_TOKEN)) return html;
  const strip = await fetchSponsorStrip();
  return html.split(SPONSOR_TOKEN).join(strip);
}

/* ── Social bar (hosted PNG icons — Gmail/Outlook safe, no data-URI SVG) ──── */
// Icons are 72x72 PNGs rendered @2x for a crisp 36px display. Gmail and
// Outlook block inline data-URI SVG images (they showed blank squares), so
// every social icon is a hosted absolute-URL raster asset with width/height
// attrs + alt text and a clickable link.
export function SocialBar(): string {
  type Kind = "instagram" | "facebook" | "x" | "youtube" | "linkedin" | "website";
  const items: Array<{ url: string | undefined; kind: Kind; label: string }> = [
    { url: SOCIAL.instagram, kind: "instagram", label: "Instagram" },
    { url: SOCIAL.facebook, kind: "facebook", label: "Facebook" },
    { url: SOCIAL.x, kind: "x", label: "X" },
    { url: SOCIAL.youtube, kind: "youtube", label: "YouTube" },
    // SOCIAL URL MISSING — flag: LinkedIn has no configured URL; the cell is
    // omitted below rather than guessing a URL. Populate SOCIAL.linkedin to
    // enable it (linkedin.png must exist under public/email-icons/).
    { url: SOCIAL.linkedin, kind: "linkedin", label: "LinkedIn" },
    { url: SOCIAL.website, kind: "website", label: "Website" },
  ];
  const cells = items
    .filter((it) => Boolean(it.url)) // omit any platform without a verified URL
    .map(
      (it) => `
        <td style="padding:0 9px;">
          <a href="${it.url}" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none;">
            <img src="${EMAIL_ICON_BASE}/${it.kind}.png" width="30" height="30" alt="${it.label}" style="display:block;width:30px;height:30px;border:0;outline:none;" />
          </a>
        </td>`,
    )
    .join("");
  return `
    <tr><td style="padding:18px 32px 6px;background:${COLORS.footerBand};text-align:center;">
      <div style="font-family:${FONT};font-size:11px;color:${COLORS.footer};letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Follow BCPL</div>
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;"><tr>${cells}</tr></table>
    </td></tr>`;
}

/* ── Legal footer ─────────────────────────────────────────────────────────── */
// Responsive: the contact row is two inline-block cells that stack cleanly on
// narrow clients (the .bcpl-stack media rule below forces full-width stacking;
// inline-block already wraps gracefully where media queries are unsupported).
export const LegalFooter = `
  <tr><td style="padding:20px 32px 28px;background:${COLORS.footerBand};border-top:1px solid rgba(255,255,255,0.12);text-align:center;">
    <div style="font-family:${FONT};font-size:14px;color:${COLORS.footerLink};font-weight:800;letter-spacing:.5px;">BCPL T20</div>
    <div style="font-family:${FONT};font-size:13px;color:${COLORS.footer};margin-top:4px;">Bhartiya Corporate Premier League</div>
    <div style="font-family:${FONT};font-size:13px;color:${COLORS.footer};margin-top:8px;line-height:1.7;">An initiative of ${LEGAL_ENTITY}</div>
    <div style="margin-top:12px;line-height:1;">
      <span class="bcpl-stack" style="display:inline-block;padding:4px 12px;">
        <a href="mailto:${FROM_EMAIL}" style="font-family:${FONT};font-size:14px;color:${COLORS.footerLink};text-decoration:underline;">${FROM_EMAIL}</a>
      </span>
      <span class="bcpl-stack" style="display:inline-block;padding:4px 12px;">
        <a href="https://${WEBSITE}" style="font-family:${FONT};font-size:14px;color:${COLORS.footerLink};text-decoration:underline;">${WEBSITE}</a>
      </span>
    </div>
    <div style="font-family:${FONT};font-size:13px;color:${COLORS.footer};margin-top:14px;line-height:1.6;">
      This is a transactional message related to your BCPL Season 5 registration.
    </div>
    <div style="font-family:${FONT};font-size:12px;color:${COLORS.footer};margin-top:10px;line-height:1.6;">
      Manage how we reach you from your
      <a href="${SITE_URL}/register/result" style="color:${COLORS.footerLink};text-decoration:underline;">notification preferences</a>,
      or reply <strong>STOP</strong> to opt out of reminders.
    </div>
  </td></tr>`;

/* ── Email shell (outer wrapper + body + footer chrome) ───────────────────── */
export function EmailShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<style>
  @media only screen and (max-width:480px){
    .bcpl-pad{padding-left:20px !important;padding-right:20px !important;}
    .bcpl-stack{display:block !important;width:100% !important;padding:4px 0 !important;}
    .bcpl-sponsor{display:inline-block !important;width:46% !important;}
    .bcpl-title{font-size:21px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.outer};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">BCPL T20 Season 5 — ${HASHTAG}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.outer};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${COLORS.card};border-radius:14px;overflow:hidden;border:1px solid ${COLORS.line};">
        ${Header}
        <tr><td class="bcpl-pad" style="padding:28px 32px;background:${COLORS.card};">
          ${body}
        </td></tr>
        ${SPONSOR_TOKEN}
        ${SocialBar()}
        ${LegalFooter}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

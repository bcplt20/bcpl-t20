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

/* ── Brand palette ────────────────────────────────────────────────────────── */
export const COLORS = {
  outer: "#040C18",       // premium dark outer background
  surface: "#0A1727",     // slightly lighter content surface
  card: "#0E1E33",        // card surface (a touch lighter for separation)
  ink: "#F4F1EC",         // high-contrast body text
  inkSoft: "#C4CDDA",     // secondary but still readable (never ultra-low opacity)
  inkFaint: "#8A97A8",    // metadata — kept above WCAG-ish contrast on dark
  gold: "#E8B23D",        // premium emphasis
  orange: "#FF7A29",      // primary accent / CTA
  green: "#22C55E",
  blue: "#3B82F6",
  amber: "#F59E0B",
  red: "#EF4444",
  line: "rgba(255,255,255,0.10)",
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

// Official social URLs. SINGLE source of truth — never guess a missing one.
// (These are the verified URLs already present in the historical email.ts.)
export const SOCIAL = {
  instagram: "https://www.instagram.com/bcpl.t20",
  facebook: "https://www.facebook.com/bhartiyacorporatepremierleague",
  x: "https://x.com/BCPLT20League",
  youtube: "https://www.youtube.com/@bcplt20league",
};

export const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "info@bcplt20.com";
export const WEBSITE = "bcplt20.com";

// Legal entity — approved wording per the owner spec.
// LEGAL ENTITY COPY REVIEW REQUIRED: the GST invoice template (tplInvoice) uses
// "Kriparti Playing11 Pvt. Ltd." (as printed on the registered GSTIN record).
// That existing statutory wording is intentionally preserved there; the
// marketing footer uses the spec wording below.
export const LEGAL_ENTITY = "Kriparthi Playing 11 Pvt. Ltd.";
export const HASHTAG = "#OfficeSeStadiumTak";

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

/* ── Icon system (inline SVG data-URIs — email-safe, no emoji) ─────────────── */
// Simple monochrome glyphs rendered via inline SVG so they render identically
// across clients. Colour is passed in; size fixed by the caller's <img>.
function svg(path: string, color: string): string {
  const raw =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(raw);
}
export const ICONS = {
  check: (c = COLORS.green) => svg(`<polyline points="20 6 9 17 4 12"/>`, c),
  clock: (c = COLORS.gold) => svg(`<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>`, c),
  alert: (c = COLORS.red) => svg(`<path d="M12 2 1 21h22L12 2z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17"/>`, c),
  video: (c = COLORS.blue) => svg(`<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3"/>`, c),
  doc: (c = COLORS.gold) => svg(`<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/>`, c),
  pin: (c = COLORS.gold) => svg(`<path d="M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>`, c),
  calendar: (c = COLORS.gold) => svg(`<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>`, c),
  trophy: (c = COLORS.gold) => svg(`<path d="M8 3h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5a2 2 0 0 0 0 4h3M16 5h3a2 2 0 0 1 0 4h-3M10 15h4v4h-4z"/><line x1="8" y1="21" x2="16" y2="21"/>`, c),
  ticket: (c = COLORS.green) => svg(`<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/>`, c),
  chart: (c = COLORS.gold) => svg(`<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="12" width="3" height="6"/><rect x="11" y="8" width="3" height="10"/><rect x="16" y="4" width="3" height="14"/>`, c),
  shield: (c = COLORS.gold) => svg(`<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>`, c),
};

/** A round medallion holding an icon — the premium hero glyph. */
export function medallion(iconUrl: string, ring = COLORS.gold): string {
  return `<img src="${iconUrl}" width="34" height="34" alt="" style="display:block;" />`
    .replace(
      /^/,
      `<div style="display:inline-block;width:72px;height:72px;line-height:72px;border-radius:50%;` +
        `background:rgba(232,178,61,0.10);border:2px solid ${ring};text-align:center;">` +
        `<span style="display:inline-block;vertical-align:middle;line-height:1;">`,
    ) + `</span></div>`;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
export const Header = `
  <tr><td style="padding:28px 32px 20px;background:${COLORS.outer};border-bottom:3px solid ${COLORS.orange};text-align:center;">
    <img src="${LOGO_URL}" alt="BCPL T20" height="50" style="height:50px;width:auto;display:block;margin:0 auto 10px;" />
    <div style="display:inline-block;background:rgba(232,178,61,0.12);border:1px solid rgba(232,178,61,0.40);border-radius:20px;padding:5px 16px;">
      <span style="font-family:${FONT};font-weight:800;font-size:10px;color:${COLORS.gold};letter-spacing:2px;">SEASON 5 &nbsp;&middot;&nbsp; ${HASHTAG}</span>
    </div>
  </td></tr>`;

/* ── Hero status ──────────────────────────────────────────────────────────── */
export function HeroStatus(opts: {
  iconUrl: string;
  ring?: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
}): string {
  const ring = opts.ring ?? COLORS.gold;
  const titleColor = opts.titleColor ?? COLORS.gold;
  return `
    <div style="text-align:center;margin-bottom:24px;">
      ${medallion(opts.iconUrl, ring)}
      <div style="font-family:${FONT};font-size:24px;line-height:1.2;font-weight:800;color:${titleColor};letter-spacing:-0.3px;margin-top:14px;">${opts.title}</div>
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
      <tr${i % 2 ? ` style="background:rgba(255,255,255,0.03);"` : ""}>
        <td style="padding:11px 12px;font-family:${FONT};font-size:12px;color:${COLORS.inkFaint};width:42%;vertical-align:top;">${k}</td>
        <td style="padding:11px 12px;font-family:${FONT};font-size:14px;color:${COLORS.ink};font-weight:700;word-break:break-word;">${v}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;background:${COLORS.surface};border-radius:12px;overflow:hidden;">${trs}</table>`;
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

/* ── Primary CTA ──────────────────────────────────────────────────────────── */
export function PrimaryCTA(text: string, href: string, color = COLORS.orange): string {
  // Bulletproof-ish button: padded anchor centered in a table cell.
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;">
      <tr><td align="center">
        <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-family:${FONT};font-weight:800;font-size:15px;letter-spacing:.4px;padding:15px 34px;border-radius:10px;mso-padding-alt:15px 34px;">${text}</a>
      </td></tr>
    </table>`;
}

/* ── Note box (soft advisory, one accent) ─────────────────────────────────── */
export function NoteBox(text: string, accent = COLORS.line): string {
  return `
    <div style="background:rgba(255,255,255,0.03);border:1px solid ${accent};border-radius:10px;padding:14px 16px;margin-bottom:18px;">
      <p style="font-family:${FONT};font-size:13px;color:${COLORS.inkSoft};margin:0;line-height:1.6;">${text}</p>
    </div>`;
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
      return `<td width="150" valign="middle" style="padding:6px 8px;">${cell}</td>`;
    })
    .join("");

  return `
    <tr><td style="padding:22px 32px 4px;background:${COLORS.outer};text-align:center;">
      <div style="font-family:${FONT};font-size:10px;color:${COLORS.inkFaint};letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Official Partners</div>
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

/* ── Social bar (icons only, no wrapping handles) ─────────────────────────── */
function socialIcon(kind: "instagram" | "facebook" | "x" | "youtube"): string {
  const c = COLORS.inkSoft;
  const paths: Record<string, string> = {
    instagram: `<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/>`,
    facebook: `<path d="M14 8h2V5h-2a3 3 0 0 0-3 3v2H9v3h2v6h3v-6h2l1-3h-3V8a1 1 0 0 1 1-1z"/>`,
    x: `<path d="M4 4l16 16M20 4L4 20"/>`,
    youtube: `<rect x="3" y="6" width="18" height="12" rx="3"/><polygon points="11 9 16 12 11 15" fill="${c}" stroke="none"/>`,
  };
  return svg(paths[kind], c);
}

export function SocialBar(): string {
  const items: Array<{ url: string | undefined; kind: "instagram" | "facebook" | "x" | "youtube"; label: string }> = [
    { url: SOCIAL.instagram, kind: "instagram", label: "Instagram" },
    { url: SOCIAL.facebook, kind: "facebook", label: "Facebook" },
    { url: SOCIAL.x, kind: "x", label: "X" },
    { url: SOCIAL.youtube, kind: "youtube", label: "YouTube" },
  ];
  const cells = items
    .map((it) => {
      if (!it.url) {
        // SOCIAL URL MISSING — flag: omit platform, never guess a URL.
        return "";
      }
      return `
        <td style="padding:0 8px;">
          <a href="${it.url}" target="_blank" rel="noopener" style="display:inline-block;width:38px;height:38px;line-height:38px;text-align:center;background:rgba(255,255,255,0.06);border:1px solid ${COLORS.line};border-radius:50%;text-decoration:none;">
            <img src="${socialIcon(it.kind)}" width="18" height="18" alt="${it.label}" style="display:inline-block;vertical-align:middle;" />
          </a>
        </td>`;
    })
    .join("");
  return `
    <tr><td style="padding:18px 32px 6px;background:${COLORS.outer};text-align:center;">
      <div style="font-family:${FONT};font-size:10px;color:${COLORS.inkFaint};letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Follow BCPL</div>
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;"><tr>${cells}</tr></table>
    </td></tr>`;
}

/* ── Legal footer ─────────────────────────────────────────────────────────── */
export const LegalFooter = `
  <tr><td style="padding:18px 32px 26px;background:${COLORS.outer};border-top:1px solid ${COLORS.line};text-align:center;">
    <div style="font-family:${FONT};font-size:13px;color:${COLORS.ink};font-weight:800;letter-spacing:.5px;">BCPL T20</div>
    <div style="font-family:${FONT};font-size:11px;color:${COLORS.inkSoft};margin-top:3px;">Bhartiya Corporate Premier League</div>
    <div style="font-family:${FONT};font-size:11px;color:${COLORS.inkFaint};margin-top:8px;line-height:1.7;">
      An initiative of ${LEGAL_ENTITY}<br/>
      <a href="mailto:${FROM_EMAIL}" style="color:${COLORS.inkFaint};text-decoration:none;">${FROM_EMAIL}</a>
      &nbsp;&middot;&nbsp;
      <a href="https://${WEBSITE}" style="color:${COLORS.inkFaint};text-decoration:none;">${WEBSITE}</a>
    </div>
    <div style="font-family:${FONT};font-size:10px;color:${COLORS.inkFaint};margin-top:10px;line-height:1.6;">
      This is a transactional message related to your BCPL Season 5 registration.
    </div>
  </td></tr>`;

/* ── Email shell (outer wrapper + body + footer chrome) ───────────────────── */
export function EmailShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark light"/>
<meta name="supported-color-schemes" content="dark light"/>
</head>
<body style="margin:0;padding:0;background:${COLORS.outer};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">BCPL T20 Season 5 — ${HASHTAG}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.outer};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${COLORS.card};border-radius:14px;overflow:hidden;border:1px solid ${COLORS.line};">
        ${Header}
        <tr><td style="padding:28px 32px;background:${COLORS.card};">
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

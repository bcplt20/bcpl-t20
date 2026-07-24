/**
 * SEO routes + server-side meta injection.
 *
 * API (mounted at /api/seo):
 *   GET  /meta            – public: merged per-page meta + GSC code + team slugs
 *   PUT  /admin/page      – admin: save (or reset) one page's meta override
 *   PUT  /admin/gsc       – admin: save/clear the Google site-verification code
 *
 * Exported handlers wired in app.ts (root level, proxied via nginx @app):
 *   sitemapHandler        – GET /sitemap.xml   (real public routes + team pages)
 *   robotsHandler         – GET /robots.txt    (fallback; static file usually wins)
 *   seoHtmlMiddleware     – serves the built SPA index.html with per-path
 *                           <title>/<meta>/OG/canonical/GSC tags injected, so
 *                           view-source and WhatsApp/Facebook share previews
 *                           show the values saved in the admin SEO section.
 *
 * Storage: site_settings key-value rows (table ensured by routes/settings.ts):
 *   seo_pages – { [path]: { title, description, ogImage?, updatedAt } }
 *   seo_gsc   – { code }
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { db } from "@workspace/db";
import { siteSettingsTable, teamsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { logger } from "../lib/logger";
import { z } from "zod";

const router = Router();

export const SITE_ORIGIN = (process.env.SITE_ORIGIN ?? "https://bcplt20.com").replace(/\/$/, "");

/* ─── Default meta for every public page (single source of truth) ─────────
   Paths must match the wouter routes in artifacts/bcpl-website/src/App.tsx. */
export interface PageMetaDefault {
  path: string;
  label: string;
  title: string;
  description: string;
}

const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/bcpl-assets/bcpl-logo-color.jpg`;

const PAGE_DEFAULTS: PageMetaDefault[] = [
  { path: "/",              label: "Home",            title: "BCPL T20 — Bhartiya Corporate Premier League | Season 5", description: "India's corporate T20 cricket league for working professionals. 10 franchise teams, ₹15 crore+ prize pool. Register at ₹299. #OfficeSeStadiumTak" },
  { path: "/register",      label: "Registration",    title: "Register for BCPL T20 Season 5 | Phase 1 at ₹299", description: "Sign up for BCPL T20 Season 5 in 3 easy steps: register, upload your cricket video and compete for selection. India's corporate cricket league." },
  { path: "/teams",         label: "Teams",           title: "BCPL T20 Teams — Franchise Squads | Season 5", description: "Explore all BCPL T20 franchise teams, squads, captains and season stats. Follow your city's team in India's corporate cricket league." },
  { path: "/players",       label: "Players",         title: "BCPL T20 Players — Season 5 Squad Database", description: "Browse every player in BCPL T20 Season 5 — search by name and filter by franchise team and role across all 10 city squads." },
  { path: "/trust",         label: "Selection Process", title: "How BCPL Selection Works | Trust & Transparency", description: "BCPL T20 selection explained: video evaluation, physical trials, player score out of 100, city and role rankings, fees, eligibility and the appeal process." },
  { path: "/match-center",  label: "Match Center",    title: "BCPL T20 Live Scores & Matches | Season 5", description: "Live scores, results and highlights from BCPL T20 Season 5 — India's corporate T20 cricket league for working professionals." },
  { path: "/schedule",      label: "Schedule",        title: "BCPL T20 Match Schedule | Season 5 Fixtures", description: "Full BCPL T20 Season 5 fixture list — dates, venues and match timings for every franchise team." },
  { path: "/points-table",  label: "Points Table",    title: "BCPL T20 Points Table | Season 5 Standings", description: "Latest BCPL T20 Season 5 standings — wins, losses, NRR and playoff race, updated after every match." },
  { path: "/sponsors",      label: "Sponsors",        title: "BCPL T20 Sponsors & Partners | Season 5", description: "Partner with BCPL T20 and reach cricket-loving working professionals across India. Title, associate and official partner options." },
  { path: "/photos",        label: "Photos",          title: "BCPL T20 Photo Gallery — Auction & Team Shoots", description: "Photos from the BCPL Season 4 player auction and the official commercial shoot — teams, jerseys and league moments." },
  { path: "/videos",        label: "Videos",          title: "BCPL T20 Videos — Auction & Highlights", description: "Watch the full BCPL Season 4 auction stream and official clips from the auction floor — India's corporate cricket league." },
  { path: "/about",         label: "About",           title: "About BCPL T20 — Bhartiya Corporate Premier League", description: "The story of BCPL T20: India's premier corporate cricket league for working professionals. Seasons, prize money, cities and the road to Season 5." },
  { path: "/faq",           label: "FAQ",             title: "BCPL T20 FAQ — Registration, Fees & Rules", description: "Answers to common BCPL T20 questions: ₹299 Phase 1 registration, trial videos, Phase 2, trial cities, eligibility and refunds." },
  { path: "/contact",       label: "Contact",         title: "Contact BCPL T20 | Support & Queries", description: "Get in touch with the BCPL T20 team for registration help, sponsorships and media queries." },
  { path: "/eligibility",   label: "Eligibility",     title: "BCPL T20 Eligibility Criteria | Who Can Play", description: "Check who can register for BCPL T20 Season 5 — age, employment and documentation requirements for India's corporate cricket league." },
  { path: "/code-of-conduct", label: "Code of Conduct", title: "BCPL T20 Code of Conduct", description: "Player and team conduct rules for BCPL T20 — fair play, discipline and on-ground behaviour standards." },
  { path: "/cricket-rulebook", label: "Rulebook",     title: "BCPL T20 Cricket Rulebook | Playing Conditions", description: "Official BCPL T20 playing conditions — match format, overs, powerplay, tie-breakers and umpiring rules." },
  { path: "/trial-rules",   label: "Physical Trial Rules", title: "Phase 2 Physical Trial Rules | BCPL T20", description: "How the BCPL physical trial works — the six-attempt rule, standardised assessment, 100-point scoring, blind evaluation, results and Auction Pool meaning." },
  { path: "/privacy",       label: "Privacy Policy",  title: "Privacy Policy | BCPL T20", description: "How BCPL T20 collects, uses and protects your personal information." },
  { path: "/refunds",       label: "Refund Policy",   title: "Refund Policy | BCPL T20", description: "BCPL T20 registration fee refund rules for Phase 1 and Phase 2." },
  { path: "/terms",         label: "Terms & Conditions", title: "Terms & Conditions | BCPL T20", description: "Terms and conditions for participating in BCPL T20 Season 5." },
];

const KNOWN_PATHS = new Set(PAGE_DEFAULTS.map((p) => p.path));

/* ─── Storage helpers (site_settings kv) ─────────────────────────────────── */

interface PageOverride { title?: string; description?: string; ogImage?: string; updatedAt?: string }
type OverrideMap = Record<string, PageOverride>;

async function readSetting<T>(key: string): Promise<T | null> {
  const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  return (rows[0]?.value as T | undefined) ?? null;
}

async function writeSetting(key: string, value: Record<string, unknown>): Promise<void> {
  const now = new Date();
  await db.insert(siteSettingsTable)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: now } });
}

/* ─── Tiny cache so page views don't hit the DB on every request ────────── */

interface SeoCache { overrides: OverrideMap; gscCode: string | null; at: number }
let cache: SeoCache | null = null;
const CACHE_TTL_MS = 30_000;

async function getSeoData(): Promise<SeoCache> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache;
  const [overrides, gsc] = await Promise.all([
    readSetting<OverrideMap>("seo_pages"),
    readSetting<{ code?: string }>("seo_gsc"),
  ]);
  cache = { overrides: overrides ?? {}, gscCode: gsc?.code?.trim() || null, at: Date.now() };
  return cache;
}

function invalidateCache() { cache = null; }

function mergedPage(p: PageMetaDefault, overrides: OverrideMap) {
  const o = overrides[p.path];
  return {
    path: p.path,
    label: p.label,
    title: o?.title?.trim() || p.title,
    description: o?.description?.trim() || p.description,
    ogImage: o?.ogImage?.trim() || DEFAULT_OG_IMAGE,
    isDefault: !o,
    updatedAt: o?.updatedAt ?? null,
  };
}

async function getTeamSlugs(): Promise<string[]> {
  try {
    const rows = await db.select({ slug: teamsTable.slug }).from(teamsTable);
    return rows.map((r) => r.slug).filter(Boolean);
  } catch {
    return [];
  }
}

/* ─── GET /api/seo/meta (public — the site + admin both read this) ──────── */
router.get("/meta", async (_req, res) => {
  try {
    const data = await getSeoData();
    const teamSlugs = await getTeamSlugs();
    res.json({
      siteOrigin: SITE_ORIGIN,
      defaultOgImage: DEFAULT_OG_IMAGE,
      pages: PAGE_DEFAULTS.map((p) => mergedPage(p, data.overrides)),
      gscCode: data.gscCode,
      teamSlugs,
    });
  } catch (e) {
    logger.error({ err: e }, "seo meta fetch failed");
    res.status(500).json({ error: "Failed to load SEO settings" });
  }
});

/* ─── PUT /api/seo/admin/page — save or reset one page's meta ───────────── */
router.put("/admin/page", requireAdmin, async (req, res) => {
  const parsed = z.object({
    path: z.string().refine((p) => KNOWN_PATHS.has(p), { message: "Unknown page path" }),
    reset: z.boolean().optional(),
    title: z.string().trim().min(5).max(120).optional(),
    description: z.string().trim().min(20).max(320).optional(),
    ogImage: z.string().trim().url().max(500).or(z.literal("")).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" });
    return;
  }
  const d = parsed.data;
  try {
    const current = (await readSetting<OverrideMap>("seo_pages")) ?? {};
    if (d.reset) {
      delete current[d.path];
    } else {
      if (!d.title || !d.description) {
        res.status(400).json({ error: "title and description are required" });
        return;
      }
      current[d.path] = {
        title: d.title,
        description: d.description,
        ...(d.ogImage ? { ogImage: d.ogImage } : {}),
        updatedAt: new Date().toISOString(),
      };
    }
    await writeSetting("seo_pages", current);
    invalidateCache();
    const def = PAGE_DEFAULTS.find((p) => p.path === d.path)!;
    logger.info({ path: d.path, reset: !!d.reset }, "seo page meta updated");
    res.json({ success: true, page: mergedPage(def, current) });
  } catch (e) {
    logger.error({ err: e }, "seo page meta save failed");
    res.status(500).json({ error: "Failed to save meta" });
  }
});

/* ─── PUT /api/seo/admin/gsc — save/clear Google verification code ──────── */
router.put("/admin/gsc", requireAdmin, async (req, res) => {
  const parsed = z.object({ code: z.string().trim().max(600) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "code must be a string" });
    return;
  }
  // Accept the full <meta … content="…"> tag, "google-site-verification=XXX",
  // or the bare content value.
  let code = parsed.data.code;
  const tagMatch = code.match(/content=["']([^"']+)["']/i);
  if (tagMatch?.[1]) code = tagMatch[1];
  code = code.replace(/^google-site-verification[=:]\s*/i, "").trim();
  if (code && !/^[A-Za-z0-9_-]{8,100}$/.test(code)) {
    res.status(400).json({ error: "That doesn't look like a Google verification code — paste the full meta tag from Search Console" });
    return;
  }
  try {
    await writeSetting("seo_gsc", { code });
    invalidateCache();
    logger.info({ set: !!code }, "gsc verification code updated");
    res.json({ success: true, code: code || null });
  } catch (e) {
    logger.error({ err: e }, "gsc code save failed");
    res.status(500).json({ error: "Failed to save verification code" });
  }
});

/* ─── Sitemap & robots ───────────────────────────────────────────────────── */

export async function sitemapHandler(_req: Request, res: Response): Promise<void> {
  try {
    const teamSlugs = await getTeamSlugs();
    const urls = [
      ...PAGE_DEFAULTS.map((p) => p.path),
      ...teamSlugs.map((s) => `/team/${s}`),
    ];
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${SITE_ORIGIN}${escapeXml(u)}</loc></url>`).join("\n") +
      `\n</urlset>\n`;
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "no-cache");
    res.send(xml);
  } catch (e) {
    logger.error({ err: e }, "sitemap generation failed");
    res.status(500).type("text/plain").send("sitemap unavailable");
  }
}

export function robotsHandler(_req: Request, res: Response): void {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
  );
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

/* ─── Server-side meta injection for the SPA's index.html ────────────────
   In production nginx falls back to this (location @app) for any request
   that isn't a real file, so every page's HTML carries its own meta. */

const TEMPLATE_CANDIDATES = [
  process.env.WEBSITE_DIST_INDEX ?? "",
  "/home/ubuntu/app/artifacts/bcpl-website/dist/public/index.html",
  path.resolve(process.cwd(), "../bcpl-website/dist/public/index.html"),
  path.resolve(process.cwd(), "artifacts/bcpl-website/dist/public/index.html"),
].filter(Boolean);

let templatePath: string | null | undefined; // undefined = not probed yet
let templateHtml = "";
let templateMtime = 0;

function loadTemplate(): string | null {
  if (templatePath === undefined) {
    templatePath = TEMPLATE_CANDIDATES.find((p) => fs.existsSync(p)) ?? null;
    if (templatePath) logger.info({ templatePath }, "seo html template found");
    else logger.warn("seo html template not found — server-side meta injection inactive (ok in dev)");
  }
  if (!templatePath) return null;
  try {
    const mtime = fs.statSync(templatePath).mtimeMs;
    if (mtime !== templateMtime) {
      templateHtml = fs.readFileSync(templatePath, "utf8");
      templateMtime = mtime;
      // Loud regression guard: if index.html's head structure changes, the
      // injection regexes silently stop matching — warn on every (re)load.
      const anchors: [string, RegExp][] = [
        ["<title>", /<title>[\s\S]*?<\/title>/i],
        ['meta name="description"', /<meta\s+name="description"\s+content="/i],
        ['meta property="og:title"', /<meta\s+property="og:title"\s+content="/i],
        ['meta property="og:image"', /<meta\s+property="og:image"\s+content="/i],
        ["</head>", /<\/head>/i],
      ];
      const missing = anchors.filter(([, re]) => !re.test(templateHtml)).map(([name]) => name);
      if (missing.length > 0) {
        logger.error({ missing, templatePath }, "seo template anchors missing — meta injection will be incomplete; update injectMeta() regexes to match index.html");
      }
    }
    return templateHtml;
  } catch {
    return null;
  }
}

function escAttr(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

/** Replace or leave alone — all replacements use functions so "$" in values is safe. */
function injectMeta(html: string, meta: { title: string; description: string; ogImage: string; url: string } | null, gscCode: string | null): string {
  let out = html;
  if (meta) {
    const title = escAttr(meta.title);
    const desc = escAttr(meta.description);
    const img = escAttr(meta.ogImage);
    const url = escAttr(meta.url);
    out = out.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${title}</title>`);
    out = out.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i, (_m, a: string, b: string) => a + desc + b);
    out = out.replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i, (_m, a: string, b: string) => a + title + b);
    out = out.replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i, (_m, a: string, b: string) => a + desc + b);
    out = out.replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/i, (_m, a: string, b: string) => a + url + b);
    out = out.replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/i, (_m, a: string, b: string) => a + img + b);
    out = out.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i, (_m, a: string, b: string) => a + title + b);
    out = out.replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i, (_m, a: string, b: string) => a + desc + b);
    out = out.replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i, (_m, a: string, b: string) => a + img + b);
    out = out.replace(/<\/head>/i, () => `  <link rel="canonical" href="${url}" />\n  </head>`);
  }
  if (gscCode) {
    out = out.replace(/<\/head>/i, () => `  <meta name="google-site-verification" content="${escAttr(gscCode)}" />\n  </head>`);
  }
  return out;
}

export async function seoHtmlMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const reqPath = (req.path || "/").replace(/\/+$/, "") || "/";
  if (reqPath.startsWith("/api")) return next();
  if (path.extname(reqPath) !== "") return next(); // real files (js/css/img) belong to nginx

  const html = loadTemplate();
  if (!html) return next();

  try {
    const data = await getSeoData();
    const def = PAGE_DEFAULTS.find((p) => p.path === reqPath);
    const meta = def
      ? (() => {
          const m = mergedPage(def, data.overrides);
          return { title: m.title, description: m.description, ogImage: m.ogImage, url: `${SITE_ORIGIN}${def.path === "/" ? "" : def.path}` || SITE_ORIGIN };
        })()
      : null; // unknown paths (SPA 404, /r/CODE, player flow) keep the built-in defaults
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-cache"); // meta edits must show up quickly
    res.send(injectMeta(html, meta, data.gscCode));
  } catch (e) {
    logger.error({ err: e }, "seo html injection failed — serving untouched template");
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  }
}

export default router;

/**
 * seoHtmlMiddleware — server-side meta + JSON-LD injection into the SPA
 * index.html (routes/seo.ts). This is the chain that only fully exists in
 * production (nginx `try_files $uri @app;` falls back to this middleware for
 * page HTML), so it never had automated coverage until now.
 *
 * Covers:
 *  - saved SEO settings (seo_pages override) → served HTML contains the saved
 *    <title>, meta description, OG tags AND the new JSON-LD (Organization
 *    site-wide, FAQPage on /faq, SportsEvent on /match-center)
 *  - default fallback: with NO override saved, the page's built-in default
 *    title/description are served (never blank)
 *  - GSC verification code injection when saved
 *  - public/-file shadowing regression: requests carrying a file extension
 *    (…/foo.js, /robots.txt) are NOT rewritten by the middleware — they fall
 *    through to next() so nginx / static files win. /api is never touched.
 *
 * The index.html template is a real temp file pointed at via WEBSITE_DIST_INDEX
 * (set BEFORE importing the app so loadTemplate() picks it up) — this stubs the
 * built SPA file without a real vite build. The temp file carries the exact
 * <head> anchor tags the injector's regexes target.
 *
 * Only this file touches the seo_pages / seo_gsc settings keys and its own
 * uniquely-named match row, so parallel suites can't race it. No payment
 * gateway calls and no notifications are possible on these read paths.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

/* Minimal index.html carrying every <head> anchor injectMeta() targets. */
const TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>DEFAULT TITLE PLACEHOLDER</title>
    <meta name="description" content="default description placeholder" />
    <meta property="og:title" content="default og title" />
    <meta property="og:description" content="default og description" />
    <meta property="og:url" content="https://bcplt20.com" />
    <meta property="og:image" content="https://bcplt20.com/default.jpg" />
    <meta name="twitter:title" content="default tw title" />
    <meta name="twitter:description" content="default tw description" />
    <meta name="twitter:image" content="https://bcplt20.com/default.jpg" />
  </head>
  <body><div id="root"></div></body>
</html>
`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bcpl-seo-"));
const templatePath = path.join(tmpDir, "index.html");
fs.writeFileSync(templatePath, TEMPLATE_HTML, "utf8");
process.env.WEBSITE_DIST_INDEX = templatePath;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { siteSettingsTable, matchesTable } = await import("@workspace/db/schema");

const suffix = String(Date.now()).slice(-7);
const SAVED_TITLE = `Saved SEO Title ${suffix} — BCPL`;
const SAVED_DESC = `Saved SEO description for the about page, saved by admin ${suffix}. Long enough for validators.`;
const GSC_CODE = `bcplGscTest${suffix}`;
let matchId = "";
const team1 = `LD Team Alpha ${suffix}`;
const team2 = `LD Team Beta ${suffix}`;

beforeAll(async () => {
  // Save an override for /about (a stable known path) via the settings kv,
  // exactly like the admin PUT does. Direct DB write keeps this test
  // independent of the admin-auth token plumbing covered elsewhere.
  await db
    .insert(siteSettingsTable)
    .values({
      key: "seo_pages",
      value: { "/about": { title: SAVED_TITLE, description: SAVED_DESC, updatedAt: new Date().toISOString() } },
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: {
        value: { "/about": { title: SAVED_TITLE, description: SAVED_DESC, updatedAt: new Date().toISOString() } },
        updatedAt: new Date(),
      },
    });

  // Save the GSC verification code BEFORE any request primes seo.ts's 30s
  // in-memory cache — otherwise the first fetch caches gscCode:null and the
  // code won't appear until the TTL expires.
  await db
    .insert(siteSettingsTable)
    .values({ key: "seo_gsc", value: { code: GSC_CODE }, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: { code: GSC_CODE }, updatedAt: new Date() } });

  // A real scheduled match so /match-center emits a SportsEvent blob.
  const [m] = await db
    .insert(matchesTable)
    .values({
      matchNo: Number(`8${suffix}`.slice(-8)),
      season: 5,
      team1,
      team2,
      venue: `LD Test Ground ${suffix}`,
      scheduledAt: new Date("2025-10-01T14:00:00.000Z"),
      status: "scheduled",
    })
    .returning();
  matchId = m.id;
});

afterAll(async () => {
  await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, "seo_pages"));
  await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, "seo_gsc"));
  if (matchId) await db.delete(matchesTable).where(eq(matchesTable.id, matchId));
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
});

/** Parse the ld+json blobs out of served HTML. */
function jsonLdBlocks(html: string): Array<Record<string, any>> {
  const out: Array<Record<string, any>> = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    // Reverse the "<" escaping the server applies for safe embedding.
    const raw = m[1].replace(/\\u003c/g, "<");
    out.push(JSON.parse(raw));
  }
  return out;
}

describe("seoHtmlMiddleware — saved SEO settings are served in HTML", () => {
  it("serves the saved title, description and OG tags for /about", async () => {
    const res = await request(app).get("/about");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain(`<title>${SAVED_TITLE}</title>`);
    expect(res.text).toContain(`content="${SAVED_DESC}"`);
    // OG + Twitter mirror the saved title
    expect(res.text).toMatch(new RegExp(`property="og:title" content="${SAVED_TITLE.replace(/[.*+?^${}()|[\]\\—]/g, "\\$&")}"`));
    expect(res.text).toMatch(new RegExp(`name="twitter:title" content="${SAVED_TITLE.replace(/[.*+?^${}()|[\]\\—]/g, "\\$&")}"`));
    // canonical URL injected
    expect(res.text).toContain(`<link rel="canonical" href="https://bcplt20.com/about" />`);
    // default placeholders are gone
    expect(res.text).not.toContain("DEFAULT TITLE PLACEHOLDER");
  });

  it("emits site-wide Organization JSON-LD on every page", async () => {
    const res = await request(app).get("/about");
    const blocks = jsonLdBlocks(res.text);
    const org = blocks.find((b) => b["@type"] === "Organization");
    expect(org).toBeTruthy();
    expect(org!.url).toBe("https://bcplt20.com");
    expect(org!.logo).toContain("bcpl-logo-color.jpg");
    expect(org!.name).toMatch(/BCPL/);
  });
});

describe("seoHtmlMiddleware — default fallback when nothing saved", () => {
  it("serves built-in default title/description for a page with no override", async () => {
    // /faq has no override saved (only /about is) → its PAGE_DEFAULTS win.
    const res = await request(app).get("/faq");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<title>BCPL T20 FAQ");
    expect(res.text).toMatch(/name="description" content="Answers to common BCPL/);
    expect(res.text).not.toContain("DEFAULT TITLE PLACEHOLDER");
    expect(res.text).not.toContain("default description placeholder");
  });

  it("still serves the built-in default even for an unknown SPA path", async () => {
    // Unknown page keeps the template defaults for meta but STILL gets
    // Organization JSON-LD (knowledge-panel works everywhere).
    const res = await request(app).get("/some-unknown-spa-route");
    expect(res.status).toBe(200);
    const blocks = jsonLdBlocks(res.text);
    expect(blocks.some((b) => b["@type"] === "Organization")).toBe(true);
  });
});

describe("seoHtmlMiddleware — FAQPage JSON-LD on /faq", () => {
  it("emits an accurate FAQPage with real question/answer pairs", async () => {
    const res = await request(app).get("/faq");
    const blocks = jsonLdBlocks(res.text);
    const faq = blocks.find((b) => b["@type"] === "FAQPage");
    expect(faq).toBeTruthy();
    expect(Array.isArray(faq!.mainEntity)).toBe(true);
    expect(faq!.mainEntity.length).toBeGreaterThan(3);
    const first = faq!.mainEntity[0];
    expect(first["@type"]).toBe("Question");
    expect(first.acceptedAnswer["@type"]).toBe("Answer");
    // Fee-bearing answer reflects the real ₹299 Phase 1 base fee.
    const registerQ = faq!.mainEntity.find((q: any) => /How do I register/i.test(q.name));
    expect(registerQ).toBeTruthy();
    expect(registerQ.acceptedAnswer.text).toContain("₹299");
  });

  it("does NOT emit FAQPage on non-FAQ pages", async () => {
    const res = await request(app).get("/about");
    const blocks = jsonLdBlocks(res.text);
    expect(blocks.some((b) => b["@type"] === "FAQPage")).toBe(false);
  });
});

describe("seoHtmlMiddleware — SportsEvent JSON-LD on match pages", () => {
  it("emits a SportsEvent built from a real matches row on /match-center", async () => {
    const res = await request(app).get("/match-center");
    const blocks = jsonLdBlocks(res.text);
    const events = blocks.filter((b) => b["@type"] === "SportsEvent");
    const mine = events.find((e) => String(e.name).includes(team1) && String(e.name).includes(team2));
    expect(mine).toBeTruthy();
    expect(mine!.sport).toBe("Cricket");
    expect(mine!.eventStatus).toBe("https://schema.org/EventScheduled");
    expect(mine!.startDate).toBe("2025-10-01T14:00:00.000Z");
    expect(Array.isArray(mine!.competitor)).toBe(true);
    expect(mine!.competitor.map((c: any) => c.name)).toEqual([team1, team2]);
    expect(mine!.location.name).toContain("LD Test Ground");
  });

  it("does NOT emit SportsEvent on non-match pages", async () => {
    const res = await request(app).get("/about");
    const blocks = jsonLdBlocks(res.text);
    expect(blocks.some((b) => b["@type"] === "SportsEvent")).toBe(false);
  });
});

describe("seoHtmlMiddleware — GSC verification code", () => {
  it("injects the saved google-site-verification meta tag", async () => {
    // GSC_CODE was saved in beforeAll (before any request primed seo.ts's
    // 30s cache), so it must appear on every served page.
    const res = await request(app).get("/contact");
    expect(res.text).toContain(`<meta name="google-site-verification" content="${GSC_CODE}" />`);
  });
});

describe("seoHtmlMiddleware — shadowing / passthrough regression", () => {
  it("does NOT rewrite requests that carry a file extension (static assets win)", async () => {
    // A .js path must fall through to next() (nginx/static serves the real
    // file in prod). The middleware is the last handler, so with no static
    // file present here Express answers its own 404 — the key regression
    // assertion is that OUR injected SPA template + JSON-LD is NOT returned
    // for an asset-looking path (that would shadow the real static file).
    const res = await request(app).get("/assets/index-abc123.js");
    expect(res.text).not.toContain('id="root"');
    expect(res.text).not.toContain('type="application/ld+json"');
    expect(res.text).not.toContain("DEFAULT TITLE PLACEHOLDER");
  });

  it("never touches /api requests", async () => {
    // /api/does-not-exist is handled by the API router, never the SPA
    // template — no injected root div, no JSON-LD, no placeholder.
    const res = await request(app).get("/api/__seo_probe_nonexistent__");
    expect(res.text).not.toContain('id="root"');
    expect(res.text).not.toContain('type="application/ld+json"');
    expect(res.text).not.toContain("DEFAULT TITLE PLACEHOLDER");
  });
});

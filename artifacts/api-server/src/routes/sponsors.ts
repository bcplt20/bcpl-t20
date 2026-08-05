/**
 * Public sponsors endpoint — sanitized list for the website.
 *
 * Source of truth: site_settings key "sponsors" (managed from the admin
 * panel via PUT /api/settings/admin/sponsors). Only ACTIVE sponsors are
 * exposed, and private fields (amount, contract date, status, visibility)
 * are stripped — the public site gets name/category/logo/website only.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getDownloadPresignedUrl } from "../lib/s3";

const router = Router();

/* The S3 bucket blocks public reads, so raw bucket URLs saved by the admin
   panel 403 in the browser (blank logos). Detect our-bucket URLs, pull out
   the cms/ key, and serve a presigned URL instead. */
const BUCKET_URL_RE = /^https?:\/\/[a-z0-9.-]+\.s3[.-][a-z0-9-]+\.amazonaws\.com\/(cms\/[A-Za-z0-9._-]+)$/i;

export function extractCmsKey(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const m = BUCKET_URL_RE.exec(url.trim());
  return m ? m[1] : null;
}

async function displayLogoUrl(logo: string): Promise<string> {
  const key = extractCmsKey(logo);
  if (!key) return logo; // external URL (or empty) — pass through untouched
  try { return await getDownloadPresignedUrl(key, 3600); }
  catch { return ""; } // never let one bad logo break the whole list
}

type SponsorRecord = {
  name?: unknown;
  category?: unknown;
  logo?: unknown;
  website?: unknown;
  status?: unknown;
};

const isHttpUrl = (v: unknown): v is string =>
  typeof v === "string" && /^https?:\/\//i.test(v);

router.get("/", async (_req, res) => {
  const rows = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, "sponsors")).limit(1);
  const raw = rows[0]?.value;
  const list = Array.isArray(raw) ? (raw as SponsorRecord[]) : [];

  const sponsors = await Promise.all(list
    .filter(s => s && s.status === "active" && typeof s.name === "string" && s.name.trim() !== "")
    .map(async s => ({
      name: String(s.name).trim(),
      category: typeof s.category === "string" ? s.category : "",
      logo: isHttpUrl(s.logo) ? await displayLogoUrl(s.logo) : "",
      website: isHttpUrl(s.website) ? s.website : "",
    })));

  /* Admin edits must show up on the site immediately — never cache. */
  res.setHeader("Cache-Control", "public, max-age=60");
  return res.json({ sponsors });
});

/* ── GET /api/sponsors/logo?key=cms/<file> — stable logo URL ──
   302-redirects to a fresh presigned URL. Gives the admin panel (and any
   email template) a permanent URL that never expires, while the bucket
   itself stays private. Restricted to the cms/ prefix — site-content
   assets only, nothing sensitive lives there. */
router.get("/logo", async (req, res) => {
  const key = String(req.query.key ?? "");
  if (!/^cms\/[A-Za-z0-9._-]+\.(?:png|jpg|jpeg|webp)$/i.test(key)) {
    return void res.status(400).json({ error: "invalid key" });
  }
  try {
    const url = await getDownloadPresignedUrl(key, 3600);
    res.setHeader("Cache-Control", "public, max-age=600");
    return void res.redirect(302, url);
  } catch {
    return void res.status(404).json({ error: "logo not found" });
  }
});

export default router;

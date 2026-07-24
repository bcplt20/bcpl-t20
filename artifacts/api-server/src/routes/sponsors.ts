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

const router = Router();

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

  const sponsors = list
    .filter(s => s && s.status === "active" && typeof s.name === "string" && s.name.trim() !== "")
    .map(s => ({
      name: String(s.name).trim(),
      category: typeof s.category === "string" ? s.category : "",
      logo: isHttpUrl(s.logo) ? s.logo : "",
      website: isHttpUrl(s.website) ? s.website : "",
    }));

  /* Admin edits must show up on the site immediately — never cache. */
  res.setHeader("Cache-Control", "no-store");
  return res.json({ sponsors });
});

export default router;

/**
 * Public app-banners endpoint — promo banners for the BCPL mobile app.
 *
 * Source of truth: site_settings key "app_banners" (managed from the admin
 * panel via PUT /api/settings/admin/app_banners). This endpoint returns ONLY
 * active banners, sorted by `order`. No auth. When the key is unset it falls
 * back to server-side defaults so the app always has content.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { activeAppBanners } from "../lib/appBanners";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, "app_banners")).limit(1);
  const banners = activeAppBanners(rows[0]?.value);

  /* Admin edits must show up in the app quickly — short cache only. */
  res.setHeader("Cache-Control", "public, max-age=60");
  return res.json({ banners });
});

export default router;

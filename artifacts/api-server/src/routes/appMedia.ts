/**
 * Public app-media endpoint — the mobile app's curated Photos & Videos tab.
 *
 * Source of truth: site_settings key "app_media" (managed from the admin panel
 * via PUT /api/settings/admin/app_media). This returns ONLY active items,
 * sorted by `order` — SEPARATE from the website gallery. No auth. Default when
 * unset is an empty list.
 *
 * Items that reference a private S3 object (s3Key) are presigned into a
 * short-lived viewUrl at request time (like the gallery), so private media/
 * and cms/ objects are never exposed as raw bucket URLs.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { activeAppMedia } from "../lib/appMedia";
import { getDownloadPresignedUrl } from "../lib/s3";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, "app_media")).limit(1);
  const active = activeAppMedia(rows[0]?.value);

  const items = await Promise.all(active.map(async (i) => {
    /* Presign private S3 objects into a viewUrl; keep the raw s3Key out of
       the public payload. External url / youtubeId pass through untouched. */
    let viewUrl = i.url ?? "";
    if (i.s3Key) {
      try { viewUrl = await getDownloadPresignedUrl(i.s3Key); }
      catch { viewUrl = i.url ?? ""; } // never let one bad key break the list
    }
    return {
      id: i.id,
      kind: i.kind,
      title: i.title,
      url: viewUrl,
      ...(i.youtubeId ? { youtubeId: i.youtubeId } : {}),
      ...(i.thumbUrl ? { thumbUrl: i.thumbUrl } : {}),
      active: i.active,
      order: i.order,
    };
  }));

  /* Presigned links are short-lived, so the app must re-fetch periodically. */
  res.setHeader("Cache-Control", "public, max-age=60");
  return res.json({ items });
});

export default router;

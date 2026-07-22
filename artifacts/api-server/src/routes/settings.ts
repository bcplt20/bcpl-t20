/**
 * Site settings routes (key-value store managed from the admin panel)
 *
 * Public:
 *   GET /api/settings/:key                 – read a whitelisted public setting
 *
 * Admin (x-bcpl-admin header):
 *   PUT  /api/settings/admin/:key          – upsert a setting
 *   POST /api/settings/admin/upload-url    – presigned S3 URL for sample-video upload
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "../middlewares/adminAuth";
import { getUploadPresignedUrl, getS3Url } from "../lib/s3";
import { logger } from "../lib/logger";
import { z } from "zod";

const router = Router();

/** Keys readable without auth (shown on public pages). */
const PUBLIC_KEYS = new Set(["sample_videos"]);
/** Keys the admin may write. */
const WRITABLE_KEYS = new Set(["sample_videos"]);

/* ── ensure table exists (idempotent, runs at boot) ── */
async function ensureSettingsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        key        varchar(100) PRIMARY KEY,
        value      json NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    logger.info("site_settings table ready");
  } catch (err) {
    logger.error({ err }, "failed to ensure site_settings table");
  }
}
void ensureSettingsTable();

/* ── GET /api/settings/:key (public, whitelisted) ── */
router.get("/:key", async (req, res) => {
  const key = String(req.params.key);
  if (!PUBLIC_KEYS.has(key)) {
    return res.status(404).json({ error: "Unknown setting" });
  }
  const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  res.json({ key, value: rows[0]?.value ?? null, updatedAt: rows[0]?.updatedAt ?? null });
});

/* ── PUT /api/settings/admin/:key ── */
const sampleVideoEntry = z.object({
  url: z.string().url().max(600),
  label: z.string().max(120).optional(),
  uploadedAt: z.string().max(40).optional(),
});
const sampleVideosSchema = z.record(
  z.enum(["batsman", "bowler", "wicket-keeper", "all-rounder"]),
  sampleVideoEntry.nullable(),
);

router.put("/admin/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key);
  if (!WRITABLE_KEYS.has(key)) {
    return res.status(400).json({ error: "Unknown setting key" });
  }

  let value: Record<string, unknown>;
  if (key === "sample_videos") {
    const parsed = sampleVideosSchema.safeParse(req.body?.value);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid sample_videos value: expected { batsman|bowler|wicket-keeper|all-rounder: { url } | null }" });
    }
    value = parsed.data as Record<string, unknown>;
  } else {
    return res.status(400).json({ error: "Unknown setting key" });
  }

  const now = new Date();
  await db.insert(siteSettingsTable)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: now } });

  logger.info({ key }, "site setting updated by admin");
  res.json({ success: true, key, value });
});

/* ── POST /api/settings/admin/upload-url (sample video S3 upload) ── */
const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-msvideo": "avi",
};

router.post("/admin/upload-url", requireAdmin, async (req, res) => {
  const contentType = String(req.body?.contentType ?? "");
  const ext = ALLOWED_VIDEO_TYPES[contentType];
  if (!ext) {
    return res.status(400).json({ error: "contentType must be one of: " + Object.keys(ALLOWED_VIDEO_TYPES).join(", ") });
  }
  const s3Key = "samples/" + randomUUID() + "." + ext;
  const presignedUrl = await getUploadPresignedUrl(s3Key, contentType);
  res.json({ success: true, presignedUrl, s3Key, publicUrl: getS3Url(s3Key) });
});

export default router;

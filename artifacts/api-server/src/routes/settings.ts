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
import { writeAudit } from "../lib/audit";
import { z } from "zod";

const router = Router();

/** Keys readable without auth (shown on public pages). */
const PUBLIC_KEYS = new Set(["sample_videos", "homepage_config"]);
/** Keys the admin may write. */
const WRITABLE_KEYS = new Set(["sample_videos", "homepage_config", "sponsors"]);
/** Per-key role restriction (SUPER_ADMIN always allowed). */
const KEY_ROLES: Record<string, string[]> = {
  sample_videos: ["VIDEO_AI_OPERATIONS", "CONTENT_TEAM"],
  homepage_config: ["CONTENT_TEAM"],
  /* sponsors: full records (amounts, contract dates) are admin-only; the
     public site reads a sanitized list via GET /api/sponsors instead. */
  sponsors: ["CONTENT_TEAM"],
};

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
    return void res.status(404).json({ error: "Unknown setting" });
  }
  const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  return res.json({ key, value: rows[0]?.value ?? null, updatedAt: rows[0]?.updatedAt ?? null });
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

/* Stage 6 — homepage CMS configuration (display values for the public site).
   These are DISPLAY values only: actual payment amounts remain configured in
   backend payment code, so content admins cannot change business rules. */
const urlOrEmpty = z.string().url().max(600).or(z.literal(""));
const homepageConfigSchema = z.object({
  heroDesktopUrl: urlOrEmpty.optional(),
  heroTabletUrl:  urlOrEmpty.optional(),
  heroMobileUrl:  urlOrEmpty.optional(),
  heroPosterUrl:  urlOrEmpty.optional(),
  seasonNumber: z.number().int().min(1).max(99).optional(),
  registrationStatus: z.enum(["open", "closed", "coming_soon"]).optional(),
  phase1FeeStandard:   z.number().int().min(0).max(100000).optional(),
  phase1FeeAllRounder: z.number().int().min(0).max(100000).optional(),
  phase2FeeStandard:   z.number().int().min(0).max(100000).optional(),
  phase2FeeAllRounder: z.number().int().min(0).max(100000).optional(),
  prizePool:    z.string().max(60).optional(),
  auctionValue: z.string().max(60).optional(),
  importantDates: z.array(z.object({
    label: z.string().min(1).max(80),
    date:  z.string().min(1).max(60),
  })).max(12).optional(),
  stats: z.array(z.object({
    label: z.string().min(1).max(60),
    value: z.string().min(1).max(30),
  })).max(8).optional(),
  socialLinks: z.object({
    instagram: z.string().max(300).optional(),
    youtube:   z.string().max(300).optional(),
    x:         z.string().max(300).optional(),
    facebook:  z.string().max(300).optional(),
  }).optional(),
  supportEmail: z.string().email().max(200).or(z.literal("")).optional(),
  supportPhone: z.string().max(20).optional(),
}).strict();

/* Sponsors list managed from the admin panel. Logos/websites must be http(s)
   URLs (S3 cms/ uploads) — base64 data URLs are rejected to keep rows small. */
const httpUrlOrEmpty = z.string().max(600)
  .refine(v => v === "" || /^https?:\/\//i.test(v), "must be an http(s) URL");
const sponsorEntry = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  category: z.string().max(80).default(""),
  logo: httpUrlOrEmpty.default(""),
  amount: z.string().max(40).default(""),
  website: httpUrlOrEmpty.default(""),
  contract: z.string().max(40).default(""),
  status: z.enum(["active", "negotiating", "expired"]).default("active"),
  visibility: z.string().max(60).default("All Platforms"),
}).strict();
const sponsorsSchema = z.array(sponsorEntry).max(100);

/* ── GET /api/settings/admin/:key (full value, role-gated — for non-public keys like sponsors) ── */
router.get("/admin/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key);
  if (!WRITABLE_KEYS.has(key)) {
    return void res.status(400).json({ error: "Unknown setting key" });
  }
  const role = req.admin?.role;
  const allowedRoles = KEY_ROLES[key] ?? [];
  if (role !== "SUPER_ADMIN" && !(role && allowedRoles.includes(role))) {
    return void res.status(403).json({ error: "Forbidden — your admin role does not allow this action" });
  }
  const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  return res.json({ key, value: rows[0]?.value ?? null, updatedAt: rows[0]?.updatedAt ?? null });
});

router.put("/admin/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key);
  if (!WRITABLE_KEYS.has(key)) {
    return void res.status(400).json({ error: "Unknown setting key" });
  }

  /* Stage 6: per-key role gate (legacy secret / owner tokens = SUPER_ADMIN) */
  const role = req.admin?.role;
  const allowedRoles = KEY_ROLES[key] ?? [];
  if (role !== "SUPER_ADMIN" && !(role && allowedRoles.includes(role))) {
    return void res.status(403).json({ error: "Forbidden — your admin role does not allow this action" });
  }

  let value: Record<string, unknown>;
  if (key === "sample_videos") {
    const parsed = sampleVideosSchema.safeParse(req.body?.value);
    if (!parsed.success) {
      return void res.status(400).json({ error: "Invalid sample_videos value: expected { batsman|bowler|wicket-keeper|all-rounder: { url } | null }" });
    }
    value = parsed.data as Record<string, unknown>;
  } else if (key === "homepage_config") {
    const parsed = homepageConfigSchema.safeParse(req.body?.value);
    if (!parsed.success) {
      const first = parsed.error.issues.slice(0, 3).map(i => (i.path.join(".") || "value") + ": " + i.message).join("; ");
      return void res.status(400).json({ error: "Invalid homepage_config value — " + first });
    }
    value = parsed.data as Record<string, unknown>;
  } else if (key === "sponsors") {
    const parsed = sponsorsSchema.safeParse(req.body?.value);
    if (!parsed.success) {
      const first = parsed.error.issues.slice(0, 3).map(i => (i.path.join(".") || "value") + ": " + i.message).join("; ");
      return void res.status(400).json({ error: "Invalid sponsors value — " + first });
    }
    /* jsonb column is typed Record<string,unknown>; an array is valid jsonb. */
    value = parsed.data as unknown as Record<string, unknown>;
  } else {
    return void res.status(400).json({ error: "Unknown setting key" });
  }

  const now = new Date();
  await db.insert(siteSettingsTable)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: now } });

  logger.info({ key }, "site setting updated by admin");
  void writeAudit(req, { action: "settings.update", entity: "site_settings", entityKey: key, newValue: value });
  return res.json({ success: true, key, value });
});

/* ── POST /api/settings/admin/upload-url (sample video S3 upload) ── */
const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-msvideo": "avi",
  // images (Stage 6 — CMS hero media / poster)
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

router.post("/admin/upload-url", requireAdmin, async (req, res) => {
  const contentType = String(req.body?.contentType ?? "");
  const ext = ALLOWED_UPLOAD_TYPES[contentType];
  if (!ext) {
    return void res.status(400).json({ error: "contentType must be one of: " + Object.keys(ALLOWED_UPLOAD_TYPES).join(", ") });
  }
  const prefix = req.body?.purpose === "cms" ? "cms/" : "samples/";
  const s3Key = prefix + randomUUID() + "." + ext;
  const presignedUrl = await getUploadPresignedUrl(s3Key, contentType);
  return res.json({ success: true, presignedUrl, s3Key, publicUrl: getS3Url(s3Key) });
});

export default router;

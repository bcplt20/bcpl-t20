/**
 * App media — shared schema + normalization for the mobile app's curated
 * Photos & Videos tab.
 *
 * Storage: site_settings key "app_media" (managed from the admin panel via
 * PUT /api/settings/admin/app_media). This is SEPARATE from the website
 * gallery — the app shows ONLY items the owner posts here, not the whole
 * website gallery.
 *
 * Each item is a photo, video or short. Videos may reference a YouTube video
 * (youtubeId) and/or an absolute url. Photos may carry either an absolute
 * `url` OR an S3 `s3Key` (uploaded via the admin media flow). Because S3
 * objects are private, the public GET /api/app-media endpoint presigns any
 * stored s3Key into a short-lived viewUrl at request time (like the gallery).
 */
import { z } from "zod";

export const MEDIA_KINDS = ["photo", "video", "short"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** S3 keys we allow the app-media view to reference (media/ or cms/ prefixes
 *  produced by the existing admin upload flows). */
export const APP_MEDIA_S3_KEY_RE = /^(?:media|cms)\/[A-Za-z0-9._/-]+$/;

export const appMediaItemSchema = z.object({
  id: z.string().min(1).max(60),
  kind: z.enum(MEDIA_KINDS),
  title: z.string().min(1).max(160),
  /** Absolute media URL (external or paste). Optional when s3Key is set. */
  url: z.string().max(600).optional(),
  /** YouTube video id (11 chars). Auto-extracted client-side from a URL. */
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "invalid YouTube id").optional(),
  /** Private S3 key (media/ or cms/); presigned into a viewUrl on read. */
  s3Key: z.string().max(500).regex(APP_MEDIA_S3_KEY_RE, "invalid s3 key").optional(),
  /** Optional thumbnail URL (for videos/shorts). */
  thumbUrl: z.string().max(600).optional(),
  active: z.boolean(),
  order: z.number().int().min(0).max(9999),
}).strict().refine(
  (v) => Boolean(v.url) || Boolean(v.s3Key) || Boolean(v.youtubeId),
  { message: "each item needs a url, s3Key or youtubeId" },
);

export type AppMediaItem = z.infer<typeof appMediaItemSchema>;

export const appMediaSchema = z.object({
  items: z.array(appMediaItemSchema).max(200),
}).strict();

export type AppMediaValue = z.infer<typeof appMediaSchema>;

/** Default when unset: empty (the app shows an empty state). */
export const DEFAULT_APP_MEDIA: AppMediaItem[] = [];

/**
 * Normalize a stored setting value into the list of ACTIVE items sorted by
 * `order`. Accepts either the wrapped { items: [...] } shape (what the admin
 * saves) or a bare array (defensive).
 */
export function activeAppMedia(raw: unknown): AppMediaItem[] {
  let list: unknown;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "items" in raw) {
    list = (raw as { items: unknown }).items;
  } else {
    list = raw;
  }
  const parsed = z.array(appMediaItemSchema).safeParse(list);
  const items = parsed.success ? parsed.data : DEFAULT_APP_MEDIA;
  return items
    .filter((i) => i.active)
    .sort((a, b) => a.order - b.order);
}

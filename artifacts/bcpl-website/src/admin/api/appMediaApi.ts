/**
 * Admin API for the App Media view — server-backed curated Photos & Videos for
 * the BCPL mobile app (SEPARATE from the website gallery).
 *
 * Storage: site_settings key "app_media" on the API server. The mobile app
 * reads only ACTIVE items (sorted by order) from the public GET /api/app-media
 * endpoint; private S3 objects are presigned server-side at request time.
 *
 * Photo uploads reuse the existing admin S3 flow (POST
 * /settings/admin/upload-url with purpose "cms" → PUT to the presigned URL),
 * and we store the returned s3Key so the app-media endpoint can presign it.
 *
 * All plumbing routes through the shared adminReq / adminGetSampleUploadUrl —
 * never a baked-in key.
 */
import { adminReq } from "../../lib/adminHttp";

export const MEDIA_KINDS = ["photo", "video", "short"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export type AppMediaItem = {
  id: string;
  kind: MediaKind;
  title: string;
  url?: string;
  youtubeId?: string;
  s3Key?: string;
  thumbUrl?: string;
  active: boolean;
  order: number;
};

export type AppMediaValue = { items: AppMediaItem[] };

export const fetchAppMediaAdmin = () =>
  adminReq<{ key: string; value: AppMediaValue | null; updatedAt: string | null }>(
    "GET", "/settings/admin/app_media",
  );

export const saveAppMediaAdmin = (value: AppMediaValue) =>
  adminReq<{ success: boolean }>("PUT", "/settings/admin/app_media", { value });

/** Extract an 11-char YouTube id from common URL shapes (or null). */
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = re.exec(url);
    if (m) return m[1];
  }
  // bare 11-char id pasted directly
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

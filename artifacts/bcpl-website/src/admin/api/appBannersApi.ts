/**
 * Admin API for the App Banners view — server-backed promo banners for the
 * BCPL mobile app.
 *
 * Storage: site_settings key "app_banners" on the API server. The mobile app
 * reads only ACTIVE banners (sorted by order) from the public
 * GET /api/app-banners endpoint.
 *
 * Uses the shared adminReq plumbing (auth headers, token renewal, error shape).
 * Do NOT add fetch logic here — always route through adminReq.
 */
import { adminReq } from "../../lib/adminHttp";

export const BANNER_ACCENTS = ["violet", "magenta", "cyan", "lime", "amber"] as const;
export type BannerAccent = (typeof BANNER_ACCENTS)[number];

export type AppBanner = {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  accent?: BannerAccent;
  active: boolean;
  order: number;
};

export type AppBannersValue = { banners: AppBanner[] };

export const fetchAppBannersAdmin = () =>
  adminReq<{ key: string; value: AppBannersValue | null; updatedAt: string | null }>(
    "GET", "/settings/admin/app_banners",
  );

export const saveAppBannersAdmin = (value: AppBannersValue) =>
  adminReq<{ success: boolean }>("PUT", "/settings/admin/app_banners", { value });

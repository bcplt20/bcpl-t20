/**
 * App promo banners — shared schema + server-side defaults.
 *
 * Storage: site_settings key "app_banners" (managed from the admin panel via
 * PUT /api/settings/admin/app_banners). The mobile app reads only ACTIVE
 * banners, sorted by `order`, from the public GET /api/app-banners endpoint.
 *
 * When the key is unset the public endpoint falls back to DEFAULT_APP_BANNERS
 * so the app always has content. Copy is compliance-reviewed: no
 * selected/scout/BCCI wording and no superlatives (best/guaranteed).
 */
import { z } from "zod";

export const BANNER_ACCENTS = ["violet", "magenta", "cyan", "lime", "amber"] as const;
export type BannerAccent = (typeof BANNER_ACCENTS)[number];

export const appBannerSchema = z.object({
  id: z.string().min(1).max(60),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(300).optional(),
  ctaLabel: z.string().max(60).optional(),
  ctaHref: z.string().max(300).optional(),
  accent: z.enum(BANNER_ACCENTS).optional(),
  active: z.boolean(),
  order: z.number().int().min(0).max(9999),
}).strict();

export type AppBanner = z.infer<typeof appBannerSchema>;

export const appBannersSchema = z.object({
  banners: z.array(appBannerSchema).max(50),
}).strict();

export type AppBannersValue = z.infer<typeof appBannersSchema>;

/** Sensible defaults so the app always has content when the key is unset. */
export const DEFAULT_APP_BANNERS: AppBanner[] = [
  {
    id: "b1",
    title: "₹299 +GST",
    subtitle: "Season 5 registrations open — Batsman · Bowler · Wicketkeeper (₹399 All-Rounder)",
    ctaLabel: "Register Now",
    ctaHref: "/register",
    accent: "violet",
    active: true,
    order: 1,
  },
  {
    id: "b2",
    title: "₹1 Crore prize pool",
    subtitle: "Season 5 winners take home ₹1 crore",
    accent: "amber",
    active: true,
    order: 2,
  },
  {
    id: "b3",
    title: "Man of the Series wins a luxury car",
    subtitle: "Season 5's biggest individual prize",
    accent: "magenta",
    active: true,
    order: 3,
  },
  {
    id: "b4",
    title: "From office to stadium",
    subtitle: "4 seasons · 400+ players auctioned · 50+ cities",
    accent: "cyan",
    active: true,
    order: 4,
  },
];

/**
 * Normalize a stored setting value into the list of ACTIVE banners sorted by
 * `order`. Accepts either the wrapped { banners: [...] } shape (what the admin
 * saves) or a bare array (defensive). Falls back to defaults when empty/unset.
 */
export function activeAppBanners(raw: unknown): AppBanner[] {
  let list: unknown;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "banners" in raw) {
    list = (raw as { banners: unknown }).banners;
  } else {
    list = raw;
  }
  const parsed = z.array(appBannerSchema).safeParse(list);
  const banners = parsed.success && parsed.data.length > 0 ? parsed.data : DEFAULT_APP_BANNERS;
  return banners
    .filter((b) => b.active)
    .sort((a, b) => a.order - b.order);
}

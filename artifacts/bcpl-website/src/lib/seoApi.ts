/**
 * SEO API client (public site meta + admin editors).
 *
 * Admin request plumbing (auth headers, sliding-session renewal, error
 * shape) is shared via adminHttp.ts — the single source of truth.
 */
import { BASE, adminReq } from "./adminHttp";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface SeoPage {
  path: string;
  label: string;
  title: string;
  description: string;
  ogImage: string;
  isDefault: boolean;
  updatedAt: string | null;
}

export interface SeoMeta {
  siteOrigin: string;
  defaultOgImage: string;
  pages: SeoPage[];
  gscCode: string | null;
  teamSlugs: string[];
}

/* ─── Public ─────────────────────────────────────────────────────────────── */

export async function fetchSeoMeta(): Promise<SeoMeta> {
  const res = await fetch(`${BASE}/api/seo/meta`);
  if (!res.ok) throw new Error("Failed to load SEO settings");
  return res.json() as Promise<SeoMeta>;
}

/** Cached variant for the public site (SiteMeta component) — never throws. */
let cachedPromise: Promise<SeoMeta | null> | null = null;
export function getSiteMetaCached(): Promise<SeoMeta | null> {
  if (!cachedPromise) cachedPromise = fetchSeoMeta().catch(() => null);
  return cachedPromise;
}

/* ─── Admin ──────────────────────────────────────────────────────────────── */

export function saveSeoPage(input: { path: string; title: string; description: string; ogImage?: string }) {
  return adminReq<{ success: boolean; page: SeoPage }>("PUT", "/seo/admin/page", input);
}

export function resetSeoPage(path: string) {
  return adminReq<{ success: boolean; page: SeoPage }>("PUT", "/seo/admin/page", { path, reset: true });
}

export function saveGscCode(code: string) {
  return adminReq<{ success: boolean; code: string | null }>("PUT", "/seo/admin/gsc", { code });
}

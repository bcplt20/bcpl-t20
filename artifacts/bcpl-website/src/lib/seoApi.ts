/**
 * SEO API client (public site meta + admin editors).
 *
 * NOTE: BASE and adminReq are deliberately DUPLICATED from api.ts (same
 * pattern as marketingApi.ts). Several queued tasks edit api.ts, and keeping
 * this module fully self-contained avoids merge conflicts. If the admin auth
 * scheme changes in api.ts, mirror it here.
 */

const BASE =
  (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") ||
  (import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, ""));
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "";
const ADMIN_TOKEN_KEY = "bcpl_admin_token_v1";

function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

async function adminReq<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAdminToken();
  if (token) headers["x-bcpl-admin-token"] = token;
  // Legacy fallback (mirrors api.ts adminReq)
  if (!token && ADMIN_KEY) headers["x-bcpl-admin"] = ADMIN_KEY;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

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

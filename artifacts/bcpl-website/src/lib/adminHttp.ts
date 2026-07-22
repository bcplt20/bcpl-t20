/**
 * Shared admin HTTP plumbing — SINGLE SOURCE OF TRUTH.
 *
 * Every admin API module (api.ts, marketingApi.ts, seoApi.ts,
 * adminToolsApi.ts, referralProgramApi.ts) imports from here.
 * Do NOT copy this logic into other modules: auth-scheme changes
 * (token header, legacy fallback, sliding-session renewal, error shape)
 * must be made in exactly one place — this file.
 */

/**
 * API base URL:
 * 1. VITE_API_URL wins when set (explicit override).
 * 2. Otherwise fall back to the app's base path — "/" in production
 *    (nginx routes /api), "/bcpl-website/" in the Replit dev preview
 *    (vite dev proxy routes it to the local API server).
 */
export const BASE =
  (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") ||
  (import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, ""));

export const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "";

// True when a legacy VITE_ADMIN_KEY is baked into the bundle (old header auth fallback).
export const hasLegacyAdminKey = () => Boolean(ADMIN_KEY);

const ADMIN_TOKEN_KEY = "bcpl_admin_token_v1";

export function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

export function saveAdminToken(token: string): void {
  try { localStorage.setItem(ADMIN_TOKEN_KEY, token); } catch {}
}

export function clearAdminToken(): void {
  try { localStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
}

/** True when an admin token is stored (used on panel load to try restoring the session). */
export function hasAdminToken(): boolean {
  return Boolean(getAdminToken());
}

/**
 * Sliding session: past half-life the server re-issues a fresh token on
 * any admin response — swap it in silently so active admins stay logged in.
 */
export function captureRenewedToken(res: Response): void {
  const renewed = res.headers.get("x-bcpl-admin-token-renewed");
  if (renewed) saveAdminToken(renewed);
}

/** Admin auth headers: session token, with legacy key fallback. */
export function adminHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  const token = getAdminToken();
  if (token) headers["x-bcpl-admin-token"] = token;
  // Legacy fallback for old header-key auth
  if (!token && ADMIN_KEY) headers["x-bcpl-admin"] = ADMIN_KEY;
  return headers;
}

/** Canonical admin JSON request: auth headers, renewal capture, error shape. */
export async function adminReq<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: adminHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  captureRenewedToken(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

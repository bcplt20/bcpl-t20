/**
 * Google Search Console — Search Analytics.
 *
 * Pulls real "clicks / impressions / CTR / average position" data (plus top
 * queries and top pages) for bcplt20.com straight from the Search Console
 * Search Analytics API, using a Google service account.
 *
 * We deliberately avoid the heavy `googleapis` dependency: `jsonwebtoken`
 * (already a dependency) signs an RS256 JWT, we exchange it for an OAuth2
 * access token at https://oauth2.googleapis.com/token, then POST to
 * webmasters/v3 searchAnalytics/query.
 *
 * Configuration (env):
 *   GSC_SERVICE_ACCOUNT_JSON – the full service-account JSON (as one string).
 *   GSC_SITE_URL             – property, e.g. "sc-domain:bcplt20.com"
 *                              (default) or "https://bcplt20.com/".
 *
 * Not configured / permission errors are surfaced as typed results so the
 * route can render a "setup needed" panel instead of a 500.
 */
import jwt from "jsonwebtoken";
import { logger } from "./logger";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export const DEFAULT_SITE_URL = "sc-domain:bcplt20.com";

export interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export type GscConfigResult =
  | { ok: true; account: ServiceAccount; siteUrl: string }
  | { ok: false; reason: "not_configured" | "invalid_json" | "missing_fields"; message: string };

/** Parse + validate the env config. Never throws. */
export function loadGscConfig(env: NodeJS.ProcessEnv = process.env): GscConfigResult {
  const raw = env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  const siteUrl = env.GSC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  if (!raw) {
    return { ok: false, reason: "not_configured", message: "GSC_SERVICE_ACCOUNT_JSON is not set" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json", message: "GSC_SERVICE_ACCOUNT_JSON is not valid JSON" };
  }
  const p = parsed as Partial<ServiceAccount>;
  if (!p.client_email || !p.private_key) {
    return { ok: false, reason: "missing_fields", message: "Service account JSON is missing client_email / private_key" };
  }
  return { ok: true, account: { client_email: p.client_email, private_key: p.private_key }, siteUrl };
}

/** Exchange a service-account JWT assertion for an OAuth2 access token. */
export async function getAccessToken(
  account: ServiceAccount,
  nowSec: number,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const assertion = jwt.sign(
    { scope: SCOPE },
    account.private_key,
    {
      algorithm: "RS256",
      issuer: account.client_email,
      subject: account.client_email,
      audience: TOKEN_URL,
      // jsonwebtoken sets iat/exp from these when given as numbers.
      expiresIn: 3600,
    },
  );

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`token exchange failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("token exchange returned no access_token");
  return json.access_token;
}

export interface QueryRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
}

/** POST one searchAnalytics/query. Returns the rows array (possibly empty). */
export async function runSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  query: SearchAnalyticsQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<QueryRow[]> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });
  if (res.status === 403) {
    const txt = await res.text().catch(() => "");
    const err = new Error(`GSC 403: ${txt.slice(0, 300)}`);
    (err as Error & { code?: string }).code = "gsc_forbidden";
    throw err;
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`searchAnalytics query failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  const json = (await res.json()) as { rows?: QueryRow[] };
  return json.rows ?? [];
}

/* ─── Date helpers (Search Console lags ~2–3 days; use full 28-day windows) ── */

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Given "today" (a Date), build the current-28-day window and the previous
 * 28-day window for delta comparison. Search Console data lags a few days,
 * so we end the current window 3 days before today.
 */
export function buildWindows(now: Date): {
  current: { startDate: string; endDate: string };
  previous: { startDate: string; endDate: string };
} {
  const LAG_DAYS = 3;
  const WINDOW = 28;
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - LAG_DAYS);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WINDOW - 1));
  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - (WINDOW - 1));
  return {
    current: { startDate: ymd(start), endDate: ymd(end) },
    previous: { startDate: ymd(prevStart), endDate: ymd(prevEnd) },
  };
}

export interface SummaryTotals {
  clicks: number;
  impressions: number;
  ctr: number;      // 0..1
  position: number; // average
}

/** Collapse an (undimensioned) rows array into a single totals object. */
export function totalsFromRows(rows: QueryRow[]): SummaryTotals {
  if (rows.length === 0) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  // With no dimensions GSC returns a single aggregate row.
  const r = rows[0];
  return {
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  };
}

export interface GscSummary {
  configured: true;
  siteUrl: string;
  range: { startDate: string; endDate: string };
  current: SummaryTotals;
  previous: SummaryTotals;
  delta: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  fetchedAt: string;
}

export type GscSummaryResult =
  | GscSummary
  | { configured: false; reason: string; message: string }
  | { configured: true; error: true; reason: string; message: string };

/**
 * Full summary fetch: current + previous totals (for deltas) plus top
 * queries and top pages. `now` is injected so tests are deterministic.
 */
export async function fetchGscSummary(
  now: Date,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<GscSummaryResult> {
  const cfg = loadGscConfig(env);
  if (!cfg.ok) {
    return { configured: false, reason: cfg.reason, message: cfg.message };
  }
  const windows = buildWindows(now);
  const nowSec = Math.floor(now.getTime() / 1000);
  try {
    const token = await getAccessToken(cfg.account, nowSec, fetchImpl);
    const [curr, prev, queries, pages] = await Promise.all([
      runSearchAnalytics(token, cfg.siteUrl, { ...windows.current }, fetchImpl),
      runSearchAnalytics(token, cfg.siteUrl, { ...windows.previous }, fetchImpl),
      runSearchAnalytics(token, cfg.siteUrl, { ...windows.current, dimensions: ["query"], rowLimit: 10 }, fetchImpl),
      runSearchAnalytics(token, cfg.siteUrl, { ...windows.current, dimensions: ["page"], rowLimit: 10 }, fetchImpl),
    ]);
    const current = totalsFromRows(curr);
    const previous = totalsFromRows(prev);
    return {
      configured: true,
      siteUrl: cfg.siteUrl,
      range: windows.current,
      current,
      previous,
      delta: {
        clicks: current.clicks - previous.clicks,
        impressions: current.impressions - previous.impressions,
        ctr: current.ctr - previous.ctr,
        // position: lower is better, so delta is previous - current
        position: previous.position - current.position,
      },
      topQueries: queries.map((r) => ({
        query: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
      })),
      topPages: pages.map((r) => ({
        page: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
      })),
      fetchedAt: now.toISOString(),
    };
  } catch (e) {
    const code = (e as Error & { code?: string }).code;
    if (code === "gsc_forbidden") {
      logger.warn({ err: e }, "GSC 403 — service account not added to the property?");
      return {
        configured: true, error: true, reason: "forbidden",
        message: "Google returned 403 — add the service-account email as a user on the Search Console property.",
      };
    }
    logger.error({ err: e }, "GSC summary fetch failed");
    return {
      configured: true, error: true, reason: "fetch_failed",
      message: e instanceof Error ? e.message : "Failed to fetch Search Console data",
    };
  }
}

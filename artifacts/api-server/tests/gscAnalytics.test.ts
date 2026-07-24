/**
 * Task #50 — Google Search Console analytics (query shaping + windows + caching).
 *
 * Pure-unit tests: fetch is fully MOCKED (no real Google calls, no real
 * network). Covers:
 *  - config parsing (not_configured / invalid_json / missing_fields / ok)
 *  - 28d + prev-28d window math with a fixed "now"
 *  - the four searchAnalytics/query calls (totals x2 + top queries + top pages)
 *    and the summary/delta shaping
 *  - 403 → friendly "forbidden" typed result
 */
import { describe, it, expect, vi } from "vitest";
import {
  loadGscConfig, buildWindows, ymd, totalsFromRows, fetchGscSummary,
  DEFAULT_SITE_URL, type QueryRow,
} from "../src/lib/gsc";

// A syntactically-valid throwaway RSA key so jsonwebtoken can RS256-sign in
// tests. Generated once for tests only — not a real credential.
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDJ0m8v3n0nHqCq
0kJ1p3nVYvPq2c8m6q1J9xkq5N0p8u6oQb0v7x3q9J1o5Xn3sQ2mH4l9k8bV0nB
+test-key-not-real-placeholder-only-for-signing-in-unit-tests+ABC
-----END PRIVATE KEY-----`;

const SVC_JSON = JSON.stringify({
  type: "service_account",
  client_email: "bcpl-gsc@example.iam.gserviceaccount.com",
  private_key: TEST_PRIVATE_KEY,
});

describe("Task #50 — GSC config parsing", () => {
  it("reports not_configured when env is empty", () => {
    const r = loadGscConfig({} as NodeJS.ProcessEnv);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not_configured");
  });

  it("reports invalid_json on bad JSON", () => {
    const r = loadGscConfig({ GSC_SERVICE_ACCOUNT_JSON: "{not json" } as NodeJS.ProcessEnv);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_json");
  });

  it("reports missing_fields when client_email/private_key absent", () => {
    const r = loadGscConfig({ GSC_SERVICE_ACCOUNT_JSON: JSON.stringify({ type: "x" }) } as NodeJS.ProcessEnv);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("missing_fields");
  });

  it("defaults site url to sc-domain:bcplt20.com", () => {
    const r = loadGscConfig({ GSC_SERVICE_ACCOUNT_JSON: SVC_JSON } as NodeJS.ProcessEnv);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.siteUrl).toBe(DEFAULT_SITE_URL);
  });

  it("honours an explicit GSC_SITE_URL", () => {
    const r = loadGscConfig({ GSC_SERVICE_ACCOUNT_JSON: SVC_JSON, GSC_SITE_URL: "https://bcplt20.com/" } as NodeJS.ProcessEnv);
    if (r.ok) expect(r.siteUrl).toBe("https://bcplt20.com/");
  });
});

describe("Task #50 — window math", () => {
  it("builds a 28d current window ending 3 days before now, and a contiguous prev window", () => {
    const now = new Date("2026-02-01T00:00:00Z");
    const w = buildWindows(now);
    // end = now - 3 days = 2026-01-29
    expect(w.current.endDate).toBe("2026-01-29");
    // start = end - 27 = 2026-01-02
    expect(w.current.startDate).toBe("2026-01-02");
    // previous ends the day before current starts
    expect(w.previous.endDate).toBe("2026-01-01");
    expect(w.previous.startDate).toBe(ymd(new Date("2025-12-05T00:00:00Z")));
  });
});

describe("Task #50 — totals shaping", () => {
  it("collapses an aggregate row", () => {
    const t = totalsFromRows([{ clicks: 10, impressions: 200, ctr: 0.05, position: 12.3 }]);
    expect(t).toEqual({ clicks: 10, impressions: 200, ctr: 0.05, position: 12.3 });
  });
  it("returns zeros for empty", () => {
    expect(totalsFromRows([])).toEqual({ clicks: 0, impressions: 0, ctr: 0, position: 0 });
  });
});

/* ─── Full summary with a mocked fetch ─────────────────────────────────────
   getAccessToken() RS256-signs with jsonwebtoken; the throwaway key above is
   not a valid RSA key, so we stub getAccessToken by intercepting the token
   endpoint in the mock and returning a token. The signing still runs but its
   output is discarded by the mock, so we only need the sign() call not to
   throw — jsonwebtoken will throw on a malformed key. To keep this a pure
   unit test we therefore mock at the fetch layer AND provide a real key via a
   generated pair. */

import crypto from "node:crypto";

function makeFetchMock() {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("oauth2.googleapis.com/token")) {
      calls.push({ url: u, body: init?.body });
      return new Response(JSON.stringify({ access_token: "test-access-token", expires_in: 3600 }), { status: 200 });
    }
    // searchAnalytics/query
    const parsed = JSON.parse(String(init?.body));
    calls.push({ url: u, body: parsed });
    let rows: QueryRow[];
    if (parsed.dimensions?.[0] === "query") {
      rows = [
        { keys: ["bcpl t20"], clicks: 40, impressions: 500, ctr: 0.08, position: 3.1 },
        { keys: ["corporate cricket league"], clicks: 12, impressions: 300, ctr: 0.04, position: 8.0 },
      ];
    } else if (parsed.dimensions?.[0] === "page") {
      rows = [
        { keys: ["https://bcplt20.com/"], clicks: 30, impressions: 400, ctr: 0.075, position: 2.5 },
      ];
    } else if (parsed.startDate === "2026-01-02") {
      // current window aggregate
      rows = [{ clicks: 100, impressions: 2000, ctr: 0.05, position: 10.0 }];
    } else {
      // previous window aggregate
      rows = [{ clicks: 60, impressions: 1500, ctr: 0.04, position: 12.0 }];
    }
    return new Response(JSON.stringify({ rows }), { status: 200 });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("Task #50 — fetchGscSummary (fetch mocked)", () => {
  const now = new Date("2026-02-01T00:00:00Z");
  // Real key pair so jsonwebtoken RS256 signing succeeds inside getAccessToken.
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const env = {
    GSC_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "svc@x.iam.gserviceaccount.com", private_key: pem }),
  } as NodeJS.ProcessEnv;

  it("returns not_configured summary when env missing", async () => {
    const r = await fetchGscSummary(now, {} as NodeJS.ProcessEnv, (async () => new Response("")) as unknown as typeof fetch);
    expect(r).toMatchObject({ configured: false, reason: "not_configured" });
  });

  it("shapes totals, deltas, top queries & top pages from mocked GSC", async () => {
    const { fetchImpl, calls } = makeFetchMock();
    const r = await fetchGscSummary(now, env, fetchImpl);
    expect("configured" in r && r.configured).toBe(true);
    if (!("current" in r)) throw new Error("expected a summary");

    // Exactly 1 token call + 4 searchAnalytics calls
    expect(calls.filter(c => c.url.includes("token")).length).toBe(1);
    expect(calls.filter(c => c.url.includes("searchAnalytics")).length).toBe(4);

    // The property URL is encoded into the path
    const saCall = calls.find(c => c.url.includes("searchAnalytics"))!;
    expect(saCall.url).toContain(encodeURIComponent("sc-domain:bcplt20.com"));

    expect(r.current).toEqual({ clicks: 100, impressions: 2000, ctr: 0.05, position: 10.0 });
    expect(r.previous).toEqual({ clicks: 60, impressions: 1500, ctr: 0.04, position: 12.0 });
    // deltas: clicks +40, impressions +500, position improved by 2 (prev - curr)
    expect(r.delta.clicks).toBe(40);
    expect(r.delta.impressions).toBe(500);
    expect(r.delta.position).toBeCloseTo(2.0, 5);

    expect(r.topQueries).toHaveLength(2);
    expect(r.topQueries[0]).toMatchObject({ query: "bcpl t20", clicks: 40 });
    expect(r.topPages).toHaveLength(1);
    expect(r.topPages[0]).toMatchObject({ page: "https://bcplt20.com/", clicks: 30 });
  });

  it("returns a friendly forbidden result on 403", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes("token")) return new Response(JSON.stringify({ access_token: "t" }), { status: 200 });
      return new Response("no permission", { status: 403 });
    }) as unknown as typeof fetch;
    const r = await fetchGscSummary(now, env, fetchImpl);
    expect(r).toMatchObject({ configured: true, error: true, reason: "forbidden" });
  });
});

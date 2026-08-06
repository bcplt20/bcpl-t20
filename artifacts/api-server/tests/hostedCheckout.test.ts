/**
 * Mobile / non-SDK hosted Cashfree checkout (app payment fix).
 *
 * Root cause covered: the app used to open the legacy
 * `https://payments.cashfree.com/order/#<sessionId>` URL, which is invalid for
 * v3 (`x-api-version: 2023-08-01`) payment sessions and made Cashfree error.
 * The fix serves GET /api/payment/checkout, which loads the v3 SDK and opens
 * the session with the `mode` matching the order's environment.
 *
 * These tests never create an order (createOrder hits REAL production Cashfree
 * in this workspace — see cashfree-verification memory) and never message anyone.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";

const { default: app } = await import("../src/app");
const { hostedCheckoutUrl } = await import("../src/routes/payment");
const { cashfreeMode } = await import("../src/lib/cashfree");

describe("cashfreeMode", () => {
  it("maps CASHFREE_ENV to the JS-SDK mode literal", () => {
    const m = cashfreeMode();
    expect(["production", "sandbox"]).toContain(m);
    expect(m).toBe(process.env.CASHFREE_ENV === "PROD" ? "production" : "sandbox");
  });
});

describe("hostedCheckoutUrl", () => {
  it("builds an absolute /api/payment/checkout URL carrying session + mode", () => {
    const url = hostedCheckoutUrl("session_ABC-123.def", "https://dev.example.com");
    expect(url).toMatch(/^https?:\/\/.+\/api\/payment\/checkout\?/);
    expect(url).toContain("session=session_ABC-123.def");
    expect(url).toContain(`mode=${cashfreeMode()}`);
  });

  it("uses the caller's own origin (never a stale API_URL host)", () => {
    const url = hostedCheckoutUrl("session_x", "https://player.bcplt20.com");
    expect(url.startsWith("https://player.bcplt20.com/api/payment/checkout?")).toBe(true);
  });

  it("does NOT use the broken legacy hosted-order URL", () => {
    expect(hostedCheckoutUrl("session_x", "https://dev.example.com")).not.toContain("payments.cashfree.com/order");
  });
});

describe("apiOriginFor", () => {
  it("prefers the caller's forwarded host + proto (Replit proxy)", async () => {
    const { apiOriginFor } = await import("../src/routes/payment");
    const req: any = {
      headers: { "x-forwarded-host": "dbf252d7.sisko.replit.dev", "x-forwarded-proto": "https" },
      get: () => undefined,
    };
    expect(apiOriginFor(req)).toBe("https://dbf252d7.sisko.replit.dev");
  });

  it("falls back to the Host header when no forwarded headers exist", async () => {
    const { apiOriginFor } = await import("../src/routes/payment");
    const req: any = { headers: {}, get: (h: string) => (h === "host" ? "player.bcplt20.com" : undefined) };
    expect(apiOriginFor(req)).toBe("https://player.bcplt20.com");
  });

  it("uses http for localhost hosts", async () => {
    const { apiOriginFor } = await import("../src/routes/payment");
    const req: any = { headers: {}, get: (h: string) => (h === "host" ? "localhost:8080" : undefined) };
    expect(apiOriginFor(req)).toBe("http://localhost:8080");
  });

  it("REJECTS a hostile Host header (payment-session disclosure) → canonical API_URL", async () => {
    const { apiOriginFor } = await import("../src/routes/payment");
    const req: any = { headers: {}, get: (h: string) => (h === "host" ? "attacker.example.com" : undefined) };
    const origin = apiOriginFor(req);
    expect(origin).not.toContain("attacker");
    expect(origin).toMatch(/^https:\/\//);
  });

  it("REJECTS a hostile X-Forwarded-Host even when Host is trusted", async () => {
    const { apiOriginFor } = await import("../src/routes/payment");
    const req: any = {
      headers: { "x-forwarded-host": "evil.attacker.io", "x-forwarded-proto": "https" },
      get: (h: string) => (h === "host" ? "bcplt20.com" : undefined),
    };
    expect(apiOriginFor(req)).not.toContain("attacker");
  });

  it("does not allow suffix tricks like notbcplt20.com", async () => {
    const { apiOriginFor } = await import("../src/routes/payment");
    const req: any = { headers: {}, get: (h: string) => (h === "host" ? "notbcplt20.com" : undefined) };
    expect(apiOriginFor(req)).not.toContain("notbcplt20");
  });
});

describe("GET /api/payment/checkout", () => {
  it("serves an HTML page that loads the v3 SDK and opens the session", async () => {
    const res = await request(app)
      .get("/api/payment/checkout")
      .query({ session: "session_ABC-123.def", mode: "production" });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("https://sdk.cashfree.com/js/v3/cashfree.js");
    expect(res.text).toContain("session_ABC-123.def");
    expect(res.text).toContain('"production"');
    expect(res.text).toContain("cashfree.checkout");
  });

  it("defaults an unknown mode to production", async () => {
    const res = await request(app)
      .get("/api/payment/checkout")
      .query({ session: "session_x", mode: "bogus" });
    expect(res.status).toBe(200);
    expect(res.text).toContain('"production"');
  });

  it("honours sandbox mode when requested", async () => {
    const res = await request(app)
      .get("/api/payment/checkout")
      .query({ session: "session_x", mode: "sandbox" });
    expect(res.status).toBe(200);
    expect(res.text).toContain('"sandbox"');
  });

  it("rejects a malformed / injection-y session id", async () => {
    const res = await request(app)
      .get("/api/payment/checkout")
      .query({ session: "<script>alert(1)</script>", mode: "production" });
    expect(res.status).toBe(400);
    expect(res.text).not.toContain("<script>alert(1)</script>");
  });

  it("rejects a missing session id", async () => {
    const res = await request(app).get("/api/payment/checkout");
    expect(res.status).toBe(400);
  });
});

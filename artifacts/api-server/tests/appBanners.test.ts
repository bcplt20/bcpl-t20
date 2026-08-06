/**
 * App banners — server-backed promo banners for the mobile app
 * (site_settings key "app_banners").
 *
 * Covers:
 *  - GET /api/app-banners (public): defaults when unset; active-only + sorted
 *    by order once the admin has saved a list; no auth required.
 *  - PUT /api/settings/admin/app_banners: CONTENT_TEAM allowed, FINANCE_TEAM
 *    blocked, unauthenticated blocked, zod validation (bad accent + unknown
 *    keys rejected).
 *  - Compliance: default copy contains no banned wording / superlatives.
 *
 * Role tokens are minted via signAdminToken (payload-only JWT, no DB row).
 * Only this file touches the "app_banners" settings key, so parallel suites
 * can't race it. No SMS/email is ever sent by these routes.
 */
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { siteSettingsTable } = await import("@workspace/db/schema");
const { signAdminToken } = await import("../src/routes/adminUsers");

const suffix = String(Date.now()).slice(-7);
const tokenFor = (role: string) =>
  signAdminToken({ email: "ab-" + role.toLowerCase() + "-" + suffix + "@t.bcpl", name: "Ab " + role, role });
const contentToken = tokenFor("CONTENT_TEAM");
const financeToken = tokenFor("FINANCE_TEAM");

const clearKey = () => db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, "app_banners"));

beforeAll(async () => { await clearKey(); });
afterAll(async () => { await clearKey(); });

describe("GET /api/app-banners (public defaults)", () => {
  it("returns server-side defaults when the key is unset", async () => {
    const res = await request(app).get("/api/app-banners");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.banners)).toBe(true);
    expect(res.body.banners.length).toBeGreaterThanOrEqual(4);
    // sorted by order
    const orders = res.body.banners.map((b: { order: number }) => b.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    // first default is the ₹299 registration banner
    expect(res.body.banners[0].title).toContain("₹299");
    expect(res.body.banners[0].ctaHref).toBe("/register");
  });

  it("default copy is compliance-clean (no banned wording / superlatives)", async () => {
    const res = await request(app).get("/api/app-banners");
    const blob = JSON.stringify(res.body).toLowerCase();
    for (const banned of ["selected", "scout", "bcci", "best", "guaranteed"]) {
      expect(blob).not.toContain(banned);
    }
  });
});

describe("app_banners admin write (role-gated, validated)", () => {
  it("FINANCE_TEAM cannot write app banners", async () => {
    const res = await request(app)
      .put("/api/settings/admin/app_banners")
      .set("x-bcpl-admin-token", financeToken)
      .send({ value: { banners: [] } });
    expect(res.status).toBe(403);
  });

  it("unauthenticated write is rejected", async () => {
    const res = await request(app)
      .put("/api/settings/admin/app_banners")
      .send({ value: { banners: [] } });
    expect([401, 403]).toContain(res.status);
  });

  it("invalid accent is rejected", async () => {
    const res = await request(app)
      .put("/api/settings/admin/app_banners")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: { banners: [{ id: "x1", title: "Hi", accent: "rainbow", active: true, order: 1 }] } });
    expect(res.status).toBe(400);
  });

  it("unknown extra keys are rejected (strict schema)", async () => {
    const res = await request(app)
      .put("/api/settings/admin/app_banners")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: { banners: [{ id: "x1", title: "Hi", active: true, order: 1, hacked: true }] } });
    expect(res.status).toBe(400);
  });

  it("non-URL imageUrl is rejected", async () => {
    const res = await request(app)
      .put("/api/settings/admin/app_banners")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: { banners: [{ id: "x1", title: "Hi", imageUrl: "not-a-url", active: true, order: 1 }] } });
    expect(res.status).toBe(400);
  });

  it("CONTENT_TEAM can save banners (round-trips)", async () => {
    const res = await request(app)
      .put("/api/settings/admin/app_banners")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: { banners: [
        { id: "a", title: "Second active", accent: "amber", active: true, order: 2 },
        { id: "b", title: "Hidden", accent: "cyan", active: false, order: 3 },
        { id: "c", title: "First active", ctaLabel: "Go", ctaHref: "/register", imageUrl: "https://bcpl-trial-videos.s3.ap-south-1.amazonaws.com/cms/banner-1.png", accent: "violet", active: true, order: 1 },
      ] } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/app-banners (after admin save)", () => {
  it("returns only ACTIVE banners sorted by order", async () => {
    const res = await request(app).get("/api/app-banners");
    expect(res.status).toBe(200);
    expect(res.body.banners).toHaveLength(2); // hidden one dropped
    expect(res.body.banners.map((b: { id: string }) => b.id)).toEqual(["c", "a"]);
    expect(res.body.banners[0].ctaHref).toBe("/register");
    // optional imageUrl round-trips to the app
    expect(res.body.banners[0].imageUrl).toBe("https://bcpl-trial-videos.s3.ap-south-1.amazonaws.com/cms/banner-1.png");
    // inactive banner never leaks
    expect(JSON.stringify(res.body)).not.toContain("Hidden");
  });
});

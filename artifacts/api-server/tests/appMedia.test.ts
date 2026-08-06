/**
 * App media — server-backed curated Photos & Videos for the mobile app
 * (site_settings key "app_media"). SEPARATE from the website gallery.
 *
 * Covers:
 *  - GET /api/app-media (public): empty default when unset; active-only +
 *    sorted by order once the admin saves; no auth required.
 *  - PUT /api/settings/admin/app_media: CONTENT_TEAM allowed, FINANCE_TEAM
 *    blocked, unauthenticated blocked; zod validation (bad kind, bad
 *    youtubeId, bad s3Key, item with no url/s3Key/youtubeId, unknown keys).
 *  - s3Key is presigned into a viewUrl on read and the raw key never leaks.
 *
 * Role tokens are minted via signAdminToken (payload-only JWT, no DB row).
 * Only this file touches the "app_media" settings key. No SMS/email is sent.
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
  signAdminToken({ email: "am-" + role.toLowerCase() + "-" + suffix + "@t.bcpl", name: "Am " + role, role });
const contentToken = tokenFor("CONTENT_TEAM");
const financeToken = tokenFor("FINANCE_TEAM");

const clearKey = () => db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, "app_media"));

beforeAll(async () => { await clearKey(); });
afterAll(async () => { await clearKey(); });

const put = (token: string | null, value: unknown) => {
  const r = request(app).put("/api/settings/admin/app_media");
  if (token) r.set("x-bcpl-admin-token", token);
  return r.send({ value });
};

describe("GET /api/app-media (public default)", () => {
  it("returns an empty list when the key is unset", async () => {
    const res = await request(app).get("/api/app-media");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});

describe("app_media admin write (role-gated, validated)", () => {
  it("FINANCE_TEAM cannot write app media", async () => {
    const res = await put(financeToken, { items: [] });
    expect(res.status).toBe(403);
  });

  it("unauthenticated write is rejected", async () => {
    const res = await put(null, { items: [] });
    expect([401, 403]).toContain(res.status);
  });

  it("invalid kind is rejected", async () => {
    const res = await put(contentToken, { items: [{ id: "x", kind: "gif", title: "T", url: "https://x/y.jpg", active: true, order: 1 }] });
    expect(res.status).toBe(400);
  });

  it("invalid youtubeId is rejected", async () => {
    const res = await put(contentToken, { items: [{ id: "x", kind: "video", title: "T", youtubeId: "tooshort", active: true, order: 1 }] });
    expect(res.status).toBe(400);
  });

  it("invalid s3Key prefix is rejected", async () => {
    const res = await put(contentToken, { items: [{ id: "x", kind: "photo", title: "T", s3Key: "secret/hack.jpg", active: true, order: 1 }] });
    expect(res.status).toBe(400);
  });

  it("an item with no url/s3Key/youtubeId is rejected", async () => {
    const res = await put(contentToken, { items: [{ id: "x", kind: "photo", title: "T", active: true, order: 1 }] });
    expect(res.status).toBe(400);
  });

  it("unknown extra keys are rejected (strict schema)", async () => {
    const res = await put(contentToken, { items: [{ id: "x", kind: "photo", title: "T", url: "https://x/y.jpg", active: true, order: 1, hacked: true }] });
    expect(res.status).toBe(400);
  });

  it("CONTENT_TEAM can save mixed items (round-trips)", async () => {
    const res = await put(contentToken, { items: [
      { id: "vid", kind: "video", title: "Auction stream", youtubeId: "Akv5fWqHXMQ", active: true, order: 2 },
      { id: "hidden", kind: "short", title: "Draft short", youtubeId: "abcdefghijk", active: false, order: 3 },
      { id: "pic", kind: "photo", title: "Trial photo", s3Key: "media/abc/1-photo.jpg", active: true, order: 1 },
      { id: "ext", kind: "photo", title: "External photo", url: "https://cdn.example/p.jpg", active: true, order: 4 },
    ] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/app-media (after admin save)", () => {
  it("returns only ACTIVE items sorted by order, s3Key presigned & hidden", async () => {
    const res = await request(app).get("/api/app-media");
    expect(res.status).toBe(200);
    // 3 active (hidden short dropped), sorted by order -> pic(1), vid(2), ext(4)
    expect(res.body.items.map((i: { id: string }) => i.id)).toEqual(["pic", "vid", "ext"]);

    const pic = res.body.items[0];
    // s3Key is presigned into a viewUrl on read; the raw s3Key field never
    // appears in the public payload (the presigned URL itself may embed the
    // object path, but consumers only ever see a fetchable url).
    expect(pic.url).toMatch(/^https?:\/\//);
    expect(pic.url).toMatch(/presigned|amazonaws/i);
    expect("s3Key" in pic).toBe(false);

    const vid = res.body.items[1];
    expect(vid.youtubeId).toBe("Akv5fWqHXMQ");

    // inactive item never leaks
    expect(JSON.stringify(res.body)).not.toContain("Draft short");
  });
});

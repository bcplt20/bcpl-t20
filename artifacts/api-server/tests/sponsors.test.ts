/**
 * Sponsors — server-backed sponsor list (site_settings key "sponsors").
 *
 * Covers:
 *  - PUT /api/settings/admin/sponsors: CONTENT_TEAM allowed, FINANCE_TEAM
 *    blocked, unauthenticated blocked, zod validation (base64 data-URL logo
 *    rejected, javascript: website rejected, unknown extra keys rejected)
 *  - GET /api/settings/admin/sponsors: full value (incl. amount) for allowed
 *    roles only
 *  - GET /api/sponsors (public): active-only + sanitized — no amount,
 *    contract, status or visibility ever leaks
 *  - GET /api/settings/sponsors: 404 — sponsors is NOT a public settings key
 *
 * Role tokens are minted via signAdminToken (payload-only JWT, no DB row) —
 * the same parallel-safe pattern as the stage6 suite. Only this file touches
 * the "sponsors" settings key, so parallel suites can't race it.
 */
import { describe, it, expect, afterAll } from "vitest";
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
  signAdminToken({ email: "spn-" + role.toLowerCase() + "-" + suffix + "@t.bcpl", name: "Spn " + role, role });
const contentToken = tokenFor("CONTENT_TEAM");
const financeToken = tokenFor("FINANCE_TEAM");

const sponsor = (over: Record<string, unknown> = {}) => ({
  id: "SP-T1",
  name: "Acme Corp",
  category: "Title Sponsor",
  logo: "",
  amount: "₹5L",
  website: "https://acme.example",
  contract: "2027-03-01",
  status: "active",
  visibility: "All Platforms",
  ...over,
});

afterAll(async () => {
  await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, "sponsors"));
});

describe("sponsors admin write (role-gated, validated)", () => {
  it("FINANCE_TEAM cannot write sponsors", async () => {
    const res = await request(app)
      .put("/api/settings/admin/sponsors")
      .set("x-bcpl-admin-token", financeToken)
      .send({ value: [sponsor()] });
    expect(res.status).toBe(403);
  });

  it("unauthenticated write is rejected", async () => {
    const res = await request(app)
      .put("/api/settings/admin/sponsors")
      .send({ value: [] });
    expect([401, 403]).toContain(res.status);
  });

  it("base64 data-URL logo is rejected (http(s) URLs only)", async () => {
    const res = await request(app)
      .put("/api/settings/admin/sponsors")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: [sponsor({ logo: "data:image/png;base64,AAAA" })] });
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/http/i);
  });

  it("javascript: website is rejected", async () => {
    const res = await request(app)
      .put("/api/settings/admin/sponsors")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: [sponsor({ website: "javascript:alert(1)" })] });
    expect(res.status).toBe(400);
  });

  it("unknown extra keys are rejected (strict schema)", async () => {
    const res = await request(app)
      .put("/api/settings/admin/sponsors")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: [sponsor({ hacked: true })] });
    expect(res.status).toBe(400);
  });

  it("CONTENT_TEAM can save sponsors (round-trips)", async () => {
    const res = await request(app)
      .put("/api/settings/admin/sponsors")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: [
        sponsor(),
        sponsor({ id: "SP-T2", name: "Hidden Co", status: "negotiating", website: "" }),
      ] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.value).toHaveLength(2);
  });

  it("admin GET returns the full value (incl. private amount) for CONTENT_TEAM", async () => {
    const res = await request(app)
      .get("/api/settings/admin/sponsors")
      .set("x-bcpl-admin-token", contentToken);
    expect(res.status).toBe(200);
    expect(res.body.value).toHaveLength(2);
    expect(res.body.value[0].amount).toBe("₹5L");
  });

  it("admin GET is blocked for FINANCE_TEAM", async () => {
    const res = await request(app)
      .get("/api/settings/admin/sponsors")
      .set("x-bcpl-admin-token", financeToken);
    expect(res.status).toBe(403);
  });
});

describe("public sponsor exposure", () => {
  it("GET /api/sponsors returns only ACTIVE sponsors with sanitized fields", async () => {
    const res = await request(app).get("/api/sponsors");
    expect(res.status).toBe(200);
    expect(res.body.sponsors).toHaveLength(1); // negotiating one hidden
    const s = res.body.sponsors[0];
    expect(s.name).toBe("Acme Corp");
    expect(Object.keys(s).sort()).toEqual(["category", "logo", "name", "website"]);
    expect(JSON.stringify(res.body)).not.toContain("₹5L");
    expect(JSON.stringify(res.body)).not.toContain("2027-03-01");
  });

  it("sponsors is NOT readable via the public settings endpoint", async () => {
    const res = await request(app).get("/api/settings/sponsors");
    expect(res.status).toBe(404);
  });
});

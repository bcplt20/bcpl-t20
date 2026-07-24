/**
 * Ops settings — founder_signature & trial_ops_defaults (site_settings keys).
 *
 * Covers:
 *  - founder_signature: MATCH_OPERATIONS can write/read; TRIAL_CITY_MANAGER /
 *    CONTENT_TEAM blocked; zod rejects http URLs, extra keys, non-object;
 *    empty image allowed (remove flow); NOT a public settings key.
 *  - trial_ops_defaults: TRIAL_CITY_MANAGER can write/read; CONTENT_TEAM
 *    blocked; length caps enforced; NOT a public settings key.
 *
 * Role tokens are minted via signAdminToken (payload-only JWT, no DB row) —
 * the same parallel-safe pattern as the sponsors suite. Only this file
 * touches these two settings keys, so parallel suites can't race them.
 */
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { inArray } from "drizzle-orm";

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
  signAdminToken({ email: "ops-" + role.toLowerCase() + "-" + suffix + "@t.bcpl", name: "Ops " + role, role });
const matchOpsToken = tokenFor("MATCH_OPERATIONS");
const trialMgrToken = tokenFor("TRIAL_CITY_MANAGER");
const contentToken  = tokenFor("CONTENT_TEAM");

/* 1x1 transparent PNG */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

afterAll(async () => {
  await db.delete(siteSettingsTable)
    .where(inArray(siteSettingsTable.key, ["founder_signature", "trial_ops_defaults"]));
});

describe("founder_signature (role-gated, validated)", () => {
  it("MATCH_OPERATIONS can save and read back the signature", async () => {
    const put = await request(app)
      .put("/api/settings/admin/founder_signature")
      .set("x-bcpl-admin-token", matchOpsToken)
      .send({ value: { image: TINY_PNG } });
    expect(put.status).toBe(200);

    const get = await request(app)
      .get("/api/settings/admin/founder_signature")
      .set("x-bcpl-admin-token", matchOpsToken);
    expect(get.status).toBe(200);
    expect(get.body.value?.image).toBe(TINY_PNG);
  });

  it("empty image is allowed (remove flow)", async () => {
    const put = await request(app)
      .put("/api/settings/admin/founder_signature")
      .set("x-bcpl-admin-token", matchOpsToken)
      .send({ value: { image: "" } });
    expect(put.status).toBe(200);
  });

  it("TRIAL_CITY_MANAGER cannot write the signature", async () => {
    const res = await request(app)
      .put("/api/settings/admin/founder_signature")
      .set("x-bcpl-admin-token", trialMgrToken)
      .send({ value: { image: TINY_PNG } });
    expect(res.status).toBe(403);
  });

  it("CONTENT_TEAM cannot read the signature", async () => {
    const res = await request(app)
      .get("/api/settings/admin/founder_signature")
      .set("x-bcpl-admin-token", contentToken);
    expect(res.status).toBe(403);
  });

  it("rejects a plain http URL (must be a data URL)", async () => {
    const res = await request(app)
      .put("/api/settings/admin/founder_signature")
      .set("x-bcpl-admin-token", matchOpsToken)
      .send({ value: { image: "https://example.com/sig.png" } });
    expect(res.status).toBe(400);
  });

  it("rejects unknown extra keys", async () => {
    const res = await request(app)
      .put("/api/settings/admin/founder_signature")
      .set("x-bcpl-admin-token", matchOpsToken)
      .send({ value: { image: TINY_PNG, extra: "nope" } });
    expect(res.status).toBe(400);
  });

  it("rejects a non-object value", async () => {
    const res = await request(app)
      .put("/api/settings/admin/founder_signature")
      .set("x-bcpl-admin-token", matchOpsToken)
      .send({ value: TINY_PNG });
    expect(res.status).toBe(400);
  });

  it("blocks unauthenticated writes", async () => {
    const res = await request(app)
      .put("/api/settings/admin/founder_signature")
      .send({ value: { image: TINY_PNG } });
    expect([401, 403]).toContain(res.status);
  });

  it("is NOT readable via the public settings endpoint", async () => {
    const res = await request(app).get("/api/settings/founder_signature");
    expect(res.status).toBe(404);
  });
});

describe("trial_ops_defaults (role-gated, validated)", () => {
  it("TRIAL_CITY_MANAGER can save and read back defaults", async () => {
    const put = await request(app)
      .put("/api/settings/admin/trial_ops_defaults")
      .set("x-bcpl-admin-token", trialMgrToken)
      .send({ value: { staff: "Ramesh Kumar", assessor: "Coach Verma" } });
    expect(put.status).toBe(200);

    const get = await request(app)
      .get("/api/settings/admin/trial_ops_defaults")
      .set("x-bcpl-admin-token", trialMgrToken);
    expect(get.status).toBe(200);
    expect(get.body.value).toEqual({ staff: "Ramesh Kumar", assessor: "Coach Verma" });
  });

  it("CONTENT_TEAM cannot write trial defaults", async () => {
    const res = await request(app)
      .put("/api/settings/admin/trial_ops_defaults")
      .set("x-bcpl-admin-token", contentToken)
      .send({ value: { staff: "X", assessor: "Y" } });
    expect(res.status).toBe(403);
  });

  it("rejects over-long names", async () => {
    const res = await request(app)
      .put("/api/settings/admin/trial_ops_defaults")
      .set("x-bcpl-admin-token", trialMgrToken)
      .send({ value: { staff: "x".repeat(100), assessor: "" } });
    expect(res.status).toBe(400);
  });

  it("is NOT readable via the public settings endpoint", async () => {
    const res = await request(app).get("/api/settings/trial_ops_defaults");
    expect(res.status).toBe(404);
  });
});

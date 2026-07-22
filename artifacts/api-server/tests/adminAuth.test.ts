/**
 * Admin auth lockdown tests (Task: keep admin APIs locked to outsiders).
 *
 * Covers:
 *  - requireAdmin behavior for every credential shape (header secret, panel JWT,
 *    garbage/expired JWT, missing creds, production-without-secret)
 *  - a representative real admin route (/api/admin/session/verify — auth-gated,
 *    DB-free) through the real Express app
 *  - a router-table guard that enumerates EVERY route under /api/admin and
 *    /api/admin-tools and fails if any is reachable without admin auth
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Deterministic test credentials — set BEFORE importing the app so nothing
// leaks in from the workspace environment.
const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { requireAdmin } = await import("../src/middlewares/adminAuth");
const { default: adminRouter } = await import("../src/routes/admin");
const { default: adminToolsRouter } = await import("../src/routes/adminTools");

const ORIGINAL_ENV = { ...process.env };
beforeEach(() => {
  process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
  process.env.SESSION_SECRET = TEST_SESSION_SECRET;
  process.env.NODE_ENV = "test";
});
afterEach(() => {
  process.env.ADMIN_SECRET = ORIGINAL_ENV.ADMIN_SECRET ?? TEST_ADMIN_SECRET;
  process.env.SESSION_SECRET = ORIGINAL_ENV.SESSION_SECRET ?? TEST_SESSION_SECRET;
  process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV;
});

/** Auth-gated, DB-free representative admin route. */
const VERIFY = "/api/admin/session/verify";

describe("requireAdmin on a real admin route", () => {
  it("no header → 403", async () => {
    const res = await request(app).get(VERIFY);
    expect(res.status).toBe(403);
  });

  it("wrong x-bcpl-admin value → 403", async () => {
    const res = await request(app).get(VERIFY).set("x-bcpl-admin", "wrong-secret");
    expect(res.status).toBe(403);
  });

  it("correct ADMIN_SECRET → 200", async () => {
    const res = await request(app).get(VERIFY).set("x-bcpl-admin", TEST_ADMIN_SECRET);
    expect(res.status).toBe(200);
  });

  it("valid admin-panel JWT ({admin:true}, SESSION_SECRET) → 200", async () => {
    const token = jwt.sign({ admin: true }, TEST_SESSION_SECRET, { expiresIn: "24h" });
    const res = await request(app).get(VERIFY).set("x-bcpl-admin-token", token);
    expect(res.status).toBe(200);
  });

  it("JWT without admin:true → 403", async () => {
    const token = jwt.sign({ admin: false }, TEST_SESSION_SECRET, { expiresIn: "24h" });
    const res = await request(app).get(VERIFY).set("x-bcpl-admin-token", token);
    expect(res.status).toBe(403);
  });

  it("expired JWT → 403", async () => {
    const token = jwt.sign({ admin: true }, TEST_SESSION_SECRET, { expiresIn: "-1h" });
    const res = await request(app).get(VERIFY).set("x-bcpl-admin-token", token);
    expect(res.status).toBe(403);
  });

  it("garbage JWT → 403", async () => {
    const res = await request(app).get(VERIFY).set("x-bcpl-admin-token", "not.a.jwt");
    expect(res.status).toBe(403);
  });

  it("JWT signed with the wrong secret → 403", async () => {
    const token = jwt.sign({ admin: true }, "some-other-secret", { expiresIn: "24h" });
    const res = await request(app).get(VERIFY).set("x-bcpl-admin-token", token);
    expect(res.status).toBe(403);
  });

  it("NODE_ENV=production with no ADMIN_SECRET set → 403 (never open)", async () => {
    delete process.env.ADMIN_SECRET;
    process.env.NODE_ENV = "production";
    const res = await request(app).get(VERIFY);
    expect(res.status).toBe(403);
  });

  it("sliding renewal: JWT past half-life gets x-bcpl-admin-token-renewed", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    // iat 20h ago, exp in 4h → well past half of the 24h life
    const token = jwt.sign(
      { admin: true, iat: nowSec - 20 * 3600, exp: nowSec + 4 * 3600 },
      TEST_SESSION_SECRET,
    );
    const res = await request(app).get(VERIFY).set("x-bcpl-admin-token", token);
    expect(res.status).toBe(200);
    expect(res.headers["x-bcpl-admin-token-renewed"]).toBeTruthy();
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Router-table guard: every route registered under the admin routers must be
 * unreachable without admin credentials. Enumerates routes from the router
 * stacks so newly added routes are covered automatically.
 * ──────────────────────────────────────────────────────────────────────────── */

type Layer = {
  route?: { path: string | string[]; methods?: Record<string, boolean>; stack?: Array<{ method?: string }> };
  handle?: { stack?: Layer[] };
  name?: string;
};

function collectRoutes(router: unknown, prefix: string): Array<{ method: string; path: string }> {
  const out: Array<{ method: string; path: string }> = [];
  const stack: Layer[] = (router as { stack: Layer[] }).stack ?? [];
  for (const layer of stack) {
    if (layer.route) {
      const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      const methods = layer.route.methods
        ? Object.keys(layer.route.methods).filter(m => layer.route!.methods![m])
        : (layer.route.stack ?? []).map(l => l.method).filter((m): m is string => !!m);
      for (const p of paths) {
        for (const m of new Set(methods)) {
          if (m === "_all" || m === "all") continue;
          out.push({ method: m, path: prefix + p });
        }
      }
    } else if (layer.handle?.stack) {
      // nested router — recurse (path reconstruction is best-effort)
      out.push(...collectRoutes(layer.handle, prefix));
    }
  }
  return out;
}

function hasRequireAdminBeforeRoutes(router: unknown, allowUnprotected: Set<string>): string[] {
  const stack: Layer[] = (router as { stack: Layer[] }).stack ?? [];
  const unprotected: string[] = [];
  let guarded = false;
  for (const layer of stack) {
    if (!layer.route && layer.name === requireAdmin.name) guarded = true;
    if (!layer.route && layer.handle === (requireAdmin as unknown)) guarded = true;
    if (layer.route && !guarded) {
      const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      for (const p of paths) if (!allowUnprotected.has(p)) unprotected.push(p);
    }
  }
  return unprotected;
}

describe("router-table guard: /api/admin* stays behind requireAdmin", () => {
  it("admin router: no route (except /session login) registered before requireAdmin", () => {
    expect(hasRequireAdminBeforeRoutes(adminRouter, new Set(["/session"]))).toEqual([]);
  });

  it("admin-tools router: no route registered before requireAdmin", () => {
    expect(hasRequireAdminBeforeRoutes(adminToolsRouter, new Set())).toEqual([]);
  });

  it("every enumerated /api/admin & /api/admin-tools route rejects unauthenticated requests", async () => {
    const routes = [
      ...collectRoutes(adminRouter, "/api/admin"),
      ...collectRoutes(adminToolsRouter, "/api/admin-tools"),
    ];
    expect(routes.length).toBeGreaterThan(10); // sanity: enumeration works

    const failures: string[] = [];
    for (const { method, path } of routes) {
      // The login endpoint is intentionally public (issues the JWT).
      if (method === "post" && path === "/api/admin/session") continue;
      const concrete = path.replace(/:[^/]+/g, "test-id");
      const res = await (request(app) as any)[method](concrete).set("x-bcpl-admin", "wrong");
      if (res.status !== 403) failures.push(`${method.toUpperCase()} ${concrete} → ${res.status}`);
    }
    expect(failures).toEqual([]);
  });
});

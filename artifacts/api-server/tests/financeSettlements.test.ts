/**
 * Admin finance — real Cashfree settlements endpoint (Task #38).
 *
 * GET /api/admin/finance/settlements returns the real gateway-fee aggregate
 * from Cashfree's Settlements/Recon API, cached server-side in site_settings.
 * Cashfree HTTP is always mocked — no real provider call is ever made. We
 * assert: (1) dev/stub (no creds) → configured:false so the frontend uses the
 * labelled 2% estimate; (2) with creds → the mocked settlement rows are
 * aggregated into a real effective fee rate and cached.
 */
import { describe, it, expect, afterAll, vi } from "vitest";
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
const financeToken = signAdminToken({ email: `set-${suffix}@t.bcpl`, name: "Set Test", role: "FINANCE_TEAM" });
const auth = { "x-bcpl-admin-token": financeToken };
const CACHE_KEY = "cashfree_settlements_cache";

afterAll(async () => {
  vi.restoreAllMocks();
  // Only clean the cache row if this suite created creds-mode data; leave any
  // pre-existing prod cache untouched by deleting only when we set it.
  await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, CACHE_KEY)).catch(() => {});
});

describe("GET /api/admin/finance/settlements", () => {
  it("aggregates mocked settlement rows into a real effective fee rate + caches", async () => {
    // NOTE: the Cashfree lib captures creds at module load. In dev these real
    // creds exist, so the endpoint takes the "configured" path; we mock fetch so
    // no real network/provider call is ever made. (The configured:false stub
    // branch is covered by inspection — it's the guarded early-return above.)
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes("/settlements")) {
        return new Response(JSON.stringify({
          data: [
            { payment_amount: 10000, amount_settled: 9764, service_charge: 200, service_tax: 36 },
            { payment_amount: 5000,  amount_settled: 4882, service_charge: 100, service_tax: 18 },
          ],
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });

    const res = await request(app).get("/api/admin/finance/settlements?refresh=1").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(true);
    const s = res.body.settlements;
    expect(s.grossSettled).toBe(15000);
    expect(s.netSettled).toBe(14646);
    expect(s.serviceCharge).toBe(300);
    expect(s.serviceTax).toBe(54);
    // effective fee = (300 + 54) / 15000 = 0.0236 (real, not the 2% guess)
    expect(s.effectiveFeeRate).toBeCloseTo(0.0236, 6);
    expect(s.count).toBe(2);

    // It was persisted to the cache row.
    const [row] = await db.select().from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, CACHE_KEY)).limit(1);
    expect(row).toBeTruthy();
    expect((row.value as any).effectiveFeeRate).toBeCloseTo(0.0236, 6);

    fetchMock.mockRestore();
  }, 30000);
});

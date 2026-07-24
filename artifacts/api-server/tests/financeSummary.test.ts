/**
 * Admin finance read-model + Cashfree backfill.
 *
 *  - GET /api/admin/finance/summary aggregates success payments by
 *    payment_group (null => "unknown") per phase + combined, and lists
 *    amount_mismatch payments as "on hold" with a total.
 *  - POST /api/admin-tools/payments/backfill-methods fills payment_group /
 *    payment_method_detail from Cashfree for success rows still missing them.
 *    Cashfree HTTP is mocked; assertions check the DB end-state + counts.
 *
 * DB end-state assertions (repo convention). All seed rows are namespaced by a
 * per-run suffix and cleaned up in afterAll so parallel agents sharing the dev
 * DB are unaffected.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;
// Real-looking Cashfree creds so hasCashfreeCredentials() is true and the
// backfill actually calls out (to our mocked fetch, never the network).
process.env.CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "test_app_id";
process.env.CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "test_secret_key";

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, phase1PaymentsTable, phase2PaymentsTable } =
  await import("@workspace/db/schema");
const { ensurePaymentMethodColumns } = await import("../src/routes/payment");
const { signAdminToken } = await import("../src/routes/adminUsers");

const suffix = String(Date.now()).slice(-7);
const financeToken = signAdminToken({ email: `fin-${suffix}@t.bcpl`, name: "Fin Test", role: "FINANCE_TEAM" });
const auth = { "x-bcpl-admin-token": financeToken };

let userId = "";
let regId = "";
// order ids namespaced so the summary/backfill assertions only see our rows
const oUpi   = `p1_fintest_upi_${suffix}`;
const oCard  = `p1_fintest_card_${suffix}`;
const oNull  = `p1_fintest_null_${suffix}`;   // success but no group → backfill target + "unknown" bucket
const oHold  = `p1_fintest_hold_${suffix}`;   // amount_mismatch → on hold
const oP2Upi = `p2_fintest_upi_${suffix}`;

beforeAll(async () => {
  await ensurePaymentMethodColumns();

  [{ id: userId }] = await db.insert(usersTable)
    .values({ name: `Fin Test ${suffix}`, phone: `81${suffix}99`.slice(0, 12), email: `finuser-${suffix}@t.bcpl`, isVerified: true })
    .returning({ id: usersTable.id });
  [{ id: regId }] = await db.insert(registrationsTable)
    .values({ userId, role: "bat", trialCity: "Delhi", regNumber: `BCPL-FIN-${suffix}` })
    .returning({ id: registrationsTable.id });

  await db.insert(phase1PaymentsTable).values([
    { registrationId: regId, amount: "800",  cashfreeOrderId: oUpi,  status: "success", paymentGroup: "upi" },
    { registrationId: regId, amount: "1200", cashfreeOrderId: oCard, status: "success", paymentGroup: "credit_card" },
    { registrationId: regId, amount: "500",  cashfreeOrderId: oNull, status: "success", paymentGroup: null },
    { registrationId: regId, amount: "999",  cashfreeOrderId: oHold, status: "amount_mismatch", paymentGroup: null },
  ]);
  await db.insert(phase2PaymentsTable).values([
    { registrationId: regId, amount: "2000", cashfreeOrderId: oP2Upi, status: "success", paymentGroup: "upi" },
  ]);
});

afterAll(async () => {
  vi.restoreAllMocks();
  if (regId) await db.delete(phase1PaymentsTable).where(eq(phase1PaymentsTable.registrationId, regId));
  if (regId) await db.delete(phase2PaymentsTable).where(eq(phase2PaymentsTable.registrationId, regId));
  if (regId) await db.delete(registrationsTable).where(eq(registrationsTable.id, regId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
});

/** Pull our seeded groups out of a summary split array (ignores other agents' rows). */
const pick = (rows: Array<{ group: string; amount: number; count: number }>, group: string) =>
  rows.find(r => r.group === group);

describe("GET /api/admin/finance/summary", () => {
  it("aggregates success payments by group (null => unknown) and lists on-hold", async () => {
    const res = await request(app).get("/api/admin/finance/summary").set(auth);
    expect(res.status).toBe(200);

    // Phase 1 split contains our upi / credit_card / unknown buckets with right amounts.
    const p1 = res.body.phase1.splitByGroup as Array<{ group: string; amount: number; count: number }>;
    expect(pick(p1, "upi")?.amount).toBe(800);
    expect(pick(p1, "credit_card")?.amount).toBe(1200);
    expect(pick(p1, "unknown")?.amount).toBe(500); // the null-group success row
    expect(pick(p1, "unknown")?.count).toBe(1);

    // Phase 2 split has the ₹2000 UPI payment.
    const p2 = res.body.phase2.splitByGroup as Array<{ group: string; amount: number; count: number }>;
    expect(pick(p2, "upi")?.amount).toBe(2000);

    // Combined UPI merges P1 (800) + P2 (2000) = 2800.
    const combined = res.body.combined.splitByGroup as Array<{ group: string; amount: number; count: number }>;
    expect(pick(combined, "upi")?.amount).toBe(2800);

    // On-hold list contains our amount_mismatch row (₹999) with the joined name.
    const hold = (res.body.onHold as Array<{ orderId: string; amount: number; name: string | null }>)
      .find(h => h.orderId === oHold);
    expect(hold).toBeTruthy();
    expect(hold!.amount).toBe(999);
    expect(hold!.name).toBe(`Fin Test ${suffix}`);
    // amount_mismatch is NOT counted as collected revenue.
    expect(pick(p1, "unknown")?.count).toBe(1); // only the success null row, not the hold row
  });
});

describe("POST /api/admin-tools/payments/backfill-methods", () => {
  it("fills payment_group/detail from Cashfree for null-group success rows", async () => {
    // Mock Cashfree GET /orders/{id}/payments — only our null-group order matters.
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes(`/orders/${oNull}/payments`)) {
        return new Response(JSON.stringify([
          { payment_status: "SUCCESS", cf_payment_id: "cf_bf_1", payment_amount: 500, payment_currency: "INR",
            payment_group: "net_banking", payment_method: { netbanking: { netbanking_bank_name: "HDFC Bank" } } },
        ]), { status: 200, headers: { "content-type": "application/json" } });
      }
      // Any other order id (from parallel agents' rows): empty → skipped.
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    });

    const res = await request(app).post("/api/admin-tools/payments/backfill-methods").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.stubMode).toBeUndefined();
    expect(res.body.updated).toBeGreaterThanOrEqual(1);

    // The previously-null row now carries the backfilled method.
    const [row] = await db.select().from(phase1PaymentsTable)
      .where(eq(phase1PaymentsTable.cashfreeOrderId, oNull)).limit(1);
    expect(row.paymentGroup).toBe("net_banking");
    expect(row.paymentMethodDetail).toBe("HDFC Bank");

    // The amount_mismatch row is NOT a backfill target (status filter).
    const [held] = await db.select().from(phase1PaymentsTable)
      .where(eq(phase1PaymentsTable.cashfreeOrderId, oHold)).limit(1);
    expect(held.paymentGroup).toBeNull();

    fetchMock.mockRestore();
  }, 30000);
});

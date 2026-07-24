/**
 * Reconcile-sweep integrity (security audit — no bypass of the amount gate):
 * the periodic pending-payment sweep must enforce the SAME amount/currency
 * validation as verify/webhook before promoting a payment to success.
 *
 * Cashfree API calls are mocked (no network); the DB is real. No SMS/email
 * can fire: reconcile itself never notifies, and the mismatch path returns
 * before any activation.
 */
import { describe, it, expect, vi, afterAll } from "vitest";
import { eq } from "drizzle-orm";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";

const cf = vi.hoisted(() => ({
  orderStatus: "PAID",
  pay: null as null | { status: string; paymentId?: string; amount?: number; currency?: string },
}));

vi.mock("../src/lib/cashfree", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/cashfree")>();
  return {
    ...actual,
    hasCashfreeCredentials: () => true,
    getOrderStatus: async () => ({ orderStatus: cf.orderStatus }),
    getPaymentStatus: async () => cf.pay,
  };
});

const { reconcileOne } = await import("../src/lib/reconcilePayments");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, phase1PaymentsTable } =
  await import("@workspace/db/schema");

const suffix = String(Date.now()).slice(-7);
const phone = "94" + String(Date.now()).slice(-8); // unique per run, never messaged
const email = "recint-" + suffix + "@test.bcpl";
const orderId = "p1_rectest_" + suffix;

let userId = "";
let regId = "";

async function payRow() {
  const [row] = await db.select().from(phase1PaymentsTable)
    .where(eq(phase1PaymentsTable.cashfreeOrderId, orderId)).limit(1);
  return row;
}
async function regRow() {
  const [row] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.id, regId)).limit(1);
  return row;
}
async function resetPending() {
  await db.update(phase1PaymentsTable)
    .set({ status: "pending", paidAt: null, cashfreePaymentId: null })
    .where(eq(phase1PaymentsTable.cashfreeOrderId, orderId));
}

afterAll(async () => {
  if (regId) await db.delete(phase1PaymentsTable).where(eq(phase1PaymentsTable.registrationId, regId));
  if (regId) await db.delete(registrationsTable).where(eq(registrationsTable.id, regId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
});

describe("reconcile sweep enforces the payment amount gate", () => {
  it("seeds a stale pending payment", async () => {
    [{ id: userId }] = await db.insert(usersTable)
      .values({ name: "Reconcile Integrity Test", phone, email, isVerified: true })
      .returning({ id: usersTable.id });
    [{ id: regId }] = await db.insert(registrationsTable)
      .values({ userId, role: "bat", trialCity: "Delhi" })
      .returning({ id: registrationsTable.id });
    await db.insert(phase1PaymentsTable).values({
      registrationId: regId, amount: "800", cashfreeOrderId: orderId, status: "pending",
    });
    expect((await payRow()).status).toBe("pending");
  });

  it("defers (no activation) when the order is PAID but payment details are unavailable", async () => {
    cf.orderStatus = "PAID";
    cf.pay = null;
    await reconcileOne(1, orderId, "800");
    const pay = await payRow();
    expect(pay.status).toBe("pending"); // untouched — retried next sweep
    expect(pay.paidAt).toBeNull();
    expect((await regRow()).phase1Status).toBe("pending");
  });

  it("flags amount_mismatch and does NOT activate on a short-paid amount", async () => {
    cf.pay = { status: "SUCCESS", paymentId: "cf_rec_bad", amount: 5, currency: "INR" };
    await reconcileOne(1, orderId, "800");
    const pay = await payRow();
    expect(pay.status).toBe("amount_mismatch");
    expect(pay.paidAt).toBeNull();
    expect((await regRow()).phase1Status).toBe("pending"); // no activation, no player number
  });

  it("flags a non-INR currency even when the number matches", async () => {
    await resetPending();
    cf.pay = { status: "SUCCESS", paymentId: "cf_rec_fx", amount: 800, currency: "USD" };
    await reconcileOne(1, orderId, "800");
    expect((await payRow()).status).toBe("amount_mismatch");
    expect((await regRow()).phase1Status).toBe("pending");
  });

  it("promotes to success (and only then activates) when amount and currency match", async () => {
    await resetPending();
    cf.pay = { status: "SUCCESS", paymentId: "cf_rec_ok", amount: 800, currency: "INR" };
    await reconcileOne(1, orderId, "800");
    const pay = await payRow();
    expect(pay.status).toBe("success");
    expect(pay.paidAt).not.toBeNull();
    expect(pay.cashfreePaymentId).toBe("cf_rec_ok");
    const reg = await regRow();
    expect(reg.phase1Status).toBe("payment_done");
    expect(reg.regNumber).toMatch(/^BCPL-/); // reconciled payer got a player number
  });
});

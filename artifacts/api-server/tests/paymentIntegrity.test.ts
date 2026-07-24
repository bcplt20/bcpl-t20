/**
 * Payment amount integrity (security audit — amount-tampering guard):
 *  - paymentAmountMismatch unit cases (stub passthrough, INR check, rounding)
 *  - webhook with a VALID signature but WRONG amount → payment row flagged
 *    reconciliation_required, registration NOT activated (end-to-end)
 *
 * The webhook test signs with CASHFREE_SECRET_KEY from env (the same secret
 * the handler verifies against) — the value itself is never printed. No
 * notification can fire: the mismatch branch returns before any notify call.
 */
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";

const { default: app } = await import("../src/app");
const { paymentAmountMismatch } = await import("../src/routes/payment");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable, phase1PaymentsTable } =
  await import("@workspace/db/schema");

const suffix = String(Date.now()).slice(-7);
const phone = "98" + String(Date.now()).slice(-8); // unique per run, never messaged
const email = `payint-${suffix}@test.bcpl`;
const orderId = `p1_paytest_${suffix}`;

let userId = "";
let regId = "";

afterAll(async () => {
  if (regId) await db.delete(phase1PaymentsTable).where(eq(phase1PaymentsTable.registrationId, regId));
  if (regId) await db.delete(registrationsTable).where(eq(registrationsTable.id, regId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
});

describe("paymentAmountMismatch (unit)", () => {
  it("passes when the gateway reports no amount (stub/dev mode)", () => {
    expect(paymentAmountMismatch({}, "800")).toBe(false);
    expect(paymentAmountMismatch({ currency: "INR" }, "800")).toBe(false);
  });

  it("passes on exact match in INR (rupee-rounded)", () => {
    expect(paymentAmountMismatch({ amount: 800, currency: "INR" }, "800")).toBe(false);
    expect(paymentAmountMismatch({ amount: 800.0, currency: "INR" }, "800.00")).toBe(false);
    expect(paymentAmountMismatch({ amount: 944 }, "944")).toBe(false); // currency absent → amount-only check
  });

  it("flags a tampered / short-paid / overpaid amount", () => {
    expect(paymentAmountMismatch({ amount: 1, currency: "INR" }, "800")).toBe(true);
    expect(paymentAmountMismatch({ amount: 799, currency: "INR" }, "800")).toBe(true);
    expect(paymentAmountMismatch({ amount: 8000, currency: "INR" }, "800")).toBe(true);
  });

  it("flags a non-INR currency even when the number matches", () => {
    expect(paymentAmountMismatch({ amount: 800, currency: "USD" }, "800")).toBe(true);
  });
});

const HAS_CF_SECRET = !!process.env.CASHFREE_SECRET_KEY;

describe.skipIf(!HAS_CF_SECRET)("webhook amount-mismatch flow (integration)", () => {
  it("acks the webhook, flags reconciliation_required, does NOT activate the registration", async () => {
    [{ id: userId }] = await db.insert(usersTable)
      .values({ name: "Pay Integrity Test", phone, email, isVerified: true })
      .returning({ id: usersTable.id });
    [{ id: regId }] = await db.insert(registrationsTable)
      .values({ userId, role: "bat", trialCity: "Delhi" })
      .returning({ id: registrationsTable.id });
    await db.insert(phase1PaymentsTable).values({
      registrationId: regId, amount: "800", cashfreeOrderId: orderId, status: "pending",
    });

    // Valid signature, tampered amount: gateway says ₹1 paid against an ₹800 fee.
    const payload = JSON.stringify({
      data: {
        order:   { order_id: orderId },
        payment: { payment_status: "SUCCESS", cf_payment_id: "cf_test_mismatch",
                   payment_amount: 1, payment_currency: "INR" },
      },
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = crypto.createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
      .update(ts + payload).digest("base64");

    const res = await request(app).post("/api/payment/webhook")
      .set("x-webhook-timestamp", ts)
      .set("x-webhook-signature", sig)
      .set("content-type", "application/json")
      .send(payload);

    expect(res.status).toBe(200); // always ack so Cashfree stops retrying
    expect(res.body.reconciliation).toBe(true);

    const [pay] = await db.select().from(phase1PaymentsTable)
      .where(eq(phase1PaymentsTable.cashfreeOrderId, orderId)).limit(1);
    expect(pay.status).toBe("amount_mismatch");
    expect(pay.paidAt).toBeNull(); // never recorded as paid

    const [reg] = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.id, regId)).limit(1);
    expect(reg.phase1Status).toBe("pending"); // NOT activated, no player number, no notifications
  });
});

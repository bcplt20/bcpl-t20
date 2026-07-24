// Periodic sweep: reconcile stale 'pending' payment rows against Cashfree.
// Abandoned checkouts become 'failed'; missed webhook successes become 'success'
// with paidAt set and registration status synced (mirrors the webhook handler).
//
// Integrity: this path enforces the SAME amount/currency gate as verify/webhook
// before promoting anything — otherwise reconcile would be a bypass around the
// tamper check. Mismatches are flagged 'amount_mismatch' (manual review, never
// swept, never activated). A PAID order whose payment details can't be fetched
// is deferred to the next sweep rather than activated unverified.
import { db } from "@workspace/db";
import {
  registrationsTable,
  phase1PaymentsTable,
  phase2PaymentsTable,
} from "@workspace/db/schema";
import { eq, and, or, isNull, lt } from "drizzle-orm";
import { getOrderStatus, getPaymentStatus, hasCashfreeCredentials } from "./cashfree";
import { paymentAmountMismatch, flagP1AmountMismatch, flagP2AmountMismatch } from "../routes/payment";
import { assignRegNumber } from "../routes/register";
import { logger } from "./logger";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type Phase = 1 | 2;

async function markSuccess(phase: Phase, orderId: string, paymentId?: string) {
  const table = phase === 1 ? phase1PaymentsTable : phase2PaymentsTable;
  const updated = await db.update(table)
    .set({ status: "success", cashfreePaymentId: paymentId ?? null, paidAt: new Date() })
    .where(and(eq(table.cashfreeOrderId, orderId), eq(table.status, "pending")))
    .returning({ registrationId: table.registrationId });

  if (!updated[0]) return;

  if (phase === 1) {
    await db.update(registrationsTable)
      .set({ phase1Status: "payment_done", updatedAt: new Date() })
      .where(and(
        eq(registrationsTable.id, updated[0].registrationId),
        eq(registrationsTable.phase1Status, "pending"),
      ));
    // Reconciled successes must get their sequential player number too — the
    // player DID pay, they just missed the webhook/verify path.
    try { await assignRegNumber(updated[0].registrationId); }
    catch (e) { logger.error({ err: e, orderId }, "Reg number assignment failed during reconcile"); }
  } else {
    await db.update(registrationsTable)
      .set({ phase2Status: "payment_done", updatedAt: new Date() })
      .where(and(
        eq(registrationsTable.id, updated[0].registrationId),
        or(isNull(registrationsTable.phase2Status), eq(registrationsTable.phase2Status, "pending")),
      ));
  }
  logger.info({ phase, orderId }, "Reconciled missed successful payment");
}

async function markFailed(phase: Phase, orderId: string) {
  const table = phase === 1 ? phase1PaymentsTable : phase2PaymentsTable;
  await db.update(table)
    .set({ status: "failed" })
    .where(and(eq(table.cashfreeOrderId, orderId), eq(table.status, "pending")));
  logger.info({ phase, orderId }, "Marked abandoned payment as failed");
}

async function flagMismatch(
  phase: Phase, orderId: string,
  gw: { amount?: number; currency?: string }, expected: string,
) {
  if (phase === 1) await flagP1AmountMismatch(orderId, gw, expected);
  else await flagP2AmountMismatch(orderId, gw, expected);
}

// Exported for regression tests (tests/reconcileIntegrity.test.ts) — tests call
// it with ONE seeded order so a suite never sweeps unrelated dev-DB rows.
export async function reconcileOne(phase: Phase, orderId: string, expectedAmount: string) {
  const order = await getOrderStatus(orderId);
  if (!order) return; // Cashfree unreachable or unknown — leave untouched, retry next sweep

  if (order.orderStatus === "PAID") {
    // Missed webhook — fetch payment details and confirm THROUGH the amount gate.
    const pay = await getPaymentStatus(orderId);
    if (!pay) {
      // Order says PAID but the payment record is unavailable: never activate
      // on an unverified amount — leave pending and retry next sweep.
      logger.warn({ phase, orderId }, "Reconcile: order PAID but payment details unavailable; deferring");
      return;
    }
    if (paymentAmountMismatch(pay, expectedAmount)) {
      await flagMismatch(phase, orderId, pay, expectedAmount);
      return;
    }
    await markSuccess(phase, orderId, pay.status === "SUCCESS" ? pay.paymentId : undefined);
    return;
  }

  if (order.orderStatus === "EXPIRED" || order.orderStatus === "TERMINATED") {
    await markFailed(phase, orderId);
    return;
  }

  // ACTIVE but older than the cutoff: only fail once Cashfree confirms no successful payment
  const pay = await getPaymentStatus(orderId);
  if (pay?.status === "SUCCESS") {
    if (paymentAmountMismatch(pay, expectedAmount)) {
      await flagMismatch(phase, orderId, pay, expectedAmount);
      return;
    }
    await markSuccess(phase, orderId, pay.paymentId);
  } else if (pay) {
    await markFailed(phase, orderId);
  }
}

export async function reconcileAbandonedPayments() {
  if (!hasCashfreeCredentials()) {
    logger.warn("Payment reconciliation skipped: Cashfree credentials not configured");
    return;
  }

  const cutoff = new Date(Date.now() - ONE_DAY_MS);

  const [p1, p2] = await Promise.all([
    db.select({ orderId: phase1PaymentsTable.cashfreeOrderId, amount: phase1PaymentsTable.amount })
      .from(phase1PaymentsTable)
      .where(and(eq(phase1PaymentsTable.status, "pending"), lt(phase1PaymentsTable.createdAt, cutoff)))
      .limit(200),
    db.select({ orderId: phase2PaymentsTable.cashfreeOrderId, amount: phase2PaymentsTable.amount })
      .from(phase2PaymentsTable)
      .where(and(eq(phase2PaymentsTable.status, "pending"), lt(phase2PaymentsTable.createdAt, cutoff)))
      .limit(200),
  ]);

  if (p1.length === 0 && p2.length === 0) return;
  logger.info({ phase1: p1.length, phase2: p2.length }, "Reconciling stale pending payments");

  for (const { orderId, amount } of p1) {
    try { await reconcileOne(1, orderId, String(amount)); }
    catch (e) { logger.error({ err: e, orderId }, "Phase 1 reconcile failed"); }
  }
  for (const { orderId, amount } of p2) {
    try { await reconcileOne(2, orderId, String(amount)); }
    catch (e) { logger.error({ err: e, orderId }, "Phase 2 reconcile failed"); }
  }
}

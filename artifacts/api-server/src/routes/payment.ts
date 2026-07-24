import { draftOnPaymentEvent } from "./drafts";
import { Router, type Request } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import {
  registrationsTable, usersTable,
  phase1PaymentsTable, phase2PaymentsTable,
} from "@workspace/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { createOrder, getPaymentStatus } from "../lib/cashfree";
import { sendEmail, tplPhase1Receipt, tplPhase2Receipt } from "../lib/email";
import { sendSms } from "../lib/sms";
import { sendWhatsApp, WA } from "../lib/whatsapp";
import { logNotifications } from "../lib/notify";
import { writeAudit } from "../lib/audit";
import { FEES, assignRegNumber } from "./register";
import { isAgeEligible, AGE_INELIGIBLE_MESSAGE } from "../lib/age";
import { getPhase1Config } from "../lib/phase1Config";
import { z } from "zod";

const router = Router();

const SITE_URL = process.env.SITE_URL || "https://elite-user-experience.replit.app/bcpl-website";
const API_URL  = process.env.API_URL  || "https://elite-user-experience.replit.app";

async function notifyPhase1Success(
  user: { id: string; name: string; email: string; phone: string },
  reg:  { id: string; role: string; trialCity: string | null; regNumber?: string | null },
  amount: number,
  windowDays = 15,
) {
  const regNo = reg.regNumber ?? reg.id.slice(0, 8).toUpperCase();
  const email = tplPhase1Receipt(user.name, reg.role, amount, regNo, reg.trialCity ?? "TBD");
  const smsMsg = "Welcome to BCPL T20 Season 5! Registered as " + reg.role.toUpperCase() + ". Reg No: " + regNo + ". Upload trial video within " + windowDays + " days. #OfficeSeStadiumtak";

  // Send on all channels in parallel (helpers never throw), then record the
  // REAL outcome of each attempt in notification_logs.
  const [em, sm, wa] = await Promise.all([
    sendEmail({ to: user.email, toName: user.name, ...email }),
    sendSms(user.phone, smsMsg),
    sendWhatsApp({ phone: user.phone, templateName: WA.PHASE1_RECEIPT, bodyValues: [user.name, reg.role.toUpperCase(), reg.trialCity ?? "TBD", `₹${amount}`] }),
  ]);
  await logNotifications(user.id, "phase1_receipt", { email: em, sms: sm, whatsapp: wa });
}

async function notifyPhase2Success(
  user: { id: string; name: string; email: string; phone: string },
  amount: number,
) {
  const email = tplPhase2Receipt(user.name, amount);
  const [em, sm, wa] = await Promise.all([
    sendEmail({ to: user.email, toName: user.name, ...email }),
    sendSms(user.phone, `BCPL T20: Phase 2 payment of ₹${amount} confirmed! Please complete your KYC. -BCPL T20`),
    sendWhatsApp({ phone: user.phone, templateName: WA.PHASE2_RECEIPT, bodyValues: [user.name, `₹${amount}`] }),
  ]);
  await logNotifications(user.id, "phase2_receipt", { email: em, sms: sm, whatsapp: wa });
}

// ── PHASE 1 ──────────────────────────────────────────────────────────────────

// POST /api/payment/phase1/create  — create Cashfree order
router.post("/phase1/create", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ registrationId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid registrationId" });

  const rows = await db.select({ reg: registrationsTable, user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(and(
      eq(registrationsTable.id, parsed.data.registrationId),
      eq(registrationsTable.userId, req.user!.userId),
    )).limit(1);

  if (!rows[0]) return void res.status(404).json({ error: "Registration not found" });
  const { reg, user } = rows[0];
  if (reg.phase1Status !== "pending") return void res.status(400).json({ error: "Payment already completed" });

  // AGE GATE (18–45): never collect payment from an ineligible player.
  if (!user.dob) {
    return void res.status(403).json({
      error: "Date of birth required before payment. Please refresh and complete your details.",
      code:  "DOB_REQUIRED",
    });
  }
  if (!isAgeEligible(user.dob)) {
    return void res.status(403).json({ error: AGE_INELIGIBLE_MESSAGE, code: "AGE_INELIGIBLE" });
  }

  const amount  = Math.round(FEES[reg.role].phase1 * 1.18); // base + 18% GST
  const orderId = `p1_${reg.id.slice(0, 8)}_${Date.now()}`;

  const order = await createOrder({
    orderId,
    amount,
    customerName:  user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    returnUrl:  `${SITE_URL}/register/payment-receipt?orderId=${orderId}`,
    notifyUrl:  `${API_URL}/api/payment/webhook`,
  });

  if (!order) return void res.status(500).json({ error: "Failed to create payment order. Please try again." });

  await db.insert(phase1PaymentsTable).values({
    registrationId:  reg.id,
    amount:          amount.toString(),
    cashfreeOrderId: orderId,
    status:          "pending",
  });

  await draftOnPaymentEvent(reg.id, "INITIATED"); // draft journey

  res.json({ success: true, orderId, paymentSessionId: order.payment_session_id, amount });
});

// ── Payment integrity (spec F): amount / currency validation ────────────────────
// The gateway-reported figure must equal the server-computed fee before any
// activation. Stub/dev responses carry no amount — those are not blocked.
export function paymentAmountMismatch(gw: { amount?: number; currency?: string }, expected: string): boolean {
  if (gw.amount == null) return false; // gateway did not report an amount (stub mode)
  const paid = Math.round(Number(gw.amount));
  const want = Math.round(Number(expected));
  const currencyBad = gw.currency != null && gw.currency !== "INR";
  return !Number.isFinite(paid) || !Number.isFinite(want) || paid !== want || currencyBad;
}

export async function flagP1AmountMismatch(orderId: string, gw: { amount?: number; currency?: string }, expected: string) {
  await db.update(phase1PaymentsTable).set({ status: "amount_mismatch" })
    .where(and(eq(phase1PaymentsTable.cashfreeOrderId, orderId), eq(phase1PaymentsTable.status, "pending")));
  console.error("[PAYMENT] phase1 amount mismatch — flagged for reconciliation",
    { orderId, gatewayAmount: gw.amount, gatewayCurrency: gw.currency, expected });
  await writeAudit(null, { action: "payment.amount_mismatch", entity: "phase1_payments", entityKey: orderId,
    newValue: { gatewayAmount: gw.amount ?? null, gatewayCurrency: gw.currency ?? null, expected } });
}

export async function flagP2AmountMismatch(orderId: string, gw: { amount?: number; currency?: string }, expected: string) {
  await db.update(phase2PaymentsTable).set({ status: "amount_mismatch" })
    .where(and(eq(phase2PaymentsTable.cashfreeOrderId, orderId), eq(phase2PaymentsTable.status, "pending")));
  console.error("[PAYMENT] phase2 amount mismatch — flagged for reconciliation",
    { orderId, gatewayAmount: gw.amount, gatewayCurrency: gw.currency, expected });
  await writeAudit(null, { action: "payment.amount_mismatch", entity: "phase2_payments", entityKey: orderId,
    newValue: { gatewayAmount: gw.amount ?? null, gatewayCurrency: gw.currency ?? null, expected } });
}

// POST /api/payment/phase1/verify  — frontend calls after redirect
router.post("/phase1/verify", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ orderId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "orderId required" });

  const status = await getPaymentStatus(parsed.data.orderId);
  if (!status || status.status !== "SUCCESS") {
    return void res.status(400).json({ success: false, status: status?.status || "UNKNOWN" });
  }

  // Amount integrity guard — must pass BEFORE the payment is recorded as success.
  const [expectedP1] = await db.select({ amount: phase1PaymentsTable.amount })
    .from(phase1PaymentsTable)
    .where(eq(phase1PaymentsTable.cashfreeOrderId, parsed.data.orderId)).limit(1);
  if (expectedP1 && paymentAmountMismatch(status, expectedP1.amount)) {
    await flagP1AmountMismatch(parsed.data.orderId, status, expectedP1.amount);
    return void res.status(409).json({
      success: false, code: "RECONCILIATION_REQUIRED",
      error: "Payment received but the amount could not be verified. Our team will review it shortly.",
    });
  }

  await db.update(phase1PaymentsTable).set({
    status: "success",
    cashfreePaymentId: status.paymentId,
    paidAt: new Date(),
  }).where(eq(phase1PaymentsTable.cashfreeOrderId, parsed.data.orderId));

  const rows = await db.select({ pay: phase1PaymentsTable, reg: registrationsTable, user: usersTable })
    .from(phase1PaymentsTable)
    .innerJoin(registrationsTable, eq(phase1PaymentsTable.registrationId, registrationsTable.id))
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(eq(phase1PaymentsTable.cashfreeOrderId, parsed.data.orderId)).limit(1);

  if (rows[0]) await draftOnPaymentEvent(rows[0].pay.registrationId, "SUCCESS"); // draft journey

  if (!rows[0]) return void res.status(404).json({ error: "Record not found" });
  const { pay, reg, user } = rows[0];

  const flipped = await db.update(registrationsTable).set({ phase1Status: "payment_done", updatedAt: new Date() })
    .where(and(eq(registrationsTable.id, reg.id), eq(registrationsTable.phase1Status, "pending")))
    .returning({ id: registrationsTable.id });

  // Payment confirmed → hand out the sequential player number (idempotent:
  // returns the existing number when the webhook already assigned it).
  const regNumber = await assignRegNumber(reg.id);

  // Fire notifications async — only if this call confirmed the payment
  // (skips duplicates when the webhook already confirmed & notified)
  if (flipped[0]) {
    // Upload window starts NOW (payment success), not at registration time.
    const cfg = await getPhase1Config();
    const videoDeadline = new Date(Date.now() + cfg.uploadWindowDays * 24 * 60 * 60 * 1000);
    await db.update(registrationsTable).set({ videoDeadline, updatedAt: new Date() })
      .where(eq(registrationsTable.id, reg.id));
    notifyPhase1Success(user, { id: reg.id, role: reg.role, trialCity: reg.trialCity, regNumber }, parseInt(pay.amount), cfg.uploadWindowDays);
  }

  res.json({ success: true, registrationId: reg.id, regNumber });
});

// ── PHASE 2 ──────────────────────────────────────────────────────────────────

// POST /api/payment/phase2/create
router.post("/phase2/create", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ registrationId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid registrationId" });

  const rows = await db.select({ reg: registrationsTable, user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(and(
      eq(registrationsTable.id, parsed.data.registrationId),
      eq(registrationsTable.userId, req.user!.userId),
    )).limit(1);

  if (!rows[0]) return void res.status(404).json({ error: "Registration not found" });
  const { reg, user } = rows[0];
  if (reg.phase1Status !== "selected") return void res.status(400).json({ error: "Not selected for Phase 2" });

  const amount  = Math.round(FEES[reg.role].phase2 * 1.18); // base + 18% GST
  const orderId = `p2_${reg.id.slice(0, 8)}_${Date.now()}`;

  const order = await createOrder({
    orderId,
    amount,
    customerName:  user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    returnUrl: `${SITE_URL}/register/phase2/payment-receipt?orderId=${orderId}`,
    notifyUrl: `${API_URL}/api/payment/webhook`,
  });

  if (!order) return void res.status(500).json({ error: "Failed to create payment order." });

  await db.insert(phase2PaymentsTable).values({
    registrationId:  reg.id,
    amount:          amount.toString(),
    cashfreeOrderId: orderId,
    status:          "pending",
  });

  res.json({ success: true, orderId, paymentSessionId: order.payment_session_id, amount });
});

// POST /api/payment/phase2/verify
router.post("/phase2/verify", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ orderId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "orderId required" });

  const status = await getPaymentStatus(parsed.data.orderId);
  if (!status || status.status !== "SUCCESS") {
    return void res.status(400).json({ success: false, status: status?.status || "UNKNOWN" });
  }

  // Amount integrity guard — must pass BEFORE the payment is recorded as success.
  const [expectedP2] = await db.select({ amount: phase2PaymentsTable.amount })
    .from(phase2PaymentsTable)
    .where(eq(phase2PaymentsTable.cashfreeOrderId, parsed.data.orderId)).limit(1);
  if (expectedP2 && paymentAmountMismatch(status, expectedP2.amount)) {
    await flagP2AmountMismatch(parsed.data.orderId, status, expectedP2.amount);
    return void res.status(409).json({
      success: false, code: "RECONCILIATION_REQUIRED",
      error: "Payment received but the amount could not be verified. Our team will review it shortly.",
    });
  }

  await db.update(phase2PaymentsTable).set({
    status: "success",
    cashfreePaymentId: status.paymentId,
    paidAt: new Date(),
  }).where(eq(phase2PaymentsTable.cashfreeOrderId, parsed.data.orderId));

  const rows = await db.select({ pay: phase2PaymentsTable, reg: registrationsTable, user: usersTable })
    .from(phase2PaymentsTable)
    .innerJoin(registrationsTable, eq(phase2PaymentsTable.registrationId, registrationsTable.id))
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(eq(phase2PaymentsTable.cashfreeOrderId, parsed.data.orderId)).limit(1);

  if (!rows[0]) return void res.status(404).json({ error: "Record not found" });
  const { pay, reg, user } = rows[0];

  const flipped = await db.update(registrationsTable).set({ phase2Status: "payment_done", updatedAt: new Date() })
    .where(and(
      eq(registrationsTable.id, reg.id),
      or(isNull(registrationsTable.phase2Status), eq(registrationsTable.phase2Status, "pending")),
    ))
    .returning({ id: registrationsTable.id });

  if (flipped[0]) notifyPhase2Success(user, parseInt(pay.amount));

  res.json({ success: true, registrationId: reg.id });
});

// Verify Cashfree webhook signature: HMAC-SHA256(timestamp + rawBody, CASHFREE_SECRET_KEY), base64
function verifyCashfreeSignature(req: Request & { rawBody?: Buffer }): boolean {
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret || typeof signature !== "string" || typeof timestamp !== "string" || !req.rawBody) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + req.rawBody.toString("utf8"))
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// POST /api/payment/webhook  — Cashfree webhook backup
router.post("/webhook", async (req, res) => {
  // Cashfree sends this on payment completion — backup to redirect flow
  if (!verifyCashfreeSignature(req)) {
    console.error("[WEBHOOK] rejected: invalid or missing x-webhook-signature", {
      hasSignature: !!req.headers["x-webhook-signature"],
      hasTimestamp: !!req.headers["x-webhook-timestamp"],
      ip: req.ip,
    });
    return void res.status(401).json({ error: "Invalid webhook signature" });
  }
  try {
    const body = req.body as { data?: { order?: { order_id: string }; payment?: { payment_status: string; cf_payment_id: string; payment_amount?: number; payment_currency?: string } } };
    const orderId = body.data?.order?.order_id;
    const payStatus = body.data?.payment?.payment_status;
    const payId = body.data?.payment?.cf_payment_id;
    const gwPaid = { amount: body.data?.payment?.payment_amount, currency: body.data?.payment?.payment_currency };

    if (orderId && payStatus === "SUCCESS") {
      if (orderId.startsWith("p1_")) {
        // Amount integrity guard — ack the webhook but do NOT activate on mismatch.
        const [expP1] = await db.select({ amount: phase1PaymentsTable.amount })
          .from(phase1PaymentsTable)
          .where(eq(phase1PaymentsTable.cashfreeOrderId, orderId)).limit(1);
        if (expP1 && paymentAmountMismatch(gwPaid, expP1.amount)) {
          await flagP1AmountMismatch(orderId, gwPaid, expP1.amount);
          return void res.json({ received: true, reconciliation: true });
        }
        const updated = await db.update(phase1PaymentsTable)
          .set({ status: "success", cashfreePaymentId: payId, paidAt: new Date() })
          .where(eq(phase1PaymentsTable.cashfreeOrderId, orderId))
          .returning({ registrationId: phase1PaymentsTable.registrationId });

        if (updated[0]) await draftOnPaymentEvent(updated[0].registrationId, "SUCCESS"); // draft journey

        // Keep registration in sync even if the user never returns to the site
        if (updated[0]) {
          const flipped = await db.update(registrationsTable)
            .set({ phase1Status: "payment_done", updatedAt: new Date() })
            .where(and(
              eq(registrationsTable.id, updated[0].registrationId),
              eq(registrationsTable.phase1Status, "pending"),
            ))
            .returning({ id: registrationsTable.id });

          // Only notify when this webhook actually confirmed the registration
          // (avoids duplicates when the redirect /verify flow already notified)
          if (flipped[0]) {
            const regNumber = await assignRegNumber(updated[0].registrationId);
            // Upload window starts at payment success (mirror of the /verify path)
            const cfg = await getPhase1Config();
            await db.update(registrationsTable)
              .set({ videoDeadline: new Date(Date.now() + cfg.uploadWindowDays * 24 * 60 * 60 * 1000), updatedAt: new Date() })
              .where(eq(registrationsTable.id, updated[0].registrationId));
            const rows = await db.select({ pay: phase1PaymentsTable, reg: registrationsTable, user: usersTable })
              .from(phase1PaymentsTable)
              .innerJoin(registrationsTable, eq(phase1PaymentsTable.registrationId, registrationsTable.id))
              .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
              .where(eq(phase1PaymentsTable.cashfreeOrderId, orderId)).limit(1);
            if (rows[0]) {
              const { pay, reg, user } = rows[0];
              notifyPhase1Success(user, { id: reg.id, role: reg.role, trialCity: reg.trialCity, regNumber }, parseInt(pay.amount), cfg.uploadWindowDays)
                .catch((e) => console.error("[WEBHOOK] phase1 notify error", e));
            }
          }
        }
      } else if (orderId.startsWith("p2_")) {
        // Amount integrity guard — ack the webhook but do NOT activate on mismatch.
        const [expP2] = await db.select({ amount: phase2PaymentsTable.amount })
          .from(phase2PaymentsTable)
          .where(eq(phase2PaymentsTable.cashfreeOrderId, orderId)).limit(1);
        if (expP2 && paymentAmountMismatch(gwPaid, expP2.amount)) {
          await flagP2AmountMismatch(orderId, gwPaid, expP2.amount);
          return void res.json({ received: true, reconciliation: true });
        }
        const updated = await db.update(phase2PaymentsTable)
          .set({ status: "success", cashfreePaymentId: payId, paidAt: new Date() })
          .where(eq(phase2PaymentsTable.cashfreeOrderId, orderId))
          .returning({ registrationId: phase2PaymentsTable.registrationId });

        if (updated[0]) {
          const flipped = await db.update(registrationsTable)
            .set({ phase2Status: "payment_done", updatedAt: new Date() })
            .where(and(
              eq(registrationsTable.id, updated[0].registrationId),
              or(isNull(registrationsTable.phase2Status), eq(registrationsTable.phase2Status, "pending")),
            ))
            .returning({ id: registrationsTable.id });

          if (flipped[0]) {
            const rows = await db.select({ pay: phase2PaymentsTable, user: usersTable })
              .from(phase2PaymentsTable)
              .innerJoin(registrationsTable, eq(phase2PaymentsTable.registrationId, registrationsTable.id))
              .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
              .where(eq(phase2PaymentsTable.cashfreeOrderId, orderId)).limit(1);
            if (rows[0]) {
              notifyPhase2Success(rows[0].user, parseInt(rows[0].pay.amount))
                .catch((e) => console.error("[WEBHOOK] phase2 notify error", e));
            }
          }
        }
      }
    }
  } catch (e) { console.error("[WEBHOOK] error", e); }
  res.json({ success: true });
});

export default router;

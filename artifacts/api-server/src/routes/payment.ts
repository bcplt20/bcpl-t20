import { Router } from "express";
import { db } from "@workspace/db";
import {
  registrationsTable, usersTable,
  phase1PaymentsTable, phase2PaymentsTable,
  notificationLogsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { createOrder, getPaymentStatus } from "../lib/cashfree";
import { sendEmail, tplPhase1Receipt, tplPhase2Receipt } from "../lib/email";
import { sendSms } from "../lib/sms";
import { sendWhatsApp, WA } from "../lib/whatsapp";
import { FEES } from "./register";
import { z } from "zod";

const router = Router();

const SITE_URL = process.env.SITE_URL || "https://elite-user-experience.replit.app/bcpl-website";
const API_URL  = process.env.API_URL  || "https://elite-user-experience.replit.app";

async function notifyPhase1Success(
  user: { id: string; name: string; email: string; phone: string },
  reg:  { id: string; role: string; trialCity: string | null },
  amount: number,
) {
  const email = tplPhase1Receipt(user.name, reg.role, amount, reg.id, reg.trialCity ?? "TBD");
  const smsMsg = `Welcome to BCPL T20 Season 5! Registered as ${reg.role.toUpperCase()}. Reg ID: ${reg.id.slice(0,8).toUpperCase()}. Upload trial video within 15 days. #OfficeSeStadiumtak`;

  await Promise.allSettled([
    sendEmail({ to: user.email, toName: user.name, ...email }),
    sendSms(user.phone, smsMsg),
    sendWhatsApp({ phone: user.phone, templateName: WA.PHASE1_RECEIPT, bodyValues: [user.name, reg.role.toUpperCase(), reg.trialCity ?? "TBD", `₹${amount}`] }),
    db.insert(notificationLogsTable).values([
      { userId: user.id, type: "email",     template: "phase1_receipt" },
      { userId: user.id, type: "sms",       template: "phase1_receipt" },
      { userId: user.id, type: "whatsapp",  template: "phase1_receipt" },
    ]),
  ]);
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

  const amount  = FEES[reg.role].phase1;
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

  res.json({ success: true, orderId, paymentSessionId: order.payment_session_id, amount });
});

// POST /api/payment/phase1/verify  — frontend calls after redirect
router.post("/phase1/verify", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ orderId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "orderId required" });

  const status = await getPaymentStatus(parsed.data.orderId);
  if (!status || status.status !== "SUCCESS") {
    return void res.status(400).json({ success: false, status: status?.status || "UNKNOWN" });
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

  if (!rows[0]) return void res.status(404).json({ error: "Record not found" });
  const { pay, reg, user } = rows[0];

  await db.update(registrationsTable).set({ phase1Status: "payment_done", updatedAt: new Date() })
    .where(eq(registrationsTable.id, reg.id));

  // Fire notifications async
  notifyPhase1Success(user, { id: reg.id, role: reg.role, trialCity: reg.trialCity }, parseInt(pay.amount));

  res.json({ success: true, registrationId: reg.id });
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

  const amount  = FEES[reg.role].phase2;
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

  await db.update(registrationsTable).set({ phase2Status: "payment_done", updatedAt: new Date() })
    .where(eq(registrationsTable.id, reg.id));

  const email = tplPhase2Receipt(user.name, parseInt(pay.amount));
  Promise.allSettled([
    sendEmail({ to: user.email, toName: user.name, ...email }),
    sendSms(user.phone, `BCPL T20: Phase 2 payment of ₹${pay.amount} confirmed! Please complete your KYC. -BCPL T20`),
    sendWhatsApp({ phone: user.phone, templateName: WA.PHASE2_RECEIPT, bodyValues: [user.name, `₹${pay.amount}`] }),
    db.insert(notificationLogsTable).values([
      { userId: user.id, type: "email",    template: "phase2_receipt" },
      { userId: user.id, type: "sms",      template: "phase2_receipt" },
      { userId: user.id, type: "whatsapp", template: "phase2_receipt" },
    ]),
  ]);

  res.json({ success: true, registrationId: reg.id });
});

// POST /api/payment/webhook  — Cashfree webhook backup
router.post("/webhook", async (req, res) => {
  // Cashfree sends this on payment completion — backup to redirect flow
  try {
    const body = req.body as { data?: { order?: { order_id: string }; payment?: { payment_status: string; cf_payment_id: string } } };
    const orderId = body.data?.order?.order_id;
    const payStatus = body.data?.payment?.payment_status;
    const payId = body.data?.payment?.cf_payment_id;

    if (orderId && payStatus === "SUCCESS") {
      if (orderId.startsWith("p1_")) {
        await db.update(phase1PaymentsTable).set({ status: "success", cashfreePaymentId: payId, paidAt: new Date() })
          .where(eq(phase1PaymentsTable.cashfreeOrderId, orderId));
      } else if (orderId.startsWith("p2_")) {
        await db.update(phase2PaymentsTable).set({ status: "success", cashfreePaymentId: payId, paidAt: new Date() })
          .where(eq(phase2PaymentsTable.cashfreeOrderId, orderId));
      }
    }
  } catch (e) { console.error("[WEBHOOK] error", e); }
  res.json({ success: true });
});

export default router;

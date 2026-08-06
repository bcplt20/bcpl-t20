import { draftOnPaymentEvent } from "./drafts";
import { formatRole } from "../lib/emailTheme";
import { Router, type Request } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import {
  registrationsTable, usersTable,
  phase1PaymentsTable, phase2PaymentsTable,
} from "@workspace/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { createOrder, getPaymentStatus, extractPaymentMethod, cashfreeMode } from "../lib/cashfree";
import { sendEmail, tplPhase1Receipt, tplPhase2Receipt } from "../lib/email";
import { buildInvoicePdf } from "../lib/invoicePdf";
import { sendSms } from "../lib/sms";
import { sendWhatsApp, WA } from "../lib/whatsapp";
import { logNotifications } from "../lib/notify";
import { writeAudit } from "../lib/audit";
import { FEES, assignRegNumber } from "./register";
import { normalizeRole } from "../lib/phase1Roles";

// Historic registrations carry long role names ('batsman', 'wicketkeeper'…);
// FEES is keyed by short codes — always resolve through normalizeRole.
function feeFor(role: string | null | undefined): { phase1: number; phase2: number } {
  return FEES[role ?? ""] ?? FEES[normalizeRole(role)] ?? FEES.bat;
}
import { isAgeEligible, AGE_INELIGIBLE_MESSAGE } from "../lib/age";
import { getPhase1Config } from "../lib/phase1Config";
import { z } from "zod";

const router = Router();

/**
 * Startup migration (idempotent) — payment method split columns.
 * Production applies schema via `drizzle-kit push --yes 2>/dev/null || true`
 * in deploy.sh, whose failures are SILENT — so we cannot rely on it for these
 * columns. Without them the success-persist writes below would crash prod
 * payments. This boot-time ensure guarantees the columns exist regardless.
 *
 * The 2 PM2 cluster workers boot simultaneously (and vitest runs test files in
 * parallel): serialize the DDL under an xact-scoped advisory lock so racing
 * ADD COLUMN IF NOT EXISTS can never collide on pg_type (23505).
 */
export async function ensurePaymentMethodColumns(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:payment_method:ddl'))`);
    await tx.execute(sql`ALTER TABLE phase1_payments ADD COLUMN IF NOT EXISTS payment_group varchar(40)`);
    await tx.execute(sql`ALTER TABLE phase1_payments ADD COLUMN IF NOT EXISTS payment_method_detail varchar(120)`);
    await tx.execute(sql`ALTER TABLE phase2_payments ADD COLUMN IF NOT EXISTS payment_group varchar(40)`);
    await tx.execute(sql`ALTER TABLE phase2_payments ADD COLUMN IF NOT EXISTS payment_method_detail varchar(120)`);
  });
}

const SITE_URL = process.env.SITE_URL || "https://elite-user-experience.replit.app/bcpl-website";
const API_URL  = process.env.API_URL  || "https://elite-user-experience.replit.app";

/**
 * Hosted Cashfree checkout page (mobile app / any non-SDK client).
 *
 * The mobile app cannot run the Cashfree JS SDK natively and there is NO valid
 * plain hosted URL for a v3 (`x-api-version: 2023-08-01`) payment session — the
 * legacy `https://payments.cashfree.com/order/#<sessionId>` format does NOT
 * work with v3 sessions and is exactly why Cashfree showed an error when the
 * order came from the app. Instead we serve a tiny page that loads the v3 SDK
 * and calls `cashfree.checkout({ paymentSessionId, redirectTarget:'_self' })`
 * with the `mode` that matches the environment the order was created in
 * (dev api-server → could be sandbox; prod → production). Cashfree then
 * redirects the browser to the server-set return_url on completion.
 *
 * GET /api/payment/checkout?session=<paymentSessionId>&mode=<production|sandbox>
 */
router.get("/checkout", (req, res) => {
  const rawSession = typeof req.query.session === "string" ? req.query.session : "";
  const rawMode = req.query.mode === "sandbox" ? "sandbox" : "production";
  // Validate the session id shape before echoing into HTML (XSS hardening).
  if (!/^[A-Za-z0-9_.-]{1,300}$/.test(rawSession)) {
    return void res.status(400).type("html").send("<!doctype html><meta charset=utf-8><p>Invalid payment session.</p>");
  }
  const sessionJson = JSON.stringify(rawSession);
  const modeJson = JSON.stringify(rawMode);
  res.status(200).type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BCPL — Secure Payment</title>
<style>
  html,body{height:100%;margin:0;background:#0b0b12;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  .wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}
  .spinner{width:38px;height:38px;border:3px solid rgba(255,255,255,.2);border-top-color:#FF1A75;border-radius:50%;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .err{color:#ff6b6b;font-size:14px;max-width:320px}
</style>
</head>
<body>
<div class="wrap">
  <div class="spinner" id="sp"></div>
  <div id="msg">Redirecting to secure Cashfree checkout…</div>
</div>
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
<script>
  (function () {
    var sessionId = ${sessionJson};
    var mode = ${modeJson};
    function fail(text) {
      var sp = document.getElementById('sp'); if (sp) sp.style.display = 'none';
      var m = document.getElementById('msg');
      if (m) { m.className = 'err'; m.textContent = text; }
    }
    try {
      if (typeof Cashfree !== 'function') { fail('Payment SDK failed to load. Please check your connection and try again.'); return; }
      var cashfree = Cashfree({ mode: mode });
      cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_self' })
        .then(function (r) { if (r && r.error) fail(r.error.message || 'Payment could not be started.'); })
        .catch(function (e) { fail((e && e.message) || 'Payment could not be started.'); });
    } catch (e) { fail((e && e.message) || 'Payment could not be started.'); }
  })();
</script>
</body>
</html>`);
});

/**
 * Absolute URL to the hosted checkout page above, for the given session.
 * Built from API_URL so it is correct in both dev (Replit) and prod.
 */
export function hostedCheckoutUrl(paymentSessionId: string): string {
  const base = API_URL.replace(/\/$/, "");
  return `${base}/api/payment/checkout?session=${encodeURIComponent(paymentSessionId)}&mode=${cashfreeMode()}`;
}

/**
 * Terminal return page for the NATIVE APP checkout WebView.
 *
 * When a payment order is created with `platform:"app"`, Cashfree redirects the
 * in-app WebView here after the user finishes (or abandons) payment. The mobile
 * app intercepts this URL (`onShouldStartLoadWithRequest`) BEFORE it renders,
 * reads `orderId`+`phase`, and calls the matching verify endpoint itself — so
 * the player NEVER sees a website page. This page is only a tiny fallback shown
 * for the split-second before the app cancels the navigation (and if a user
 * somehow lands here in a real browser).
 *
 * GET /api/payment/app-return?orderId=<id>&phase=<1|2>
 */
router.get("/app-return", (req, res) => {
  const orderId = typeof req.query.orderId === "string" ? req.query.orderId : "";
  const phase = req.query.phase === "2" ? "2" : "1";
  // Shape-validate the orderId before echoing (XSS hardening). Our order ids are
  // like `p1_<8hex>_<ms>` / `p2_...`.
  const safeOrder = /^[A-Za-z0-9_.-]{1,80}$/.test(orderId) ? orderId : "";
  res.status(200).type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>BCPL — Payment</title>
<style>html,body{height:100%;margin:0;background:#0b0b12;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}.wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center}.spinner{width:34px;height:34px;border:3px solid rgba(255,255,255,.2);border-top-color:#16E0A3;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>
</head><body>
<div class="wrap" data-bcpl-app-return="1" data-order-id="${safeOrder}" data-phase="${phase}">
  <div class="spinner"></div>
  <div>Confirming your payment…</div>
</div>
<script>
  // Best-effort signal to any WebView still listening (interception is the
  // primary mechanism; this is a belt-and-braces fallback).
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'bcpl_payment_return', orderId: ${JSON.stringify(safeOrder)}, phase: ${JSON.stringify(phase)} }));
    }
  } catch (e) {}
</script>
</body></html>`);
});

/**
 * Return URL for a create-order call. For the native app we point Cashfree back
 * at our own `/app-return` terminal page (intercepted by the WebView); for the
 * website we keep the existing receipt pages.
 */
function paymentReturnUrl(platform: "app" | "web" | undefined, phase: 1 | 2, orderId: string): string {
  if (platform === "app") {
    const base = API_URL.replace(/\/$/, "");
    return `${base}/api/payment/app-return?orderId=${encodeURIComponent(orderId)}&phase=${phase}`;
  }
  return phase === 1
    ? `${SITE_URL}/register/payment-receipt?orderId=${orderId}`
    : `${SITE_URL}/register/phase2/payment-receipt?orderId=${orderId}`;
}

/**
 * Build the GST invoice PDF as an email attachment from the REAL gross amount
 * paid. Uses the SAME invoice-number scheme as the admin invoice route
 * (`BCPL/25-26/<txnId>`) so the PDF matches the emailed HTML invoice exactly.
 * Never throws — on any error it logs a warning and returns undefined so the
 * receipt email still goes out (just without the attachment).
 */
async function buildInvoiceAttachment(p: {
  name: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  phase: 1 | 2;
  amount: number;
  invoiceRef?: { txnId: string; paidAt: Date | string };
  regNo?: string;
}): Promise<Array<{ name: string; contentBase64: string }> | undefined> {
  if (!p.invoiceRef) return undefined;
  try {
    const invoiceNo = `BCPL/25-26/${p.invoiceRef.txnId}`;
    const pdf = await buildInvoicePdf({
      name: p.name,
      phone: p.phone ?? null,
      email: p.email ?? null,
      role: p.role ?? null,
      invoiceNo,
      phase: p.phase,
      txnId: p.invoiceRef.txnId,
      paidAt: p.invoiceRef.paidAt,
      grossAmount: p.amount,
    });
    const fileName = `BCPL-Invoice-${p.regNo ?? p.invoiceRef.txnId}.pdf`;
    return [{ name: fileName, contentBase64: pdf.toString("base64") }];
  } catch (e) {
    console.warn("[PAYMENT] invoice PDF generation failed — sending receipt without attachment", e);
    return undefined;
  }
}

async function notifyPhase1Success(
  user: { id: string; name: string; email: string; phone: string },
  reg:  { id: string; role: string; trialCity: string | null; regNumber?: string | null },
  amount: number,
  windowDays = 15,
  invoice?: { txnId: string; paidAt: Date | string },
) {
  const regNo = reg.regNumber ?? reg.id.slice(0, 8).toUpperCase();
  const email = tplPhase1Receipt(user.name, reg.role, amount, regNo, reg.trialCity ?? "TBD");
  const smsMsg = "Welcome to BCPL Season 5! Registered as " + formatRole(reg.role) + ". Reg No: " + regNo + ". Upload trial video within " + windowDays + " days. #OfficeSeStadiumtak";

  // Best-effort GST invoice PDF attachment from the REAL gross amount paid.
  // A PDF failure must NEVER block the receipt — on error we send without it.
  const attachments = await buildInvoiceAttachment({
    name: user.name, phone: user.phone, email: user.email, role: reg.role,
    phase: 1, amount, invoiceRef: invoice, regNo,
  });

  // Send on all channels in parallel (helpers never throw), then record the
  // REAL outcome of each attempt in notification_logs.
  const [em, sm, wa] = await Promise.all([
    sendEmail({ to: user.email, toName: user.name, ...email, ...(attachments ? { attachments } : {}) }),
    sendSms(user.phone, smsMsg, { smsType: "phase1_receipt", smsFlowVars: [formatRole(reg.role), regNo, String(windowDays)] }),
    sendWhatsApp({ phone: user.phone, templateName: WA.PHASE1_RECEIPT, bodyValues: [user.name, formatRole(reg.role), reg.trialCity ?? "TBD", `₹${amount}`] }),
  ]);
  await logNotifications(user.id, "phase1_receipt", { email: em, sms: sm, whatsapp: wa });
}

async function notifyPhase2Success(
  user: { id: string; name: string; email: string; phone: string },
  amount: number,
  regNumber?: string | null,
  invoice?: { txnId: string; paidAt: Date | string; role?: string | null },
) {
  // Show the real sequential player ID (BCPL-DEL-1 style) when we have it —
  // mirrors the phase-1 receipt. WhatsApp bodyValues stay at [name, amount]
  // because the approved Interakt template (bcpl_phase2_receipt) has exactly
  // two placeholders; adding a third would break the template send.
  const regNo = regNumber ?? undefined;
  const email = tplPhase2Receipt(user.name, amount, regNo);
  const idLine = regNo ? ` Player ID: ${regNo}.` : "";

  // Best-effort GST invoice PDF attachment — never blocks the receipt.
  const attachments = await buildInvoiceAttachment({
    name: user.name, phone: user.phone, email: user.email, role: invoice?.role ?? null,
    phase: 2, amount, invoiceRef: invoice, regNo,
  });

  const [em, sm, wa] = await Promise.all([
    sendEmail({ to: user.email, toName: user.name, ...email, ...(attachments ? { attachments } : {}) }),
    sendSms(user.phone, `BCPL: Phase 2 payment of ₹${amount} confirmed!${idLine} Please complete your KYC. -BCPL`, { smsType: "phase2_receipt", smsFlowVars: [`₹${amount}`, regNo ?? ""] }),
    sendWhatsApp({ phone: user.phone, templateName: WA.PHASE2_RECEIPT, bodyValues: [user.name, `₹${amount}`] }),
  ]);
  await logNotifications(user.id, "phase2_receipt", { email: em, sms: sm, whatsapp: wa });
}

// ── PHASE 1 ──────────────────────────────────────────────────────────────────

/**
 * Consent audit write — ATOMIC jsonb merge at the SQL level, so concurrent
 * phase1/phase2 consent writes (or a request holding a stale row read) can
 * never clobber the other phase's key.
 */
export async function recordConsentKey(
  registrationId: string,
  key: "phase1" | "phase2",
  value: Record<string, unknown>,
): Promise<void> {
  await db.execute(sql`
    UPDATE registrations
    SET consents = COALESCE(consents, '{}'::jsonb) || jsonb_build_object(${key}::text, ${JSON.stringify(value)}::jsonb),
        updated_at = NOW()
    WHERE id = ${registrationId}
  `);
}

// POST /api/payment/phase1/create  — create Cashfree order
router.post("/phase1/create", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    // Legal consent audit (optional for backward compatibility): client sends
    // accepted document versions + marketing choice; server stamps acceptedAt.
    consent: z.object({
      termsVersion:   z.string().min(1).max(20),
      privacyVersion: z.string().min(1).max(20),
      marketingOptIn: z.boolean(),
    }).optional(),
    // Native app clients send platform:"app" so Cashfree returns to our own
    // in-app-intercepted terminal page instead of the website receipt.
    platform: z.enum(["app", "web"]).optional(),
  });
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

  // Record consent at payment initiation (acceptance stands even if the
  // gateway order later fails). Atomic jsonb merge keeps other consent keys intact.
  if (parsed.data.consent) {
    const c = parsed.data.consent;
    await recordConsentKey(reg.id, "phase1", {
      documentVersion: `terms-v${c.termsVersion}+privacy-v${c.privacyVersion}`,
      termsVersion:    c.termsVersion,
      privacyVersion:  c.privacyVersion,
      marketingOptIn:  c.marketingOptIn,
      acceptedAt:      new Date().toISOString(),
    });
  }

  const amount  = Math.round(feeFor(reg.role).phase1 * 1.18); // base + 18% GST
  const orderId = `p1_${reg.id.slice(0, 8)}_${Date.now()}`;

  const order = await createOrder({
    orderId,
    amount,
    customerName:  user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    returnUrl:  paymentReturnUrl(parsed.data.platform, 1, orderId),
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

  // `checkoutUrl` + `cashfreeMode` let non-SDK clients (the mobile app) open a
  // hosted checkout page that runs the v3 SDK with the correct environment mode.
  res.json({
    success: true,
    orderId,
    paymentSessionId: order.payment_session_id,
    amount,
    cashfreeMode: cashfreeMode(),
    checkoutUrl: hostedCheckoutUrl(order.payment_session_id),
  });
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

  // Ownership guard — the order must belong to the authenticated user's
  // registration BEFORE any provider lookup or mutation (IDOR protection).
  const [ownedP1] = await db.select({ amount: phase1PaymentsTable.amount })
    .from(phase1PaymentsTable)
    .innerJoin(registrationsTable, eq(phase1PaymentsTable.registrationId, registrationsTable.id))
    .where(and(
      eq(phase1PaymentsTable.cashfreeOrderId, parsed.data.orderId),
      eq(registrationsTable.userId, String(req.user!.userId)),
    )).limit(1);
  if (!ownedP1) return void res.status(404).json({ error: "Record not found" });

  const status = await getPaymentStatus(parsed.data.orderId);
  if (!status || status.status !== "SUCCESS") {
    return void res.status(400).json({ success: false, status: status?.status || "UNKNOWN" });
  }

  // Amount integrity guard — must pass BEFORE the payment is recorded as success.
  const expectedP1 = ownedP1;
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
    paymentGroup: status.paymentGroup ?? null,
    paymentMethodDetail: status.paymentMethodDetail ?? null,
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
    // Owner rule (5 Aug '26): the upload window is anchored at REGISTRATION
    // time (players are promised 15 days from registration), so payment must
    // never shorten or reset it — only backfill legacy rows missing one.
    const cfg = await getPhase1Config();
    await db.execute(sql`UPDATE registrations
      SET video_deadline = COALESCE(video_deadline, created_at + make_interval(days => ${cfg.uploadWindowDays})),
          updated_at = now()
      WHERE id = ${reg.id}`);
    notifyPhase1Success(user, { id: reg.id, role: reg.role, trialCity: reg.trialCity, regNumber }, parseInt(pay.amount), cfg.uploadWindowDays, { txnId: pay.cashfreeOrderId || pay.id, paidAt: pay.paidAt ?? new Date() });
  }

  res.json({ success: true, registrationId: reg.id, regNumber });
});

// ── PHASE 2 ──────────────────────────────────────────────────────────────────

// POST /api/payment/phase2/create
router.post("/phase2/create", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    // Phase 2 declarations audit (optional for backward compatibility):
    // the exact declaration texts ticked by the player; server stamps acceptedAt.
    declarations: z.object({
      version: z.string().min(1).max(20),
      items:   z.array(z.string().min(1).max(300)).min(1).max(8),
    }).optional(),
    platform: z.enum(["app", "web"]).optional(),
  });
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
  // Phase-2 fee already settled (normal payment OR legacy-paid carryover
  // waiver) — never create another payable order for this registration.
  if (reg.phase2Status && !["pending", "payment_pending"].includes(reg.phase2Status)) {
    return void res.status(409).json({ error: "Phase 2 payment is already complete for this registration." });
  }

  // Record accepted declarations at payment initiation (consent audit).
  if (parsed.data.declarations) {
    const d = parsed.data.declarations;
    await recordConsentKey(reg.id, "phase2", {
      documentVersion: `phase2-declarations-v${d.version}`,
      items:           d.items,
      acceptedAt:      new Date().toISOString(),
    });
  }

  const amount  = Math.round(feeFor(reg.role).phase2 * 1.18); // base + 18% GST
  const orderId = `p2_${reg.id.slice(0, 8)}_${Date.now()}`;

  const order = await createOrder({
    orderId,
    amount,
    customerName:  user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    returnUrl: paymentReturnUrl(parsed.data.platform, 2, orderId),
    notifyUrl: `${API_URL}/api/payment/webhook`,
  });

  if (!order) return void res.status(500).json({ error: "Failed to create payment order." });

  await db.insert(phase2PaymentsTable).values({
    registrationId:  reg.id,
    amount:          amount.toString(),
    cashfreeOrderId: orderId,
    status:          "pending",
  });

  res.json({
    success: true,
    orderId,
    paymentSessionId: order.payment_session_id,
    amount,
    cashfreeMode: cashfreeMode(),
    checkoutUrl: hostedCheckoutUrl(order.payment_session_id),
  });
});

// POST /api/payment/phase2/verify
router.post("/phase2/verify", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ orderId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "orderId required" });

  // Ownership guard — the order must belong to the authenticated user's
  // registration BEFORE any provider lookup or mutation (IDOR protection).
  const [owned] = await db.select({ amount: phase2PaymentsTable.amount })
    .from(phase2PaymentsTable)
    .innerJoin(registrationsTable, eq(phase2PaymentsTable.registrationId, registrationsTable.id))
    .where(and(
      eq(phase2PaymentsTable.cashfreeOrderId, parsed.data.orderId),
      eq(registrationsTable.userId, String(req.user!.userId)),
    )).limit(1);
  if (!owned) return void res.status(404).json({ error: "Record not found" });

  const status = await getPaymentStatus(parsed.data.orderId);
  if (!status || status.status !== "SUCCESS") {
    return void res.status(400).json({ success: false, status: status?.status || "UNKNOWN" });
  }

  // Amount integrity guard — must pass BEFORE the payment is recorded as success.
  const expectedP2 = owned;
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
    paymentGroup: status.paymentGroup ?? null,
    paymentMethodDetail: status.paymentMethodDetail ?? null,
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

  if (flipped[0]) notifyPhase2Success(user, parseInt(pay.amount), reg.regNumber, { txnId: pay.cashfreeOrderId || pay.id, paidAt: pay.paidAt ?? new Date(), role: reg.role });

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
    const body = req.body as { data?: { order?: { order_id: string }; payment?: { payment_status: string; cf_payment_id: string; payment_amount?: number; payment_currency?: string; payment_group?: string; payment_method?: Record<string, unknown> } } };
    const orderId = body.data?.order?.order_id;
    const payStatus = body.data?.payment?.payment_status;
    const payId = body.data?.payment?.cf_payment_id;
    const gwPaid = { amount: body.data?.payment?.payment_amount, currency: body.data?.payment?.payment_currency };
    // Coarse group + free-text detail from the webhook payment entity (defensive).
    const method = extractPaymentMethod(body.data?.payment);

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
          .set({ status: "success", cashfreePaymentId: payId, paymentGroup: method.paymentGroup, paymentMethodDetail: method.paymentMethodDetail, paidAt: new Date() })
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
            // Registration-anchored window (mirror of the /verify path):
            // only backfill a missing deadline, never reset it at payment.
            const cfg = await getPhase1Config();
            await db.execute(sql`UPDATE registrations
              SET video_deadline = COALESCE(video_deadline, created_at + make_interval(days => ${cfg.uploadWindowDays})),
                  updated_at = now()
              WHERE id = ${updated[0].registrationId}`);
            const rows = await db.select({ pay: phase1PaymentsTable, reg: registrationsTable, user: usersTable })
              .from(phase1PaymentsTable)
              .innerJoin(registrationsTable, eq(phase1PaymentsTable.registrationId, registrationsTable.id))
              .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
              .where(eq(phase1PaymentsTable.cashfreeOrderId, orderId)).limit(1);
            if (rows[0]) {
              const { pay, reg, user } = rows[0];
              notifyPhase1Success(user, { id: reg.id, role: reg.role, trialCity: reg.trialCity, regNumber }, parseInt(pay.amount), cfg.uploadWindowDays, { txnId: pay.cashfreeOrderId || pay.id, paidAt: pay.paidAt ?? new Date() })
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
          .set({ status: "success", cashfreePaymentId: payId, paymentGroup: method.paymentGroup, paymentMethodDetail: method.paymentMethodDetail, paidAt: new Date() })
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
            const rows = await db.select({ pay: phase2PaymentsTable, reg: registrationsTable, user: usersTable })
              .from(phase2PaymentsTable)
              .innerJoin(registrationsTable, eq(phase2PaymentsTable.registrationId, registrationsTable.id))
              .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
              .where(eq(phase2PaymentsTable.cashfreeOrderId, orderId)).limit(1);
            if (rows[0]) {
              notifyPhase2Success(rows[0].user, parseInt(rows[0].pay.amount), rows[0].reg.regNumber, { txnId: rows[0].pay.cashfreeOrderId || rows[0].pay.id, paidAt: rows[0].pay.paidAt ?? new Date(), role: rows[0].reg.role })
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

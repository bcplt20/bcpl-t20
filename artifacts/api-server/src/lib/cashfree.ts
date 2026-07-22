// Cashfree Payment Gateway — https://cashfree.com
const APP_ID    = process.env.CASHFREE_APP_ID;
const SECRET    = process.env.CASHFREE_SECRET_KEY;
const CF_ENV    = process.env.CASHFREE_ENV || "TEST"; // TEST | PROD
const BASE_URL  = CF_ENV === "PROD"
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

interface CreateOrderParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface CashfreeOrder {
  payment_session_id: string;
  order_id: string;
  order_status: string;
}

const cfHeaders = () => ({
  "x-api-version": "2023-08-01",
  "x-client-id": APP_ID!,
  "x-client-secret": SECRET!,
  "Content-Type": "application/json",
});

export async function createOrder(p: CreateOrderParams): Promise<CashfreeOrder | null> {
  if (!APP_ID || !SECRET) {
    console.warn("[CF-STUB] createOrder:", p.orderId, "₹" + p.amount);
    return { payment_session_id: `mock_sess_${Date.now()}`, order_id: p.orderId, order_status: "ACTIVE" };
  }
  try {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify({
        order_id: p.orderId,
        order_amount: p.amount,
        order_currency: "INR",
        customer_details: {
          customer_id: p.orderId,
          customer_name: p.customerName,
          customer_email: p.customerEmail,
          customer_phone: p.customerPhone,
        },
        order_meta: { return_url: p.returnUrl, notify_url: p.notifyUrl },
      }),
    });
    if (!res.ok) { console.error("[CF] createOrder failed:", await res.text()); return null; }
    return (await res.json()) as CashfreeOrder;
  } catch (e) { console.error("[CF] createOrder error", e); return null; }
}

export const hasCashfreeCredentials = () => Boolean(APP_ID && SECRET);

/**
 * Fetch order status from Cashfree.
 * order_status: ACTIVE | PAID | EXPIRED | TERMINATED | TERMINATION_REQUESTED
 */
export async function getOrderStatus(orderId: string): Promise<{ orderStatus: string } | null> {
  if (!APP_ID || !SECRET) {
    console.warn("[CF-STUB] getOrderStatus:", orderId);
    return null;
  }
  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}`, { headers: cfHeaders() });
    if (!res.ok) {
      console.error("[CF] getOrderStatus failed:", orderId, res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { order_status?: string };
    return data.order_status ? { orderStatus: data.order_status } : null;
  } catch (e) { console.error("[CF] getOrderStatus error", e); return null; }
}

export async function getPaymentStatus(orderId: string): Promise<{ status: string; paymentId?: string } | null> {
  if (!APP_ID || !SECRET) {
    return { status: "SUCCESS", paymentId: `mock_pay_${Date.now()}` };
  }
  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/payments`, { headers: cfHeaders() });
    if (!res.ok) return null;
    const payments = (await res.json()) as Array<{ payment_status: string; cf_payment_id: string }>;
    const success = payments.find(p => p.payment_status === "SUCCESS");
    if (success) return { status: "SUCCESS", paymentId: success.cf_payment_id };
    const latest = payments[0];
    return latest ? { status: latest.payment_status } : { status: "PENDING" };
  } catch (e) { console.error("[CF] getPaymentStatus error", e); return null; }
}

// ─── Cashfree Verification Suite (separate credentials) ───────────────────────
const VERIFY_APP_ID = process.env.CF_VERIFY_APP_ID;
const VERIFY_SECRET = process.env.CF_VERIFY_SECRET;

const verifyHeaders = () => ({
  "x-client-id":     VERIFY_APP_ID!,
  "x-client-secret": VERIFY_SECRET!,
  "Content-Type":    "application/json",
});

/**
 * Verify PAN via Cashfree Verification Suite.
 * Distinguishes a genuinely wrong PAN from a service/config problem so the
 * caller never blames the player for a vendor outage.
 */
export type PanVerifyResult =
  | { outcome: "valid"; name: string; referenceId: string }
  | { outcome: "invalid"; panStatus: string }        // Cashfree explicitly rejected this PAN
  | { outcome: "service_error"; detail: string }     // auth/IP-whitelist/outage/unknown response
  | { outcome: "not_configured" };                   // env vars missing (dev)

const maskPan = (p: string) => p.slice(0, 2) + "******" + p.slice(-2);

export async function verifyPan(pan: string, name: string): Promise<PanVerifyResult> {
  if (!VERIFY_APP_ID || !VERIFY_SECRET) {
    console.warn("[CF-VERIFY] PAN check skipped — CF_VERIFY_APP_ID / CF_VERIFY_SECRET not set");
    return { outcome: "not_configured" };
  }
  try {
    const res = await fetch("https://api.cashfree.com/verification/pan", {
      method: "POST",
      headers: verifyHeaders(),
      body: JSON.stringify({ pan, name }),
    });
    const raw = await res.text();
    let data: any = {};
    try { data = JSON.parse(raw); } catch { /* non-JSON body (e.g. HTML error page) */ }

    // Redacted diagnostic view: scalar status/error fields only — never names, DOB or echoes of the PAN
    const safeBody = {
      status: data.status, pan_status: data.pan_status, valid: data.valid,
      code: data.code, type: data.type, message: data.message, error: data.error,
      keys: Object.keys(data),
    };

    if (!res.ok) {
      // 401 = wrong keys · 403 = IP not whitelisted / Verification Suite not activated
      console.error("[CF-VERIFY] PAN API error", {
        httpStatus: res.status, pan: maskPan(pan),
        ...safeBody,
        nonJsonBody: Object.keys(data).length === 0 ? raw.slice(0, 200) : undefined,
      });
      return { outcome: "service_error", detail: `HTTP ${res.status}` };
    }

    const panStatus = String(data.pan_status ?? data.status ?? "").toUpperCase();
    console.info("[CF-VERIFY] PAN API response", {
      httpStatus: res.status, pan: maskPan(pan), panStatus,
      valid: data.valid, referenceId: data.reference_id,
    });

    if (panStatus === "VALID" || data.valid === true) {
      return {
        outcome:     "valid",
        name:        data.name_on_pan ?? data.registered_name ?? name,
        referenceId: String(data.reference_id ?? `pan_${Date.now()}`),
      };
    }
    if (data.valid === false || ["INVALID", "NOT_FOUND", "INVALID_PAN", "FAILED"].includes(panStatus)) {
      return { outcome: "invalid", panStatus: panStatus || "INVALID" };
    }
    // 2xx but no recognizable verdict — account misconfigured or response shape changed
    console.error("[CF-VERIFY] PAN API unrecognized response", { pan: maskPan(pan), ...safeBody });
    return { outcome: "service_error", detail: `unrecognized pan_status "${panStatus}"` };
  } catch (e) {
    console.error("[CF-VERIFY] PAN API network error", e);
    return { outcome: "service_error", detail: "network" };
  }
}

/**
 * Step 1 — Initiate Aadhaar OTP via Cashfree Verification Suite
 * Returns: { referenceId: string } to be used in verifyAadhaarOtp
 */
export async function initiateAadhaarOtp(aadhaarNumber: string): Promise<{
  referenceId: string;
} | null> {
  if (!VERIFY_APP_ID || !VERIFY_SECRET) {
    console.warn("[CF-STUB] initiateAadhaarOtp — returning mock");
    return { referenceId: `mock_aadhaar_${Date.now()}` };
  }
  try {
    const res = await fetch("https://api.cashfree.com/verification/offline-aadhaar/otp", {
      method: "POST",
      headers: verifyHeaders(),
      body: JSON.stringify({ aadhaar_number: aadhaarNumber }),
    });
    const data = await res.json() as any;
    if (!res.ok) {
      console.error("[CF] initiateAadhaarOtp failed:", { http: res.status, code: data?.code, type: data?.type, message: data?.message, status: data?.status });
      return null;
    }
    // Docs: 200 → { status: "SUCCESS", message: "OTP sent successfully", ref_id: 21637861 }
    const refId = data.ref_id ?? data.reference_id;
    if (refId === undefined || refId === null) {
      console.error("[CF] initiateAadhaarOtp: no ref_id in response", { status: data?.status, message: data?.message });
      return null;
    }
    return { referenceId: String(refId) };
  } catch (e) { console.error("[CF] initiateAadhaarOtp error", e); return null; }
}

/**
 * Step 2 — Verify Aadhaar OTP
 * Returns: { valid: boolean; name: string; dob: string; address: string }
 */
export async function verifyAadhaarOtp(referenceId: string, otp: string): Promise<{
  valid: boolean; name: string; dob?: string; address?: string;
} | null> {
  if (!VERIFY_APP_ID || !VERIFY_SECRET) {
    return { valid: true, name: "Verified", dob: "", address: "" };
  }
  try {
    const res = await fetch("https://api.cashfree.com/verification/offline-aadhaar/verify", {
      method: "POST",
      headers: verifyHeaders(),
      // Docs contract: { otp, ref_id } — NOT reference_id (that mismatch made
      // Cashfree 400 every verify, shown to players as "service unavailable")
      body: JSON.stringify({ ref_id: String(referenceId), otp }),
    });
    const data = await res.json() as any;
    if (!res.ok) {
      // Redacted: scalar error fields only — never name/dob/address/photo
      console.error("[CF] verifyAadhaarOtp failed:", { http: res.status, code: data?.code, type: data?.type, message: data?.message });
      // A wrong/expired OTP comes back as an error response — that is the
      // player's problem to retry, not a vendor outage.
      const errText = `${data?.message ?? ""} ${data?.code ?? ""}`.toLowerCase();
      if (errText.includes("otp")) return { valid: false, name: "" };
      return null;
    }
    // Docs: 200 → { status: "VALID", name, dob, address, ... }
    return {
      valid:   data.status === "VALID",
      name:    data.name ?? "",
      dob:     data.dob  ?? "",
      address: data.address ?? "",
    };
  } catch (e) { console.error("[CF] verifyAadhaarOtp error", e); return null; }
}


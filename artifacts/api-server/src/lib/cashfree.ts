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

/**
 * A Cashfree "payment entity" (element of GET /orders/{id}/payments).
 * We only type the fields we consume; the payment_method object is a tagged
 * union keyed by the method group (upi/card/netbanking/app), so it is parsed
 * defensively by extractPaymentMethod().
 */
export interface CashfreePaymentEntity {
  payment_status: string;
  cf_payment_id: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_group?: string;
  payment_method?: Record<string, unknown>;
}

/** Extracted, DB-ready split: coarse group + free-text detail (either may be null). */
export interface PaymentMethodSplit {
  paymentGroup: string | null;
  paymentMethodDetail: string | null;
}

/**
 * Pull the coarse payment_group and a human-readable detail out of a Cashfree
 * payment entity. Extremely defensive — the payload shape varies by method and
 * any field can be absent; store null when we cannot determine a value.
 *
 * payment_method is shaped like { upi: { upi_id, channel } } /
 * { card: { card_network, card_bank_name, ... } } /
 * { netbanking: { netbanking_bank_name, ... } } / { app: { provider } } etc.
 */
export function extractPaymentMethod(p: {
  payment_group?: unknown;
  payment_method?: unknown;
} | null | undefined): PaymentMethodSplit {
  if (!p || typeof p !== "object") return { paymentGroup: null, paymentMethodDetail: null };

  const group = typeof p.payment_group === "string" && p.payment_group.trim()
    ? p.payment_group.trim().slice(0, 40)
    : null;

  let detail: string | null = null;
  const pm = p.payment_method;
  if (pm && typeof pm === "object") {
    const obj = pm as Record<string, Record<string, unknown> | unknown>;
    // Find the single tag key (upi/card/netbanking/app/wallet/...) and read a
    // sensible display field from within it.
    for (const [key, val] of Object.entries(obj)) {
      if (!val || typeof val !== "object") continue;
      const inner = val as Record<string, unknown>;
      const pick = (...keys: string[]): string | null => {
        for (const k of keys) {
          const v = inner[k];
          if (typeof v === "string" && v.trim()) return v.trim();
        }
        return null;
      };
      if (key === "upi")        detail = pick("upi_id", "channel");
      else if (key === "card")  detail = pick("card_bank_name", "card_network", "card_type");
      else if (key === "netbanking") detail = pick("netbanking_bank_name", "netbanking_bank_code", "channel");
      else if (key === "app" || key === "wallet") detail = pick("provider", "channel");
      else                      detail = pick("provider", "channel", "bank_name");
      if (detail) break;
    }
  }
  if (detail) detail = detail.slice(0, 120);
  return { paymentGroup: group, paymentMethodDetail: detail };
}

export async function getPaymentStatus(orderId: string): Promise<{ status: string; paymentId?: string; amount?: number; currency?: string; paymentGroup?: string | null; paymentMethodDetail?: string | null } | null> {
  if (!APP_ID || !SECRET) {
    return { status: "SUCCESS", paymentId: `mock_pay_${Date.now()}`, paymentGroup: null, paymentMethodDetail: null };
  }
  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/payments`, { headers: cfHeaders() });
    if (!res.ok) return null;
    const payments = (await res.json()) as CashfreePaymentEntity[];
    const success = payments.find(p => p.payment_status === "SUCCESS");
    if (success) {
      const split = extractPaymentMethod(success);
      return { status: "SUCCESS", paymentId: success.cf_payment_id, amount: success.payment_amount, currency: success.payment_currency, ...split };
    }
    const latest = payments[0];
    if (!latest) return { status: "PENDING" };
    const split = extractPaymentMethod(latest);
    return { status: latest.payment_status, amount: latest.payment_amount, currency: latest.payment_currency, ...split };
  } catch (e) { console.error("[CF] getPaymentStatus error", e); return null; }
}

/**
 * Fetch the full list of Cashfree payment entities for an order (used by the
 * admin backfill tool). Returns null when creds are missing (dev/stub) so the
 * caller can skip real network calls.
 */
export async function listOrderPayments(orderId: string): Promise<CashfreePaymentEntity[] | null> {
  if (!APP_ID || !SECRET) return null;
  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/payments`, { headers: cfHeaders() });
    if (!res.ok) { console.error("[CF] listOrderPayments failed:", orderId, res.status); return null; }
    return (await res.json()) as CashfreePaymentEntity[];
  } catch (e) { console.error("[CF] listOrderPayments error", e); return null; }
}

/**
 * A Cashfree settlement record (element of POST /pg/settlements).
 * Only the fields we surface are typed; the API returns many more.
 */
export interface CashfreeSettlement {
  settlement_id?: number | string;
  cf_settlement_id?: number | string;
  amount_settled?: number;   // net paid into the bank account (₹)
  payment_amount?: number;   // gross captured for this settlement (₹)
  settled?: number;          // some API versions use `settled`
  service_charge?: number;   // Cashfree gateway fee (₹, pre-GST)
  service_tax?: number;      // GST on the gateway fee (₹)
  adjustment?: number;
  status?: string;
  event_time?: string;
  settlement_date?: string;
  utr?: string;
}

/** Aggregated settlement/fee view returned to the admin finance screen. */
export interface SettlementSummary {
  configured: boolean;         // false ⇒ dev/stub, no real creds
  count: number;               // settlements considered
  grossSettled: number;        // sum of gross captured (₹)
  netSettled: number;          // sum of amount_settled (₹)
  serviceCharge: number;       // sum of Cashfree gateway fee (₹)
  serviceTax: number;          // sum of GST on the gateway fee (₹)
  effectiveFeeRate: number;    // (serviceCharge + serviceTax) / grossSettled
  from: string | null;
  to: string | null;
  fetchedAt: string;
}

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Fetch settlement records from the Cashfree Recon / Settlements API and
 * aggregate the real gateway fees.
 *
 * Returns { configured:false } when creds are missing (dev/stub) so the caller
 * can fall back to the labelled 2% estimate without ever hitting the network.
 * The Settlements API is only reachable from whitelisted PROD IPs, so on any
 * network/auth failure we return null (caller keeps its last cached value).
 */
export async function fetchSettlementSummary(opts?: { from?: string; to?: string }): Promise<SettlementSummary | null> {
  const fetchedAt = new Date().toISOString();
  if (!APP_ID || !SECRET) {
    return {
      configured: false, count: 0, grossSettled: 0, netSettled: 0,
      serviceCharge: 0, serviceTax: 0, effectiveFeeRate: 0,
      from: opts?.from ?? null, to: opts?.to ?? null, fetchedAt,
    };
  }
  try {
    // Recon endpoint: POST /pg/settlements with an optional date filter.
    const filters: Record<string, unknown> = {};
    if (opts?.from && opts?.to) {
      filters.start_date = opts.from;
      filters.end_date = opts.to;
    }
    const res = await fetch(`${BASE_URL}/settlements`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify({
        filters,
        pagination: { limit: 1000 },
      }),
    });
    if (!res.ok) {
      console.error("[CF] fetchSettlementSummary failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const body = (await res.json()) as { data?: CashfreeSettlement[] } | CashfreeSettlement[];
    const rows: CashfreeSettlement[] = Array.isArray(body) ? body : (body.data ?? []);

    let grossSettled = 0, netSettled = 0, serviceCharge = 0, serviceTax = 0;
    for (const r of rows) {
      grossSettled  += num(r.payment_amount);
      netSettled    += num(r.amount_settled ?? r.settled);
      serviceCharge += num(r.service_charge);
      serviceTax    += num(r.service_tax);
    }
    const totalFee = serviceCharge + serviceTax;
    const effectiveFeeRate = grossSettled > 0 ? totalFee / grossSettled : 0;

    return {
      configured: true,
      count: rows.length,
      grossSettled: Math.round(grossSettled * 100) / 100,
      netSettled: Math.round(netSettled * 100) / 100,
      serviceCharge: Math.round(serviceCharge * 100) / 100,
      serviceTax: Math.round(serviceTax * 100) / 100,
      effectiveFeeRate: Math.round(effectiveFeeRate * 1e6) / 1e6,
      from: opts?.from ?? null,
      to: opts?.to ?? null,
      fetchedAt,
    };
  } catch (e) {
    console.error("[CF] fetchSettlementSummary error", e);
    return null;
  }
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
      // Redacted: scalar status/error fields only — never the raw response,
      // which carries Aadhaar PII (name, DOB, address, photo, digits).
      console.error("[CF] initiateAadhaarOtp failed:", { http: res.status, status: data?.status, code: data?.code, sub_code: data?.sub_code, type: data?.type, message: data?.message });
      return null;
    }
    // Docs: 200 → { status: "SUCCESS", message: "OTP sent successfully", ref_id: 21637861 }
    const refId = data.ref_id ?? data.reference_id;
    if (refId === undefined || refId === null) {
      console.error("[CF] initiateAadhaarOtp: no ref_id in response", { status: data?.status, code: data?.code, sub_code: data?.sub_code, message: data?.message });
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
      // Redacted: scalar status/error fields only — never name/dob/address/photo
      // or any echo of the Aadhaar number.
      console.error("[CF] verifyAadhaarOtp failed:", { http: res.status, status: data?.status, code: data?.code, sub_code: data?.sub_code, type: data?.type, message: data?.message });
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


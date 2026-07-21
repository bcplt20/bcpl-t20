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
 * Verify PAN via Cashfree Verification Suite
 * Returns: { valid: boolean; name: string; referenceId: string }
 */
export async function verifyPan(pan: string, name: string): Promise<{
  valid: boolean; name: string; referenceId: string;
} | null> {
  if (!VERIFY_APP_ID || !VERIFY_SECRET) {
    console.warn("[CF-STUB] verifyPan — credentials not set, returning mock");
    return { valid: true, name, referenceId: `mock_pan_${Date.now()}` };
  }
  try {
    const res = await fetch("https://api.cashfree.com/verification/pan", {
      method: "POST",
      headers: verifyHeaders(),
      body: JSON.stringify({ pan, name }),
    });
    const data = await res.json() as any;
    if (!res.ok) {
      console.error("[CF] verifyPan failed:", data);
      return null;
    }
    // pan_status: "VALID" | "INVALID" | "NOT_FOUND" | "PENDING"
    return {
      valid:       data.pan_status === "VALID",
      name:        data.name_on_pan ?? name,
      referenceId: data.reference_id ?? `pan_${Date.now()}`,
    };
  } catch (e) { console.error("[CF] verifyPan error", e); return null; }
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
    if (!res.ok) { console.error("[CF] initiateAadhaarOtp failed:", data); return null; }
    return { referenceId: data.reference_id ?? data.ref_id };
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
      body: JSON.stringify({ reference_id: referenceId, otp }),
    });
    const data = await res.json() as any;
    if (!res.ok) { console.error("[CF] verifyAadhaarOtp failed:", data); return null; }
    return {
      valid:   data.status === "SUCCESS",
      name:    data.name ?? "",
      dob:     data.dob  ?? "",
      address: data.address ?? "",
    };
  } catch (e) { console.error("[CF] verifyAadhaarOtp error", e); return null; }
}

/**
 * Combined KYC — verifies PAN + initiates Aadhaar OTP in parallel.
 * Called from kyc.ts route. Returns kycId (stored in DB) and status.
 */
export async function initiateKyc(params: {
  referenceId: string;   // registrationId
  aadhaarNumber?: string;
  panNumber?: string;
  playerName?: string;
}): Promise<{ kycId: string; status: string; aadhaarRefId?: string } | null> {
  if (!VERIFY_APP_ID || !VERIFY_SECRET) {
    console.warn("[CF-STUB] initiateKyc — credentials not configured");
    return { kycId: `mock_kyc_${Date.now()}`, status: "PENDING" };
  }

  let panValid    = false;
  let aadhaarRefId: string | undefined;

  const tasks: Promise<void>[] = [];

  // PAN verification
  if (params.panNumber) {
    tasks.push(
      verifyPan(params.panNumber, params.playerName ?? params.referenceId)
        .then(r => { if (r?.valid) panValid = true; })
        .catch(() => {})
    );
  }

  // Aadhaar OTP initiation
  if (params.aadhaarNumber) {
    tasks.push(
      initiateAadhaarOtp(params.aadhaarNumber)
        .then(r => { if (r) aadhaarRefId = r.referenceId; })
        .catch(() => {})
    );
  }

  await Promise.all(tasks);

  // If both docs provided: success only when PAN valid + Aadhaar OTP initiated
  // If only PAN: instant verification
  if (params.panNumber && !params.aadhaarNumber) {
    return {
      kycId:  `pan_${params.referenceId}_${Date.now()}`,
      status: panValid ? "VALID" : "FAILED",
    };
  }

  if (aadhaarRefId) {
    return {
      kycId:       `kyc_${params.referenceId}_${Date.now()}`,
      status:      "OTP_SENT",   // frontend will collect OTP and call /kyc/verify-otp
      aadhaarRefId,
    };
  }

  return { kycId: `kyc_${params.referenceId}_${Date.now()}`, status: "PENDING" };
}

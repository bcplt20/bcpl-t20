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

// Cashfree KYC / Aadhaar-PAN verification (Verification Suite)
export async function initiateKyc(params: {
  referenceId: string;
  aadhaarNumber?: string;
  panNumber?: string;
}): Promise<{ kycId: string; status: string } | null> {
  if (!APP_ID || !SECRET) {
    console.warn("[CF-STUB] initiateKyc", params.referenceId);
    return { kycId: `mock_kyc_${Date.now()}`, status: "PENDING" };
  }
  // Cashfree Verification Suite endpoint
  try {
    const res = await fetch("https://api.cashfree.com/verification/pan", {
      method: "POST",
      headers: {
        "x-client-id": APP_ID,
        "x-client-secret": SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pan: params.panNumber,
        name: params.referenceId,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reference_id: string; pan_status: string };
    return { kycId: data.reference_id, status: data.pan_status };
  } catch (e) { console.error("[CF] initiateKyc error", e); return null; }
}

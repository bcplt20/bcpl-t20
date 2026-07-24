// Scenario 3 — payment path: order creation (Cashfree SANDBOX) + webhook
// processing incl. the DUPLICATE-webhook replay case (must stay idempotent).
// STAGING ONLY. Requires staging CASHFREE_SECRET_KEY for webhook signing.
import http from "k6/http";
import crypto from "k6/crypto";
import { check, sleep } from "k6";
import { profileStages } from "./profiles.js";

const BASE = __ENV.BASE_URL || "http://localhost:4000";
const CF_SECRET = __ENV.CF_WEBHOOK_SECRET || ""; // staging Cashfree secret ONLY
const ORDER_ID = __ENV.ORDER_ID || ""; // a known staging order to replay

export const options = {
  stages: profileStages(),
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500"],
  },
};

// Cashfree signature: base64(HMAC-SHA256(timestamp + rawBody, secret)),
// headers x-webhook-timestamp + x-webhook-signature.
function signedWebhook(rawBody) {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = crypto.hmac("sha256", CF_SECRET, ts + rawBody, "base64");
  return { ts, sig };
}

export default function () {
  // 1. Webhook replay (duplicate delivery) — the core idempotency check.
  if (CF_SECRET && ORDER_ID) {
    // TODO-VERIFY payload shape against a captured staging webhook before big runs.
    const payload = JSON.stringify({
      type: "PAYMENT_SUCCESS_WEBHOOK",
      data: { order: { order_id: ORDER_ID }, payment: { payment_status: "SUCCESS" } },
    });
    const { ts, sig } = signedWebhook(payload);
    const res = http.post(`${BASE}/api/payment/webhook`, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-webhook-timestamp": ts,
        "x-webhook-signature": sig,
      },
      tags: { step: "webhook-duplicate" },
    });
    // Duplicates must be ACCEPTED quietly (2xx) and change nothing.
    check(res, { "webhook 2xx": (r) => r.status >= 200 && r.status < 300 });
  }

  // 2. Authenticated order creation needs a logged-in session (see scenario 2)
  //    and writes real rows — enable only on disposable staging:
  // if (__ENV.DO_WRITE === "1" && __ENV.TOKEN) {
  //   http.post(`${BASE}/api/payment/phase1/create`, "{}", { headers: { Authorization: `Bearer ${__ENV.TOKEN}`, "Content-Type": "application/json" } });
  // }

  sleep(1);
}

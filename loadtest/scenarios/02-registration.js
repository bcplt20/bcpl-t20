// Scenario 2 — registration funnel: send-otp (MOCK MODE) → verify-otp → status.
// STAGING ONLY, with MSG91 keys UNSET so /api/auth/send-otp runs in stub mode
// and returns the OTP in its response (no real SMS can possibly fire).
import http from "k6/http";
import { check, sleep, fail } from "k6";
import { profileStages } from "./profiles.js";

const BASE = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  stages: profileStages(),
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1200"],
  },
};

// Unique per-VU-iteration phone in a reserved impossible range (starts with 0
// → can never be a real Indian mobile, mirrors the API test convention).
function testPhone() {
  const n = (__VU * 1_000_000 + __ITER) % 100_000_000;
  return `00${String(n).padStart(8, "0")}`;
}

export default function () {
  const phone = testPhone();

  const send = http.post(`${BASE}/api/auth/send-otp`, JSON.stringify({ phone }), {
    headers: { "Content-Type": "application/json" },
    tags: { step: "send-otp" },
  });
  check(send, { "send-otp 200": (r) => r.status === 200 });

  // Stub mode exposes the OTP in the response body. TODO-VERIFY the exact
  // field name against staging (devOtp / otp) before big runs.
  const body = send.json() || {};
  const otp = body.devOtp || body.otp;
  if (!otp) {
    // Staging is NOT in mock mode — abort loudly instead of hammering a real provider.
    fail("no dev OTP in response — staging must run with MSG91 keys unset");
  }

  sleep(1);

  const verify = http.post(`${BASE}/api/auth/verify-otp`, JSON.stringify({ phone, otp }), {
    headers: { "Content-Type": "application/json" },
    tags: { step: "verify-otp" },
  });
  const token = (verify.json() || {}).token;
  check(verify, {
    "verify 200": (r) => r.status === 200,
    "got token": () => Boolean(token),
  });
  if (!token) return;

  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const status = http.get(`${BASE}/api/register/status`, { ...auth, tags: { step: "status" } });
  check(status, { "status 200": (r) => r.status === 200 });

  // Full phase1 registration POST (role, city, personal details) is write-heavy;
  // enable only on a disposable staging DB. TODO-VERIFY body fields first.
  // if (__ENV.DO_WRITE === "1") { http.post(`${BASE}/api/register/phase1`, ...) }

  sleep(Math.random() * 3 + 1);
}

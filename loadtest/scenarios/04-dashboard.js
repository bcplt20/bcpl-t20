// Scenario 4 — player dashboard: authenticated reads at scale.
// Each VU logs in once (mock OTP, staging only) then loops read endpoints.
// Data isolation (player A cannot read player B) is covered by API tests;
// here we measure read throughput + latency under concurrency.
import http from "k6/http";
import { check, sleep, fail } from "k6";
import { profileStages } from "./profiles.js";

const BASE = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  stages: profileStages(),
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<600"],
  },
};

function login() {
  const phone = `00${String((__VU % 100_000_000)).padStart(8, "0")}`;
  const send = http.post(`${BASE}/api/auth/send-otp`, JSON.stringify({ phone }), {
    headers: { "Content-Type": "application/json" },
  });
  const otp = (send.json() || {}).devOtp || (send.json() || {}).otp;
  if (!otp) fail("staging must run in mock OTP mode");
  const verify = http.post(`${BASE}/api/auth/verify-otp`, JSON.stringify({ phone, otp }), {
    headers: { "Content-Type": "application/json" },
  });
  return (verify.json() || {}).token;
}

export default function () {
  if (!__ENV.__token) {
    __ENV.__token = login(); // once per VU
  }
  const auth = { headers: { Authorization: `Bearer ${__ENV.__token}` } };

  for (const path of ["/api/auth/me", "/api/register/status", "/api/video/status"]) {
    const res = http.get(`${BASE}${path}`, { ...auth, tags: { path } });
    check(res, { [`${path} ok`]: (r) => r.status === 200 || r.status === 404 });
    sleep(0.3);
  }
  sleep(Math.random() * 2);
}

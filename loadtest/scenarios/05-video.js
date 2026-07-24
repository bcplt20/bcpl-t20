// Scenario 5 — video pipeline edge: signed-URL issuance under concurrency
// (+ optional tiny representative PUT to S3 — never million real videos).
// The heavy bytes go browser→S3 directly; the API only signs + records.
import http from "k6/http";
import { check, sleep, fail } from "k6";
import { profileStages } from "./profiles.js";

const BASE = __ENV.BASE_URL || "http://localhost:4000";
const UPLOAD_BYTES = Number(__ENV.UPLOAD_BYTES || 0); // e.g. 65536 for a 64KB representative file

export const options = {
  stages: profileStages(),
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1000"],
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
  if (!__ENV.__token) __ENV.__token = login();
  const auth = { Authorization: `Bearer ${__ENV.__token}`, "Content-Type": "application/json" };

  // Presigned URL issuance — the API-side hot path.
  // TODO-VERIFY body fields (contentType/fileName/size) against staging;
  // requires the VU's registration to be in an upload-eligible state, so on a
  // fresh staging DB expect 4xx here — issuance latency is still measured.
  const res = http.post(
    `${BASE}/api/video/upload-url`,
    JSON.stringify({ contentType: "video/mp4" }),
    { headers: auth, tags: { step: "upload-url" } },
  );
  check(res, { "responded": (r) => r.status > 0 && r.status < 500 });

  const url = (res.json() || {}).uploadUrl || (res.json() || {}).url;
  if (url && UPLOAD_BYTES > 0) {
    const blob = new Uint8Array(UPLOAD_BYTES).buffer;
    const put = http.put(url, blob, { headers: { "Content-Type": "video/mp4" }, tags: { step: "s3-put" } });
    check(put, { "s3 put 200": (r) => r.status === 200 });
    // Completion event (POST /api/video/confirm) writes rows — DO_WRITE only.
  }

  sleep(Math.random() * 2 + 0.5);
}

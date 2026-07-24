// Scenario 1 — public website browse (homepage, teams, static pages).
// Validates CloudFront caching once CF is in front: compare origin RPS vs
// edge RPS (x-cache: Hit from cloudfront ratio).
import http from "k6/http";
import { check, sleep } from "k6";
import { profileStages } from "./profiles.js";

const BASE = __ENV.BASE_URL || "http://localhost:4000";
const PAGES = (__ENV.PAGES || "/,/teams,/register").split(",");

export const options = {
  stages: profileStages(),
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<2000"],
  },
};

export default function () {
  for (const p of PAGES) {
    const res = http.get(`${BASE}${p.trim()}`, { tags: { page: p.trim() } });
    check(res, {
      "status 200": (r) => r.status === 200,
      "html body": (r) => String(r.body).includes("<"),
    });
    sleep(Math.random() * 2 + 0.5); // human-ish think time
  }
}

/**
 * Fee config — single source of truth for every DISPLAYED price on the site.
 *
 * Served by GET /api/fees from the SAME map the API uses to create payment
 * orders, so shown and charged amounts can never drift. Falls back to the
 * known values if the API is briefly unreachable (display-only — the amount
 * actually charged is always computed server-side).
 */
import { useEffect, useState } from "react";
import { getFees, type FeeConfig } from "./api";

export const FALLBACK_FEES: FeeConfig = {
  phase1: { bat: 299, bowl: 299, wk: 299, ar: 399 },
  phase2: { bat: 2000, bowl: 2000, wk: 2000, ar: 3000 },
  gstRate: 0.18,
};

let cached: FeeConfig | null = null;
let inflight: Promise<FeeConfig> | null = null;

export function fetchFees(): Promise<FeeConfig> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = getFees()
      .then(f => { cached = f; return f; })
      .catch(() => FALLBACK_FEES)
      .finally(() => { inflight = null; });
  }
  return inflight;
}

/** React hook — returns fallback immediately, live config once loaded. */
export function useFees(): FeeConfig {
  const [fees, setFees] = useState<FeeConfig>(cached ?? FALLBACK_FEES);
  useEffect(() => {
    let on = true;
    fetchFees().then(f => { if (on) setFees(f); });
    return () => { on = false; };
  }, []);
  return fees;
}

/** Gross amount charged at checkout (mirrors server: round(base × (1+GST))). */
export const withGst = (base: number, rate: number = FALLBACK_FEES.gstRate) =>
  Math.round(base * (1 + rate));

/** Indian-format rupee display: 2000 → "₹2,000" */
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

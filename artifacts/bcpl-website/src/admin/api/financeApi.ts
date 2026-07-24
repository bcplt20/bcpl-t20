/**
 * Admin API for the Finance view — real payment-method split + payments on hold,
 * and the Cashfree backfill action.
 *
 * Uses the shared adminReq plumbing (auth headers, token renewal, error shape).
 * Do NOT add fetch logic here — always route through adminReq.
 */
import { adminReq } from "../../lib/adminHttp";

export type SplitRow = { group: string; amount: number; count: number };

export type PhaseSplit = { totalCollected: number; splitByGroup: SplitRow[] };

export type OnHoldRow = {
  phase: "Phase 1" | "Phase 2";
  name: string | null;
  regNumber: string | null;
  amount: number;
  orderId: string;
  flaggedAt: string;
};

export type FinanceSummary = {
  phase1: PhaseSplit;
  phase2: PhaseSplit;
  combined: PhaseSplit;
  onHold: OnHoldRow[];
  onHoldTotal: number;
};

export type BackfillResult = {
  stubMode?: boolean;
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
};

/** Aggregated real Cashfree gateway fees / settlement totals (Task #38). */
export type SettlementSummary = {
  configured: boolean;
  count: number;
  grossSettled: number;
  netSettled: number;
  serviceCharge: number;    // Cashfree gateway fee (pre-GST), ₹
  serviceTax: number;       // GST on the gateway fee, ₹
  effectiveFeeRate: number; // (serviceCharge + serviceTax) / grossSettled
  from: string | null;
  to: string | null;
  fetchedAt: string;
  cachedAt?: string;
};

export type SettlementsResponse = {
  configured: boolean;      // false ⇒ dev/stub, use labelled 2% estimate
  fromCache: boolean;
  settlements: SettlementSummary | null;
  message?: string;
};

/** Per-phase + combined payment split and the on-hold (amount_mismatch) list. */
export const adminGetFinanceSummary = () =>
  adminReq<FinanceSummary>("GET", "/admin/finance/summary");

/** Real Cashfree settlements / gateway fees (cached server-side). */
export const adminGetSettlements = () =>
  adminReq<SettlementsResponse>("GET", "/admin/finance/settlements");

/** Fill in missing payment methods from Cashfree for old success payments. */
export const adminBackfillPaymentMethods = () =>
  adminReq<BackfillResult>("POST", "/admin-tools/payments/backfill-methods");

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

/** Per-phase + combined payment split and the on-hold (amount_mismatch) list. */
export const adminGetFinanceSummary = () =>
  adminReq<FinanceSummary>("GET", "/admin/finance/summary");

/** Fill in missing payment methods from Cashfree for old success payments. */
export const adminBackfillPaymentMethods = () =>
  adminReq<BackfillResult>("POST", "/admin-tools/payments/backfill-methods");

/**
 * GST helpers — BCPL prices are GST-INCLUSIVE.
 * Mirror of artifacts/bcpl-website/src/lib/gst.ts — keep the two in sync.
 *
 * Stored payment amounts (₹353, ₹471, ₹2,360, ₹3,540) are the final amounts
 * players actually paid (base fee + 18% GST already included), so GST must be
 * extracted OUT of the stored amount, never added on top.
 * All math is done in paise so the parts always sum exactly to the total.
 */
export const GST_RATE = 0.18;

export type GstBreakup = {
  base: number;   // taxable value (before GST)
  gst: number;    // total GST included in the gross amount
  cgst: number;   // 9% half (floor)
  sgst: number;   // 9% half (remainder, so cgst + sgst === gst exactly)
  total: number;  // the gross (GST-inclusive) amount, unchanged
};

export function gstFromGross(gross: number): GstBreakup {
  const grossP = Math.round(gross * 100);
  const baseP  = Math.round(grossP / (1 + GST_RATE));
  const gstP   = grossP - baseP;
  const cgstP  = Math.floor(gstP / 2);
  const sgstP  = gstP - cgstP;
  return {
    base:  baseP / 100,
    gst:   gstP / 100,
    cgst:  cgstP / 100,
    sgst:  sgstP / 100,
    total: grossP / 100,
  };
}

/** Format rupee amounts that may carry paise — "2,000" or "299.15" */
export function inr(n: number): string {
  return n % 1 === 0
    ? n.toLocaleString("en-IN")
    : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

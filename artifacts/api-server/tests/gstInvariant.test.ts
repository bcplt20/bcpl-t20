/**
 * GST paise-math invariant (guards Task #19's fix).
 *
 * lib/gst.ts extracts an 18% GST-INCLUSIVE amount into base + CGST + SGST.
 * The whole point of doing the arithmetic in paise is that the parts always
 * sum back to the exact gross the player paid — no rupee ever appears or
 * disappears through rounding (e.g. 353 = 299.15 + 26.92 + 26.93).
 *
 * This test pins that invariant so a future "simplification" of gst.ts that
 * reintroduces float drift fails loudly in CI. Pure-function unit test — no
 * DB, no network, no provider calls.
 */
import { describe, it, expect } from "vitest";
import { gstFromGross, inr, GST_RATE } from "../src/lib/gst";

/** Every part must be an exact multiple of a paise (2 dp) — no float dust. */
const isPaise = (n: number) => Number.isInteger(Math.round(n * 100)) &&
  Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

/** Assert the full invariant for a single gross amount. */
function assertBreakup(gross: number) {
  const b = gstFromGross(gross);

  // total is the untouched gross
  expect(Math.round(b.total * 100)).toBe(Math.round(gross * 100));

  // every returned figure is clean to the paise (no 26.920000001 dust)
  for (const part of [b.base, b.gst, b.cgst, b.sgst, b.total]) {
    expect(isPaise(part)).toBe(true);
  }

  // base + cgst + sgst === total EXACTLY (compare in integer paise)
  const baseP  = Math.round(b.base * 100);
  const cgstP  = Math.round(b.cgst * 100);
  const sgstP  = Math.round(b.sgst * 100);
  const totalP = Math.round(b.total * 100);
  expect(baseP + cgstP + sgstP).toBe(totalP);

  // cgst + sgst === gst EXACTLY
  const gstP = Math.round(b.gst * 100);
  expect(cgstP + sgstP).toBe(gstP);

  // the two halves differ by at most 1 paise (odd-paise GST splits one extra
  // paise into SGST, never more)
  expect(Math.abs(cgstP - sgstP)).toBeLessThanOrEqual(1);

  // no negative components; base is never larger than the gross
  expect(baseP).toBeGreaterThanOrEqual(0);
  expect(gstP).toBeGreaterThanOrEqual(0);
  expect(baseP).toBeLessThanOrEqual(totalP);
}

describe("gstFromGross paise invariant", () => {
  // Known real BCPL price points across BOTH fee tiers:
  //   Phase 1 standard 353, all-rounder 471
  //   Phase 2 standard 2360, all-rounder 3540
  // plus the pre-GST base figures (299, 399, 2000, 3000) for good measure.
  const REAL_AMOUNTS = [299, 353, 399, 471, 2000, 2360, 3000, 3540];

  it.each(REAL_AMOUNTS)("holds exactly for real amount ₹%d", (amt) => {
    assertBreakup(amt);
  });

  it("353 splits into the documented 299.15 / 26.92 / 26.93", () => {
    const b = gstFromGross(353);
    expect(b.base).toBe(299.15);
    expect(b.cgst).toBe(26.92);
    expect(b.sgst).toBe(26.93);
    expect(b.base + b.cgst + b.sgst).toBe(353);
  });

  it("holds exhaustively for every integer rupee 1..5000", () => {
    for (let amt = 1; amt <= 5000; amt++) {
      assertBreakup(amt);
    }
  });

  it("holds for amounts carrying paise (½-rupee steps 0.50..2000)", () => {
    for (let p = 50; p <= 200000; p += 50) {
      assertBreakup(p / 100);
    }
  });

  it("GST_RATE is 18%", () => {
    expect(GST_RATE).toBe(0.18);
  });
});

describe("inr formatting helper", () => {
  it("formats whole rupees without decimals", () => {
    expect(inr(2000)).toBe("2,000");
    expect(inr(353)).toBe("353");
  });
  it("formats paise-carrying amounts with 2 decimals", () => {
    expect(inr(299.15)).toBe("299.15");
    expect(inr(26.9)).toBe("26.90");
  });
});

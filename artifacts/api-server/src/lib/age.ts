/**
 * Age eligibility for BCPL Season 5 (spec: 18–45 years inclusive).
 * Pure functions — exact birthday math, no timezone drift (UTC dates).
 */

export const AGE_MIN = 18;
export const AGE_MAX = 45;

export const AGE_INELIGIBLE_MESSAGE =
  "BCPL Season 5 player eligibility is currently limited to players aged 18–45 years.";

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a YYYY-MM-DD date string strictly; returns null when invalid. */
export function parseDob(dob: string): { y: number; m: number; d: number } | null {
  if (!DOB_RE.test(dob)) return null;
  const [y, m, d] = dob.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  // Round-trip through Date (UTC) to reject impossible dates like Feb 30.
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return { y, m, d };
}

/**
 * Completed age in years at `now` for a YYYY-MM-DD dob.
 * Returns null for malformed/impossible dates or future dates.
 */
export function computeAgeYears(dob: string, now: Date = new Date()): number | null {
  const p = parseDob(dob);
  if (!p) return null;
  const ny = now.getUTCFullYear();
  const nm = now.getUTCMonth() + 1;
  const nd = now.getUTCDate();
  let age = ny - p.y;
  // Birthday not yet reached this year → one year younger.
  if (nm < p.m || (nm === p.m && nd < p.d)) age -= 1;
  if (age < 0 || age > 130) return null;
  return age;
}

/** Inclusive 18–45 gate. Boundary rules: 18th birthday today = eligible; still 45 = eligible; 46+ = not. */
export function isAgeEligible(dob: string, now: Date = new Date()): boolean {
  const age = computeAgeYears(dob, now);
  return age !== null && age >= AGE_MIN && age <= AGE_MAX;
}

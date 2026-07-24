// OTP abuse guards (security audit — spec sections S, T, BK).
//
// In-memory, per-process. With N pm2 instances the per-IP cap is effectively
// N× — acceptable for SMS-cost control. The authoritative per-phone send cap
// is DB-backed in routes/auth.ts (send-otp), so it holds across the cluster.
// The verify-attempt lockout below is best-effort brute-force protection; the
// 6-digit code also expires in 10 min and is single-use.

type Bucket = { count: number; resetAt: number };

const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const IP_MAX_SENDS = 30; // many different phones from one IP / device
const VERIFY_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_MAX_FAILS = 8; // wrong-OTP guesses before temporary lockout

const ipSends = new Map<string, Bucket>();
const verifyFails = new Map<string, Bucket>();

function bump(map: Map<string, Bucket>, key: string, windowMs: number): number {
  const now = Date.now();
  const b = map.get(key);
  if (!b || now >= b.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  b.count += 1;
  return b.count;
}

/** Count this IP's OTP-send attempt; ok:false once it exceeds the hourly cap. */
export function checkOtpSendIp(ip: string): { ok: boolean; retryAfter?: number } {
  const key = ip || "unknown";
  const count = bump(ipSends, key, IP_WINDOW_MS);
  if (count > IP_MAX_SENDS) {
    const b = ipSends.get(key)!;
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - Date.now()) / 1000)) };
  }
  return { ok: true };
}

/** True if the phone is temporarily locked from verifying (too many wrong OTPs). */
export function isOtpVerifyLocked(phone: string): boolean {
  const b = verifyFails.get(phone);
  return !!b && Date.now() < b.resetAt && b.count >= VERIFY_MAX_FAILS;
}

/** Record a wrong OTP attempt; returns attempts remaining before lockout. */
export function registerOtpVerifyFail(phone: string): number {
  const count = bump(verifyFails, phone, VERIFY_WINDOW_MS);
  return Math.max(0, VERIFY_MAX_FAILS - count);
}

/** Clear the wrong-attempt counter after a successful verify. */
export function clearOtpVerifyFails(phone: string): void {
  verifyFails.delete(phone);
}

/** Test-only: reset all counters. */
export function __resetOtpGuards(): void {
  ipSends.clear();
  verifyFails.clear();
}

export const OTP_LIMITS = { IP_MAX_SENDS, IP_WINDOW_MS, VERIFY_MAX_FAILS, VERIFY_WINDOW_MS };

// OTP abuse guards (security audit — spec sections S, T, BK).
//
// In-memory, per-process. With N pm2 instances the caps are effectively N× —
// acceptable for SMS-cost / brute-force control. The authoritative per-phone
// send cap is DB-backed in routes/auth.ts (send-otp), so it holds across the
// cluster.
//
// Verify-side design (lockout-DoS safe): wrong-guess counters only ever move
// when the phone has a LIVE OTP session (enforced by the caller), and hitting
// the cap burns that session instead of locking the phone — so an attacker
// can never lock an arbitrary number out of login, while the 6-digit space
// stays capped at VERIFY_MAX_FAILS guesses per issued OTP.

type Bucket = { count: number; resetAt: number };

const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const IP_MAX_SENDS = 30; // many different phones from one IP / device
const VERIFY_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_MAX_FAILS = 8; // wrong guesses before the pending OTP is burned
const VERIFY_IP_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_IP_MAX = 60; // verify attempts per IP — blocks bulk abuse, generous for humans

const ipSends = new Map<string, Bucket>();
const ipVerifies = new Map<string, Bucket>();
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

function overLimit(map: Map<string, Bucket>, key: string, windowMs: number, max: number):
  { ok: boolean; retryAfter?: number } {
  const count = bump(map, key, windowMs);
  if (count > max) {
    const b = map.get(key)!;
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - Date.now()) / 1000)) };
  }
  return { ok: true };
}

/** Count this IP's OTP-send attempt; ok:false once it exceeds the hourly cap. */
export function checkOtpSendIp(ip: string): { ok: boolean; retryAfter?: number } {
  return overLimit(ipSends, ip || "unknown", IP_WINDOW_MS, IP_MAX_SENDS);
}

/** Count this IP's verify attempt; ok:false once it exceeds the window cap. */
export function checkOtpVerifyIp(ip: string): { ok: boolean; retryAfter?: number } {
  return overLimit(ipVerifies, ip || "unknown", VERIFY_IP_WINDOW_MS, VERIFY_IP_MAX);
}

/**
 * Record a wrong OTP attempt for a phone that HAS a live session (caller must
 * verify that first — counting without a session enables lockout-DoS).
 * Returns the failure count in the current window.
 */
export function registerOtpVerifyFail(phone: string): number {
  return bump(verifyFails, phone, VERIFY_WINDOW_MS);
}

/** Clear the wrong-attempt counter (successful verify, or after session burn). */
export function clearOtpVerifyFails(phone: string): void {
  verifyFails.delete(phone);
}

/** Test-only: reset all counters. */
export function __resetOtpGuards(): void {
  ipSends.clear();
  ipVerifies.clear();
  verifyFails.clear();
}

export const OTP_LIMITS = {
  IP_MAX_SENDS, IP_WINDOW_MS,
  VERIFY_MAX_FAILS, VERIFY_WINDOW_MS,
  VERIFY_IP_MAX, VERIFY_IP_WINDOW_MS,
};

/**
 * OTP abuse protection (security audit — rate limiting / brute-force):
 *  - send-otp: per-IP burst cap + per-phone hourly cap + resend cooldown
 *  - verify-otp: wrong-attempt lockout (6-digit brute-force guard)
 *
 * NO real SMS can fire from this suite (MSG91 keys are live in dev):
 *  - unit tests hit the guard module directly (no HTTP)
 *  - the verify-otp tests never send SMS (verify only reads otp_sessions)
 *  - the send-otp cap test pre-seeds otp_sessions so the request
 *    short-circuits with 429 BEFORE reaching sendOtp()
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";

const guard = await import("../src/lib/otpGuard");
const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { otpSessionsTable } = await import("@workspace/db/schema");

// unique per-run phones (valid Indian format, never real recipients — no SMS is sent)
const lockPhone = "96" + String(Date.now()).slice(-8);
const capPhone  = "97" + String(Date.now() + 1).slice(-8);

beforeEach(() => guard.__resetOtpGuards());

afterAll(async () => {
  await db.delete(otpSessionsTable).where(eq(otpSessionsTable.phone, capPhone));
  guard.__resetOtpGuards();
});

describe("otpGuard (unit)", () => {
  it("caps OTP sends per IP, then unblocks after reset", () => {
    const ip = "203.0.113.7";
    let lastOk = true;
    for (let i = 0; i < guard.OTP_LIMITS.IP_MAX_SENDS; i++) lastOk = guard.checkOtpSendIp(ip).ok;
    expect(lastOk).toBe(true); // exactly at the cap is still allowed
    const over = guard.checkOtpSendIp(ip);
    expect(over.ok).toBe(false); // one past the cap blocks
    expect(over.retryAfter).toBeGreaterThan(0);
    guard.__resetOtpGuards();
    expect(guard.checkOtpSendIp(ip).ok).toBe(true);
  });

  it("locks a phone after too many wrong OTP attempts, clears on success", () => {
    const p = "9800000001";
    expect(guard.isOtpVerifyLocked(p)).toBe(false);
    for (let i = 0; i < guard.OTP_LIMITS.VERIFY_MAX_FAILS; i++) guard.registerOtpVerifyFail(p);
    expect(guard.isOtpVerifyLocked(p)).toBe(true);
    guard.clearOtpVerifyFails(p); // successful verify clears the counter
    expect(guard.isOtpVerifyLocked(p)).toBe(false);
  });
});

describe("verify-otp brute-force lockout (HTTP, no SMS)", () => {
  it("returns 429 after repeated wrong OTPs for the same phone", async () => {
    for (let i = 0; i < guard.OTP_LIMITS.VERIFY_MAX_FAILS; i++) {
      const r = await request(app)
        .post("/api/auth/verify-otp")
        .send({ phone: lockPhone, otp: "000000", purpose: "login" });
      expect(r.status).toBe(400); // invalid OTP, counted as a failed attempt
    }
    const locked = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: lockPhone, otp: "000000", purpose: "login" });
    expect(locked.status).toBe(429);
    expect(String(locked.body.error)).toMatch(/too many/i);
  });
});

describe("send-otp per-phone cap (HTTP, short-circuits before any SMS)", () => {
  it("returns 429 and creates no new OTP row when the phone is over the cap", async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    for (let i = 0; i < 5; i++) {
      await db.insert(otpSessionsTable).values({
        phone: capPhone, otpCode: "111111", purpose: "register", expiresAt,
      });
    }
    const before = (await db.select().from(otpSessionsTable)
      .where(eq(otpSessionsTable.phone, capPhone))).length;

    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: capPhone, purpose: "register" });
    expect(res.status).toBe(429); // cooldown / hourly cap — rejected pre-send

    const after = (await db.select().from(otpSessionsTable)
      .where(eq(otpSessionsTable.phone, capPhone))).length;
    expect(after).toBe(before); // no new OTP row ⇒ sendOtp() was never reached
  });
});

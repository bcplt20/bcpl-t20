/**
 * OTP abuse protection (security audit — rate limiting / brute-force):
 *  - send-otp: per-IP burst cap + per-phone hourly cap + resend cooldown
 *  - verify-otp: per-IP throttle + session burn after repeated wrong guesses
 *    (deliberately NO per-phone lockout — that was a lockout-DoS vector)
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
const burnPhone = "95" + String(Date.now() + 2).slice(-8);

beforeEach(() => guard.__resetOtpGuards());

afterAll(async () => {
  for (const p of [capPhone, lockPhone, burnPhone]) {
    await db.delete(otpSessionsTable).where(eq(otpSessionsTable.phone, p));
  }
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

  it("caps verify attempts per IP, then unblocks after reset", () => {
    const ip = "203.0.113.9";
    let lastOk = true;
    for (let i = 0; i < guard.OTP_LIMITS.VERIFY_IP_MAX; i++) lastOk = guard.checkOtpVerifyIp(ip).ok;
    expect(lastOk).toBe(true); // exactly at the cap is still allowed
    expect(guard.checkOtpVerifyIp(ip).ok).toBe(false);
    guard.__resetOtpGuards();
    expect(guard.checkOtpVerifyIp(ip).ok).toBe(true);
  });

  it("counts wrong-OTP attempts per phone and clears on success", () => {
    const p = "9800000001";
    let n = 0;
    for (let i = 0; i < guard.OTP_LIMITS.VERIFY_MAX_FAILS; i++) n = guard.registerOtpVerifyFail(p);
    expect(n).toBe(guard.OTP_LIMITS.VERIFY_MAX_FAILS);
    guard.clearOtpVerifyFails(p); // successful verify (or session burn) resets
    expect(guard.registerOtpVerifyFail(p)).toBe(1);
  });
});

describe("verify-otp abuse hardening (HTTP, no SMS)", () => {
  it("never locks a phone that has NO active OTP session (lockout-DoS guard)", async () => {
    // An attacker hammering arbitrary numbers must not be able to block them.
    for (let i = 0; i < guard.OTP_LIMITS.VERIFY_MAX_FAILS + 4; i++) {
      const r = await request(app)
        .post("/api/auth/verify-otp")
        .send({ phone: lockPhone, otp: "000000", purpose: "login" });
      expect(r.status).toBe(400); // generic invalid — never 429, nothing counted
    }
    // The rightful owner can still verify immediately: seed a live session and
    // use the correct code — it must get PAST the OTP check (404 = no account
    // for this phone, proving the code was accepted, phone never locked).
    await db.insert(otpSessionsTable).values({
      phone: lockPhone, otpCode: "222333", purpose: "login",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    const ok = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: lockPhone, otp: "222333", purpose: "login" });
    expect(ok.status).toBe(404);
    expect(String(ok.body.error)).toMatch(/no account/i);
  });

  it("burns the pending OTP after too many wrong guesses (brute-force guard)", async () => {
    await db.insert(otpSessionsTable).values({
      phone: burnPhone, otpCode: "654321", purpose: "login",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    for (let i = 0; i < guard.OTP_LIMITS.VERIFY_MAX_FAILS; i++) {
      const r = await request(app)
        .post("/api/auth/verify-otp")
        .send({ phone: burnPhone, otp: "000000", purpose: "login" });
      expect(r.status).toBe(400); // counted — a live session exists
    }
    // Even the CORRECT code now fails: the session was invalidated, capping
    // the 6-digit space at VERIFY_MAX_FAILS guesses per issued OTP.
    const after = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: burnPhone, otp: "654321", purpose: "login" });
    expect(after.status).toBe(400);

    const rows = await db.select().from(otpSessionsTable)
      .where(eq(otpSessionsTable.phone, burnPhone));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.usedAt !== null)).toBe(true); // burned, not locked
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

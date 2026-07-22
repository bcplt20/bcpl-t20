/**
 * Admin login brute-force protection tests (Task: lock down panel password guessing).
 *
 * Covers:
 *  - 6th wrong password from one IP → 429 (5 fails / 15 min window)
 *  - correct password after the lockout window expires → 200 (lockout resets)
 *  - spoofed EARLY x-forwarded-for entries do not evade the per-IP counter
 *    (only the LAST, proxy-appended entry identifies the client)
 *  - GLOBAL circuit breaker: 50 fails across ALL IPs / 15 min → 429 for
 *    everyone (even fresh IPs and the correct password) until the window ends
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";

const TEST_PANEL_PASSWORD = "test-panel-password-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_PANEL_PASSWORD = TEST_PANEL_PASSWORD;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { __resetAdminLoginRateLimit } = await import("../src/routes/admin");

const ORIGINAL_ENV = { ...process.env };
beforeEach(() => {
  process.env.ADMIN_PANEL_PASSWORD = TEST_PANEL_PASSWORD;
  process.env.SESSION_SECRET = TEST_SESSION_SECRET;
  process.env.NODE_ENV = "test";
});
afterEach(() => {
  process.env.ADMIN_PANEL_PASSWORD = ORIGINAL_ENV.ADMIN_PANEL_PASSWORD;
  process.env.SESSION_SECRET = ORIGINAL_ENV.SESSION_SECRET ?? TEST_SESSION_SECRET;
  process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV;
  vi.restoreAllMocks();
});

const LOGIN = "/api/admin/session";

/** Attempt login with a given x-forwarded-for header value. */
function attempt(xff: string, password: string) {
  return request(app).post(LOGIN).set("x-forwarded-for", xff).send({ password });
}

// The in-memory loginFails map persists for the life of the module, so every
// test uses its own unique "real client IP" (the LAST x-forwarded-for entry).
let ipCounter = 0;
function freshIp() {
  ipCounter += 1;
  return `10.99.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

describe("POST /api/admin/session brute-force lockout", () => {
  it("5 wrong passwords → 401 each; 6th attempt from same IP → 429", async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) {
      const res = await attempt(ip, "wrong-password");
      expect(res.status).toBe(401);
    }
    // 6th attempt is blocked even before the password is checked
    const blocked = await attempt(ip, "wrong-password");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many failed attempts/i);

    // ...and even the CORRECT password is refused while locked out
    const correctWhileLocked = await attempt(ip, TEST_PANEL_PASSWORD);
    expect(correctWhileLocked.status).toBe(429);
  });

  it("correct password succeeds again after the 15-minute lockout window expires", async () => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) {
      expect((await attempt(ip, "wrong-password")).status).toBe(401);
    }
    expect((await attempt(ip, TEST_PANEL_PASSWORD)).status).toBe(429);

    // Advance time past the 15-minute window
    const realNow = Date.now();
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(realNow + 16 * 60 * 1000);
    try {
      const res = await attempt(ip, TEST_PANEL_PASSWORD);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("successful login resets the fail counter for that IP", async () => {
    const ip = freshIp();
    for (let i = 0; i < 4; i++) {
      expect((await attempt(ip, "wrong-password")).status).toBe(401);
    }
    expect((await attempt(ip, TEST_PANEL_PASSWORD)).status).toBe(200);
    // Counter cleared: another few wrong attempts are 401, not 429
    expect((await attempt(ip, "wrong-password")).status).toBe(401);
  });

  it("spoofed EARLY x-forwarded-for entries do not evade the per-IP counter", async () => {
    const realIp = freshIp();
    // Attacker varies the client-controlled early entries on every request,
    // but the proxy always appends the real client IP last.
    for (let i = 0; i < 5; i++) {
      const res = await attempt(`1.2.3.${i}, 5.6.7.${i}, ${realIp}`, "wrong-password");
      expect(res.status).toBe(401);
    }
    // 6th attempt with yet another spoofed prefix is still blocked
    const blocked = await attempt(`9.9.9.9, ${realIp}`, "wrong-password");
    expect(blocked.status).toBe(429);
  });

  it("a different real client IP is not affected by another IP's lockout", async () => {
    const lockedIp = freshIp();
    const otherIp = freshIp();
    for (let i = 0; i < 5; i++) await attempt(lockedIp, "wrong-password");
    expect((await attempt(lockedIp, "wrong-password")).status).toBe(429);

    const res = await attempt(otherIp, TEST_PANEL_PASSWORD);
    expect(res.status).toBe(200);
  });
});

describe("global circuit breaker (50 fails across ALL IPs / 15 min)", () => {
  beforeEach(() => __resetAdminLoginRateLimit());
  afterEach(() => __resetAdminLoginRateLimit());

  /** Rack up `n` failures, each from a brand-new IP (per-IP limit never trips). */
  async function failFromRotatingIps(n: number) {
    for (let i = 0; i < n; i++) {
      const res = await attempt(freshIp(), "wrong-password");
      expect(res.status).toBe(401);
    }
  }

  it("50 failures from rotating IPs → 429 for everyone, even a fresh IP with the correct password", async () => {
    await failFromRotatingIps(50);

    // Fresh IP, wrong password → blocked globally
    const blockedWrong = await attempt(freshIp(), "wrong-password");
    expect(blockedWrong.status).toBe(429);
    expect(blockedWrong.body.error).toMatch(/temporarily locked|unusual activity/i);

    // Fresh IP, CORRECT password → still blocked while tripped
    const blockedCorrect = await attempt(freshIp(), TEST_PANEL_PASSWORD);
    expect(blockedCorrect.status).toBe(429);
  });

  it("logs an admin alert when the breaker trips", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await failFromRotatingIps(50);
    const alerted = errSpy.mock.calls.some(args =>
      String(args[0]).includes("circuit breaker TRIPPED")
    );
    expect(alerted).toBe(true);
  });

  it("49 failures do NOT trip the breaker — a fresh IP can still log in", async () => {
    await failFromRotatingIps(49);
    const res = await attempt(freshIp(), TEST_PANEL_PASSWORD);
    expect(res.status).toBe(200);
  });

  it("breaker resets after the 15-minute window — login works again", async () => {
    await failFromRotatingIps(50);
    expect((await attempt(freshIp(), TEST_PANEL_PASSWORD)).status).toBe(429);

    const realNow = Date.now();
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(realNow + 16 * 60 * 1000);
    try {
      const res = await attempt(freshIp(), TEST_PANEL_PASSWORD);
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
    } finally {
      nowSpy.mockRestore();
    }
  });
});

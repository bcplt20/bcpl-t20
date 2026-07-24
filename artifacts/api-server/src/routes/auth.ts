import { draftOnOtpRequested, draftOnOtpVerified } from "./drafts";
import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, otpSessionsTable, registrationsTable } from "@workspace/db/schema";
import { eq, and, gt, gte, isNull } from "drizzle-orm";
import { sendOtp, otpConfigured } from "../lib/sms";
import { signToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { checkOtpSendIp, isOtpVerifyLocked, registerOtpVerifyFail, clearOtpVerifyFails } from "../lib/otpGuard";
import { z } from "zod";

const router = Router();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Real client IP behind nginx: the LAST x-forwarded-for entry is proxy-appended
// (earlier entries can be spoofed by the client).
function clientIp(req: { headers: Record<string, unknown>; ip?: string }): string {
  const xff = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xff) ? xff[xff.length - 1] : xff;
  if (typeof raw === "string" && raw.trim()) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.ip ?? "unknown";
}

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  const schema = z.object({
    phone:   z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
    purpose: z.enum(["register", "login"]),
    draftKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { phone, purpose, draftKey } = parsed.data;

  // ── Abuse guard 1: per-IP burst cap (many phones from one IP / botnet) ──
  const ipCheck = checkOtpSendIp(clientIp(req));
  if (!ipCheck.ok) {
    return void res.status(429).json({
      error: "Too many OTP requests from your network. Please try again later.",
      retryAfter: ipCheck.retryAfter,
    });
  }

  // Gate BEFORE sending any SMS — don't waste an OTP on a doomed flow.
  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  const existingReg = existingUser
    ? (await db.select({ id: registrationsTable.id }).from(registrationsTable)
        .where(eq(registrationsTable.userId, existingUser.id)).limit(1))[0]
    : undefined;

  if (purpose === "register" && existingReg) {
    return void res.status(409).json({
      error: "This mobile number is already registered for Season 5. Please login to continue where you left off.",
      code:  "ALREADY_REGISTERED",
    });
  }
  if (purpose === "login" && !existingReg) {
    return void res.status(404).json({
      error: "No registration found for this number. Please register first.",
      code:  "NOT_REGISTERED",
    });
  }

  // ── Abuse guard 2: per-phone resend cooldown + hourly cap (SMS cost / bombing) ──
  // Cross-instance safe (DB-backed), unlike the in-memory IP guard above.
  const HOUR_MS = 60 * 60 * 1000;
  const recent = await db.select({ createdAt: otpSessionsTable.createdAt })
    .from(otpSessionsTable)
    .where(and(eq(otpSessionsTable.phone, phone), gte(otpSessionsTable.createdAt, new Date(Date.now() - HOUR_MS))));
  const lastSent = recent.reduce((m, r) => Math.max(m, r.createdAt.getTime()), 0);
  if (lastSent && Date.now() - lastSent < 45 * 1000) {
    return void res.status(429).json({
      error: "Please wait a few seconds before requesting another OTP.",
      retryAfter: Math.ceil((45000 - (Date.now() - lastSent)) / 1000),
    });
  }
  if (recent.length >= 5) {
    return void res.status(429).json({ error: "OTP limit reached for this number. Please try again after an hour." });
  }

  const otp       = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.insert(otpSessionsTable).values({ phone, otpCode: otp, purpose, expiresAt });

  const sent = await sendOtp(phone, otp);
  if (!sent) return void res.status(500).json({ error: "Failed to send OTP. Please try again." });

  // Draft autosave journey hook — must never block the OTP flow.
  if (purpose === "register" && draftKey) await draftOnOtpRequested(draftKey, phone);

  // In dev mode (no real SMS delivery configured), return OTP so the UI can show it
  const devOtp = !otpConfigured ? (globalThis as any).__lastDevOtp : undefined;
  res.json({ success: true, message: "OTP sent to " + phone, ...(devOtp ? { devOtp } : {}) });
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  const schema = z.object({
    phone:   z.string().regex(/^[6-9]\d{9}$/),
    otp:     z.string().length(6),
    purpose: z.enum(["register", "login"]),
    name:    z.string().min(2).max(100).optional(),
    email:   z.string().email().optional(),
    draftKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { phone, otp, purpose, name, email, draftKey } = parsed.data;

  // ── Abuse guard: brute-force lockout on the 6-digit code ──
  if (isOtpVerifyLocked(phone)) {
    return void res.status(429).json({ error: "Too many incorrect attempts. Please wait 15 minutes and try again." });
  }

  // Validate OTP
  const [session] = await db.select().from(otpSessionsTable).where(
    and(
      eq(otpSessionsTable.phone, phone),
      eq(otpSessionsTable.otpCode, otp),
      eq(otpSessionsTable.purpose, purpose),
      gt(otpSessionsTable.expiresAt, new Date()),
      isNull(otpSessionsTable.usedAt),
    ),
  ).limit(1);

  if (!session) {
    registerOtpVerifyFail(phone);
    return void res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // Mark OTP used
  await db.update(otpSessionsTable).set({ usedAt: new Date() }).where(eq(otpSessionsTable.id, session.id));
  clearOtpVerifyFails(phone);

  // Find or create user
  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);

  if (!user) {
    if (purpose === "login") return void res.status(404).json({ error: "No account found. Please register first." });
    if (!name || !email) return void res.status(400).json({ error: "Name and email are required for registration." });

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) return void res.status(409).json({ error: "Email already registered with another account." });

    [user] = await db.insert(usersTable).values({ name, phone, email, isVerified: true }).returning();
  } else {
    await db.update(usersTable).set({ isVerified: true, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  }

  // Draft autosave journey hook — the ONLY path that marks a draft's mobile verified.
  if (purpose === "register") await draftOnOtpVerified(draftKey ?? null, phone, user.id);

  const token = signToken({ userId: user.id, phone: user.phone });
  res.json({ success: true, token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email } });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) return void res.status(404).json({ error: "User not found" });
  res.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email } });
});

export default router;

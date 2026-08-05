import { draftOnOtpRequested, draftOnOtpVerified } from "./drafts";
import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, otpSessionsTable, registrationsTable, legacyRegistrationsTable, type LegacyRegistration } from "@workspace/db/schema";
import { eq, and, gt, gte, isNull, lt, sql } from "drizzle-orm";
import { assignRegNumber } from "./register";
import { sendOtp, otpConfigured } from "../lib/sms";
import { signToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { checkOtpSendIp, checkOtpVerifyIp, registerOtpVerifyFail, clearOtpVerifyFails, OTP_LIMITS } from "../lib/otpGuard";
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


/* ── Season-4 paid carryover ─────────────────────────────────────────────
 * Old-site PAID players were promised trials for TWO seasons on the same
 * payment. When such a phone logs in (OTP as usual), we auto-provision a
 * Season-5 account + registration that lands directly on the Phase-2 card:
 * phase1 carried over, phase2 fee treated as already paid — only KYC left.
 * Unpaid legacy rows get nothing: they must register afresh. */
async function findLegacyPaid(phone: string): Promise<LegacyRegistration | undefined> {
  const rows = await db.select().from(legacyRegistrationsTable)
    .where(and(
      eq(legacyRegistrationsTable.source, "paid"),
      sql`right(regexp_replace(${legacyRegistrationsTable.phone}, '\\D', '', 'g'), 10) = ${phone}`,
    )).limit(1);
  return rows[0];
}

/** Legacy exports use old city spellings; the current season's sequences use
 *  the new ones. Normalise so a carryover Bengaluru player continues the same
 *  BCPL-BEN-… sequence instead of forking a BAN one. */
const LEGACY_CITY_ALIASES: Record<string, string> = {
  "bangalore": "Bengaluru",
  "gurgaon":   "Gurugram",
  "new delhi": "Delhi",
  "bombay":    "Mumbai",
};
function normalizeLegacyCity(c: string | null): string | null {
  const t = (c ?? "").trim();
  if (!t) return null;
  return LEGACY_CITY_ALIASES[t.toLowerCase()] ?? t;
}

function mapLegacyRole(r: string | null): string {
  const s = (r ?? "").toLowerCase();
  if (s.includes("bowl")) return "bowl";
  if (s.includes("wicket") || s.includes("keeper") || s === "wk") return "wk";
  if (s.includes("all")) return "ar";
  return "bat";
}

/** Create the carryover registration (idempotent: skipped if the user already
 *  has one). phase1Status "selected" + phase2Status "payment_done" is the
 *  exact state the normal flow reaches after Phase-2 payment — so the
 *  existing KYC gate and trial-pass gate work unchanged. */
async function provisionLegacyCarryover(userId: string, legacy: LegacyRegistration): Promise<void> {
  const reg = await db.transaction(async (tx) => {
    // Per-user advisory lock: concurrent verify-otp calls serialise here, so
    // the recheck below makes provisioning exactly-once.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${"bcpl_legacy_carry_" + userId}))`);
    const [existing] = await tx.select({
      id: registrationsTable.id,
      phase1Status: registrationsTable.phase1Status,
      phase2Status: registrationsTable.phase2Status,
      regNumber: registrationsTable.regNumber,
    }).from(registrationsTable)
      .where(eq(registrationsTable.userId, userId)).limit(1);
    if (existing) {
      // The player ALSO registered fresh this season (e.g. before the
      // carryover login shipped). The 2-season promise still applies:
      // upgrade the existing registration in place instead of leaving them
      // stuck at payment/video steps — but never touch a reg that is already
      // past Phase 1 evaluation (qualified/not_shortlisted/rejected/selected).
      const upgradeable = ["pending", "payment_pending", "payment_done", "video_submitted"];
      if (existing.phase1Status !== "selected" && upgradeable.includes(existing.phase1Status)) {
        const p2Early = !existing.phase2Status || ["pending", "payment_pending"].includes(existing.phase2Status);
        await tx.execute(sql`
          UPDATE registrations
          SET phase1_status = 'selected',
              phase2_status = CASE WHEN ${p2Early} THEN 'payment_done' ELSE phase2_status END,
              consents = COALESCE(consents, '{}'::jsonb) || jsonb_build_object('legacyCarryover', ${JSON.stringify({
                source: legacy.source, legacyRegId: legacy.legacyRegId,
                amountPaise: legacy.amountPaise, upgradedExisting: true, at: new Date().toISOString(),
              })}::jsonb),
              updated_at = NOW()
          WHERE id = ${existing.id}
        `);
        if (!existing.regNumber) return { id: existing.id }; // assign a number below
      }
      return null;
    }
    const [inserted] = await tx.insert(registrationsTable).values({
    userId,
    role: mapLegacyRole(legacy.role),
    trialCity: normalizeLegacyCity(legacy.trialCity),
    phase1Status: "selected",
    phase2Status: "payment_done",
    consents: { legacyCarryover: {
      source: legacy.source, legacyRegId: legacy.legacyRegId,
      amountPaise: legacy.amountPaise, at: new Date().toISOString(),
    } },
    }).returning({ id: registrationsTable.id });
    return inserted ?? null;
  });
  if (reg) await assignRegNumber(reg.id); // paid players carry a reg number
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
    const legacy = await findLegacyPaid(phone);
    if (!legacy) {
      return void res.status(404).json({
        error: "No registration found for this number. Please register first.",
        code:  "NOT_REGISTERED",
      });
    }
    // Season-4 paid player — let the OTP go out; verify-otp provisions the account.
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

  // Opportunistic cleanup: drop this phone's rows older than 24h so
  // otp_sessions stays bounded even at large registration volumes.
  await db.delete(otpSessionsTable)
    .where(and(eq(otpSessionsTable.phone, phone), lt(otpSessionsTable.createdAt, new Date(Date.now() - 24 * HOUR_MS))));

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

  // ── Abuse guard: per-IP verify throttle (bulk brute-force / harassment) ──
  const vip = checkOtpVerifyIp(clientIp(req));
  if (!vip.ok) {
    return void res.status(429).json({
      error: "Too many attempts from your network. Please try again later.",
      retryAfter: vip.retryAfter,
    });
  }

  // Fetch the phone's LIVE sessions (unexpired, unused) WITHOUT filtering on
  // the code, so wrong guesses are only ever counted against a real pending
  // OTP. Counting when no session exists would let an attacker lock arbitrary
  // phone numbers out of login (lockout-DoS).
  const active = await db.select().from(otpSessionsTable).where(
    and(
      eq(otpSessionsTable.phone, phone),
      eq(otpSessionsTable.purpose, purpose),
      gt(otpSessionsTable.expiresAt, new Date()),
      isNull(otpSessionsTable.usedAt),
    ),
  );
  const session = active.find((s) => s.otpCode === otp);

  if (!session) {
    if (active.length > 0) {
      const fails = registerOtpVerifyFail(phone);
      if (fails >= OTP_LIMITS.VERIFY_MAX_FAILS) {
        // Too many wrong guesses: burn the pending OTP(s) instead of locking
        // the phone. The owner just requests a fresh OTP (send caps apply);
        // the 6-digit space stays capped at VERIFY_MAX_FAILS guesses per OTP.
        await db.update(otpSessionsTable).set({ usedAt: new Date() }).where(
          and(eq(otpSessionsTable.phone, phone), isNull(otpSessionsTable.usedAt)),
        );
        clearOtpVerifyFails(phone);
      }
    }
    return void res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // Mark OTP used — atomic: a concurrent request racing on the same session
  // loses here (usedAt already set) and gets the same "invalid" rejection.
  const consumed = await db.update(otpSessionsTable).set({ usedAt: new Date() })
    .where(and(eq(otpSessionsTable.id, session.id), isNull(otpSessionsTable.usedAt)))
    .returning({ id: otpSessionsTable.id });
  if (consumed.length === 0) return void res.status(400).json({ error: "Invalid or expired OTP" });
  clearOtpVerifyFails(phone);

  // Find or create user
  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);

  if (!user && purpose === "login") {
    const legacy = await findLegacyPaid(phone);
    if (!legacy) return void res.status(404).json({ error: "No account found. Please register first." });
    const fullName = [legacy.firstName, legacy.lastName].filter(Boolean).join(" ").trim().slice(0, 100) || "BCPL Player";
    let legacyEmail = legacy.email;
    if (legacyEmail) {
      const clash = await db.select({ id: usersTable.id }).from(usersTable)
        .where(eq(usersTable.email, legacyEmail)).limit(1);
      if (clash.length > 0) legacyEmail = null; // email taken on the new site — use placeholder
    }
    try {
      [user] = await db.insert(usersTable).values({
        name: fullName,
        phone,
        email: legacyEmail ?? "player" + phone + "@legacy.bcplt20.com",
        isVerified: true,
      }).returning();
    } catch (e) {
      // Concurrent first-login won the insert (unique phone/email) — reuse its row.
      [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
      if (!user) throw e;
    }
    await provisionLegacyCarryover(user.id, legacy);
  }

  if (!user) {
    if (!name || !email) return void res.status(400).json({ error: "Name and email are required for registration." });

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) return void res.status(409).json({ error: "Email already registered with another account." });

    [user] = await db.insert(usersTable).values({ name, phone, email, isVerified: true }).returning();
  } else {
    await db.update(usersTable).set({ isVerified: true, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
    if (purpose === "login") {
      // Always check legacy-paid: provisionLegacyCarryover creates the reg
      // when missing AND upgrades an existing fresh-season reg in place
      // (fees waived per the 2-season promise). Idempotent + advisory-locked.
      const legacy = await findLegacyPaid(phone);
      if (legacy) await provisionLegacyCarryover(user.id, legacy);
    }
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

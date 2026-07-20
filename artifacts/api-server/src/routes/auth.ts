import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, otpSessionsTable } from "@workspace/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { sendOtp } from "../lib/sms";
import { signToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => {
  const schema = z.object({
    phone:   z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
    purpose: z.enum(["register", "login"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { phone, purpose } = parsed.data;
  const otp       = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.insert(otpSessionsTable).values({ phone, otpCode: otp, purpose, expiresAt });

  const sent = await sendOtp(phone, otp);
  if (!sent) return void res.status(500).json({ error: "Failed to send OTP. Please try again." });

  res.json({ success: true, message: "OTP sent to " + phone });
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  const schema = z.object({
    phone:   z.string().regex(/^[6-9]\d{9}$/),
    otp:     z.string().length(6),
    purpose: z.enum(["register", "login"]),
    name:    z.string().min(2).max(100).optional(),
    email:   z.string().email().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { phone, otp, purpose, name, email } = parsed.data;

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

  if (!session) return void res.status(400).json({ error: "Invalid or expired OTP" });

  // Mark OTP used
  await db.update(otpSessionsTable).set({ usedAt: new Date() }).where(eq(otpSessionsTable.id, session.id));

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

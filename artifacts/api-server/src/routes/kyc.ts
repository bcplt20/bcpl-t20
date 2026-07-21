import { Router } from "express";
import { db } from "@workspace/db";
import {
  registrationsTable, kycRecordsTable,
  usersTable, notificationLogsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { verifyPan, initiateAadhaarOtp, verifyAadhaarOtp } from "../lib/cashfree";
import { sendEmail, tplKycComplete } from "../lib/email";
import { sendSms } from "../lib/sms";
import { sendWhatsApp, WA } from "../lib/whatsapp";
import { z } from "zod";

const router = Router();

export const PROFESSIONS = [
  "Business Owner", "Salaried Employee", "Doctor", "Engineer",
  "Government Officer", "IAS / IPS / IFS", "Army / Navy / Air Force",
  "Railway Employee", "Teacher / Professor", "Lawyer",
  "Farmer / Agriculture", "Delivery / Logistics (Zomato, Swiggy etc.)",
  "Student / Intern", "Freelancer / Self-Employed", "Other",
] as const;

// ─── Helper: mark KYC + registration as verified ─────────────────────────────
async function markKycVerified(kycId: string, registrationId: string, userId: string) {
  await Promise.all([
    db.update(kycRecordsTable)
      .set({ status: "verified", verifiedAt: new Date() })
      .where(eq(kycRecordsTable.id, kycId)),
    db.update(registrationsTable)
      .set({ phase2Status: "kyc_done", updatedAt: new Date() })
      .where(eq(registrationsTable.id, registrationId)),
  ]);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [reg]  = await db.select().from(registrationsTable).where(eq(registrationsTable.id, registrationId)).limit(1);
  if (user && reg) {
    const email = tplKycComplete(user.name, reg.trialCity ?? "TBD");
    Promise.allSettled([
      sendEmail({ to: user.email, toName: user.name, ...email }),
      sendSms(user.phone, `BCPL T20: KYC verified! Trial city: ${reg.trialCity ?? "TBD"}. We will notify you when trial venue is announced. -BCPL T20`),
      sendWhatsApp({ phone: user.phone, templateName: WA.KYC_COMPLETE, bodyValues: [user.name, reg.trialCity ?? "TBD"] }),
      db.insert(notificationLogsTable).values([
        { userId: user.id, type: "email",    template: "kyc_complete" },
        { userId: user.id, type: "sms",      template: "kyc_complete" },
        { userId: user.id, type: "whatsapp", template: "kyc_complete" },
      ]),
    ]);
  }
}

// ─── POST /api/kyc/initiate ───────────────────────────────────────────────────
// Verifies PAN instantly + initiates Aadhaar OTP
router.post("/initiate", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    profession:     z.enum(PROFESSIONS),
    aadhaarNumber:  z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
    panNumber:      z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN format"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { registrationId, profession, aadhaarNumber, panNumber } = parsed.data;

  const [reg] = await db.select().from(registrationsTable).where(
    and(
      eq(registrationsTable.id, registrationId),
      eq(registrationsTable.userId, req.user!.userId),
    ),
  ).limit(1);

  if (!reg) return void res.status(404).json({ error: "Registration not found" });
  if (reg.phase2Status !== "payment_done") {
    return void res.status(400).json({ error: "Complete Phase 2 payment first" });
  }

  // Get player name for PAN verification
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  // Run PAN verify + Aadhaar OTP initiation in parallel
  const [panResult, aadhaarResult] = await Promise.all([
    verifyPan(panNumber, user?.name ?? registrationId),
    initiateAadhaarOtp(aadhaarNumber),
  ]);

  if (!panResult) {
    return void res.status(502).json({ error: "PAN verification service unavailable. Try again." });
  }
  if (!panResult.valid) {
    return void res.status(400).json({ error: "PAN verification failed. Please check your PAN number." });
  }
  if (!aadhaarResult) {
    return void res.status(502).json({ error: "Aadhaar OTP service unavailable. Try again." });
  }

  // Store KYC record with panRef + aadhaarRef
  const [kyc] = await db.insert(kycRecordsTable).values({
    registrationId,
    profession,
    cashfreeKycId: `kyc_${registrationId.slice(0, 8)}_${Date.now()}`,
    panRef:        panResult.referenceId,
    aadhaarRef:    aadhaarResult.referenceId,
    status:        "pending",
  }).returning();

  res.json({
    success:       true,
    kycId:         kyc.id,
    status:        "OTP_SENT",
    aadhaarRefId:  aadhaarResult.referenceId,
    message:       "PAN verified ✓. OTP sent to Aadhaar-linked mobile number.",
  });
});

// ─── POST /api/kyc/verify-otp ─────────────────────────────────────────────────
// Player submits the OTP received on Aadhaar-linked mobile
router.post("/verify-otp", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    aadhaarRefId:   z.string().min(1),
    otp:            z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { registrationId, aadhaarRefId, otp } = parsed.data;

  // Fetch KYC record
  const [kyc] = await db.select().from(kycRecordsTable)
    .where(and(
      eq(kycRecordsTable.registrationId, registrationId),
      eq(kycRecordsTable.aadhaarRef, aadhaarRefId),
    ))
    .orderBy(kycRecordsTable.createdAt)
    .limit(1);

  if (!kyc) return void res.status(404).json({ error: "KYC record not found. Please restart KYC." });
  if (kyc.status === "verified") {
    return void res.json({ success: true, status: "verified", message: "Already verified." });
  }

  const result = await verifyAadhaarOtp(aadhaarRefId, otp);
  if (!result) {
    return void res.status(502).json({ error: "Aadhaar verification service unavailable. Try again." });
  }
  if (!result.valid) {
    return void res.status(400).json({ error: "Incorrect OTP or OTP expired. Please try again." });
  }

  // Mark verified
  await markKycVerified(kyc.id, registrationId, req.user!.userId);

  res.json({
    success: true,
    status:  "verified",
    message: "KYC verified! Trial details will be shared when announced.",
  });
});

// ─── POST /api/kyc/webhook — Cashfree KYC webhook (backup) ───────────────────
router.post("/webhook", async (req, res) => {
  try {
    const { reference_id, status } = req.body as { reference_id?: string; status?: string };
    if (reference_id && (status === "VALID" || status === "verified" || status === "SUCCESS")) {
      const [kyc] = await db.select().from(kycRecordsTable)
        .where(eq(kycRecordsTable.aadhaarRef, reference_id))
        .limit(1);
      if (kyc && kyc.status !== "verified") {
        await markKycVerified(kyc.id, kyc.registrationId, "webhook");
      }
    }
  } catch (e) { console.error("[KYC-WEBHOOK]", e); }
  res.json({ success: true });
});

export default router;

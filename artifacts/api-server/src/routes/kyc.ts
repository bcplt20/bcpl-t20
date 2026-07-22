import { Router } from "express";
import { db } from "@workspace/db";
import {
  registrationsTable, kycRecordsTable,
  usersTable, notificationLogsTable,
  playerProfilesTable,
} from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { verifyPan, initiateAadhaarOtp, verifyAadhaarOtp } from "../lib/cashfree";
import { sendEmail, tplKycComplete } from "../lib/email";
import { sendSms } from "../lib/sms";
import { sendWhatsApp, WA } from "../lib/whatsapp";
import { z } from "zod";

const router = Router();

// ─── Startup migration: add pan_verified / aadhaar_verified columns (idempotent) ──
export async function ensureKycPanVerified(): Promise<void> {
  await db.execute(sql`
    ALTER TABLE kyc_records
    ADD COLUMN IF NOT EXISTS pan_verified boolean NOT NULL DEFAULT true
  `);
  await db.execute(sql`
    ALTER TABLE kyc_records
    ADD COLUMN IF NOT EXISTS aadhaar_verified boolean NOT NULL DEFAULT false
  `);
  // Records verified before this column existed completed Aadhaar OTP
  await db.execute(sql`
    UPDATE kyc_records SET aadhaar_verified = true
    WHERE status = 'verified' AND aadhaar_verified = false
  `);
  console.log("[MIGRATE] kyc_records.pan_verified + aadhaar_verified ready");
}

// ─── Startup migration: player_profiles table (employment + emergency contact) ──
// These details used to live only in browser sessionStorage; now they are
// collected on the KYC page (after Phase 2 payment) and stored here.
export async function ensurePlayerProfiles(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS player_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id uuid NOT NULL UNIQUE REFERENCES registrations(id),
      company varchar(150),
      job_title varchar(150),
      experience varchar(20),
      linkedin varchar(200),
      tshirt_size varchar(5),
      emergency_name varchar(100),
      emergency_relation varchar(30),
      emergency_phone varchar(15),
      blood_group varchar(5),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  console.log("[MIGRATE] player_profiles ready");
}

export const PROFESSIONS = [
  "Business Owner", "Salaried Employee", "Doctor", "Engineer",
  "Government Officer", "IAS / IPS / IFS", "Army / Navy / Air Force",
  "Railway Employee", "Teacher / Professor", "Lawyer",
  "Farmer / Agriculture", "Delivery / Logistics (Zomato, Swiggy etc.)",
  "Student / Intern", "Freelancer / Self-Employed", "Other",
] as const;

// ─── Helper: mark KYC + registration as verified ─────────────────────────────
// Single path for OTP success, admin approval and webhook — keeps kyc_records
// and registrations.phase2Status in sync and sends player notifications.
export async function markKycVerified(kycId: string, registrationId: string, userId: string) {
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
// Verifies PAN instantly + initiates Aadhaar OTP.
// Also stores employment + emergency-contact details (moved here from the
// pre-payment form so players pay first, then fill the rest).
router.post("/initiate", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    profession:     z.enum(PROFESSIONS),
    aadhaarNumber:  z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
    panNumber:      z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN format"),
    // Employment + emergency contact — optional so older clients that don't
    // send them keep working; the new KYC form always sends them.
    company:           z.string().trim().max(150).optional(),
    jobTitle:          z.string().trim().max(150).optional(),
    experience:        z.string().trim().max(20).optional(),
    linkedin:          z.string().trim().max(200).optional(),
    tshirtSize:        z.enum(["S", "M", "L", "XL", "XXL"]).optional(),
    emergencyName:     z.string().trim().max(100).optional(),
    emergencyRelation: z.string().trim().max(30).optional(),
    emergencyPhone:    z.string().trim().regex(/^\d{10}$/, "Emergency contact number must be 10 digits").optional(),
    bloodGroup:        z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { registrationId, profession, aadhaarNumber, panNumber, ...profile } = parsed.data;

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

  // Save employment + emergency details BEFORE the KYC vendor calls, so the
  // player never has to re-type them even if PAN/Aadhaar verification fails.
  const profileValues = {
    company:           profile.company           || undefined,
    jobTitle:          profile.jobTitle          || undefined,
    experience:        profile.experience        || undefined,
    linkedin:          profile.linkedin          || undefined,
    tshirtSize:        profile.tshirtSize        || undefined,
    emergencyName:     profile.emergencyName     || undefined,
    emergencyRelation: profile.emergencyRelation || undefined,
    emergencyPhone:    profile.emergencyPhone    || undefined,
    bloodGroup:        profile.bloodGroup        || undefined,
  };
  if (Object.values(profileValues).some(v => v !== undefined)) {
    await db.insert(playerProfilesTable)
      .values({ registrationId, ...profileValues })
      .onConflictDoUpdate({
        target: playerProfilesTable.registrationId,
        set: { ...profileValues, updatedAt: new Date() },
      });
  }

  // Get player name for PAN verification
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  // Re-submission guard: reuse the newest existing KYC row instead of piling up duplicates
  const [existingKyc] = await db.select().from(kycRecordsTable)
    .where(eq(kycRecordsTable.registrationId, registrationId))
    .orderBy(desc(kycRecordsTable.createdAt))
    .limit(1);
  if (existingKyc && existingKyc.status === "verified") {
    return void res.json({ success: true, kycId: existingKyc.id, status: "verified", message: "KYC already verified." });
  }
  const upsertKyc = async (values: { panRef: string; aadhaarRef: string; panVerified: boolean }) => {
    if (existingKyc) {
      const [row] = await db.update(kycRecordsTable)
        .set({ profession, ...values, status: "pending", aadhaarVerified: false })
        .where(eq(kycRecordsTable.id, existingKyc.id))
        .returning();
      return row;
    }
    const [row] = await db.insert(kycRecordsTable).values({
      registrationId,
      profession,
      cashfreeKycId: `kyc_${registrationId.slice(0, 8)}_${Date.now()}`,
      ...values,
      status: "pending",
    }).returning();
    return row;
  };

  // Run PAN verify + Aadhaar OTP initiation in parallel
  const [panResult, aadhaarResult] = await Promise.all([
    verifyPan(panNumber, user?.name ?? registrationId),
    initiateAadhaarOtp(aadhaarNumber),
  ]);

  // Cashfree explicitly rejected this PAN → genuinely wrong number, block with a clear message
  if (panResult.outcome === "invalid") {
    return void res.status(400).json({
      error: "PAN verification failed. Please enter the exact 10-character PAN printed on your PAN card.",
    });
  }

  // valid → auto-verified. service_error / not_configured → accept but flag for manual review.
  const panVerified = panResult.outcome === "valid";
  const panRef = panVerified ? panResult.referenceId : `manual_review_${Date.now()}`;
  if (!panVerified) {
    console.warn("[KYC] PAN auto-verify unavailable — flagged for manual review", {
      registrationId, reason: panResult.outcome,
      detail: panResult.outcome === "service_error" ? panResult.detail : undefined,
    });
  }

  if (!aadhaarResult) {
    // Aadhaar OTP service also unavailable — accept the documents and verify manually.
    // A paying player must never be blocked by a vendor outage.
    const kyc = await upsertKyc({ panRef, aadhaarRef: `manual_review_${Date.now()}`, panVerified });
    return void res.json({
      success: true,
      kycId:   kyc.id,
      status:  "MANUAL_REVIEW",
      message: "Documents received ✓. Our team will verify your KYC within 24–48 hours. You will get an SMS + email once verified.",
    });
  }

  // Store KYC record with panRef + aadhaarRef
  const kyc = await upsertKyc({ panRef, aadhaarRef: aadhaarResult.referenceId, panVerified });

  res.json({
    success:       true,
    kycId:         kyc.id,
    status:        "OTP_SENT",
    aadhaarRefId:  aadhaarResult.referenceId,
    panVerified,
    message:       panVerified
      ? "PAN verified ✓. OTP sent to Aadhaar-linked mobile number."
      : "PAN received — our team will verify it. OTP sent to Aadhaar-linked mobile number.",
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

  // Aadhaar OTP passed
  await db.update(kycRecordsTable)
    .set({ aadhaarVerified: true })
    .where(eq(kycRecordsTable.id, kyc.id));

  // If PAN could not be auto-verified, KYC must stay pending until an admin
  // approves the PAN (admin Verify sets pan_verified=true and completes KYC).
  if (!kyc.panVerified) {
    console.warn("[KYC] Aadhaar OTP done but PAN pending manual review — KYC stays pending", {
      kycId: kyc.id, registrationId,
    });
    return void res.json({
      success: true,
      status:  "MANUAL_REVIEW",
      message: "Aadhaar verified ✓. Your PAN will be checked by our team within 24–48 hours. You will get an SMS + email once your KYC is complete.",
    });
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
        await db.update(kycRecordsTable)
          .set({ aadhaarVerified: true })
          .where(eq(kycRecordsTable.id, kyc.id));
        if (kyc.panVerified) {
          await markKycVerified(kyc.id, kyc.registrationId, "webhook");
        } else {
          console.warn("[KYC-WEBHOOK] Aadhaar verified but PAN pending manual review — KYC stays pending", { kycId: kyc.id });
        }
      }
    }
  } catch (e) { console.error("[KYC-WEBHOOK]", e); }
  res.json({ success: true });
});

export default router;

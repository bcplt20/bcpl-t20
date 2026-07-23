import { Router, type Request } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import {
  registrationsTable, kycRecordsTable,
  usersTable, notificationLogsTable,
  playerProfilesTable,
} from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { verifyPan, initiateAadhaarOtp, verifyAadhaarOtp } from "../lib/cashfree";
import { sendEmail, tplKycComplete, adminAlertRecipient, tplKycManualReview } from "../lib/email";
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

// ─── Admin alert: KYC parked for manual review ───────────────────────────────
// Fire-and-forget: must never block or fail the player's request. Call sites
// guard so this fires only on the transition INTO a manual-review state —
// the admin gets exactly one email per parked KYC, not one per player retry.
async function alertAdminKycManualReview(p: {
  registrationId: string;
  panVerified: boolean;
  aadhaarVerified: boolean;
  reason: string;
}): Promise<void> {
  try {
    const alertTo = adminAlertRecipient();
    if (!alertTo) {
      console.error(
        "[KYC][ALERT] ADMIN_ALERT_EMAIL is not set — KYC manual-review alert NOT sent. " +
        "Set ADMIN_ALERT_EMAIL to the admin's monitored inbox.",
        { registrationId: p.registrationId, reason: p.reason },
      );
      return;
    }
    const [row] = await db.select({
      name:  usersTable.name,
      phone: usersTable.phone,
      city:  registrationsTable.trialCity,
    }).from(registrationsTable)
      .innerJoin(usersTable, eq(usersTable.id, registrationsTable.userId))
      .where(eq(registrationsTable.id, p.registrationId))
      .limit(1);
    const tpl = tplKycManualReview({
      playerName:      row?.name ?? "Unknown player",
      playerPhone:     row?.phone ?? "—",
      regIdShort:      p.registrationId.slice(0, 8).toUpperCase(),
      trialCity:       row?.city ?? "TBD",
      panVerified:     p.panVerified,
      aadhaarVerified: p.aadhaarVerified,
      reason:          p.reason,
      flaggedAt:       new Date(),
    });
    await sendEmail({ to: alertTo, toName: "BCPL Admin", subject: tpl.subject, htmlContent: tpl.htmlContent });
  } catch (e) {
    console.error("[KYC][ALERT] manual-review alert email failed", e);
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
  // Resume-safety: never re-run (and re-bill) a verification that has already
  // passed. A verified PAN stays verified; a verified Aadhaar stays verified.
  const skipPan     = existingKyc?.panVerified === true;
  const skipAadhaar = existingKyc?.aadhaarVerified === true;

  const upsertKyc = async (values: { panRef: string; aadhaarRef: string; panVerified: boolean }) => {
    if (existingKyc) {
      const [row] = await db.update(kycRecordsTable)
        .set({ profession, ...values, status: "pending", aadhaarVerified: skipAadhaar })
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

  // Run PAN verify + Aadhaar OTP initiation in parallel — skipping any paid
  // vendor call whose successful result is already on file.
  const [panResult, aadhaarResult] = await Promise.all([
    skipPan
      ? Promise.resolve({ outcome: "valid", referenceId: existingKyc!.panRef ?? `kept_${Date.now()}` } as Awaited<ReturnType<typeof verifyPan>>)
      : verifyPan(panNumber, user?.name ?? registrationId),
    skipAadhaar
      ? Promise.resolve({ referenceId: existingKyc!.aadhaarRef ?? `kept_${Date.now()}` })
      : initiateAadhaarOtp(aadhaarNumber),
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
    // Alert admin once: skip only when this registration is ALREADY sitting in
    // pending manual review (player retrying while the vendor is still down).
    // A previously failed/rejected row re-entering review must alert again.
    const alreadyParked =
      existingKyc?.status === "pending" &&
      (existingKyc.aadhaarRef?.startsWith("manual_review") ?? false);
    if (!alreadyParked) {
      void alertAdminKycManualReview({
        registrationId,
        panVerified,
        aadhaarVerified: false,
        reason: panVerified
          ? "Aadhaar OTP service was unavailable — verify Aadhaar manually"
          : "Aadhaar OTP service AND PAN auto-verify were unavailable — verify both manually",
      });
    }
    return void res.json({
      success: true,
      kycId:   kyc.id,
      status:  "MANUAL_REVIEW",
      message: "Documents received ✓. Our team will verify your KYC within 24–48 hours. You will get an SMS + email once verified.",
    });
  }

  // Store KYC record with panRef + aadhaarRef
  const kyc = await upsertKyc({ panRef, aadhaarRef: aadhaarResult.referenceId, panVerified });

  // Aadhaar was already OTP-verified on a previous attempt — nothing left for
  // the player to do on that side.
  if (skipAadhaar) {
    if (panVerified) {
      await markKycVerified(kyc.id, registrationId, req.user!.userId);
      return void res.json({ success: true, kycId: kyc.id, status: "verified", message: "KYC verified! Trial details will be shared when announced." });
    }
    return void res.json({
      success: true,
      kycId:   kyc.id,
      status:  "MANUAL_REVIEW",
      message: "Aadhaar already verified ✓. Your PAN will be checked by our team within 24–48 hours.",
    });
  }

  res.json({
    success:       true,
    kycId:         kyc.id,
    status:        "OTP_SENT",
    aadhaarRefId:  aadhaarResult.referenceId,
    panVerified,
    message:       panVerified
      ? (skipPan ? "PAN already verified ✓. OTP sent to Aadhaar-linked mobile number." : "PAN verified ✓. OTP sent to Aadhaar-linked mobile number.")
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

  // Ownership guard (IDOR): the registration must belong to the caller
  const [ownedReg] = await db.select({ id: registrationsTable.id }).from(registrationsTable)
    .where(and(
      eq(registrationsTable.id, registrationId),
      eq(registrationsTable.userId, req.user!.userId),
    )).limit(1);
  if (!ownedReg) return void res.status(404).json({ error: "Registration not found." });

  // Throttle OTP guesses per registration (vendor also enforces its own cap)
  if (!vendorCallAllowed(`votp:${registrationId}`, 10)) {
    return void res.status(429).json({ error: "Too many attempts. Please wait 10 minutes and try again." });
  }

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

  // Aadhaar OTP passed — conditional update so the false→true transition is
  // detected atomically: of concurrent OTP + webhook deliveries, exactly one
  // sees the row flip (Postgres row lock), so at most one admin alert fires.
  const transitioned = (await db.update(kycRecordsTable)
    .set({ aadhaarVerified: true })
    .where(and(
      eq(kycRecordsTable.id, kyc.id),
      eq(kycRecordsTable.aadhaarVerified, false),
    ))
    .returning({ id: kycRecordsTable.id })).length > 0;

  // If PAN could not be auto-verified, KYC must stay pending until an admin
  // approves the PAN (admin Verify sets pan_verified=true and completes KYC).
  if (!kyc.panVerified) {
    console.warn("[KYC] Aadhaar OTP done but PAN pending manual review — KYC stays pending", {
      kycId: kyc.id, registrationId,
    });
    if (transitioned) {
      void alertAdminKycManualReview({
        registrationId,
        panVerified: false,
        aadhaarVerified: true,
        reason: "Aadhaar verified by OTP; PAN could not be auto-verified — approve PAN manually",
      });
    }
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

// ─── Per-registration throttle for billed vendor calls ───────────────────────
// Aadhaar OTP sends and PAN lookups cost money per call; cap the damage a
// stuck client (or an abusive logged-in user) can do. In-memory is fine —
// single-process server, and the vendor enforces its own harder limits.
const vendorCallLog = new Map<string, number[]>();
function vendorCallAllowed(key: string, max = 6, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const hits = (vendorCallLog.get(key) ?? []).filter(t => now - t < windowMs);
  if (hits.length >= max) { vendorCallLog.set(key, hits); return false; }
  hits.push(now);
  vendorCallLog.set(key, hits);
  if (vendorCallLog.size > 5000) {
    for (const [k, v] of vendorCallLog) {
      if (v.every(t => now - t >= windowMs)) vendorCallLog.delete(k);
    }
  }
  return true;
}

// ─── Helper: load a registration (ownership-checked) + its newest KYC row ────
async function loadOwnedKyc(registrationId: string, userId: string) {
  const [reg] = await db.select().from(registrationsTable).where(and(
    eq(registrationsTable.id, registrationId),
    eq(registrationsTable.userId, userId),
  )).limit(1);
  if (!reg) return { reg: null, kyc: null };
  const [kyc] = await db.select().from(kycRecordsTable)
    .where(eq(kycRecordsTable.registrationId, registrationId))
    .orderBy(desc(kycRecordsTable.createdAt))
    .limit(1);
  return { reg, kyc: kyc ?? null };
}

// ─── GET /api/kyc/progress/:registrationId ────────────────────────────────────
// Where did the player leave off? Used by the KYC page to resume mid-way
// instead of restarting (and re-billing) the whole flow.
router.get("/progress/:registrationId", requireAuth, async (req: AuthRequest, res) => {
  const registrationId = String(req.params.registrationId);
  if (!/^[0-9a-f-]{36}$/i.test(registrationId)) {
    return void res.status(400).json({ error: "Invalid registrationId" });
  }
  const { reg, kyc } = await loadOwnedKyc(registrationId, req.user!.userId);
  if (!reg) return void res.status(404).json({ error: "Registration not found" });

  const [profile] = await db.select().from(playerProfilesTable)
    .where(eq(playerProfilesTable.registrationId, registrationId)).limit(1);

  if (!kyc) return void res.json({ hasKyc: false, profile: profile ?? null });
  res.json({
    hasKyc:          true,
    status:          kyc.status,
    panVerified:     kyc.panVerified,
    aadhaarVerified: kyc.aadhaarVerified,
    aadhaarParked:   kyc.aadhaarRef?.startsWith("manual_review") ?? false,
    profession:      kyc.profession,
    profile:         profile ?? null,
  });
});

// ─── POST /api/kyc/aadhaar-otp ────────────────────────────────────────────────
// Resume/resend: (re)send the Aadhaar OTP WITHOUT touching PAN — used by the
// resume flow and the "Resend OTP" button so the PAN check is never re-billed.
router.post("/aadhaar-otp", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    aadhaarNumber:  z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { registrationId, aadhaarNumber } = parsed.data;
  const { reg, kyc } = await loadOwnedKyc(registrationId, req.user!.userId);
  if (!reg) return void res.status(404).json({ error: "Registration not found" });
  if (!kyc) return void res.status(404).json({ error: "No KYC submission found. Please fill the KYC form first." });
  if (kyc.status === "verified") {
    return void res.json({ success: true, status: "verified", message: "KYC already verified." });
  }
  if (kyc.aadhaarVerified) {
    return void res.json({ success: true, status: "AADHAAR_DONE", message: "Aadhaar is already verified. Only PAN is pending." });
  }

  // Billed vendor call — throttle per registration
  if (!vendorCallAllowed(`aotp:${registrationId}`)) {
    return void res.status(429).json({ error: "Too many OTP requests. Please wait 10 minutes and try again." });
  }

  const result = await initiateAadhaarOtp(aadhaarNumber);
  if (!result) {
    return void res.status(503).json({
      error: "Aadhaar OTP service is temporarily unavailable. Please try again in some time — our team also verifies parked documents manually.",
    });
  }
  await db.update(kycRecordsTable)
    .set({ aadhaarRef: result.referenceId })
    .where(eq(kycRecordsTable.id, kyc.id));

  res.json({
    success:      true,
    status:       "OTP_SENT",
    aadhaarRefId: result.referenceId,
    panVerified:  kyc.panVerified,
    message:      "OTP sent to your Aadhaar-linked mobile number.",
  });
});

// ─── POST /api/kyc/verify-pan ─────────────────────────────────────────────────
// Resume: PAN retry for players whose Aadhaar is already verified — no Aadhaar
// OTP re-run, no duplicate billing.
router.post("/verify-pan", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    panNumber:      z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN format"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { registrationId, panNumber } = parsed.data;
  const { reg, kyc } = await loadOwnedKyc(registrationId, req.user!.userId);
  if (!reg) return void res.status(404).json({ error: "Registration not found" });
  if (!kyc) return void res.status(404).json({ error: "No KYC submission found. Please fill the KYC form first." });
  if (kyc.status === "verified") {
    return void res.json({ success: true, status: "verified", message: "KYC already verified." });
  }
  if (kyc.panVerified) {
    return void res.json({ success: true, status: "PAN_DONE", message: "PAN is already verified." });
  }

  // Billed vendor call — throttle per registration
  if (!vendorCallAllowed(`pan:${registrationId}`)) {
    return void res.status(429).json({ error: "Too many attempts. Please wait 10 minutes and try again." });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  const result = await verifyPan(panNumber, user?.name ?? registrationId);

  if (result.outcome === "invalid") {
    return void res.status(400).json({
      error: "PAN verification failed. Please enter the exact 10-character PAN printed on your PAN card.",
    });
  }
  if (result.outcome !== "valid") {
    // Vendor down / not configured — the KYC stays parked for manual review
    // (admin was already alerted when it was first parked).
    return void res.json({
      success: true,
      status:  "MANUAL_REVIEW",
      message: "PAN verification service is unavailable right now. Our team will verify your PAN manually within 24–48 hours.",
    });
  }

  await db.update(kycRecordsTable)
    .set({ panVerified: true, panRef: result.referenceId })
    .where(eq(kycRecordsTable.id, kyc.id));

  if (kyc.aadhaarVerified) {
    await markKycVerified(kyc.id, registrationId, req.user!.userId);
    return void res.json({ success: true, status: "verified", message: "KYC verified! Trial details will be shared when announced." });
  }
  res.json({ success: true, status: "PAN_VERIFIED", message: "PAN verified ✓. Now complete the Aadhaar OTP step." });
});

// ─── POST /api/kyc/webhook — Cashfree KYC webhook (backup) ───────────────────
// Signature is mandatory: an unauthenticated request must never be able to
// flip KYC state. Cashfree signs webhooks as base64(HMAC-SHA256(timestamp +
// rawBody, secret)); verification-suite hooks are signed with the verify-suite
// secret, so accept a valid signature from either configured secret.
function verifyKycWebhookSignature(req: Request & { rawBody?: Buffer }): boolean {
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];
  if (typeof signature !== "string" || typeof timestamp !== "string" || !req.rawBody) return false;
  const secrets = [process.env.CF_VERIFY_SECRET, process.env.CASHFREE_SECRET_KEY]
    .filter((s): s is string => !!s);
  const sig = Buffer.from(signature);
  return secrets.some(secret => {
    const expected = Buffer.from(
      crypto.createHmac("sha256", secret).update(timestamp + req.rawBody!.toString("utf8")).digest("base64"),
    );
    return expected.length === sig.length && crypto.timingSafeEqual(expected, sig);
  });
}

router.post("/webhook", async (req, res) => {
  if (!verifyKycWebhookSignature(req as Request & { rawBody?: Buffer })) {
    console.error("[KYC-WEBHOOK] rejected: invalid or missing x-webhook-signature", {
      hasSignature: !!req.headers["x-webhook-signature"],
      hasTimestamp: !!req.headers["x-webhook-timestamp"],
      ip: req.ip,
    });
    return void res.status(401).json({ error: "Invalid webhook signature" });
  }
  try {
    const { reference_id, status } = req.body as { reference_id?: string; status?: string };
    if (reference_id && (status === "VALID" || status === "verified" || status === "SUCCESS")) {
      const [kyc] = await db.select().from(kycRecordsTable)
        .where(eq(kycRecordsTable.aadhaarRef, reference_id))
        .limit(1);
      if (kyc && kyc.status !== "verified") {
        // Same atomic transition guard as verify-otp: only the request that
        // actually flips aadhaar_verified false→true may alert the admin.
        const transitioned = (await db.update(kycRecordsTable)
          .set({ aadhaarVerified: true })
          .where(and(
            eq(kycRecordsTable.id, kyc.id),
            eq(kycRecordsTable.aadhaarVerified, false),
          ))
          .returning({ id: kycRecordsTable.id })).length > 0;
        if (kyc.panVerified) {
          await markKycVerified(kyc.id, kyc.registrationId, "webhook");
        } else {
          console.warn("[KYC-WEBHOOK] Aadhaar verified but PAN pending manual review — KYC stays pending", { kycId: kyc.id });
          if (transitioned) {
            void alertAdminKycManualReview({
              registrationId: kyc.registrationId,
              panVerified: false,
              aadhaarVerified: true,
              reason: "Aadhaar verified via Cashfree webhook; PAN could not be auto-verified — approve PAN manually",
            });
          }
        }
      }
    }
  } catch (e) { console.error("[KYC-WEBHOOK]", e); }
  res.json({ success: true });
});

export default router;

/* ── Stage 6: employment verification columns (idempotent migration) ── */
export async function ensureKycEmployment(): Promise<void> {
  await db.execute(sql`ALTER TABLE kyc_records ADD COLUMN IF NOT EXISTS employment_category varchar(40)`);
  await db.execute(sql`ALTER TABLE kyc_records ADD COLUMN IF NOT EXISTS employment_status varchar(32) NOT NULL DEFAULT 'pending'`);
  await db.execute(sql`ALTER TABLE kyc_records ADD COLUMN IF NOT EXISTS employment_verified_at timestamptz`);
  await db.execute(sql`ALTER TABLE kyc_records ADD COLUMN IF NOT EXISTS employment_method varchar(60)`);
  await db.execute(sql`ALTER TABLE kyc_records ADD COLUMN IF NOT EXISTS employment_reference varchar(200)`);
  await db.execute(sql`ALTER TABLE kyc_records ADD COLUMN IF NOT EXISTS employment_failure_reason varchar(500)`);
  console.log("[MIGRATE] kyc_records employment columns ready");
}

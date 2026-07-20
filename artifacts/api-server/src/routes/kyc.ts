import { Router } from "express";
import { db } from "@workspace/db";
import {
  registrationsTable, kycRecordsTable,
  usersTable, notificationLogsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { initiateKyc } from "../lib/cashfree";
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

// POST /api/kyc/initiate
router.post("/initiate", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    profession:     z.enum(PROFESSIONS),
    aadhaarNumber:  z.string().regex(/^\d{12}$/).optional(),
    panNumber:      z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { registrationId, profession, aadhaarNumber, panNumber } = parsed.data;

  const [reg] = await db.select().from(registrationsTable).where(
    and(
      eq(registrationsTable.id, registrationId),
      eq(registrationsTable.userId, req.user!.userId),
    ),
  ).limit(1);

  if (!reg) return void res.status(404).json({ error: "Registration not found" });
  if (reg.phase2Status !== "payment_done") return void res.status(400).json({ error: "Complete Phase 2 payment first" });

  // Initiate Cashfree KYC
  const kycResult = await initiateKyc({
    referenceId: reg.id,
    aadhaarNumber,
    panNumber,
  });

  const [kyc] = await db.insert(kycRecordsTable).values({
    registrationId,
    profession,
    cashfreeKycId: kycResult?.kycId,
    status:        kycResult ? "pending" : "failed",
  }).returning();

  if (!kycResult) return void res.status(500).json({ error: "KYC initiation failed. Please try again." });

  // If KYC is instant (mock/verified immediately)
  if (kycResult.status === "VALID" || kycResult.status === "verified") {
    await db.update(kycRecordsTable).set({ status: "verified", verifiedAt: new Date() })
      .where(eq(kycRecordsTable.id, kyc.id));
    await db.update(registrationsTable).set({ phase2Status: "kyc_done", updatedAt: new Date() })
      .where(eq(registrationsTable.id, registrationId));

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (user) {
      const email = tplKycComplete(user.name, reg.trialCity ?? "TBD");
      Promise.allSettled([
        sendEmail({ to: user.email, toName: user.name, ...email }),
        sendSms(user.phone, `BCPL T20: KYC verified successfully! Trial city: ${reg.trialCity ?? "TBD"}. We will notify you when trial venue is announced. -BCPL T20`),
        sendWhatsApp({ phone: user.phone, templateName: WA.KYC_COMPLETE, bodyValues: [user.name, reg.trialCity ?? "TBD"] }),
        db.insert(notificationLogsTable).values([
          { userId: user.id, type: "email",    template: "kyc_complete" },
          { userId: user.id, type: "sms",      template: "kyc_complete" },
          { userId: user.id, type: "whatsapp", template: "kyc_complete" },
        ]),
      ]);
    }
  }

  res.json({
    success:   true,
    kycId:     kyc.id,
    status:    kyc.status,
    message:   kyc.status === "verified"
      ? "KYC verified! Trial details will be shared soon."
      : "KYC initiated. Verification in progress.",
  });
});

// POST /api/kyc/webhook  — Cashfree KYC webhook
router.post("/webhook", async (req, res) => {
  try {
    const { reference_id, status } = req.body as { reference_id?: string; status?: string };
    if (reference_id && (status === "VALID" || status === "verified")) {
      await db.update(kycRecordsTable).set({ status: "verified", verifiedAt: new Date() })
        .where(eq(kycRecordsTable.cashfreeKycId, reference_id));

      const [kyc] = await db.select().from(kycRecordsTable)
        .where(eq(kycRecordsTable.cashfreeKycId, reference_id)).limit(1);
      if (kyc) {
        await db.update(registrationsTable).set({ phase2Status: "kyc_done", updatedAt: new Date() })
          .where(eq(registrationsTable.id, kyc.registrationId));
      }
    }
  } catch (e) { console.error("[KYC-WEBHOOK]", e); }
  res.json({ success: true });
});

export default router;

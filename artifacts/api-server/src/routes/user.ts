import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, registrationsTable,
  phase1PaymentsTable, phase1VideosTable,
  phase2PaymentsTable, kycRecordsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/user/dashboard  — full registration journey for logged-in user
router.get("/dashboard", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.user!.userId)).limit(1);

  if (!user) return void res.status(404).json({ error: "User not found" });

  const [reg] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.userId, user.id)).limit(1);

  if (!reg) {
    return void res.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email }, registered: false });
  }

  const [p1Pay] = await db.select().from(phase1PaymentsTable)
    .where(eq(phase1PaymentsTable.registrationId, reg.id)).limit(1);

  const [video] = await db.select().from(phase1VideosTable)
    .where(eq(phase1VideosTable.registrationId, reg.id)).limit(1);

  const [p2Pay] = await db.select().from(phase2PaymentsTable)
    .where(eq(phase2PaymentsTable.registrationId, reg.id)).limit(1);

  const [kyc] = await db.select().from(kycRecordsTable)
    .where(eq(kycRecordsTable.registrationId, reg.id)).limit(1);

  const now = new Date();

  res.json({
    user:           { id: user.id, name: user.name, phone: user.phone, email: user.email },
    registered:     true,
    registration:   {
      id:            reg.id,
      regNumber:     reg.regNumber,
      role:          reg.role,
      trialCity:     reg.trialCity,
      phase1Status:  reg.phase1Status,
      phase2Status:  reg.phase2Status,
      videoDeadline: reg.videoDeadline,
      deadlineExpired: reg.videoDeadline ? reg.videoDeadline < now : false,
      createdAt:     reg.createdAt,
    },
    phase1Payment: p1Pay ? { status: p1Pay.status, amount: p1Pay.amount, paidAt: p1Pay.paidAt } : null,
    video:         video ? { submitted: true, submittedAt: video.submittedAt, status: video.status } : null,
    phase2Payment: p2Pay ? { status: p2Pay.status, amount: p2Pay.amount, paidAt: p2Pay.paidAt } : null,
    kyc:           kyc  ? { status: kyc.status, profession: kyc.profession, verifiedAt: kyc.verifiedAt } : null,
  });
});

/**
 * GET /api/user/next-action — getPlayerNextAction(): the single source of
 * truth for status-aware CTAs (header, dashboard, nudges). Returns one enum
 * action computed from REAL backend state; the client only maps it to a
 * label + path. CTAs must never be derived from frontend-cached state.
 */
router.get("/next-action", requireAuth, async (req: AuthRequest, res) => {
  const [reg] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);

  if (!reg) return void res.json({ action: "REGISTER" });

  const p1 = reg.phase1Status ?? "pending";
  const p2 = reg.phase2Status ?? "";

  /* Canonical statuses (see video.ts / kyc.ts / trials.ts):
     phase1: pending → payment_done → video_submitted → selected | rejected
     phase2: (null|pending) → payment_done → kyc_done → selected | rejected
     kyc_records.status: pending | verified | failed                       */
  let action = "MY_BCPL";
  if (p1 === "pending") {
    action = "COMPLETE_PAYMENT";
  } else if (p1 === "payment_done") {
    /* Status flips to video_submitted only after upload persists — but check
       the video row too so a mid-transition state never hides the CTA. */
    const [video] = await db.select().from(phase1VideosTable)
      .where(eq(phase1VideosTable.registrationId, reg.id)).limit(1);
    action = video ? "WAIT_FOR_RESULT" : "UPLOAD_VIDEO";
  } else if (p1 === "video_submitted") {
    action = "WAIT_FOR_RESULT";
  } else if (p1 === "rejected") {
    action = "VIEW_RESULT";
  } else if (p1 === "selected") {
    if (!p2 || p2 === "pending") {
      action = "CONTINUE_PHASE2";
    } else if (p2 === "payment_done") {
      const [kyc] = await db.select().from(kycRecordsTable)
        .where(eq(kycRecordsTable.registrationId, reg.id)).limit(1);
      /* No KYC yet (or failed → resubmit) = complete it; pending/verified
         (awaiting phase2Status sync) = nothing actionable, show MY BCPL. */
      action = !kyc || kyc.status === "failed" ? "COMPLETE_KYC" : "MY_BCPL";
    } else if (p2 === "kyc_done") {
      action = "VIEW_TRIAL";
    }
    /* phase2 selected / rejected → MY_BCPL (profile shows the outcome) */
  }

  res.json({ action, phase1Status: p1, phase2Status: p2 || null });
});

// GET /api/user/trial-venue — announced venue for player's trial city
router.get("/trial-venue", requireAuth, async (req: AuthRequest, res) => {
  const { trialVenuesTable } = await import("@workspace/db/schema");
  const { and, isNotNull } = await import("drizzle-orm");

  const [reg] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);

  if (!reg) return void res.json({ found: false });

  const [venue] = await db.select().from(trialVenuesTable)
    .where(
      and(
        eq(trialVenuesTable.city, reg.trialCity ?? ""),
        isNotNull(trialVenuesTable.announcedAt),
      )
    )
    .orderBy(trialVenuesTable.announcedAt)
    .limit(1);

  if (!venue) return void res.json({ found: false });

  res.json({
    found: true,
    venue: {
      id:            venue.id,
      city:          venue.city,
      venue:         venue.venue,
      trialDate:     venue.trialDate,
      trialTime:     venue.trialTime,
      reportingTime: venue.reportingTime,
      slots:         venue.slots,
      notes:         venue.notes,
      status:        venue.status,
      announcedAt:   venue.announcedAt,
    },
  });
});

export default router;

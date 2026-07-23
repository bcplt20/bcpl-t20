import { Router } from "express";
import { db } from "@workspace/db";
import {
  registrationsTable, phase1VideosTable, phase1EvaluationsTable,
  usersTable, notificationLogsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { getUploadPresignedUrl, getS3Url, headS3Object, deleteObject } from "../lib/s3";
import { getPhase1Config, getPhase1Instructions, type Phase1Instructions } from "../lib/phase1Config";
import { sendEmail, tplVideoSubmitted, tplVideoReminder } from "../lib/email";
import { sendSms } from "../lib/sms";
import { sendWhatsApp, WA } from "../lib/whatsapp";
import { logger } from "../lib/logger";
import { z } from "zod";

const router = Router();

const ALLOWED_CONTENT_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"] as const;

type RoleKey = keyof Phase1Instructions;

/** registrations.role has two historic formats ("bat" and "Batsman") — normalise on read. */
function normalizeRole(role: string | null | undefined): RoleKey {
  const r = (role ?? "").toLowerCase();
  if (r === "bowl" || r.startsWith("bowler")) return "bowl";
  if (r === "ar" || r.startsWith("all")) return "ar";
  if (r === "wk" || r.startsWith("wicket") || r.startsWith("keep")) return "wk";
  return "bat";
}

async function loadOwnedRegistration(userId: string, registrationId: string) {
  const [reg] = await db.select().from(registrationsTable).where(
    and(
      eq(registrationsTable.id, registrationId),
      eq(registrationsTable.userId, userId),
    ),
  ).limit(1);
  return reg;
}

/** pg error codes hide inside DrizzleQueryError's .cause chain. */
function isUniqueViolation(e: unknown): boolean {
  let cur = e as { code?: string; cause?: unknown } | undefined;
  while (cur) {
    if (cur.code === "23505") return true;
    cur = cur.cause as { code?: string; cause?: unknown } | undefined;
  }
  return false;
}

// POST /api/video/upload-url  — get S3 presigned URL to upload directly from browser
router.post("/upload-url", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    contentType:    z.enum(ALLOWED_CONTENT_TYPES),
    sizeBytes:      z.number().int().positive().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { registrationId, contentType, sizeBytes } = parsed.data;
  const cfg = await getPhase1Config();

  const reg = await loadOwnedRegistration(req.user!.userId, registrationId);
  if (!reg) return void res.status(404).json({ error: "Registration not found" });

  if (reg.phase1Status !== "payment_done" && reg.phase1Status !== "video_submitted") {
    return void res.status(400).json({ error: "Complete Phase 1 payment first" });
  }
  if (reg.videoDeadline && reg.videoDeadline < new Date()) {
    return void res.status(400).json({ error: "Video upload deadline has passed" });
  }

  // Advisory check for fast UX feedback — /confirm re-checks atomically.
  const maxAttempts = 1 + cfg.maxReuploads;
  const attempts = await db.select({ id: phase1VideosTable.id }).from(phase1VideosTable)
    .where(eq(phase1VideosTable.registrationId, registrationId));
  if (attempts.length >= maxAttempts) {
    return void res.status(400).json({ error: "Re-upload limit reached", code: "REUPLOAD_LIMIT" });
  }

  if (sizeBytes && sizeBytes > cfg.maxVideoFileSizeMb * 1024 * 1024) {
    return void res.status(400).json({ error: "File too large. Max " + cfg.maxVideoFileSizeMb + " MB." });
  }

  const ext = contentType === "video/quicktime" ? "mov" : contentType.split("/")[1];
  const s3Key = "videos/" + req.user!.userId + "/" + registrationId + "/" + Date.now() + "." + ext;

  const presignedUrl = await getUploadPresignedUrl(s3Key, contentType);

  res.json({ success: true, presignedUrl, s3Key, maxSizeMb: cfg.maxVideoFileSizeMb });
});

// POST /api/video/confirm  — after upload succeeds, verify object + save the record
router.post("/confirm", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId:      z.string().uuid(),
    s3Key:               z.string().min(5).max(500),
    declarationAccepted: z.boolean().optional(),
    durationSeconds:     z.number().int().min(1).max(900).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { registrationId, s3Key, declarationAccepted, durationSeconds } = parsed.data;
  const cfg = await getPhase1Config();
  const maxAttempts = 1 + cfg.maxReuploads;

  if (declarationAccepted !== true) {
    return void res.status(400).json({
      error: "Please accept the declaration that this is your own unedited video.",
      code: "DECLARATION_REQUIRED",
    });
  }

  // Cheap pre-checks before any S3 round-trip. All of them are re-checked
  // under the row lock inside the transaction below.
  const reg = await loadOwnedRegistration(req.user!.userId, registrationId);
  if (!reg) return void res.status(404).json({ error: "Registration not found" });

  if (reg.phase1Status !== "payment_done" && reg.phase1Status !== "video_submitted") {
    return void res.status(400).json({ error: "Complete Phase 1 payment first" });
  }
  if (reg.videoDeadline && reg.videoDeadline < new Date()) {
    return void res.status(400).json({ error: "Video upload deadline has passed" });
  }

  // The key must be one WE issued for this exact user + registration.
  const expectedPrefix = "videos/" + req.user!.userId + "/" + registrationId + "/";
  if (!s3Key.startsWith(expectedPrefix)) {
    return void res.status(400).json({ error: "Invalid upload key" });
  }

  // Never trust the client: verify the object actually landed in S3 and
  // capture size/type/etag from storage itself. (Network I/O stays outside
  // the transaction.)
  const head = await headS3Object(s3Key);
  if (!head.exists) {
    return void res.status(400).json({ error: "Upload not found in storage. Please try uploading again." });
  }
  if (head.sizeBytes > cfg.maxVideoFileSizeMb * 1024 * 1024) {
    deleteObject(s3Key).catch(() => {});
    return void res.status(400).json({ error: "File too large. Max " + cfg.maxVideoFileSizeMb + " MB." });
  }
  if (head.contentType && !(ALLOWED_CONTENT_TYPES as readonly string[]).includes(head.contentType)) {
    deleteObject(s3Key).catch(() => {});
    return void res.status(400).json({ error: "Invalid video format." });
  }

  // Fast-fail on client-measured duration (server re-validates with ffprobe
  // during the evaluation pipeline — this is UX, not the source of truth).
  if (durationSeconds && (durationSeconds < cfg.videoMinSeconds - 2 || durationSeconds > cfg.videoMaxSeconds + 2)) {
    deleteObject(s3Key).catch(() => {});
    return void res.status(400).json({
      error: "Video must be " + cfg.videoMinSeconds + "-" + cfg.videoMaxSeconds + " seconds long.",
      code: "DURATION_OUT_OF_RANGE",
    });
  }

  const s3Url = getS3Url(s3Key);

  // Atomic section: lock the registration row, then count → supersede →
  // insert → status flip. Concurrent confirms serialise on the lock, so the
  // attempt cap and single-active-submission invariants hold. Unique indexes
  // (registration_id, attempt_number) and (registration_id WHERE submitted)
  // are DB-level backstops.
  type TxFail = { fail: "gone" | "status" | "deadline" | "limit" };
  type TxOk = { attemptNumber: number };
  let outcome: TxFail | TxOk;
  try {
    outcome = await db.transaction(async (tx): Promise<TxFail | TxOk> => {
      const [locked] = await tx.select({
        id: registrationsTable.id,
        phase1Status: registrationsTable.phase1Status,
        videoDeadline: registrationsTable.videoDeadline,
      }).from(registrationsTable)
        .where(and(
          eq(registrationsTable.id, registrationId),
          eq(registrationsTable.userId, req.user!.userId),
        ))
        .for("update")
        .limit(1);
      if (!locked) return { fail: "gone" };
      if (locked.phase1Status !== "payment_done" && locked.phase1Status !== "video_submitted") return { fail: "status" };
      if (locked.videoDeadline && locked.videoDeadline < new Date()) return { fail: "deadline" };

      const rows = await tx.select({ id: phase1VideosTable.id }).from(phase1VideosTable)
        .where(eq(phase1VideosTable.registrationId, registrationId));
      const attemptsUsed = rows.length;
      if (attemptsUsed >= maxAttempts) return { fail: "limit" };

      // A re-upload replaces the earlier submission.
      if (attemptsUsed > 0) {
        await tx.update(phase1VideosTable)
          .set({ status: "superseded" })
          .where(and(
            eq(phase1VideosTable.registrationId, registrationId),
            eq(phase1VideosTable.status, "submitted"),
          ));
      }

      await tx.insert(phase1VideosTable).values({
        registrationId,
        s3Key,
        s3Url,
        status: "submitted",
        mimeType: head.contentType,
        sizeBytes: head.sizeBytes || null,
        etag: head.etag,
        declarationAccepted: true,
        attemptNumber: attemptsUsed + 1,
        durationSeconds: durationSeconds ?? null,
      });
      await tx.update(registrationsTable)
        .set({ phase1Status: "video_submitted", updatedAt: new Date() })
        .where(eq(registrationsTable.id, registrationId));

      return { attemptNumber: attemptsUsed + 1 };
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      // Backstop indexes fired — another confirm won the race.
      deleteObject(s3Key).catch(() => {});
      return void res.status(409).json({ error: "Another upload was just processed. Please refresh and check your status." });
    }
    throw e;
  }

  if ("fail" in outcome) {
    // Object can't be accepted — don't leave it orphaned in the bucket.
    deleteObject(s3Key).catch(() => {});
    if (outcome.fail === "gone")     return void res.status(404).json({ error: "Registration not found" });
    if (outcome.fail === "status")   return void res.status(400).json({ error: "Complete Phase 1 payment first" });
    if (outcome.fail === "deadline") return void res.status(400).json({ error: "Video upload deadline has passed" });
    return void res.status(400).json({ error: "Re-upload limit reached", code: "REUPLOAD_LIMIT" });
  }

  const attemptNumber = outcome.attemptNumber;

  // Notifications only on the FIRST submission — the transaction guarantees
  // exactly one request ever sees attemptNumber === 1.
  if (attemptNumber === 1) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (user) {
      const email = tplVideoSubmitted(user.name);
      Promise.allSettled([
        sendEmail({ to: user.email, toName: user.name, ...email }),
        sendSms(user.phone, "BCPL T20: Your trial video has been received! Our scouts will review it and share your result soon. Stay tuned! -BCPL T20"),
        sendWhatsApp({ phone: user.phone, templateName: WA.VIDEO_SUBMITTED, bodyValues: [user.name] }),
        db.insert(notificationLogsTable).values([
          { userId: user.id, type: "email",    template: "video_submitted", dedupeKey: "p1_video_submitted_email_" + registrationId },
          { userId: user.id, type: "sms",      template: "video_submitted", dedupeKey: "p1_video_submitted_sms_" + registrationId },
          { userId: user.id, type: "whatsapp", template: "video_submitted", dedupeKey: "p1_video_submitted_wa_" + registrationId },
        ]).onConflictDoNothing(),
      ]);
    }
  }

  res.json({
    success: true,
    message: attemptNumber === 1 ? "Video submitted successfully!" : "New video received — it replaces your earlier upload.",
    attemptsUsed: attemptNumber,
    maxAttempts,
    reuploadsLeft: Math.max(0, maxAttempts - attemptNumber),
  });
});

// GET /api/video/instructions  — role-specific filming instructions + upload constraints
router.get("/instructions", requireAuth, async (req: AuthRequest, res) => {
  const [cfg, instructions] = await Promise.all([getPhase1Config(), getPhase1Instructions()]);

  const [reg] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);

  const roleKey = reg ? normalizeRole(reg.role) : null;

  res.json({
    role: reg?.role ?? null,
    roleKey,
    instructions: roleKey ? instructions[roleKey] : null,
    constraints: {
      videoMinSeconds:    cfg.videoMinSeconds,
      videoMaxSeconds:    cfg.videoMaxSeconds,
      maxVideoFileSizeMb: cfg.maxVideoFileSizeMb,
      maxReuploads:       cfg.maxReuploads,
      maxAttempts:        1 + cfg.maxReuploads,
      allowedFormats:     ALLOWED_CONTENT_TYPES,
    },
  });
});

// GET /api/video/status
router.get("/status", requireAuth, async (req: AuthRequest, res) => {
  const [reg] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);

  if (!reg) return void res.json({ registered: false });

  const cfg = await getPhase1Config();
  const maxAttempts = 1 + cfg.maxReuploads;
  const videos = await db.select().from(phase1VideosTable)
    .where(eq(phase1VideosTable.registrationId, reg.id));
  const attemptsUsed = videos.length;
  const latest = videos.sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0))[0];
  const deadlineExpired = reg.videoDeadline ? reg.videoDeadline < new Date() : false;

  // Surface a validation failure on the latest attempt so the upload page
  // can prompt for a re-upload with the specific reason.
  let reuploadReason: string | null = null;
  if (latest && latest.status === "validation_failed") {
    const [ev] = await db.select({ reasonCode: phase1EvaluationsTable.reasonCode })
      .from(phase1EvaluationsTable)
      .where(and(
        eq(phase1EvaluationsTable.registrationId, reg.id),
        eq(phase1EvaluationsTable.attemptNumber, latest.attemptNumber),
      )).limit(1);
    reuploadReason = ev?.reasonCode ?? "REUPLOAD_REQUIRED";
  }

  res.json({
    registered:      true,
    phase1Status:    reg.phase1Status,
    videoDeadline:   reg.videoDeadline,
    deadlineExpired,
    videoSubmitted:  attemptsUsed > 0,
    submittedAt:     latest?.submittedAt ?? null,
    attemptsUsed,
    maxAttempts,
    canReupload:     reg.phase1Status === "video_submitted" && attemptsUsed > 0 && attemptsUsed < maxAttempts && !deadlineExpired,
    latestVideoStatus: latest?.status ?? null,
    reuploadReason,
  });
});

// ── Internal: send reminder emails (called by scheduler) ───────────────────

export async function sendVideoReminders() {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const registrations = await db.select({ reg: registrationsTable, user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(eq(registrationsTable.phase1Status, "payment_done"));

  for (const { reg, user } of registrations) {
    if (!reg.videoDeadline) continue;
    const msLeft = reg.videoDeadline.getTime() - now.getTime();
    if (msLeft <= 0) continue;
    const daysLeft = Math.ceil(msLeft / dayMs);

    // 7-day window: mid-window nudge (4 days left ≈ day 3) and urgent nudge (1 day left ≈ day 6)
    const isMid = daysLeft === 4;
    const isUrgent = daysLeft === 1;
    if (!isMid && !isUrgent) continue;

    // Reserve-first dedupe: the partial unique index on dedupe_key is the
    // authority. Only the tick that WINS the insert sends anything, so
    // overlapping scheduler runs can never double-send.
    const dedupeKey = "p1_video_reminder_" + reg.id + "_d" + daysLeft;
    const reserved = await db.insert(notificationLogsTable)
      .values({ userId: user.id, type: "email", template: "video_reminder_d" + daysLeft, dedupeKey })
      .onConflictDoNothing()
      .returning({ id: notificationLogsTable.id });
    if (!reserved.length) continue;

    const email = tplVideoReminder(user.name, daysLeft);
    const smsText = isMid
      ? "BCPL T20: Only " + daysLeft + " days left to upload your trial video! Login at bcplt20.com to upload. -BCPL T20"
      : "BCPL T20 URGENT: Only 1 day left! Upload your trial video NOW before your window closes. bcplt20.com -BCPL T20";
    await Promise.allSettled([
      sendEmail({ to: user.email, toName: user.name, ...email }),
      sendSms(user.phone, smsText),
      sendWhatsApp({ phone: user.phone, templateName: WA.VIDEO_REMINDER, bodyValues: [user.name, daysLeft.toString()] }),
    ]);
    logger.info({ registrationId: reg.id, daysLeft }, "phase1 video reminder sent");
  }
}

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import {
  registrationsTable, phase1VideosTable,
  usersTable, notificationLogsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { getUploadPresignedUrl, getS3Url } from "../lib/s3";
import { sendEmail, tplVideoSubmitted, tplVideoReminder } from "../lib/email";
import { sendSms } from "../lib/sms";
import { sendWhatsApp, WA } from "../lib/whatsapp";
import { z } from "zod";

const router = Router();

// POST /api/video/upload-url  — get S3 presigned URL to upload directly from browser
router.post("/upload-url", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    contentType:    z.enum(["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { registrationId, contentType } = parsed.data;

  const [reg] = await db.select().from(registrationsTable).where(
    and(
      eq(registrationsTable.id, registrationId),
      eq(registrationsTable.userId, req.user!.userId),
    ),
  ).limit(1);

  if (!reg) return void res.status(404).json({ error: "Registration not found" });
  if (reg.phase1Status !== "payment_done") return void res.status(400).json({ error: "Complete Phase 1 payment first" });

  if (reg.videoDeadline && reg.videoDeadline < new Date()) {
    return void res.status(400).json({ error: "Video upload deadline has passed" });
  }

  const ext = contentType === "video/quicktime" ? "mov" : contentType.split("/")[1];
  const s3Key = `videos/${req.user!.userId}/${registrationId}/${Date.now()}.${ext}`;

  const presignedUrl = await getUploadPresignedUrl(s3Key, contentType);

  res.json({ success: true, presignedUrl, s3Key });
});

// POST /api/video/confirm  — after upload succeeds, save the record
router.post("/confirm", requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({
    registrationId: z.string().uuid(),
    s3Key:          z.string().min(5),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { registrationId, s3Key } = parsed.data;

  const [reg] = await db.select().from(registrationsTable).where(
    and(
      eq(registrationsTable.id, registrationId),
      eq(registrationsTable.userId, req.user!.userId),
    ),
  ).limit(1);

  if (!reg) return void res.status(404).json({ error: "Registration not found" });

  const s3Url = getS3Url(s3Key);

  await db.insert(phase1VideosTable).values({ registrationId, s3Key, s3Url, status: "submitted" });
  await db.update(registrationsTable).set({ phase1Status: "video_submitted", updatedAt: new Date() })
    .where(eq(registrationsTable.id, registrationId));

  // Get user for notifications
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (user) {
    const email = tplVideoSubmitted(user.name);
    Promise.allSettled([
      sendEmail({ to: user.email, toName: user.name, ...email }),
      sendSms(user.phone, `BCPL T20: Your trial video has been received! Our scouts will review it within 7 working days. Stay tuned! -BCPL T20`),
      sendWhatsApp({ phone: user.phone, templateName: WA.VIDEO_SUBMITTED, bodyValues: [user.name] }),
      db.insert(notificationLogsTable).values([
        { userId: user.id, type: "email",    template: "video_submitted" },
        { userId: user.id, type: "sms",      template: "video_submitted" },
        { userId: user.id, type: "whatsapp", template: "video_submitted" },
      ]),
    ]);
  }

  res.json({ success: true, message: "Video submitted successfully! Result in 7 working days." });
});

// GET /api/video/status
router.get("/status", requireAuth, async (req: AuthRequest, res) => {
  const [reg] = await db.select().from(registrationsTable)
    .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);

  if (!reg) return void res.json({ registered: false });

  const [video] = await db.select().from(phase1VideosTable)
    .where(eq(phase1VideosTable.registrationId, reg.id)).limit(1);

  res.json({
    registered:     true,
    phase1Status:   reg.phase1Status,
    videoDeadline:  reg.videoDeadline,
    deadlineExpired: reg.videoDeadline ? reg.videoDeadline < new Date() : false,
    videoSubmitted: !!video,
    submittedAt:    video?.submittedAt,
  });
});

// ── Internal: send reminder emails (called by scheduler) ───────────────────

export async function sendVideoReminders() {
  const now = new Date();

  // Reminders: users who paid but haven't uploaded, deadline in 4 days (3-day reminder)
  // and 1 day (6-day reminder)
  const dayMs = 24 * 60 * 60 * 1000;

  const registrations = await db.select({ reg: registrationsTable, user: usersTable })
    .from(registrationsTable)
    .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(eq(registrationsTable.phase1Status, "payment_done"));

  for (const { reg, user } of registrations) {
    if (!reg.videoDeadline) continue;
    const msLeft = reg.videoDeadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / dayMs);

    // Send reminder at 4 days left (day 3) and 1 day left (day 6)
    if (daysLeft === 4 || daysLeft === 1) {
      const email = tplVideoReminder(user.name, daysLeft);
      await Promise.allSettled([
        sendEmail({ to: user.email, toName: user.name, ...email }),
        sendSms(user.phone, `BCPL T20 Reminder: ${daysLeft} day${daysLeft > 1 ? "s" : ""} left to upload your trial video! Upload now to avoid losing your registration. -BCPL T20`),
        sendWhatsApp({ phone: user.phone, templateName: WA.VIDEO_REMINDER, bodyValues: [user.name, daysLeft.toString()] }),
        db.insert(notificationLogsTable).values({ userId: user.id, type: "email", template: `video_reminder_d${daysLeft}` }),
      ]);
      console.log(`[REMINDER] Sent ${daysLeft}-day reminder to ${user.phone}`);
    }
  }
}

export default router;

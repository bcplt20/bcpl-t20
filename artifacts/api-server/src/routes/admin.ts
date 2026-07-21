/**
 * BCPL Admin Routes
 * All routes under /api/admin/
 *
 * Auth: POST /session issues a JWT via ADMIN_PANEL_PASSWORD
 *       All other routes require that JWT (x-bcpl-admin-token header)
 *       or the legacy x-bcpl-admin header.
 */

import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import {
  registrationsTable,
  usersTable,
  phase1VideosTable,
  kycRecordsTable,
  phase1PaymentsTable,
} from "@workspace/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";

const router = Router();

/* ─── POST /api/admin/session ─────────────────────────────────────
   Validate admin panel password → issue 8-hour JWT.
   Frontend stores token as x-bcpl-admin-token header on all requests.
──────────────────────────────────────────────────────────────────── */
router.post("/session", async (req, res) => {
  const { password } = req.body as { password?: string };
  const panelPassword = process.env.ADMIN_PANEL_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret";

  if (!panelPassword) {
    // Dev mode with no password configured — allow
    if (process.env.NODE_ENV !== "production") {
      const token = jwt.sign({ admin: true }, sessionSecret, { expiresIn: "8h" });
      res.json({ success: true, token });
      return;
    }
    res.status(403).json({ error: "Admin panel not configured" });
    return;
  }

  if (!password || password !== panelPassword) {
    res.status(401).json({ error: "Invalid admin password" });
    return;
  }

  const token = jwt.sign({ admin: true }, sessionSecret, { expiresIn: "8h" });
  res.json({ success: true, token });
});

/* ─── All routes below require admin auth ─────────────────────── */
router.use(requireAdmin);

/* ─── GET /api/admin/stats ─────────────────────────────────────── */
router.get("/stats", async (_req, res) => {
  try {
    const [[totalRegs], [selected], [rejected], [videoSubmitted], [paymentDone]] =
      await Promise.all([
        db.select({ c: count() }).from(registrationsTable),
        db.select({ c: count() }).from(registrationsTable).where(eq(registrationsTable.phase1Status, "selected")),
        db.select({ c: count() }).from(registrationsTable).where(eq(registrationsTable.phase1Status, "rejected")),
        db.select({ c: count() }).from(registrationsTable).where(eq(registrationsTable.phase1Status, "video_submitted")),
        db.select({ c: count() }).from(registrationsTable).where(eq(registrationsTable.phase1Status, "payment_done")),
      ]);

    const [[totalVideos], [pendingVideos], [reviewedVideos]] =
      await Promise.all([
        db.select({ c: count() }).from(phase1VideosTable),
        db.select({ c: count() }).from(phase1VideosTable).where(eq(phase1VideosTable.status, "submitted")),
        db.select({ c: count() }).from(phase1VideosTable).where(eq(phase1VideosTable.status, "reviewed")),
      ]);

    const [[totalKyc], [pendingKyc], [verifiedKyc], [failedKyc]] =
      await Promise.all([
        db.select({ c: count() }).from(kycRecordsTable),
        db.select({ c: count() }).from(kycRecordsTable).where(eq(kycRecordsTable.status, "pending")),
        db.select({ c: count() }).from(kycRecordsTable).where(eq(kycRecordsTable.status, "verified")),
        db.select({ c: count() }).from(kycRecordsTable).where(eq(kycRecordsTable.status, "failed")),
      ]);

    const [[totalUsers]] = await Promise.all([
      db.select({ c: count() }).from(usersTable),
    ]);

    res.json({
      registrations: {
        total:         Number(totalRegs.c),
        paymentDone:   Number(paymentDone.c),
        videoSubmitted:Number(videoSubmitted.c),
        selected:      Number(selected.c),
        rejected:      Number(rejected.c),
      },
      videos: {
        total:    Number(totalVideos.c),
        pending:  Number(pendingVideos.c),
        reviewed: Number(reviewedVideos.c),
      },
      kyc: {
        total:    Number(totalKyc.c),
        pending:  Number(pendingKyc.c),
        verified: Number(verifiedKyc.c),
        failed:   Number(failedKyc.c),
      },
      users: {
        total: Number(totalUsers.c),
      },
    });
  } catch (err: any) {
    console.error("[admin/stats]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET /api/admin/registrations ─────────────────────────────── */
router.get("/registrations", async (req, res) => {
  try {
    const { phase1Status, role, trialCity } = req.query as Record<string, string>;

    const rows = await db
      .select({ reg: registrationsTable, user: usersTable })
      .from(registrationsTable)
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .orderBy(desc(registrationsTable.createdAt));

    // JS-side filters (simple; low row counts expected in early phases)
    let filtered = rows;
    if (phase1Status) filtered = filtered.filter(r => r.reg.phase1Status === phase1Status);
    if (role) filtered = filtered.filter(r => r.reg.role === role);
    if (trialCity) filtered = filtered.filter(r =>
      r.reg.trialCity?.toLowerCase().includes(trialCity.toLowerCase())
    );

    // Fetch payments + videos in one sweep
    const [allPayments, allVideos] = await Promise.all([
      db.select().from(phase1PaymentsTable),
      db.select().from(phase1VideosTable),
    ]);
    const payMap = new Map(allPayments.map(p => [p.registrationId, p]));
    const vidMap = new Map(allVideos.map(v => [v.registrationId, v]));

    const registrations = filtered.map(r => ({
      id:           r.reg.id,
      userId:       r.reg.userId,
      role:         r.reg.role,
      trialCity:    r.reg.trialCity,
      phase1Status: r.reg.phase1Status,
      phase2Status: r.reg.phase2Status,
      videoDeadline:r.reg.videoDeadline,
      createdAt:    r.reg.createdAt,
      user: r.user ? { id: r.user.id, name: r.user.name, phone: r.user.phone, email: r.user.email } : null,
      payment: payMap.get(r.reg.id) ?? null,
      video:   vidMap.get(r.reg.id) ?? null,
    }));

    res.json({ registrations, total: registrations.length });
  } catch (err: any) {
    console.error("[admin/registrations]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─── PUT /api/admin/registrations/:id/phase1-status ───────────── */
router.put("/registrations/:id/phase1-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    const valid = ["pending", "payment_done", "video_submitted", "selected", "rejected"];
    if (!status || !valid.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${valid.join(", ")}` });
      return;
    }
    const [updated] = await db
      .update(registrationsTable)
      .set({ phase1Status: status, updatedAt: new Date() })
      .where(eq(registrationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Registration not found" }); return; }
    res.json({ success: true, registration: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── PUT /api/admin/registrations/:id/phase2-status ───────────── */
router.put("/registrations/:id/phase2-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    const valid = ["pending", "payment_done", "kyc_done", "selected", "rejected"];
    if (!status || !valid.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${valid.join(", ")}` });
      return;
    }
    const [updated] = await db
      .update(registrationsTable)
      .set({ phase2Status: status, updatedAt: new Date() })
      .where(eq(registrationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Registration not found" }); return; }
    res.json({ success: true, registration: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET /api/admin/videos ─────────────────────────────────────── */
router.get("/videos", async (req, res) => {
  try {
    const { status } = req.query as Record<string, string>;

    const rows = await db
      .select({ video: phase1VideosTable, reg: registrationsTable, user: usersTable })
      .from(phase1VideosTable)
      .leftJoin(registrationsTable, eq(phase1VideosTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .orderBy(desc(phase1VideosTable.submittedAt));

    let filtered = rows;
    if (status) filtered = filtered.filter(r => r.video.status === status);

    const videos = filtered.map(r => ({
      id:              r.video.id,
      registrationId:  r.video.registrationId,
      s3Key:           r.video.s3Key,
      s3Url:           r.video.s3Url,
      durationSeconds: r.video.durationSeconds,
      submittedAt:     r.video.submittedAt,
      status:          r.video.status,
      player:          r.user?.name ?? "Unknown",
      phone:           r.user?.phone ?? "",
      role:            r.reg?.role ?? "",
      trialCity:       r.reg?.trialCity ?? "",
    }));

    res.json({ videos, total: videos.length });
  } catch (err: any) {
    console.error("[admin/videos]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─── PUT /api/admin/videos/:id/review ──────────────────────────── */
router.put("/videos/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    const valid = ["submitted", "reviewed"];
    if (status && !valid.includes(status)) {
      res.status(400).json({ error: "status must be submitted or reviewed" });
      return;
    }
    const [updated] = await db
      .update(phase1VideosTable)
      .set({ status: status ?? "reviewed" })
      .where(eq(phase1VideosTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Video not found" }); return; }
    res.json({ success: true, video: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET /api/admin/kyc ────────────────────────────────────────── */
router.get("/kyc", async (req, res) => {
  try {
    const { status } = req.query as Record<string, string>;

    const rows = await db
      .select({ kyc: kycRecordsTable, reg: registrationsTable, user: usersTable })
      .from(kycRecordsTable)
      .leftJoin(registrationsTable, eq(kycRecordsTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .orderBy(desc(kycRecordsTable.createdAt));

    let filtered = rows;
    if (status) filtered = filtered.filter(r => r.kyc.status === status);

    const kyc = filtered.map(r => ({
      id:             r.kyc.id,
      registrationId: r.kyc.registrationId,
      profession:     r.kyc.profession,
      aadhaarRef:     r.kyc.aadhaarRef,
      panRef:         r.kyc.panRef,
      cashfreeKycId:  r.kyc.cashfreeKycId,
      status:         r.kyc.status,
      verifiedAt:     r.kyc.verifiedAt,
      createdAt:      r.kyc.createdAt,
      player:         r.user?.name ?? "Unknown",
      phone:          r.user?.phone ?? "",
      email:          r.user?.email ?? "",
      role:           r.reg?.role ?? "",
      trialCity:      r.reg?.trialCity ?? "",
      phase2Status:   r.reg?.phase2Status ?? null,
    }));

    res.json({ kyc, total: kyc.length });
  } catch (err: any) {
    console.error("[admin/kyc]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─── PUT /api/admin/kyc/:id/status ────────────────────────────── */
router.put("/kyc/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    const valid = ["pending", "verified", "failed"];
    if (!status || !valid.includes(status)) {
      res.status(400).json({ error: "status must be pending, verified, or failed" });
      return;
    }
    const [updated] = await db
      .update(kycRecordsTable)
      .set({ status, verifiedAt: status === "verified" ? new Date() : null })
      .where(eq(kycRecordsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "KYC record not found" }); return; }
    res.json({ success: true, kyc: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

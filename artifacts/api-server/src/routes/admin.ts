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
  phase1ScoresTable,
  kycRecordsTable,
  phase1PaymentsTable,
  phase2PaymentsTable,
  trialVenuesTable,
  playerProfilesTable,
  notificationLogsTable,
  phase1EvaluationsTable,
  aiEvaluationPassesTable,
  rankingSnapshotsTable,
} from "@workspace/db/schema";
import { eq, desc, count, and, inArray, lt, gte, isNotNull, sql } from "drizzle-orm";
import { sendVideoReminders } from "./video";
import { sendPaymentReminders, remindersEnabled } from "../lib/reminders";
import { requireAdmin } from "../middlewares/adminAuth";
import { markKycVerified } from "./kyc";
import { sendEmail, adminAlertRecipient, tplPhase1ResultReady, tplTrialVenueAnnounced, tplInvoice, tplAdminLoginLockdown } from "../lib/email";
import { sendSms, adminAlertPhone } from "../lib/sms";
import { logNotifications } from "../lib/notify";
import { gstFromGross } from "../lib/gst";
import { z } from "zod";

const router = Router();

/* ─── POST /api/admin/session ─────────────────────────────────────
   Validate admin panel password → issue a 24-hour JWT.
   Frontend stores token as x-bcpl-admin-token header on all requests.
   Sliding session: requireAdmin re-issues a fresh token (response
   header x-bcpl-admin-token-renewed) once half the life has passed,
   so an ACTIVE admin is never logged out; ~24h of inactivity ends
   the session.
──────────────────────────────────────────────────────────────────── */
export const ADMIN_TOKEN_TTL = "24h";

// Basic in-memory rate limit for wrong-password attempts (per IP).
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 5;
const loginFails = new Map<string, { fails: number; resetAt: number }>();

// Global circuit breaker: too many failures across ALL IPs (botnet / IP
// rotation) → brief lockout for everyone + admin alert in the logs.
const GLOBAL_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const GLOBAL_LOGIN_MAX_FAILS = 50;
const globalLoginFails = { fails: 0, resetAt: 0, tripped: false };

/** Test-only: reset both the per-IP and global login failure counters. */
export function __resetAdminLoginRateLimit() {
  loginFails.clear();
  globalLoginFails.fails = 0;
  globalLoginFails.resetAt = 0;
  globalLoginFails.tripped = false;
}

function loginClientIp(req: { headers: Record<string, unknown>; ip?: string }): string {
  // Behind nginx the LAST x-forwarded-for entry is the proxy-appended real
  // client IP; earlier entries can be spoofed by the client.
  const xff = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xff) ? xff[xff.length - 1] : xff;
  if (typeof raw === "string" && raw.trim()) {
    const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.ip ?? "unknown";
}

router.post("/session", async (req, res) => {
  const { password } = req.body as { password?: string };
  const panelPassword = process.env.ADMIN_PANEL_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret";

  const ip = loginClientIp(req);
  const now = Date.now();
  if (loginFails.size > 1000) {
    for (const [k, v] of loginFails) if (v.resetAt <= now) loginFails.delete(k);
  }
  // Global circuit breaker check (before per-IP so rotating IPs can't evade it)
  if (globalLoginFails.resetAt <= now) {
    globalLoginFails.fails = 0;
    globalLoginFails.resetAt = 0;
    globalLoginFails.tripped = false;
  }
  if (globalLoginFails.fails >= GLOBAL_LOGIN_MAX_FAILS) {
    const mins = Math.max(1, Math.ceil((globalLoginFails.resetAt - now) / 60000));
    res.status(429).json({ error: "Admin login is temporarily locked due to unusual activity. Try again in " + mins + " minute" + (mins === 1 ? "" : "s") + "." });
    return;
  }

  const entry = loginFails.get(ip);
  if (entry && entry.resetAt > now && entry.fails >= LOGIN_MAX_FAILS) {
    const mins = Math.max(1, Math.ceil((entry.resetAt - now) / 60000));
    res.status(429).json({ error: "Too many failed attempts. Try again in " + mins + " minute" + (mins === 1 ? "" : "s") + "." });
    return;
  }

  if (!panelPassword) {
    // Dev convenience only — production always requires the env var.
    if (process.env.NODE_ENV !== "production") {
      const token = jwt.sign({ admin: true }, sessionSecret, { expiresIn: ADMIN_TOKEN_TTL });
      res.json({ success: true, token });
      return;
    }
    console.error("[ADMIN] ADMIN_PANEL_PASSWORD is not set — admin login is impossible in production");
    res.status(403).json({ error: "Admin panel not configured" });
    return;
  }

  if (!password || password !== panelPassword) {
    const e = entry && entry.resetAt > now ? entry : { fails: 0, resetAt: now + LOGIN_WINDOW_MS };
    e.fails += 1;
    loginFails.set(ip, e);
    // Count toward the global circuit breaker too
    if (globalLoginFails.resetAt <= now) {
      globalLoginFails.fails = 0;
      globalLoginFails.tripped = false;
      globalLoginFails.resetAt = now + GLOBAL_LOGIN_WINDOW_MS;
    }
    globalLoginFails.fails += 1;
    if (globalLoginFails.fails >= GLOBAL_LOGIN_MAX_FAILS && !globalLoginFails.tripped) {
      globalLoginFails.tripped = true;
      console.error(
        "[ADMIN][ALERT] Global admin-login circuit breaker TRIPPED: " +
        globalLoginFails.fails + " failed attempts across all IPs within 15 minutes. " +
        "Admin login is locked for everyone until " + new Date(globalLoginFails.resetAt).toISOString() + ". Possible distributed brute-force attack."
      );
      // Fire-and-forget email alert to the admin. The `tripped` flag above
      // guarantees at most one email per lockout window.
      const alertTo = adminAlertRecipient();
      if (alertTo) {
        const tpl = tplAdminLoginLockdown({
          failCount: globalLoginFails.fails,
          trippedAt: new Date(now),
          lockedUntil: new Date(globalLoginFails.resetAt),
        });
        sendEmail({ to: alertTo, toName: "BCPL Admin", subject: tpl.subject, htmlContent: tpl.htmlContent })
          .catch(e => console.error("[ADMIN][ALERT] lockdown alert email failed", e));
      } else {
        console.error("[ADMIN][ALERT] ADMIN_ALERT_EMAIL is not set — lockdown alert email NOT sent. Set ADMIN_ALERT_EMAIL to the admin's monitored inbox.");
      }
      // Fire-and-forget SMS alert too — email can be missed during a live
      // attack. Same `tripped` dedupe: at most one SMS per lockout window.
      // NOTE: text must match a DLT-approved transactional template on the
      // owner's MSG91 account, or Indian operators will silently drop it.
      const alertPhone = adminAlertPhone();
      if (alertPhone) {
        const lockedUntil = new Date(globalLoginFails.resetAt);
        const hh = String(lockedUntil.getHours()).padStart(2, "0");
        const mm = String(lockedUntil.getMinutes()).padStart(2, "0");
        const smsMsg =
          `BCPL ALERT: Admin login locked after ${globalLoginFails.fails} failed attempts. ` +
          `Locked until ${hh}:${mm}. Possible attack in progress. - BCPL T20`;
        sendSms(alertPhone, smsMsg)
          .then(r => { if (!r.ok) console.error("[ADMIN][ALERT] lockdown alert SMS failed", r.error ?? "(skipped)"); })
          .catch(e => console.error("[ADMIN][ALERT] lockdown alert SMS failed", e));
      } else {
        console.error("[ADMIN][ALERT] ADMIN_ALERT_PHONE is not set — lockdown alert SMS NOT sent. Set ADMIN_ALERT_PHONE to the admin's 10-digit mobile number.");
      }
    }
    console.warn("[ADMIN] wrong panel password attempt", { ip, fails: e.fails, globalFails: globalLoginFails.fails });
    res.status(401).json({ error: "Invalid admin password" });
    return;
  }

  loginFails.delete(ip);
  const token = jwt.sign({ admin: true }, sessionSecret, { expiresIn: ADMIN_TOKEN_TTL });
  res.json({ success: true, token });
});

/* ─── All routes below require admin auth ─────────────────────── */
router.use(requireAdmin);

/* ─── GET /api/admin/session/verify ─────────────────────────────
   Lightweight "is my stored token still valid?" check used by the
   panel on page load to restore the session without re-login.
   (requireAdmin above does the actual verification.) ──────────── */
router.get("/session/verify", (_req, res) => {
  res.json({ success: true });
});

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

    // Fetch payments + videos + kyc in one sweep
    const [allPayments, allP2Payments, allVideos, allKyc] = await Promise.all([
      db.select().from(phase1PaymentsTable),
      db.select().from(phase2PaymentsTable),
      db.select().from(phase1VideosTable),
      db.select().from(kycRecordsTable),
    ]);
    // A registration can have several payment attempt rows — prefer the successful one,
    // and among rows of the same class (paid vs not) keep the most recent attempt
    const PAID_ROW = new Set(["success", "paid"]);
    const pickPayments = <T extends { registrationId: string; status: string; createdAt: Date | string }>(rows: T[]) => {
      const map = new Map<string, T>();
      for (const p of rows) {
        const cur = map.get(p.registrationId);
        const better =
          !cur ||
          (!PAID_ROW.has(cur.status) && PAID_ROW.has(p.status)) ||
          (PAID_ROW.has(cur.status) === PAID_ROW.has(p.status) &&
            new Date(p.createdAt).getTime() > new Date(cur.createdAt).getTime());
        if (better) map.set(p.registrationId, p);
      }
      return map;
    };
    const payMap   = pickPayments(allPayments);
    const p2PayMap = pickPayments(allP2Payments);
    const vidMap = new Map(allVideos.map(v => [v.registrationId, v]));
    // Latest KYC record per registration (real status for the Users view)
    const kycMap = new Map<string, (typeof allKyc)[number]>();
    for (const k of allKyc) {
      const cur = kycMap.get(k.registrationId);
      if (!cur || new Date(k.createdAt).getTime() > new Date(cur.createdAt).getTime()) {
        kycMap.set(k.registrationId, k);
      }
    }

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
      payment:       payMap.get(r.reg.id) ?? null,
      phase2Payment: p2PayMap.get(r.reg.id) ?? null,
      video:         vidMap.get(r.reg.id) ?? null,
      kyc: (() => {
        const k = kycMap.get(r.reg.id);
        return k ? { id: k.id, status: k.status, panVerified: k.panVerified, verifiedAt: k.verifiedAt } : null;
      })(),
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
    // Ownership guard (§34/§82): registrations with an AI evaluation are
    // decided by the pipeline and announced by the release worker. A manual
    // decide here would race that worker (it overwrites phase1_status from
    // the evaluation result) and double-notify under a second dedupe key —
    // so selected/rejected is reserved for legacy registrations only.
    if (status === "selected" || status === "rejected") {
      const [aiEval] = await db.select({ id: phase1EvaluationsTable.id })
        .from(phase1EvaluationsTable)
        .where(eq(phase1EvaluationsTable.registrationId, String(id)))
        .limit(1);
      if (aiEval) {
        res.status(409).json({
          error: "This registration is managed by the AI evaluation pipeline; its result is decided and announced automatically. Manual selection applies only to legacy registrations without an AI evaluation.",
        });
        return;
      }
    }
    const [updated] = await db
      .update(registrationsTable)
      .set({ phase1Status: status, updatedAt: new Date() })
      .where(eq(registrationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Registration not found" }); return; }

    // Fire-and-forget: send email + SMS on select / reject
    if (status === "selected" || status === "rejected") {
      const [userRow] = await db
        .select({ user: usersTable })
        .from(usersTable)
        .where(eq(usersTable.id, updated.userId))
        .limit(1);

      if (userRow?.user) {
        const { name, email, phone } = userRow.user;
        // §82: result notifications are outcome-neutral — the result (and the
        // §83 congratulations, on first view) live in the player dashboard.
        // Reserve-first log = exactly-once per registration, even on re-decides.
        const reserved = await db.insert(notificationLogsTable)
          .values({ userId: updated.userId, type: "email", template: "phase1_result", dedupeKey: "p1_result_legacy_" + updated.id })
          .onConflictDoNothing()
          .returning({ id: notificationLogsTable.id });
        if (reserved.length > 0) {
          const tpl = tplPhase1ResultReady(name);
          const smsMsg = "BCPL T20: Hi " + name + ", your Phase 1 result is now available. View it in your Player Dashboard at bcplt20.com -BCPL T20";
          // Don't await — fire and forget
          sendEmail({ to: email, toName: name, subject: tpl.subject, htmlContent: tpl.htmlContent })
            .catch(e => console.error("[admin] email failed", e));
          sendSms(phone, smsMsg)
            .catch(e => console.error("[admin] sms failed", e));
        }
      }
    }

    res.json({ success: true, registration: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── PUT /api/admin/registrations/:id/score ─────────────────────
   BCPL 100-point Phase 1 evaluation (upsert). Total is always
   recomputed server-side. Maxima mirror SCORE_CRITERIA in results.ts. */
router.put("/registrations/:id/score", async (req, res) => {
  try {
    const id = String(req.params.id);
    const schema = z.object({
      roleSkill:     z.number().int().min(0).max(35),
      technique:     z.number().int().min(0).max(25),
      execution:     z.number().int().min(0).max(15),
      gameAwareness: z.number().int().min(0).max(10),
      movement:      z.number().int().min(0).max(10),
      videoEvidence: z.number().int().min(0).max(5),
      selectorNote:  z.string().trim().max(600).optional().nullable(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const d = parsed.data;

    const [reg] = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.id, id)).limit(1);
    if (!reg) { res.status(404).json({ error: "Registration not found" }); return; }

    const total = d.roleSkill + d.technique + d.execution + d.gameAwareness + d.movement + d.videoEvidence;
    const values = {
      registrationId: id,
      roleSkill:      d.roleSkill,
      technique:      d.technique,
      execution:      d.execution,
      gameAwareness:  d.gameAwareness,
      movement:       d.movement,
      videoEvidence:  d.videoEvidence,
      total,
      selectorNote:   d.selectorNote?.trim() ? d.selectorNote.trim() : null,
      updatedAt:      new Date(),
    };
    const [saved] = await db.insert(phase1ScoresTable)
      .values(values)
      .onConflictDoUpdate({ target: phase1ScoresTable.registrationId, set: values })
      .returning();

    res.json({ success: true, score: saved });
  } catch (err: any) {
    console.error("[admin/score]", err);
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
      .select({ video: phase1VideosTable, reg: registrationsTable, user: usersTable, score: phase1ScoresTable })
      .from(phase1VideosTable)
      .leftJoin(registrationsTable, eq(phase1VideosTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .leftJoin(phase1ScoresTable, eq(phase1VideosTable.registrationId, phase1ScoresTable.registrationId))
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
      phase1Status:    r.reg?.phase1Status ?? "",
      score: r.score ? {
        roleSkill:     r.score.roleSkill,
        technique:     r.score.technique,
        execution:     r.score.execution,
        gameAwareness: r.score.gameAwareness,
        movement:      r.score.movement,
        videoEvidence: r.score.videoEvidence,
        total:         r.score.total,
        selectorNote:  r.score.selectorNote,
      } : null,
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

/* ─── Trial Venue CRUD ─────────────────────────────────────────── */

// GET /api/admin/trial-venues
router.get("/trial-venues", async (_req, res) => {
  try {
    const venues = await db.select().from(trialVenuesTable).orderBy(trialVenuesTable.city);
    res.json({ venues });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/trial-venues
router.post("/trial-venues", async (req, res) => {
  try {
    const { city, venue, trialDate, trialTime, reportingTime, slots, notes } = req.body as {
      city: string; venue: string; trialDate: string; trialTime: string;
      reportingTime: string; slots?: number; notes?: string;
    };
    if (!city || !venue || !trialDate || !trialTime || !reportingTime) {
      res.status(400).json({ error: "city, venue, trialDate, trialTime, reportingTime are required" });
      return;
    }
    const [created] = await db.insert(trialVenuesTable).values({
      city, venue, trialDate, trialTime, reportingTime,
      slots: slots ?? 100, notes: notes ?? null,
    }).returning();
    res.json({ success: true, venue: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/trial-venues/:id
router.put("/trial-venues/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { city, venue, trialDate, trialTime, reportingTime, slots, notes, status } = req.body as Record<string, any>;
    const [updated] = await db
      .update(trialVenuesTable)
      .set({ city, venue, trialDate, trialTime, reportingTime, slots, notes, status, updatedAt: new Date() })
      .where(eq(trialVenuesTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Venue not found" }); return; }
    res.json({ success: true, venue: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/trial-venues/:id
router.delete("/trial-venues/:id", async (req, res) => {
  try {
    await db.delete(trialVenuesTable).where(eq(trialVenuesTable.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/trial-venues/:id/announce
// Sends tplTrialVenueAnnounced email to all Phase 2 players in that city
router.post("/trial-venues/:id/announce", async (req, res) => {
  try {
    const { id } = req.params;
    const [venueRow] = await db.select().from(trialVenuesTable).where(eq(trialVenuesTable.id, id)).limit(1);
    if (!venueRow) { res.status(404).json({ error: "Venue not found" }); return; }

    // Fetch selected players in this city with phase2 payment done or kyc done
    const players = await db
      .select({ reg: registrationsTable, user: usersTable })
      .from(registrationsTable)
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .where(eq(registrationsTable.trialCity, venueRow.city));

    // Filter: selected for phase 2 and payment/kyc done
    const eligible = players.filter(p =>
      p.reg.phase1Status === "selected" &&
      (p.reg.phase2Status === "payment_done" || p.reg.phase2Status === "kyc_done")
    );

    let sent = 0;
    for (const { user } of eligible) {
      if (!user) continue;
      const tpl = tplTrialVenueAnnounced(
        user.name, venueRow.city, venueRow.venue,
        venueRow.trialDate, venueRow.trialTime, venueRow.reportingTime
      );
      const emailRes = await sendEmail({ to: user.email, toName: user.name, subject: tpl.subject, htmlContent: tpl.htmlContent });
      if (emailRes.ok || emailRes.skipped) {
        await sendSms(user.phone, `BCPL T20 Season 5: Your Phase 2 trial is confirmed! Venue: ${venueRow.venue}, ${venueRow.city} on ${venueRow.trialDate} at ${venueRow.trialTime}. Reporting: ${venueRow.reportingTime}. - BCPL T20`).catch(() => {});
        sent++;
      }
    }

    // Mark as announced
    await db.update(trialVenuesTable).set({ announcedAt: new Date(), updatedAt: new Date() }).where(eq(trialVenuesTable.id, id));

    res.json({ success: true, sent, total: eligible.length });
  } catch (err: any) {
    console.error("[admin/announce]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET /api/admin/kyc ────────────────────────────────────────── */
router.get("/kyc", async (req, res) => {
  try {
    const { status } = req.query as Record<string, string>;

    const rows = await db
      .select({ kyc: kycRecordsTable, reg: registrationsTable, user: usersTable, profile: playerProfilesTable })
      .from(kycRecordsTable)
      .leftJoin(registrationsTable, eq(kycRecordsTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .leftJoin(playerProfilesTable, eq(playerProfilesTable.registrationId, kycRecordsTable.registrationId))
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
      status:          r.kyc.status,
      panVerified:     r.kyc.panVerified,
      aadhaarVerified: r.kyc.aadhaarVerified,
      verifiedAt:      r.kyc.verifiedAt,
      createdAt:      r.kyc.createdAt,
      player:         r.user?.name ?? "Unknown",
      phone:          r.user?.phone ?? "",
      email:          r.user?.email ?? "",
      role:           r.reg?.role ?? "",
      trialCity:      r.reg?.trialCity ?? "",
      phase2Status:   r.reg?.phase2Status ?? null,
      // Employment + emergency contact (collected on the KYC page)
      company:           r.profile?.company ?? null,
      jobTitle:          r.profile?.jobTitle ?? null,
      experience:        r.profile?.experience ?? null,
      linkedin:          r.profile?.linkedin ?? null,
      tshirtSize:        r.profile?.tshirtSize ?? null,
      emergencyName:     r.profile?.emergencyName ?? null,
      emergencyRelation: r.profile?.emergencyRelation ?? null,
      emergencyPhone:    r.profile?.emergencyPhone ?? null,
      bloodGroup:        r.profile?.bloodGroup ?? null,
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

    if (status === "verified") {
      // Admin approval = PAN manually checked → clear the manual-review flag and go
      // through the same path as OTP success (syncs registration + notifies player).
      const [kyc] = await db.select().from(kycRecordsTable).where(eq(kycRecordsTable.id, id)).limit(1);
      if (!kyc) { res.status(404).json({ error: "KYC record not found" }); return; }
      const [reg] = await db.select().from(registrationsTable)
        .where(eq(registrationsTable.id, kyc.registrationId)).limit(1);
      await db.update(kycRecordsTable).set({ panVerified: true, aadhaarVerified: true }).where(eq(kycRecordsTable.id, id));
      await markKycVerified(kyc.id, kyc.registrationId, reg?.userId ?? "admin");
      const [updated] = await db.select().from(kycRecordsTable).where(eq(kycRecordsTable.id, id)).limit(1);
      res.json({ success: true, kyc: updated });
      return;
    }

    const [updated] = await db
      .update(kycRecordsTable)
      .set({ status, verifiedAt: null })
      .where(eq(kycRecordsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "KYC record not found" }); return; }
    res.json({ success: true, kyc: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/admin/invoice/send — email a real GST tax invoice ──────────
 * Finds the successful payment for the registration+phase, extracts GST out
 * of the stored gross amount (amounts are GST-inclusive), sends the invoice
 * email and records the attempt in notification_logs. Fails loudly. */
const invoiceSchema = z.object({
  registrationId: z.string().uuid(),
  phase: z.union([z.literal(1), z.literal(2)]),
  email: z.string().email().optional(),
});

router.post("/invoice/send", requireAdmin, async (req, res) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "registrationId (uuid) and phase (1 or 2) required; email optional" });
    return;
  }
  const { registrationId, phase, email: emailOverride } = parsed.data;
  try {
    const rows = await db
      .select({ reg: registrationsTable, user: usersTable })
      .from(registrationsTable)
      .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .where(eq(registrationsTable.id, registrationId))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Registration not found" }); return; }
    const { user } = rows[0];

    const payTable = phase === 1 ? phase1PaymentsTable : phase2PaymentsTable;
    const pays = await db.select().from(payTable).where(eq(payTable.registrationId, registrationId));
    const PAID = new Set(["success", "paid"]);
    const pay = pays
      .filter(p => PAID.has(p.status))
      .sort((a, b) => new Date(b.paidAt ?? b.createdAt).getTime() - new Date(a.paidAt ?? a.createdAt).getTime())[0];
    if (!pay) {
      res.status(404).json({ error: `No successful Phase ${phase} payment found for this registration` });
      return;
    }

    const breakup   = gstFromGross(Math.round(Number(pay.amount)));
    const invoiceNo = `BCPL/25-26/${pay.cashfreeOrderId || pay.id}`;
    const to        = emailOverride || user.email;
    const tpl = tplInvoice({
      name: user.name,
      invoiceNo,
      phase,
      txnId: pay.cashfreeOrderId || pay.id,
      paidAt: pay.paidAt ?? pay.createdAt,
      breakup,
    });

    const result = await sendEmail({ to, toName: user.name, subject: tpl.subject, htmlContent: tpl.htmlContent });
    await logNotifications(user.id, `invoice_phase${phase}`, { email: result });

    if (!result.ok) {
      res.status(502).json({
        success: false,
        error: result.skipped
          ? "Email is not configured on this server (BREVO_API_KEY missing)"
          : result.error ?? "Email provider rejected the send",
      });
      return;
    }
    res.json({ success: true, sentTo: to, invoiceNo });
  } catch (err: any) {
    console.error("[admin/invoice] failed", err);
    res.status(500).json({ error: err.message ?? "Failed to send invoice" });
  }
});


/* ─── GET /api/admin/marketing/abandoned ──────────────────────────
   Registration-recovery segment: players who registered but never
   completed Phase 1 payment, with attempt + reminder context. */
router.get("/marketing/abandoned", async (_req, res) => {
  try {
    const rows = await db.select({ reg: registrationsTable, user: usersTable })
      .from(registrationsTable)
      .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .where(eq(registrationsTable.phase1Status, "pending"))
      .orderBy(desc(registrationsTable.createdAt))
      .limit(500);

    const ids = rows.map(r => r.reg.id);
    const payMap = new Map<string, { attempts: number; last: string | null }>();
    const remCount = new Map<string, number>();
    if (ids.length) {
      const pays = await db.select().from(phase1PaymentsTable)
        .where(inArray(phase1PaymentsTable.registrationId, ids))
        .orderBy(desc(phase1PaymentsTable.createdAt));
      for (const p of pays) {
        const cur = payMap.get(p.registrationId) ?? { attempts: 0, last: null };
        cur.attempts += 1;
        if (cur.last === null) cur.last = p.status;
        payMap.set(p.registrationId, cur);
      }
      const userIds = rows.map(r => r.user.id);
      const rems = await db.select({ userId: notificationLogsTable.userId, dedupeKey: notificationLogsTable.dedupeKey })
        .from(notificationLogsTable)
        .where(inArray(notificationLogsTable.userId, userIds));
      for (const n of rems) {
        if (n.dedupeKey && n.dedupeKey.startsWith("p1_pay_reminder_")) {
          remCount.set(n.userId, (remCount.get(n.userId) ?? 0) + 1);
        }
      }
    }

    const now = Date.now();
    res.json({
      abandoned: rows.map(({ reg, user }) => {
        const pp = payMap.get(reg.id);
        return {
          registrationId: reg.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          city: reg.trialCity,
          role: reg.role,
          registeredAt: reg.createdAt,
          ageHours: Math.floor((now - reg.createdAt.getTime()) / 3600000),
          paymentAttempts: pp ? pp.attempts : 0,
          lastAttemptStatus: pp ? pp.last : null,
          remindersSent: remCount.get(user.id) ?? 0,
        };
      }),
    });
  } catch (err: any) {
    console.error("[admin/marketing/abandoned]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─── POST /api/admin/jobs/run-reminders ──────────────────────────
   Manual trigger for the reminder sweeps. Defaults to dryRun:true —
   pass { "dryRun": false } to actually send. Idempotent either way:
   dedupe keys guarantee one send per player per bucket, ever. */
router.post("/jobs/run-reminders", async (req, res) => {
  try {
    const dryRun = req.body && req.body.dryRun === false ? false : true;
    const videoCount = await sendVideoReminders({ dryRun });
    const pay = await sendPaymentReminders({ dryRun });
    res.json({ remindersEnabledInEnv: remindersEnabled(), videoReminders: videoCount, ...pay });
  } catch (err: any) {
    console.error("[admin/jobs/run-reminders]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET /api/admin/ops ──────────────────────────────────────────
   Operational dashboard payload: registration matrix (city × role ×
   phase statuses) the client can slice under any filter combination,
   AI pipeline stats and a server-computed Action-Required alert list.
   Trial capacity / check-in numbers join in with the trials module. */
router.get("/ops", async (_req, res) => {
  try {
    const nowMs = Date.now();
    const H = 3600 * 1000;
    const AI_WORKING = ["validating", "ai_validating", "scoring"];

    const [matrix, evalRows, evalAvgRows, resultRows, kycRows, videoRows, stuckAi, stalePendingP1, failedP1Recent, notifFailedRecent] = await Promise.all([
      db.select({
        city: registrationsTable.trialCity,
        role: registrationsTable.role,
        p1: registrationsTable.phase1Status,
        p2: registrationsTable.phase2Status,
        n: count(),
      }).from(registrationsTable)
        .groupBy(registrationsTable.trialCity, registrationsTable.role, registrationsTable.phase1Status, registrationsTable.phase2Status),

      db.select({ status: phase1EvaluationsTable.status, n: count() })
        .from(phase1EvaluationsTable).groupBy(phase1EvaluationsTable.status),

      /* single global aggregate — avg() ignores NULLs, so denominators are
         the non-null metric counts (per-status avg × row-count recombination
         would skew when a status mixes null and non-null metrics) */
      db.select({
        avgScore: sql<string | null>`avg(${phase1EvaluationsTable.finalScore})`,
        avgConfidence: sql<string | null>`avg(${phase1EvaluationsTable.confidence})`,
        avgProcessingMs: sql<string | null>`avg(${phase1EvaluationsTable.processingMs})`,
      }).from(phase1EvaluationsTable),

      db.select({ result: phase1EvaluationsTable.result, n: count() })
        .from(phase1EvaluationsTable)
        .where(isNotNull(phase1EvaluationsTable.result))
        .groupBy(phase1EvaluationsTable.result),

      db.select({ status: kycRecordsTable.status, n: count() })
        .from(kycRecordsTable).groupBy(kycRecordsTable.status),

      db.select({ status: phase1VideosTable.status, n: count() })
        .from(phase1VideosTable).groupBy(phase1VideosTable.status),

      db.select({ n: count() }).from(phase1EvaluationsTable)
        .where(and(
          inArray(phase1EvaluationsTable.status, AI_WORKING),
          lt(phase1EvaluationsTable.updatedAt, new Date(nowMs - 0.5 * H)),
        )),

      db.select({ n: count() }).from(phase1PaymentsTable)
        .where(and(
          eq(phase1PaymentsTable.status, "pending"),
          lt(phase1PaymentsTable.createdAt, new Date(nowMs - 24 * H)),
        )),

      db.select({ n: count() }).from(phase1PaymentsTable)
        .where(and(
          eq(phase1PaymentsTable.status, "failed"),
          gte(phase1PaymentsTable.createdAt, new Date(nowMs - 24 * H)),
        )),

      db.select({ n: count() }).from(notificationLogsTable)
        .where(and(
          eq(notificationLogsTable.status, "failed"),
          gte(notificationLogsTable.createdAt, new Date(nowMs - 48 * H)),
        )),
    ]);

    const evalByStatus: Record<string, number> = {};
    for (const e of evalRows) evalByStatus[e.status] = Number(e.n);
    const avgRow = evalAvgRows[0];
    const results: Record<string, number> = {};
    for (const r of resultRows) if (r.result) results[r.result] = Number(r.n);
    const kyc: Record<string, number> = {};
    for (const k of kycRows) kyc[k.status] = Number(k.n);
    const videos: Record<string, number> = {};
    for (const v of videoRows) videos[v.status] = Number(v.n);

    const nStuck = Number(stuckAi[0]?.n ?? 0);
    const nStalePending = Number(stalePendingP1[0]?.n ?? 0);
    const nFailedPay = Number(failedP1Recent[0]?.n ?? 0);
    const nNotifFailed = Number(notifFailedRecent[0]?.n ?? 0);

    type Sev = "critical" | "warn" | "info";
    const alerts: { id: string; severity: Sev; label: string; count: number; tab: string }[] = [];
    const push = (id: string, severity: Sev, label: string, cnt: number, tab: string) => {
      if (cnt > 0) alerts.push({ id, severity, label, count: cnt, tab });
    };
    push("stale_pending_payments", "critical", "Phase 1 payments stuck in pending for over 24h — reconciliation needs a look", nStalePending, "finance");
    push("ai_stuck", "critical", "AI evaluations stuck mid-pipeline for over 30 minutes", nStuck, "selection");
    push("integrity_review", "warn", "Videos parked for integrity review — admin decision needed", evalByStatus["integrity_review"] ?? 0, "video_review");
    push("kyc_failed", "warn", "KYC verifications failed — players may need help", kyc["failed"] ?? 0, "phase2_kyc");
    push("notif_failed", "warn", "Notifications failed to deliver in the last 48h", nNotifFailed, "marketing");
    push("ai_backlog", (evalByStatus["queued"] ?? 0) > 50 ? "warn" : "info", "Videos waiting in the AI queue", evalByStatus["queued"] ?? 0, "selection");
    push("reupload_required", "info", "Players asked to re-upload their video", evalByStatus["reupload_required"] ?? 0, "video_review");
    push("kyc_pending", "info", "KYC submissions awaiting review", kyc["pending"] ?? 0, "phase2_kyc");
    push("failed_payments_24h", "info", "Payment attempts failed in the last 24h", nFailedPay, "finance");

    res.json({
      matrix: matrix.map(m => ({ city: m.city, role: m.role, p1: m.p1, p2: m.p2, n: Number(m.n) })),
      evals: {
        byStatus: evalByStatus,
        avgScore: avgRow?.avgScore != null ? Number(avgRow.avgScore) : null,
        avgConfidence: avgRow?.avgConfidence != null ? Number(avgRow.avgConfidence) : null,
        avgProcessingMs: avgRow?.avgProcessingMs != null ? Number(avgRow.avgProcessingMs) : null,
      },
      results,
      kyc,
      videos,
      alerts,
    });
  } catch (err: any) {
    console.error("[admin/ops]", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET /api/admin/players/:key/journey ─────────────────────────
   Master Player Journey aggregation — ONE call returns everything the
   Master Player Profile page needs. :key = regNumber (BCPL-DEL-1) or
   registration UUID. Read-only: the unified journey is DERIVED from the
   existing per-domain statuses; no schema changes, no writes, and the
   original AI scores are never editable from here (spec rule). */
router.get("/players/:key/journey", async (req, res) => {
  try {
    const key = String(req.params.key).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);

    const regRows = await db
      .select({ reg: registrationsTable, user: usersTable })
      .from(registrationsTable)
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .where(isUuid ? eq(registrationsTable.id, key) : eq(registrationsTable.regNumber, key.toUpperCase()))
      .limit(1);
    const row = regRows[0];
    if (!row) { res.status(404).json({ error: "Player not found: " + key }); return; }
    const reg = row.reg;

    const [p1Pays, p2Pays, videos, evals, snaps, kycs, profiles, notifs] = await Promise.all([
      db.select().from(phase1PaymentsTable).where(eq(phase1PaymentsTable.registrationId, reg.id)).orderBy(desc(phase1PaymentsTable.createdAt)),
      db.select().from(phase2PaymentsTable).where(eq(phase2PaymentsTable.registrationId, reg.id)).orderBy(desc(phase2PaymentsTable.createdAt)),
      db.select().from(phase1VideosTable).where(eq(phase1VideosTable.registrationId, reg.id)).orderBy(desc(phase1VideosTable.submittedAt)),
      db.select().from(phase1EvaluationsTable).where(eq(phase1EvaluationsTable.registrationId, reg.id)).orderBy(desc(phase1EvaluationsTable.attemptNumber)),
      db.select().from(rankingSnapshotsTable).where(eq(rankingSnapshotsTable.registrationId, reg.id)),
      db.select().from(kycRecordsTable).where(eq(kycRecordsTable.registrationId, reg.id)).orderBy(desc(kycRecordsTable.createdAt)),
      db.select().from(playerProfilesTable).where(eq(playerProfilesTable.registrationId, reg.id)),
      db.select().from(notificationLogsTable).where(eq(notificationLogsTable.userId, reg.userId)).orderBy(desc(notificationLogsTable.createdAt)).limit(60),
    ]);

    const isPaid = (st: string) => st === "success" || st === "paid"; // legacy rows use "paid"
    const paid1 = p1Pays.find(x => isPaid(x.status)) ?? null;
    const paid2 = p2Pays.find(x => isPaid(x.status)) ?? null;
    const latestP1 = paid1 ?? p1Pays[0] ?? null;
    const latestP2 = paid2 ?? p2Pays[0] ?? null;
    const video = videos[0] ?? null;
    const ev = evals[0] ?? null;
    const kyc = kycs[0] ?? null;
    const profile = profiles[0] ?? null;
    const snap = snaps[0] ?? null;

    const passes = ev
      ? await db.select().from(aiEvaluationPassesTable).where(eq(aiEvaluationPassesTable.evaluationId, ev.id)).orderBy(aiEvaluationPassesTable.passNumber)
      : [];

    /* ── Derive unified journey ── */
    type StepState = "done" | "current" | "attention" | "locked";
    type Step = { id: string; label: string; state: StepState; detail: string | null; at: Date | string | null };
    const step = (id: string, label: string, state: StepState, detail?: string | null, at?: Date | string | null): Step =>
      ({ id, label, state, detail: detail ?? null, at: at ?? null });

    const qualified = reg.phase1Status === "selected" || !!reg.phase2Status;
    const notShortlisted = reg.phase1Status === "rejected";
    const kycDone = kyc?.status === "verified";
    const essentialsDone = !!(profile && profile.emergencyPhone && profile.tshirtSize);
    const p2Complete = reg.phase2Status === "kyc_done" || reg.phase2Status === "selected";

    const steps: Step[] = [];
    steps.push(step("registration", "Registration", "done", reg.regNumber ?? "Registered", reg.createdAt));

    if (paid1) steps.push(step("phase1_payment", "Phase 1 Payment", "done", "Paid " + String(paid1.amount), paid1.paidAt));
    else steps.push(step("phase1_payment", "Phase 1 Payment", "current", latestP1 ? "Last attempt: " + latestP1.status : "Payment pending"));

    const reupload = ev?.status === "reupload_required";
    if (video && !reupload) steps.push(step("video", "Trial Video", "done", (video.durationSeconds != null ? video.durationSeconds + " sec" : "Uploaded"), video.submittedAt));
    else if (reupload) steps.push(step("video", "Trial Video", "attention", "Re-upload required" + (ev && ev.reasonCode ? " · " + ev.reasonCode : "")));
    else if (paid1) steps.push(step("video", "Trial Video", "current", reg.videoDeadline ? "Deadline " + new Date(reg.videoDeadline).toISOString().slice(0, 10) : "Awaiting upload"));
    else steps.push(step("video", "Trial Video", "locked"));

    const EV_DONE = new Set(["final_scoring", "result_ready", "result_released"]);
    const EV_RUNNING = new Set(["queued", "validating", "ai_pass_1", "ai_pass_2", "ai_pass_3"]);
    if (ev && (EV_DONE.has(ev.status) || ev.finalScore != null))
      steps.push(step("ai_evaluation", "AI Evaluation", "done", ev.finalScore != null ? "Score " + ev.finalScore + "/100" : "Scored", ev.updatedAt));
    else if (ev && (ev.status === "failed_final" || ev.status === "integrity_review"))
      steps.push(step("ai_evaluation", "AI Evaluation", "attention", ev.status === "integrity_review" ? "Integrity review" : "Failed — needs admin"));
    else if (ev && EV_RUNNING.has(ev.status))
      steps.push(step("ai_evaluation", "AI Evaluation", "current", "Stage: " + ev.status.replace(/_/g, " ")));
    else if (reupload) steps.push(step("ai_evaluation", "AI Evaluation", "locked"));
    else if (video) steps.push(step("ai_evaluation", "AI Evaluation", "current", "Queued"));
    else steps.push(step("ai_evaluation", "AI Evaluation", "locked"));

    if (ev && ev.resultReleasedAt)
      steps.push(step("phase1_result", "Phase 1 Result", "done", qualified ? "Qualified" : (notShortlisted ? "Not shortlisted" : "Released"), ev.resultReleasedAt));
    else if (qualified || notShortlisted)
      steps.push(step("phase1_result", "Phase 1 Result", "done", qualified ? "Qualified" : "Not shortlisted"));
    else if (ev && ev.resultReleaseAt)
      steps.push(step("phase1_result", "Phase 1 Result", "current", "Release scheduled", ev.resultReleaseAt));
    else steps.push(step("phase1_result", "Phase 1 Result", "locked"));

    if (paid2) steps.push(step("phase2_payment", "Phase 2 Payment", "done", "Paid " + String(paid2.amount), paid2.paidAt));
    else if (qualified) steps.push(step("phase2_payment", "Phase 2 Payment", "current", latestP2 ? "Last attempt: " + latestP2.status : "Payment pending"));
    else steps.push(step("phase2_payment", "Phase 2 Payment", "locked"));

    if (kycDone) steps.push(step("kyc", "Identity / KYC", "done", kyc && kyc.panVerified === false ? "Verified · PAN manual" : "Verified", kyc ? kyc.verifiedAt : null));
    else if (kyc && kyc.panVerified === false) steps.push(step("kyc", "Identity / KYC", "attention", "PAN manual review"));
    else if (kyc) steps.push(step("kyc", "Identity / KYC", "current", "Status: " + kyc.status));
    else if (paid2) steps.push(step("kyc", "Identity / KYC", "current", "Not started"));
    else steps.push(step("kyc", "Identity / KYC", "locked"));

    if (essentialsDone) steps.push(step("essentials", "Player Essentials", "done", profile && profile.tshirtSize ? "T-shirt " + profile.tshirtSize : "Complete"));
    else if (profile) steps.push(step("essentials", "Player Essentials", "current", "Incomplete"));
    else if (paid2) steps.push(step("essentials", "Player Essentials", "current", "Not submitted"));
    else steps.push(step("essentials", "Player Essentials", "locked"));

    if (p2Complete) steps.push(step("physical_trial", "Physical Trial", "current", "Awaiting allocation"));
    else steps.push(step("physical_trial", "Physical Trial", "locked"));

    if (reg.phase2Status === "selected") {
      steps.push(step("final_selection", "Final Selection", "done", "Selected"));
      steps.push(step("auction", "Auction Pool", "current", "In pool"));
    } else if (reg.phase2Status === "rejected") {
      steps.push(step("final_selection", "Final Selection", "attention", "Not selected"));
      steps.push(step("auction", "Auction Pool", "locked"));
    } else {
      steps.push(step("final_selection", "Final Selection", "locked"));
      steps.push(step("auction", "Auction Pool", "locked"));
    }
    steps.push(step("team_contract", "Team & Contract", "locked"));

    const firstAttention = steps.find(x => x.state === "attention");
    const firstCurrent = steps.find(x => x.state === "current");
    const masterStatus = firstAttention
      ? firstAttention.label.toUpperCase() + " — " + (firstAttention.detail ?? "NEEDS ATTENTION")
      : firstCurrent
        ? firstCurrent.label.toUpperCase() + (firstCurrent.detail ? " — " + firstCurrent.detail : "")
        : notShortlisted ? "PHASE 1 — NOT SHORTLISTED" : "ALL STEPS COMPLETE";

    const roleLabel = (r: string): string => {
      const v = (r || "").toLowerCase();
      if (v === "bat" || v === "batsman") return "Batsman";
      if (v === "bowl" || v === "bowler") return "Bowler";
      if (v === "wk" || v === "wicketkeeper" || v === "wicket-keeper") return "Wicket-keeper";
      if (v === "ar" || v === "all-rounder" || v === "allrounder") return "All-rounder";
      return r;
    };

    res.json({
      player: {
        registrationId: reg.id,
        regNumber: reg.regNumber,
        name: row.user ? row.user.name : null,
        phone: row.user ? row.user.phone : null,
        email: row.user ? row.user.email : null,
        role: reg.role,
        roleLabel: roleLabel(reg.role),
        trialCity: reg.trialCity,
        phase1Status: reg.phase1Status,
        phase2Status: reg.phase2Status,
        videoDeadline: reg.videoDeadline,
        registeredAt: reg.createdAt,
      },
      journey: { masterStatus, steps },
      phase1Payment: latestP1 ? { amount: latestP1.amount, status: latestP1.status, orderId: latestP1.cashfreeOrderId, paymentId: latestP1.cashfreePaymentId, paidAt: latestP1.paidAt, attempts: p1Pays.length } : null,
      phase2Payment: latestP2 ? { amount: latestP2.amount, status: latestP2.status, orderId: latestP2.cashfreeOrderId, paymentId: latestP2.cashfreePaymentId, paidAt: latestP2.paidAt, attempts: p2Pays.length } : null,
      videos: videos.map(v => ({ id: v.id, status: v.status, durationSeconds: v.durationSeconds, mimeType: v.mimeType, sizeBytes: v.sizeBytes, declarationAccepted: v.declarationAccepted, uploadedAt: v.submittedAt })),
      evaluation: ev ? {
        attemptNumber: ev.attemptNumber, status: ev.status, reasonCode: ev.reasonCode,
        pass1Score: ev.pass1Score, pass2Score: ev.pass2Score, pass3Score: ev.pass3Score,
        finalScore: ev.finalScore, confidence: ev.confidence, scoreVariance: ev.scoreVariance,
        passesUsed: ev.passesUsed, result: ev.result, categoryScores: ev.categoryScores,
        strongestArea: ev.strongestArea, improvementArea: ev.improvementArea,
        resultReleaseAt: ev.resultReleaseAt, resultReleasedAt: ev.resultReleasedAt,
        modelVersion: ev.modelVersion, promptVersion: ev.promptVersion, rubricVersion: ev.rubricVersion, assessmentVersion: ev.assessmentVersion,
      } : null,
      passes: passes.map(x => ({ passNumber: x.passNumber, kind: x.kind, status: x.status, model: x.model, score: x.score, confidence: x.confidence, latencyMs: x.latencyMs, at: x.responseAt ?? x.requestAt })),
      ranking: snap ? { cityRank: snap.cityRank, cityTotal: snap.cityTotal, roleRank: snap.roleRank, roleTotal: snap.roleTotal, percentile: snap.percentile, snapshotAt: snap.snapshotAt } : null,
      kyc: kyc ? { status: kyc.status, aadhaarVerified: kyc.aadhaarVerified, panVerified: kyc.panVerified, profession: kyc.profession, verifiedAt: kyc.verifiedAt } : null,
      profile: profile ? { company: profile.company, jobTitle: profile.jobTitle, experience: profile.experience, tshirtSize: profile.tshirtSize, bloodGroup: profile.bloodGroup, emergencyName: profile.emergencyName, emergencyRelation: profile.emergencyRelation, emergencyPhone: profile.emergencyPhone } : null,
      notifications: notifs.map(n => ({ type: n.type, template: n.template, status: n.status, error: n.error, at: n.createdAt })),
    });
  } catch (err: any) {
    console.error("[admin/players/journey]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

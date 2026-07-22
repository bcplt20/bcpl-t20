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
  phase2PaymentsTable,
  trialVenuesTable,
  playerProfilesTable,
} from "@workspace/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { markKycVerified } from "./kyc";
import { sendEmail, adminAlertRecipient, tplPhase1Selected, tplPhase1Rejected, tplTrialVenueAnnounced, tplInvoice, tplAdminLoginLockdown } from "../lib/email";
import { sendSms } from "../lib/sms";
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
        const tpl = status === "selected" ? tplPhase1Selected(name) : tplPhase1Rejected(name);
        const smsMsg = status === "selected"
          ? `Congratulations ${name}! You have been SELECTED for BCPL T20 Season 5 Phase 2 trials. Login to bcplt20.com to proceed. - BCPL T20`
          : `Dear ${name}, thank you for participating in BCPL Season 5. Phase 1 result is out. Visit bcplt20.com for details. - BCPL T20`;

        // Don't await — fire and forget
        sendEmail({ to: email, toName: name, subject: tpl.subject, htmlContent: tpl.htmlContent })
          .catch(e => console.error("[admin] email failed", e));
        sendSms(phone, smsMsg)
          .catch(e => console.error("[admin] sms failed", e));
      }
    }

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

export default router;

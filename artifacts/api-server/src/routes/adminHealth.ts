/**
 * Stage 5 — admin API-health page backend.
 *
 * GET /api/admin/health  →  per-integration status + job heartbeats +
 * AI queue depths. NEVER returns secret values — only booleans ("is the
 * env var set") and timestamps ("when did this integration last work",
 * derived from our own DB activity).
 *
 * ?probe=1 additionally live-pings the providers with a SAFE read-only
 * request where one exists (Brevo account, Gemini model list). Providers
 * without a harmless probe endpoint (Cashfree PG/verification, MSG91)
 * stay activity-based to avoid accidental side effects.
 */
import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { getJobHeartbeats } from "../lib/heartbeat";
import { getPhase1Config } from "../lib/phase1Config";
import { logger } from "../lib/logger";

export const adminHealthRouter = Router();
adminHealthRouter.use(requireAdmin);

const has = (...keys: string[]) => keys.every((k) => !!process.env[k]);

async function lastAt(q: ReturnType<typeof sql>): Promise<string | null> {
  try {
    const r = await db.execute(q);
    const rows = (r as unknown as { rows?: Record<string, unknown>[] }).rows ?? [];
    const v = rows[0]?.["last"];
    if (!v) return null;
    const d = new Date(v as string);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

interface ProbeResult { ok: boolean; note: string }

async function probeBrevo(): Promise<ProbeResult> {
  try {
    const r = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": process.env.BREVO_API_KEY ?? "" },
      signal: AbortSignal.timeout(3500),
    });
    return { ok: r.ok, note: r.ok ? "account reachable" : `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.message.slice(0, 120) : "unreachable" };
  }
}

async function probeGemini(): Promise<ProbeResult> {
  try {
    const key = process.env.GEMINI_API_KEY ?? "";
    /* Probe the exact model evaluations use — a valid key with a retired/
       pinned model must show as FAILED here (with the model name), not as
       a healthy "model list reachable". */
    const model = (await getPhase1Config()).geminiPrimaryModel;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}?key=${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(3500),
    });
    return { ok: r.ok, note: r.ok ? `model ${model} reachable` : `HTTP ${r.status} for model ${model}` };
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.message.slice(0, 120) : "unreachable" };
  }
}

adminHealthRouter.get("/", async (req, res) => {
  try {
    const probe = req.query["probe"] === "1";
    const [payLast, emailLast, smsLast, waLast, geminiLast, s3Last, aadhaarLast, panLast, queueRows] = await Promise.all([
      lastAt(sql`SELECT max(paid_at) AS last FROM (
        SELECT paid_at FROM phase1_payments WHERE status = 'success'
        UNION ALL SELECT paid_at FROM phase2_payments WHERE status = 'success') t`),
      lastAt(sql`SELECT max(created_at) AS last FROM notification_logs WHERE type = 'email' AND status = 'sent'`),
      lastAt(sql`SELECT max(created_at) AS last FROM notification_logs WHERE type = 'sms' AND status = 'sent'`),
      lastAt(sql`SELECT max(created_at) AS last FROM notification_logs WHERE type = 'whatsapp' AND status = 'sent'`),
      lastAt(sql`SELECT max(created_at) AS last FROM ai_evaluation_passes`),
      lastAt(sql`SELECT max(created_at) AS last FROM phase1_videos`),
      lastAt(sql`SELECT max(verified_at) AS last FROM kyc_records WHERE aadhaar_verified = true`),
      lastAt(sql`SELECT max(verified_at) AS last FROM kyc_records WHERE pan_verified = true AND status = 'verified'`),
      db.execute(sql`SELECT status, count(*)::int AS n FROM phase1_evaluations GROUP BY status`).catch(() => null),
    ]);

    const [brevoProbe, geminiProbe] = probe
      ? await Promise.all([
          has("BREVO_API_KEY") ? probeBrevo() : Promise.resolve<ProbeResult>({ ok: false, note: "not configured" }),
          has("GEMINI_API_KEY") ? probeGemini() : Promise.resolve<ProbeResult>({ ok: false, note: "not configured" }),
        ])
      : [null, null];

    const integrations = [
      { id: "cashfree_pg", name: "Payment Gateway (Cashfree)", configured: has("CASHFREE_APP_ID", "CASHFREE_SECRET_KEY"), lastActivityAt: payLast, probe: null, note: "activity = last successful payment" },
      { id: "gemini", name: "Gemini (AI evaluation)", configured: has("GEMINI_API_KEY"), lastActivityAt: geminiLast, probe: geminiProbe, note: "activity = last AI evaluation pass" },
      { id: "s3", name: "Cloud Storage (S3)", configured: has("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"), lastActivityAt: s3Last, probe: null, note: "activity = last video upload" },
      { id: "email_brevo", name: "Email (Brevo)", configured: has("BREVO_API_KEY"), lastActivityAt: emailLast, probe: brevoProbe, note: "activity = last sent email" },
      { id: "sms_msg91", name: "SMS (MSG91)", configured: has("MSG91_AUTH_KEY"), lastActivityAt: smsLast, probe: null, note: "activity = last sent SMS" },
      { id: "whatsapp", name: "WhatsApp (via MSG91)", configured: has("MSG91_AUTH_KEY"), lastActivityAt: waLast, probe: null, note: "activity = last sent WhatsApp" },
      { id: "aadhaar_verify", name: "Aadhaar Verification (Cashfree)", configured: has("CF_VERIFY_APP_ID", "CF_VERIFY_SECRET"), lastActivityAt: aadhaarLast, probe: null, note: "prod-only credentials; dev runs in stub mode" },
      { id: "pan_verify", name: "PAN Verification (Cashfree)", configured: has("CF_VERIFY_APP_ID", "CF_VERIFY_SECRET"), lastActivityAt: panLast, probe: null, note: "prod-only credentials; dev runs in stub mode" },
    ];

    const queues: Record<string, number> = {};
    if (queueRows) {
      const rows = (queueRows as unknown as { rows?: { status: string; n: number }[] }).rows ?? [];
      for (const r of rows) queues[r.status] = Number(r.n);
    }

    res.json({
      checkedAt: new Date().toISOString(),
      probed: probe,
      uptimeSec: Math.round(process.uptime()),
      integrations,
      jobs: getJobHeartbeats(),
      queues,
    });
  } catch (e) {
    logger.error({ err: e }, "admin health failed");
    res.status(500).json({ error: "Failed to load API health" });
  }
});

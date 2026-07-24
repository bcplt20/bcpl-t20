/**
 * Admin content tools — CSV data export, revenue forecast, content-calendar
 * planner, WhatsApp template registry, and the S3 media library.
 *
 * NOTE: deliberately a separate router file (mounted at /api/admin-tools) so
 * queued tasks editing routes/admin.ts don't conflict. Small helpers are
 * duplicated from marketing.ts for the same reason.
 */
import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  mediaFoldersTable,
  mediaFilesTable,
  plannedPostsTable,
  whatsappTemplatesTable,
  registrationsTable,
  usersTable,
  phase1PaymentsTable,
  phase2PaymentsTable,
  kycRecordsTable,
  phase1VideosTable,
  siteSettingsTable,
} from "@workspace/db/schema";
import { eq, desc, asc, sql, and, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middlewares/adminAuth";
import { getUploadPresignedUrl, getDownloadPresignedUrl, getS3Url, deleteObject } from "../lib/s3";
import { hasCashfreeCredentials, listOrderPayments, extractPaymentMethod } from "../lib/cashfree";
import { runVideoValidations } from "../lib/videoValidation";
import { runAiValidityChecks } from "../lib/aiPipeline";
import { runAiScoringPasses } from "../lib/aiScoring";
import { runResultReleases } from "../lib/resultRelease";
import { getPhase1Config, updatePhase1Config } from "../lib/phase1Config";

const router = Router();
router.use(requireAdmin);

// ── Phase 1 pipeline ops ─────────────────────────────────────────────────────
// Manual validation sweep (the scheduler also runs this every 2 minutes).
router.post("/phase1/run-validation", async (_req: Request, res: Response) => {
  const result = await runVideoValidations(25);
  res.json({ success: true, ...result });
});

// Manual AI validity sweep (pass zero — mock mode without GEMINI_API_KEY).
router.post("/phase1/run-ai", async (_req: Request, res: Response) => {
  const result = await runAiValidityChecks(25);
  res.json({ success: true, ...result });
});

// Manual AI scoring sweep (passes 1/2 + variance pass 3, §§24–30).
router.post("/phase1/run-scoring", async (_req: Request, res: Response) => {
  const result = await runAiScoringPasses(10);
  res.json({ success: true, ...result });
});

// Manual result-release sweep (§§32–35 — gated on resultReleaseEnabled).
router.post("/phase1/run-release", async (_req: Request, res: Response) => {
  const result = await runResultReleases(50);
  res.json({ success: true, ...result });
});

// Phase 1 pipeline config — read + patch (audited, cache-busting).
// §75 observability + §76 cost aggregates — feeds the admin monitoring view.
router.get("/phase1/stats", async (_req: Request, res: Response) => {
  try {
    const rows = (r: unknown): Array<Record<string, unknown>> =>
      Array.isArray(r) ? r : ((r as { rows?: Array<Record<string, unknown>> })?.rows ?? []);
    const [regTotal, byCity, byRole, byP1Status, vids, vidPending, evalByStatus, evalAgg, released, backlog, evalErrors, passes, notifs] = await Promise.all([
      db.execute(sql`SELECT count(*)::int AS n FROM registrations`),
      db.execute(sql`SELECT coalesce(trial_city,'unknown') AS k, count(*)::int AS n FROM registrations GROUP BY 1 ORDER BY 2 DESC`),
      db.execute(sql`SELECT CASE WHEN lower(coalesce(role,''))='bowl' OR lower(coalesce(role,'')) LIKE 'bowler%' THEN 'bowl'
                            WHEN lower(coalesce(role,''))='ar' OR lower(coalesce(role,'')) LIKE 'all%' THEN 'ar'
                            WHEN lower(coalesce(role,''))='wk' OR lower(coalesce(role,'')) LIKE 'wicket%' OR lower(coalesce(role,'')) LIKE 'keep%' THEN 'wk'
                            ELSE 'bat' END AS k, count(*)::int AS n FROM registrations GROUP BY 1`),
      db.execute(sql`SELECT coalesce(phase1_status,'none') AS k, count(*)::int AS n FROM registrations GROUP BY 1`),
      db.execute(sql`SELECT status AS k, count(*)::int AS n, coalesce(sum(size_bytes),0)::bigint AS bytes FROM phase1_videos GROUP BY 1`),
      db.execute(sql`SELECT count(*)::int AS n FROM registrations r WHERE r.phase1_status='payment_done'
                     AND NOT EXISTS (SELECT 1 FROM phase1_videos v WHERE v.registration_id=r.id AND v.status='submitted')`),
      db.execute(sql`SELECT status AS k, count(*)::int AS n FROM phase1_evaluations GROUP BY 1`),
      db.execute(sql`SELECT coalesce(avg(processing_ms),0)::int AS avg_ms, coalesce(avg(final_score),0)::float AS avg_score FROM phase1_evaluations WHERE final_score IS NOT NULL`),
      db.execute(sql`SELECT coalesce(result,'pending') AS k, count(*)::int AS n FROM phase1_evaluations WHERE status='result_released' GROUP BY 1`),
      db.execute(sql`SELECT count(*)::int AS n FROM phase1_evaluations WHERE status='scored' AND result_release_at <= now()`),
      db.execute(sql`SELECT count(*)::int AS n FROM phase1_evaluations WHERE error IS NOT NULL AND status NOT IN ('result_released','scored','skipped')`),
      db.execute(sql`SELECT count(*)::int AS total, count(DISTINCT evaluation_id)::int AS evals FROM ai_evaluation_passes`),
      db.execute(sql`SELECT status AS k, count(*)::int AS n FROM notification_logs
                     WHERE template IN ('phase1_result','phase1_congrats','video_reupload_required') GROUP BY 1`),
    ]);
    const kv = (r: unknown) => Object.fromEntries(rows(r).map((x) => [String(x.k), Number(x.n)]));
    const vidRows = rows(vids);
    const agg = rows(evalAgg)[0] ?? {};
    const passRow = rows(passes)[0] ?? {};
    const passEvals = Number(passRow.evals ?? 0);
    res.json({
      generatedAt: new Date().toISOString(),
      registrations: { total: Number(rows(regTotal)[0]?.n ?? 0), byCity: kv(byCity), byRole: kv(byRole), byPhase1Status: kv(byP1Status) },
      videos: {
        awaitingUpload: Number(rows(vidPending)[0]?.n ?? 0),
        byStatus: Object.fromEntries(vidRows.map((x) => [String(x.k), Number(x.n)])),
        storageBytes: vidRows.reduce((s, x) => s + Number(x.bytes ?? 0), 0),
      },
      evaluations: {
        byStatus: kv(evalByStatus),
        avgProcessingMs: Number(agg.avg_ms ?? 0),
        avgFinalScore: Math.round(Number(agg.avg_score ?? 0) * 10) / 10,
        released: kv(released),
        releaseBacklog: Number(rows(backlog)[0]?.n ?? 0),
        rowsWithErrors: Number(rows(evalErrors)[0]?.n ?? 0),
      },
      cost: {
        aiPassesTotal: Number(passRow.total ?? 0),
        avgPassesPerEvaluation: passEvals > 0 ? Math.round((Number(passRow.total ?? 0) / passEvals) * 10) / 10 : 0,
      },
      notifications: kv(notifs),
    });
  } catch (e) {
    res.status(500).json({ error: "stats_failed", detail: String(e).slice(0, 300) });
  }
});

router.get("/phase1/config", async (_req: Request, res: Response) => {
  const cfg = await getPhase1Config();
  res.json({ success: true, config: cfg });
});
router.patch("/phase1/config", async (req: Request, res: Response) => {
  try {
    const updated = await updatePhase1Config(req.body, "admin-tools", req.ip);
    res.json({ success: true, config: updated });
  } catch (e) {
    res.status(400).json({ error: "Invalid config patch: " + String(e).slice(0, 300) });
  }
});

/* Payment rows that count as money received (mirrors marketing.ts). */
const PAID_STATUSES = ["success", "paid"];

/** Postgres unique_violation (23505) — drizzle wraps the pg error in .cause. */
function isUniqueViolation(e: unknown): boolean {
  let cur = e as { code?: string; message?: string; cause?: unknown } | undefined;
  for (let depth = 0; cur && depth < 4; depth++) {
    if (cur.code === "23505") return true;
    if (String(cur.message ?? "").includes("duplicate key value")) return true;
    cur = cur.cause as typeof cur;
  }
  return false;
}

type H = (req: Request, res: Response) => Promise<void>;
const safe = (name: string, fn: H): H => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (isUniqueViolation(err)) {
      if (!res.headersSent) res.status(409).json({ error: "Already exists — use a different name" });
      return;
    }
    console.error(`[admin-tools/${name}]`, err);
    if (!res.headersSent) res.status(500).json({ error: (err as Error)?.message ?? "Internal error" });
  }
};

/* ────────────────────────────────────────────────────────────────────────────
 * Startup migration (idempotent — called from index.ts start loop)
 * ──────────────────────────────────────────────────────────────────────────── */

/** WhatsApp templates the server code actually sends (lib/whatsapp.ts WA.*). */
const CODE_TEMPLATES: Array<{
  name: string; category: string; body: string; varNames: string[]; sampleValues: string[];
}> = [
  {
    name: "bcpl_phase1_receipt",
    category: "Utility",
    body: "Hi {{1}}, your BCPL T20 Phase-1 registration is confirmed! Role: {{2}}, Trial City: {{3}}. Amount paid: Rs.{{4}}. Next step: upload your trial video at bcplt20.com - BCPL T20",
    varNames: ["name", "role", "trial_city", "amount"],
    sampleValues: ["Rahul Sharma", "Batsman", "Delhi", "599"],
  },
  {
    name: "bcpl_video_reminder",
    category: "Utility",
    body: "Hi {{1}}, only {{2}} days left to upload your BCPL T20 trial video! Login at bcplt20.com and upload now. - BCPL T20",
    varNames: ["name", "days_left"],
    sampleValues: ["Rahul Sharma", "5"],
  },
  {
    name: "bcpl_video_submitted",
    category: "Utility",
    body: "Hi {{1}}, your BCPL T20 trial video has been received! Our scouts will review it within 15 working days. - BCPL T20",
    varNames: ["name"],
    sampleValues: ["Rahul Sharma"],
  },
  {
    name: "bcpl_phase1_selected",
    category: "Utility",
    body: "Congratulations {{1}}! You have been SELECTED in the BCPL T20 Phase-1 trials. Login at bcplt20.com to complete your Phase-2 registration. - BCPL T20",
    varNames: ["name"],
    sampleValues: ["Rahul Sharma"],
  },
  {
    name: "bcpl_phase1_rejected",
    category: "Utility",
    body: "Hi {{1}}, thank you for participating in the BCPL T20 Phase-1 trials. Unfortunately you were not selected this time. Keep practicing! - BCPL T20",
    varNames: ["name"],
    sampleValues: ["Rahul Sharma"],
  },
  {
    name: "bcpl_phase2_receipt",
    category: "Utility",
    body: "Hi {{1}}, your BCPL T20 Phase-2 payment of Rs.{{2}} is confirmed! Complete your KYC at bcplt20.com to finish your registration. - BCPL T20",
    varNames: ["name", "amount"],
    sampleValues: ["Rahul Sharma", "2999"],
  },
  {
    name: "bcpl_kyc_complete",
    category: "Utility",
    body: "Hi {{1}}, your BCPL T20 KYC is complete! You are all set for the {{2}} trials. See you on the ground! - BCPL T20",
    varNames: ["name", "trial_city"],
    sampleValues: ["Rahul Sharma", "Delhi"],
  },
];
const CODE_TEMPLATE_NAMES = new Set(CODE_TEMPLATES.map(t => t.name));

export async function ensureAdminContentTables(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS media_folders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(150) NOT NULL,
    kind varchar(10) NOT NULL DEFAULT 'photo',
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  // Public-gallery opt-in flag — added after the table shipped, so ALTER for
  // existing deployments (idempotent).
  await db.execute(sql`ALTER TABLE media_folders ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS media_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id uuid NOT NULL REFERENCES media_folders(id),
    name varchar(300) NOT NULL,
    s3_key varchar(500) NOT NULL,
    s3_url varchar(1000) NOT NULL,
    content_type varchar(100) NOT NULL,
    size_bytes bigint NOT NULL DEFAULT 0,
    kind varchar(10) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS planned_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_date varchar(10) NOT NULL,
    post_time varchar(5),
    platform varchar(30) NOT NULL,
    post_type varchar(30) NOT NULL DEFAULT 'Post',
    caption text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL UNIQUE,
    category varchar(30) NOT NULL DEFAULT 'Utility',
    language varchar(40) NOT NULL DEFAULT 'English',
    body text NOT NULL,
    var_names json NOT NULL DEFAULT '[]',
    sample_values json NOT NULL DEFAULT '[]',
    status varchar(20) NOT NULL DEFAULT 'draft',
    used_in_code boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);

  // Seed the registry once with the templates the server code actually sends.
  const existing = await db.select({ id: whatsappTemplatesTable.id }).from(whatsappTemplatesTable).limit(1);
  if (existing.length === 0) {
    for (const t of CODE_TEMPLATES) {
      await db.insert(whatsappTemplatesTable).values({
        name: t.name,
        category: t.category,
        language: "English",
        body: t.body,
        varNames: t.varNames,
        sampleValues: t.sampleValues,
        status: "draft", // honest default — admin updates it after checking Interakt
        usedInCode: true,
      }).onConflictDoNothing();
    }
    console.log("[admin-tools] Seeded WhatsApp template registry with the 7 code templates");
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * CSV export
 * ──────────────────────────────────────────────────────────────────────────── */

const IST = "Asia/Kolkata";
const fmtDate = new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
});

function istDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(+dt) ? "" : fmtDate.format(dt);
}
function istDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(+dt) ? "" : fmtDateTime.format(dt).replace(",", "");
}

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  // Spreadsheet formula-injection guard: if the first non-space char could
  // start a formula in Excel/Sheets (= + - @ or tab/CR), prefix with '
  if (/^\s*[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.split('"').join('""')}"` : s;
}

function sendCsv(res: Response, filename: string, header: string[], rows: Array<Array<string | number | null | undefined>>): void {
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) lines.push(r.map(csvCell).join(","));
  const csv = "\uFEFF" + lines.join("\r\n") + "\r\n"; // BOM so Excel reads UTF-8
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

function dateRange(q: Record<string, string | undefined>) {
  const parse = (s: string | undefined, suffix: string) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const d = new Date(s + suffix);
    return isNaN(+d) ? null : d;
  };
  return {
    from: parse(q.from, "T00:00:00+05:30"),
    to: parse(q.to, "T23:59:59.999+05:30"),
  };
}
function inRange(d: Date | string | null | undefined, from: Date | null, to: Date | null): boolean {
  if (!from && !to) return true;
  if (!d) return false;
  const t = new Date(d).getTime();
  if (from && t < from.getTime()) return false;
  if (to && t > to.getTime()) return false;
  return true;
}

const ROLE_LABELS: Record<string, string> = { bat: "Batsman", bowl: "Bowler", wk: "Wicket Keeper", ar: "All Rounder" };

router.get("/export/:dataset", safe("export", async (req, res) => {
  const dataset = String(req.params.dataset);
  const q = req.query as Record<string, string | undefined>;
  const { from, to } = dateRange(q);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());

  if (dataset === "registrations") {
    const rows = await db
      .select({ reg: registrationsTable, user: usersTable })
      .from(registrationsTable)
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .orderBy(desc(registrationsTable.createdAt));
    let out = rows.filter(r => inRange(r.reg.createdAt, from, to));
    if (q.city) out = out.filter(r => (r.reg.trialCity ?? "").toLowerCase().includes(q.city!.toLowerCase()));
    if (q.status) out = out.filter(r => r.reg.phase1Status === q.status);
    if (q.role) out = out.filter(r => r.reg.role === q.role);
    sendCsv(res, `bcpl-registrations-${today}.csv`,
      ["Reg Number", "Name", "Phone", "Email", "Role", "Trial City", "Phase 1 Status", "Phase 2 Status", "Registered On"],
      out.map(r => [
        r.reg.regNumber ?? "", r.user?.name ?? "", r.user?.phone ?? "", r.user?.email ?? "",
        ROLE_LABELS[r.reg.role] ?? r.reg.role, r.reg.trialCity ?? "",
        r.reg.phase1Status, r.reg.phase2Status ?? "", istDateTime(r.reg.createdAt),
      ]));
    return;
  }

  if (dataset === "payments") {
    const [p1, p2, regs] = await Promise.all([
      db.select().from(phase1PaymentsTable),
      db.select().from(phase2PaymentsTable),
      db.select({ reg: registrationsTable, user: usersTable })
        .from(registrationsTable)
        .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id)),
    ]);
    const regMap = new Map(regs.map(r => [r.reg.id, r]));
    let all = [
      ...p1.map(p => ({ phase: "Phase 1", p })),
      ...p2.map(p => ({ phase: "Phase 2", p })),
    ];
    all = all.filter(x => inRange(x.p.createdAt, from, to));
    if (q.status === "paid") all = all.filter(x => PAID_STATUSES.includes(x.p.status));
    else if (q.status) all = all.filter(x => x.p.status === q.status);
    if (q.phase === "1" || q.phase === "2") all = all.filter(x => x.phase === `Phase ${q.phase}`);
    all.sort((a, b) => new Date(b.p.createdAt).getTime() - new Date(a.p.createdAt).getTime());
    sendCsv(res, `bcpl-payments-${today}.csv`,
      ["Date", "Player", "Phone", "Reg Number", "Phase", "Amount (Rs)", "Status", "Cashfree Order ID", "Cashfree Payment ID", "Paid At"],
      all.map(x => {
        const r = regMap.get(x.p.registrationId);
        return [
          istDateTime(x.p.createdAt), r?.user?.name ?? "", r?.user?.phone ?? "", r?.reg.regNumber ?? "",
          x.phase, x.p.amount, x.p.status, x.p.cashfreeOrderId ?? "", x.p.cashfreePaymentId ?? "",
          istDateTime(x.p.paidAt),
        ];
      }));
    return;
  }

  if (dataset === "kyc") {
    const [kyc, regs] = await Promise.all([
      db.select().from(kycRecordsTable).orderBy(desc(kycRecordsTable.createdAt)),
      db.select({ reg: registrationsTable, user: usersTable })
        .from(registrationsTable)
        .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id)),
    ]);
    const regMap = new Map(regs.map(r => [r.reg.id, r]));
    let out = kyc.filter(k => inRange(k.createdAt, from, to));
    if (q.status) out = out.filter(k => k.status === q.status);
    sendCsv(res, `bcpl-kyc-${today}.csv`,
      ["Player", "Phone", "Reg Number", "Profession", "Status", "PAN Verified", "Aadhaar Verified", "Submitted On", "Verified On"],
      out.map(k => {
        const r = regMap.get(k.registrationId);
        return [
          r?.user?.name ?? "", r?.user?.phone ?? "", r?.reg.regNumber ?? "", k.profession ?? "",
          k.status, k.panVerified ? "Yes" : "No", k.aadhaarVerified ? "Yes" : "No",
          istDateTime(k.createdAt), istDateTime(k.verifiedAt),
        ];
      }));
    return;
  }

  if (dataset === "videos") {
    const [videos, regs] = await Promise.all([
      db.select().from(phase1VideosTable).orderBy(desc(phase1VideosTable.submittedAt)),
      db.select({ reg: registrationsTable, user: usersTable })
        .from(registrationsTable)
        .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id)),
    ]);
    const regMap = new Map(regs.map(r => [r.reg.id, r]));
    let out = videos.filter(v => inRange(v.submittedAt, from, to));
    if (q.status) out = out.filter(v => v.status === q.status);
    // Trial videos live in a private bucket — the CSV must NOT carry a
    // permanent public s3Url. Emit a fresh short-lived presigned GET (2 h,
    // long enough for the admin to open the export and click through) so a
    // leaked spreadsheet can't grant permanent access to players' videos.
    const rows = await Promise.all(out.map(async v => {
      const r = regMap.get(v.registrationId);
      const url = v.s3Key ? await getDownloadPresignedUrl(v.s3Key, 7200) : "";
      return [
        r?.user?.name ?? "", r?.user?.phone ?? "", r?.reg.regNumber ?? "", r?.reg.trialCity ?? "",
        v.status, istDateTime(v.submittedAt), url,
      ];
    }));
    sendCsv(res, `bcpl-videos-${today}.csv`,
      ["Player", "Phone", "Reg Number", "Trial City", "Status", "Submitted On", "Video URL"],
      rows);
    return;
  }

  res.status(400).json({ error: "Unknown dataset. Use registrations | payments | kyc | videos" });
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Forecast — real actuals from the DB + admin-set goal/targets
 * ──────────────────────────────────────────────────────────────────────────── */

const FORECAST_KEY = "forecast_settings";
type ForecastSettings = { goal: number; seasonStart: string | null; targets: Record<string, number> };
const DEFAULT_FORECAST: ForecastSettings = { goal: 500, seasonStart: null, targets: {} };

async function readForecastSettings(): Promise<ForecastSettings> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, FORECAST_KEY)).limit(1);
  if (!row) return { ...DEFAULT_FORECAST };
  const v = row.value as Partial<ForecastSettings>;
  return {
    goal: typeof v.goal === "number" && v.goal > 0 ? v.goal : DEFAULT_FORECAST.goal,
    seasonStart: typeof v.seasonStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.seasonStart) ? v.seasonStart : null,
    targets: v.targets && typeof v.targets === "object" ? (v.targets as Record<string, number>) : {},
  };
}

router.get("/forecast", safe("forecast", async (_req, res) => {
  const exec = async (query: ReturnType<typeof sql>) => {
    const r = (await db.execute(query)) as unknown as { rows?: Array<Record<string, unknown>> };
    return (r.rows ?? (r as unknown as Array<Record<string, unknown>>)) as Array<Record<string, unknown>>;
  };

  const [regsByMonth, p1ByMonth, p2ByMonth, pace, settings] = await Promise.all([
    exec(sql`SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') AS month, count(*)::int AS regs
             FROM registrations GROUP BY 1 ORDER BY 1`),
    exec(sql`SELECT to_char(coalesce(paid_at, created_at) AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') AS month,
                    count(*)::int AS payments, coalesce(sum(amount), 0)::float AS revenue
             FROM phase1_payments WHERE status IN ('success','paid') GROUP BY 1`),
    exec(sql`SELECT to_char(coalesce(paid_at, created_at) AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') AS month,
                    count(*)::int AS payments, coalesce(sum(amount), 0)::float AS revenue
             FROM phase2_payments WHERE status IN ('success','paid') GROUP BY 1`),
    exec(sql`SELECT
               (SELECT count(*)::int FROM registrations WHERE created_at >= now() - interval '14 days') AS regs_14d,
               (SELECT count(*)::int FROM phase1_payments WHERE status IN ('success','paid')
                  AND coalesce(paid_at, created_at) >= now() - interval '14 days') AS paid_14d,
               (SELECT coalesce(sum(amount), 0)::float FROM phase1_payments WHERE status IN ('success','paid')
                  AND coalesce(paid_at, created_at) >= now() - interval '14 days')
             + (SELECT coalesce(sum(amount), 0)::float FROM phase2_payments WHERE status IN ('success','paid')
                  AND coalesce(paid_at, created_at) >= now() - interval '14 days') AS revenue_14d`),
    readForecastSettings(),
  ]);

  const months = new Map<string, { month: string; registrations: number; paidRegistrations: number; revenue: number }>();
  const monthOf = (m: unknown) => {
    const key = String(m ?? "");
    if (!months.has(key)) months.set(key, { month: key, registrations: 0, paidRegistrations: 0, revenue: 0 });
    return months.get(key)!;
  };
  for (const r of regsByMonth) monthOf(r.month).registrations = Number(r.regs) || 0;
  for (const r of p1ByMonth) {
    const m = monthOf(r.month);
    m.paidRegistrations = Number(r.payments) || 0;
    m.revenue += Number(r.revenue) || 0;
  }
  for (const r of p2ByMonth) monthOf(r.month).revenue += Number(r.revenue) || 0;
  for (const key of Object.keys(settings.targets)) monthOf(key); // show target-only months too

  const monthly = [...months.values()].filter(m => /^\d{4}-\d{2}$/.test(m.month)).sort((a, b) => a.month.localeCompare(b.month));
  const totals = monthly.reduce(
    (acc, m) => {
      acc.registrations += m.registrations;
      acc.paidRegistrations += m.paidRegistrations;
      acc.revenue += m.revenue;
      return acc;
    },
    { registrations: 0, paidRegistrations: 0, revenue: 0 },
  );

  const p = pace[0] ?? {};
  res.json({
    monthly,
    totals,
    pace14d: {
      registrations: Number(p.regs_14d) || 0,
      paidRegistrations: Number(p.paid_14d) || 0,
      revenue: Number(p.revenue_14d) || 0,
    },
    settings,
  });
}));

router.put("/forecast/settings", safe("forecast-settings", async (req, res) => {
  const schema = z.object({
    goal: z.number().int().min(1).max(1_000_000),
    seasonStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    targets: z.record(z.string().regex(/^\d{4}-\d{2}$/), z.number().int().min(0).max(1_000_000)).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const value: ForecastSettings = {
    goal: parsed.data.goal,
    seasonStart: parsed.data.seasonStart ?? null,
    targets: parsed.data.targets ?? {},
  };
  await db.insert(siteSettingsTable)
    .values({ key: FORECAST_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: new Date() } });
  res.json({ success: true, settings: value });
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Content-calendar planner (manual — nothing auto-posts)
 * ──────────────────────────────────────────────────────────────────────────── */

const postSchema = z.object({
  postDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  postTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  platform: z.string().min(1).max(30),
  postType: z.string().min(1).max(30).default("Post"),
  caption: z.string().min(1).max(5000),
  status: z.enum(["draft", "planned", "posted"]).default("draft"),
});

router.get("/planner/posts", safe("planner-list", async (_req, res) => {
  const posts = await db.select().from(plannedPostsTable)
    .orderBy(asc(plannedPostsTable.postDate), asc(plannedPostsTable.postTime));
  res.json({ posts });
}));

router.post("/planner/posts", safe("planner-create", async (req, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const [post] = await db.insert(plannedPostsTable).values({
    ...parsed.data,
    postTime: parsed.data.postTime ?? null,
  }).returning();
  res.json({ success: true, post });
}));

router.put("/planner/posts/:id", safe("planner-update", async (req, res) => {
  const id = String(req.params.id);
  const parsed = postSchema.partial().safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const [post] = await db.update(plannedPostsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(plannedPostsTable.id, id))
    .returning();
  if (!post) return void res.status(404).json({ error: "Post not found" });
  res.json({ success: true, post });
}));

router.delete("/planner/posts/:id", safe("planner-delete", async (req, res) => {
  const id = String(req.params.id);
  const deleted = await db.delete(plannedPostsTable).where(eq(plannedPostsTable.id, id)).returning();
  if (deleted.length === 0) return void res.status(404).json({ error: "Post not found" });
  res.json({ success: true });
}));

/* ────────────────────────────────────────────────────────────────────────────
 * WhatsApp template registry (manual tracking — NOT synced with Interakt)
 * ──────────────────────────────────────────────────────────────────────────── */

const templateSchema = z.object({
  name: z.string().regex(/^[a-z0-9_]{3,100}$/, "Name must be lowercase letters, digits and _ (like Interakt template names)"),
  category: z.string().min(1).max(30).default("Utility"),
  language: z.string().min(1).max(40).default("English"),
  body: z.string().min(1).max(5000),
  varNames: z.array(z.string().max(50)).max(10).default([]),
  sampleValues: z.array(z.string().max(200)).max(10).default([]),
  status: z.enum(["draft", "submitted", "approved", "rejected"]).default("draft"),
});

router.get("/wa-templates", safe("wa-list", async (_req, res) => {
  const templates = await db.select().from(whatsappTemplatesTable).orderBy(asc(whatsappTemplatesTable.createdAt));
  res.json({ templates });
}));

router.post("/wa-templates", safe("wa-create", async (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const [template] = await db.insert(whatsappTemplatesTable).values({
    ...parsed.data,
    usedInCode: CODE_TEMPLATE_NAMES.has(parsed.data.name),
  }).returning();
  res.json({ success: true, template });
}));

router.put("/wa-templates/:id", safe("wa-update", async (req, res) => {
  const id = String(req.params.id);
  const parsed = templateSchema.partial().safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const set: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.name) set.usedInCode = CODE_TEMPLATE_NAMES.has(parsed.data.name);
  const [template] = await db.update(whatsappTemplatesTable)
    .set(set)
    .where(eq(whatsappTemplatesTable.id, id))
    .returning();
  if (!template) return void res.status(404).json({ error: "Template not found" });
  res.json({ success: true, template });
}));

router.delete("/wa-templates/:id", safe("wa-delete", async (req, res) => {
  const id = String(req.params.id);
  const deleted = await db.delete(whatsappTemplatesTable).where(eq(whatsappTemplatesTable.id, id)).returning();
  if (deleted.length === 0) return void res.status(404).json({ error: "Template not found" });
  res.json({ success: true });
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Media library — real S3 (same bucket + presign flow as trial videos)
 * ──────────────────────────────────────────────────────────────────────────── */

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;   // 25 MB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;  // 500 MB

router.get("/media/folders", safe("media-folders", async (_req, res) => {
  const [folders, files] = await Promise.all([
    db.select().from(mediaFoldersTable).orderBy(asc(mediaFoldersTable.createdAt)),
    db.select({
      folderId: mediaFilesTable.folderId,
      count: sql<number>`count(*)::int`,
      bytes: sql<number>`coalesce(sum(${mediaFilesTable.sizeBytes}), 0)::float`,
    }).from(mediaFilesTable).groupBy(mediaFilesTable.folderId),
  ]);
  const statMap = new Map(files.map(f => [f.folderId, f]));
  res.json({
    folders: folders.map(f => ({
      ...f,
      fileCount: Number(statMap.get(f.id)?.count) || 0,
      totalBytes: Number(statMap.get(f.id)?.bytes) || 0,
    })),
  });
}));

router.post("/media/folders", safe("media-folder-create", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(150),
    kind: z.enum(["photo", "video", "mixed"]).default("photo"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const [folder] = await db.insert(mediaFoldersTable).values(parsed.data).returning();
  res.json({ success: true, folder: { ...folder, fileCount: 0, totalBytes: 0 } });
}));

// Toggle whether a folder appears on the public website Gallery. Files remain
// in the private S3 prefix — only presigned GET links are ever exposed.
router.patch("/media/folders/:id", safe("media-folder-update", async (req, res) => {
  const id = String(req.params.id);
  const schema = z.object({ isPublic: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const [updated] = await db.update(mediaFoldersTable)
    .set({ isPublic: parsed.data.isPublic })
    .where(eq(mediaFoldersTable.id, id))
    .returning();
  if (!updated) return void res.status(404).json({ error: "Folder not found" });
  res.json({ success: true, folder: updated });
}));

router.delete("/media/folders/:id", safe("media-folder-delete", async (req, res) => {
  const id = String(req.params.id);
  const files = await db.select().from(mediaFilesTable).where(eq(mediaFilesTable.folderId, id));
  const results = await Promise.allSettled(files.map(f => deleteObject(f.s3Key)));
  const failedKeys: string[] = [];
  for (const [i, r] of results.entries()) {
    if (r.status === "rejected") {
      failedKeys.push(files[i].s3Key);
      console.error(`[admin-tools] S3 delete failed for ${files[i].s3Key}:`, r.reason);
    } else {
      // Remove rows only for objects actually gone from S3
      await db.delete(mediaFilesTable).where(eq(mediaFilesTable.id, files[i].id));
    }
  }
  if (failedKeys.length > 0) {
    return void res.status(502).json({ error: "Could not delete " + failedKeys.length + " file(s) from storage - please try again" });
  }
  await db.delete(mediaFilesTable).where(eq(mediaFilesTable.folderId, id));
  const deleted = await db.delete(mediaFoldersTable).where(eq(mediaFoldersTable.id, id)).returning();
  if (deleted.length === 0) return void res.status(404).json({ error: "Folder not found" });
  res.json({ success: true, deletedFiles: files.length });
}));

router.get("/media/folders/:id/files", safe("media-files", async (req, res) => {
  const id = String(req.params.id);
  const files = await db.select().from(mediaFilesTable)
    .where(eq(mediaFilesTable.folderId, id))
    .orderBy(desc(mediaFilesTable.createdAt));
  const withUrls = await Promise.all(files.map(async f => ({
    ...f,
    viewUrl: await getDownloadPresignedUrl(f.s3Key),
  })));
  res.json({ files: withUrls });
}));

router.post("/media/upload-url", safe("media-upload-url", async (req, res) => {
  const schema = z.object({
    folderId: z.string().uuid(),
    fileName: z.string().min(1).max(300),
    contentType: z.enum([...IMAGE_TYPES, ...VIDEO_TYPES]),
    sizeBytes: z.number().int().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const { folderId, fileName, contentType, sizeBytes } = parsed.data;

  const isImage = (IMAGE_TYPES as readonly string[]).includes(contentType);
  const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (sizeBytes > limit) {
    return void res.status(400).json({ error: `File too large — max ${isImage ? "25 MB for photos" : "500 MB for videos"}` });
  }

  const [folder] = await db.select().from(mediaFoldersTable).where(eq(mediaFoldersTable.id, folderId)).limit(1);
  if (!folder) return void res.status(404).json({ error: "Folder not found" });

  if (!process.env.AWS_ACCESS_KEY_ID) {
    return void res.status(503).json({ error: "S3 storage is not configured on this server (AWS keys missing)" });
  }

  const slug = fileName.toLowerCase().split("").map(c => (/[a-z0-9._-]/.test(c) ? c : "-")).join("").slice(0, 120);
  const s3Key = `media/${folderId}/${Date.now()}-${slug}`;
  const presignedUrl = await getUploadPresignedUrl(s3Key, contentType);
  res.json({ success: true, presignedUrl, s3Key });
}));

router.post("/media/confirm", safe("media-confirm", async (req, res) => {
  const schema = z.object({
    folderId: z.string().uuid(),
    s3Key: z.string().min(7).max(500).refine(k => k.startsWith("media/"), "Invalid key"),
    name: z.string().min(1).max(300),
    contentType: z.enum([...IMAGE_TYPES, ...VIDEO_TYPES]),
    sizeBytes: z.number().int().min(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });
  const { folderId, s3Key, name, contentType, sizeBytes } = parsed.data;

  const [folder] = await db.select().from(mediaFoldersTable).where(eq(mediaFoldersTable.id, folderId)).limit(1);
  if (!folder) return void res.status(404).json({ error: "Folder not found" });

  // The key must be one we issued for THIS folder (upload-url generates
  // media/<folderId>/<ts>-<slug>) - blocks cross-folder key injection.
  if (!s3Key.startsWith("media/" + folderId + "/")) {
    return void res.status(400).json({ error: "Key does not belong to this folder" });
  }
  const [dup] = await db.select({ id: mediaFilesTable.id }).from(mediaFilesTable).where(eq(mediaFilesTable.s3Key, s3Key)).limit(1);
  if (dup) return void res.status(409).json({ error: "This upload was already confirmed" });

  const [file] = await db.insert(mediaFilesTable).values({
    folderId, name, s3Key,
    s3Url: getS3Url(s3Key),
    contentType, sizeBytes,
    kind: contentType.startsWith("image/") ? "photo" : "video",
  }).returning();
  res.json({ success: true, file: { ...file, viewUrl: await getDownloadPresignedUrl(file.s3Key) } });
}));

router.delete("/media/files/:id", safe("media-file-delete", async (req, res) => {
  const id = String(req.params.id);
  const [file] = await db.select().from(mediaFilesTable).where(eq(mediaFilesTable.id, id)).limit(1);
  if (!file) return void res.status(404).json({ error: "File not found" });
  try {
    await deleteObject(file.s3Key);
  } catch (err) {
    console.error(`[admin-tools] S3 delete failed for ${file.s3Key}:`, err);
    // Keep the DB row so the file stays visible and the admin can retry -
    // otherwise the S3 object would be orphaned invisibly.
    return void res.status(502).json({ error: "Could not delete the file from storage - please try again" });
  }
  await db.delete(mediaFilesTable).where(eq(mediaFilesTable.id, id));
  res.json({ success: true });
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Finance — payment-method split + payments on hold + Cashfree backfill
 * ──────────────────────────────────────────────────────────────────────────── */

/** Coarse group labels for the pie/legend; unknown/null buckets to "unknown". */
const GROUP_ORDER = ["upi", "credit_card", "debit_card", "net_banking", "wallet", "other", "unknown"] as const;

type SplitRow = { group: string; amount: number; count: number };

/** Aggregate one phase's success payments by payment_group (null => "unknown"). */
async function splitForPhase(table: typeof phase1PaymentsTable | typeof phase2PaymentsTable) {
  const rows = await db
    .select({
      group: sql<string | null>`${table.paymentGroup}`,
      amount: sql<number>`coalesce(sum(${table.amount}), 0)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(table)
    .where(sql`${table.status} IN ('success','paid')`)
    .groupBy(table.paymentGroup);

  let total = 0;
  const byGroup = new Map<string, SplitRow>();
  for (const r of rows) {
    const key = r.group && String(r.group).trim() ? String(r.group).trim() : "unknown";
    const amount = Number(r.amount) || 0;
    const count = Number(r.count) || 0;
    total += amount;
    const cur = byGroup.get(key);
    if (cur) { cur.amount += amount; cur.count += count; }
    else byGroup.set(key, { group: key, amount, count });
  }
  const splitByGroup = [...byGroup.values()].sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a.group as typeof GROUP_ORDER[number]);
    const ib = GROUP_ORDER.indexOf(b.group as typeof GROUP_ORDER[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return { totalCollected: Math.round(total), splitByGroup };
}

/** Merge two split arrays into one combined view. */
function mergeSplits(...splits: SplitRow[][]): SplitRow[] {
  const byGroup = new Map<string, SplitRow>();
  for (const arr of splits) {
    for (const r of arr) {
      const cur = byGroup.get(r.group);
      if (cur) { cur.amount += r.amount; cur.count += r.count; }
      else byGroup.set(r.group, { ...r });
    }
  }
  return [...byGroup.values()].sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a.group as typeof GROUP_ORDER[number]);
    const ib = GROUP_ORDER.indexOf(b.group as typeof GROUP_ORDER[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

/** Flagged (amount_mismatch) payments for one phase, joined to the player. */
async function onHoldForPhase(
  table: typeof phase1PaymentsTable | typeof phase2PaymentsTable,
  phaseLabel: "Phase 1" | "Phase 2",
) {
  const rows = await db
    .select({
      name: usersTable.name,
      regNumber: registrationsTable.regNumber,
      amount: table.amount,
      orderId: table.cashfreeOrderId,
      flaggedAt: table.createdAt,
    })
    .from(table)
    .leftJoin(registrationsTable, eq(table.registrationId, registrationsTable.id))
    .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
    .where(eq(table.status, "amount_mismatch"))
    .orderBy(desc(table.createdAt));
  return rows.map(r => ({
    phase: phaseLabel,
    name: r.name ?? null,
    regNumber: r.regNumber ?? null,
    amount: Math.round(Number(r.amount) || 0),
    orderId: r.orderId,
    flaggedAt: r.flaggedAt,
  }));
}

/**
 * GET /api/admin/finance/summary
 * Per-phase and combined: totalCollected, splitByGroup, on-hold list + total.
 */
const financeSummaryHandler: H = safe("finance-summary", async (_req, res) => {
  const [p1Split, p2Split, p1Hold, p2Hold] = await Promise.all([
    splitForPhase(phase1PaymentsTable),
    splitForPhase(phase2PaymentsTable),
    onHoldForPhase(phase1PaymentsTable, "Phase 1"),
    onHoldForPhase(phase2PaymentsTable, "Phase 2"),
  ]);

  const onHold = [...p1Hold, ...p2Hold].sort(
    (a, b) => new Date(b.flaggedAt as unknown as string).getTime() - new Date(a.flaggedAt as unknown as string).getTime(),
  );
  const onHoldTotal = onHold.reduce((a, r) => a + r.amount, 0);

  res.json({
    phase1: p1Split,
    phase2: p2Split,
    combined: {
      totalCollected: p1Split.totalCollected + p2Split.totalCollected,
      splitByGroup: mergeSplits(p1Split.splitByGroup, p2Split.splitByGroup),
    },
    onHold,
    onHoldTotal,
  });
});

/**
 * POST /api/admin-tools/payments/backfill-methods
 * For success payments (both phases) with a null payment_group and a Cashfree
 * order id, fetch the order's payments from Cashfree, take the successful
 * entity and write its group/detail. Sequential (~150ms delay), cap 500 rows.
 * In dev/stub mode (no real creds) returns { stubMode: true } without calling out.
 */
router.post("/payments/backfill-methods", safe("backfill-methods", async (_req, res) => {
  if (!hasCashfreeCredentials()) {
    return void res.json({ stubMode: true, scanned: 0, updated: 0, skipped: 0, errors: 0 });
  }

  const CAP = 500;
  const candidates: Array<{ table: typeof phase1PaymentsTable | typeof phase2PaymentsTable; id: string; orderId: string }> = [];

  for (const table of [phase1PaymentsTable, phase2PaymentsTable] as const) {
    const rows = await db
      .select({ id: table.id, orderId: table.cashfreeOrderId })
      .from(table)
      .where(and(
        sql`${table.status} IN ('success','paid')`,
        isNull(table.paymentGroup),
        isNotNull(table.cashfreeOrderId),
      ))
      .limit(CAP);
    for (const r of rows) candidates.push({ table, id: r.id, orderId: r.orderId });
  }

  const batch = candidates.slice(0, CAP);
  let updated = 0, skipped = 0, errors = 0;

  for (const c of batch) {
    try {
      const payments = await listOrderPayments(c.orderId);
      if (!payments || payments.length === 0) { skipped++; continue; }
      const success = payments.find(p => p.payment_status === "SUCCESS") ?? payments[0];
      const split = extractPaymentMethod(success);
      if (!split.paymentGroup) { skipped++; continue; }
      await db.update(c.table)
        .set({ paymentGroup: split.paymentGroup, paymentMethodDetail: split.paymentMethodDetail })
        .where(eq(c.table.id, c.id));
      updated++;
    } catch (e) {
      console.error("[admin-tools/backfill-methods] row error", c.orderId, e);
      errors++;
    }
    await new Promise(r => setTimeout(r, 150));
  }

  res.json({ scanned: batch.length, updated, skipped, errors });
}));

export default router;
export { financeSummaryHandler };

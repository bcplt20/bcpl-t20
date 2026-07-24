/**
 * QR Trial Ops — staff mobile app API (mounted at /api/staff).
 *
 * Field-staff endpoints for trial day, per the owner's "QR TRIAL OPERATIONS"
 * master spec:
 *   - gate scan        → GREEN / YELLOW / RED status only (no PII)
 *   - check-in         → identity verification + wristband hand-off
 *   - blind evaluator  → trial number + role + attempts ONLY (spec §10)
 *   - attempt control  → exactly 6 valid balls, feeder-error re-bowls logged
 *   - 100-pt scoring   → versioned rubric, server-side computation
 *   - submission lock  → append-only trial_evaluations; corrections go
 *                        through the supervisor workflow, originals kept
 *
 * Staff authenticate exactly like admins (admin_users + session JWT) with
 * the new field roles; every endpoint is role-gated and city-scoped via
 * fieldCityScope (empty city list on a field account = NO access).
 *
 * NOTE: /checkin intentionally re-implements the admin check-in flow with
 * stricter role gates + audit; consolidate with routes/trials.ts when the
 * legacy admin flow is retired.
 */
import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import {
  registrationsTable, usersTable, trialSlotsTable, trialAllocationsTable,
  trialCheckinsTable, physicalAssessmentsTable, siteSettingsTable,
  trialAttemptsTable, trialEvaluationsTable, trialCorrectionRequestsTable,
} from "@workspace/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { requireAdmin, requireRole, fieldCityScope, type AdminRoleName } from "../middlewares/adminAuth";
import { writeAudit } from "../lib/audit";
import { normalizeRole } from "./trials";
import { logger } from "../lib/logger";

/* ─── startup migration (tx + advisory lock: PM2×2 / parallel vitest safe) ── */

export async function ensureTrialOpsTables(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(74112031)`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS trial_attempts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      allocation_id uuid NOT NULL,
      registration_id uuid NOT NULL,
      discipline varchar(20) NOT NULL,
      seq integer NOT NULL,
      outcome varchar(30) NOT NULL,
      is_valid boolean NOT NULL DEFAULT true,
      recorded_by varchar(160) NOT NULL,
      station varchar(40),
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS trial_attempts_valid_seq_uidx
      ON trial_attempts (allocation_id, discipline, seq) WHERE is_valid`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS trial_attempts_alloc_idx
      ON trial_attempts (allocation_id, discipline)`);

    await tx.execute(sql`CREATE TABLE IF NOT EXISTS trial_evaluations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id uuid NOT NULL,
      allocation_id uuid,
      eval_round integer NOT NULL DEFAULT 1,
      evaluator_email varchar(160) NOT NULL,
      evaluator_name varchar(120),
      player_role varchar(30) NOT NULL,
      rubric_version varchar(40) NOT NULL,
      sections jsonb NOT NULL,
      attempt_summary jsonb,
      total_score numeric(6,2) NOT NULL,
      notes text,
      status varchar(30) NOT NULL DEFAULT 'submitted',
      locked_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS trial_eval_active_reg_uidx
      ON trial_evaluations (registration_id, eval_round) WHERE status = 'submitted'`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS trial_eval_reg_idx
      ON trial_evaluations (registration_id)`);

    await tx.execute(sql`CREATE TABLE IF NOT EXISTS trial_correction_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      evaluation_id uuid NOT NULL,
      registration_id uuid NOT NULL,
      requested_by varchar(160) NOT NULL,
      reason text NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending',
      decided_by varchar(160),
      decision_note text,
      decided_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS trial_correction_status_idx
      ON trial_correction_requests (status)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS trial_correction_eval_idx
      ON trial_correction_requests (evaluation_id)`);
  });
}

/* ─── rubric model (initial structure per owner spec §18–21; versioned) ── */

export const RUBRIC_VERSION = "v1-2026-07";

/** Points per attempt outcome. Batting outcomes are BCPL-defined contact
 *  quality; bowling outcomes are the spec's TARGET HIT / NEAR TARGET / MISS. */
export const OUTCOME_POINTS: Record<string, Record<string, number>> = {
  batting: { MIDDLED: 3, GOOD_CONTACT: 2, PARTIAL: 1, MISS: 0 },
  bowling: { TARGET_HIT: 3, NEAR_TARGET: 1.5, MISS: 0 },
};

export interface RubricDim { key: string; label: string; weight: number; hint?: string }
export interface ObjectiveBlock { discipline: "batting" | "bowling"; weight: number }
export interface RoleRubric { objective: ObjectiveBlock[]; technical: RubricDim[] }

/** Generic 0–10 anchor labels shown under every technical dial (spec §18:
 *  "Create scoring anchors. Do not just show blank arbitrary boxes.") */
export const SCORE_ANCHORS = [
  { min: 0, max: 2, label: "Below basic — repeated fundamental errors" },
  { min: 3, max: 4, label: "Developing — inconsistent fundamentals" },
  { min: 5, max: 6, label: "Competent — solid club standard" },
  { min: 7, max: 8, label: "Strong — consistent, competitive standard" },
  { min: 9, max: 10, label: "Exceptional — clearly above the field" },
];

export const DEFAULT_RUBRICS: Record<string, RoleRubric> = {
  batsman: {
    objective: [{ discipline: "batting", weight: 40 }],
    technical: [
      { key: "balance",        label: "Balance",         weight: 11 },
      { key: "footwork",       label: "Footwork",        weight: 11 },
      { key: "timing",         label: "Timing",          weight: 11 },
      { key: "shot_execution", label: "Shot Execution",  weight: 11 },
      { key: "shot_selection", label: "Shot Selection",  weight: 11 },
      { key: "fielding",       label: "Fielding Drill",  weight: 5 },
    ],
  },
  bowler: {
    objective: [{ discipline: "bowling", weight: 45 }],
    technical: [
      { key: "action_rhythm", label: "Action & Rhythm",      weight: 12.5 },
      { key: "line_length",   label: "Line/Length Quality",  weight: 12.5 },
      { key: "control",       label: "Control",              weight: 12.5 },
      { key: "variation",     label: "Variation & Effect",   weight: 12.5 },
      { key: "fielding",      label: "Fielding Drill",       weight: 5 },
    ],
  },
  all_rounder: {
    objective: [
      { discipline: "batting", weight: 20 },
      { discipline: "bowling", weight: 20 },
    ],
    technical: [
      { key: "batting_technique", label: "Batting Technique",       weight: 20 },
      { key: "bowling_technique", label: "Bowling Technique",       weight: 20 },
      { key: "fielding",          label: "Fielding Drill",          weight: 10 },
      { key: "consistency",       label: "Consistency / Readiness", weight: 10 },
    ],
  },
  wicket_keeper: {
    objective: [{ discipline: "batting", weight: 10 }],
    technical: [
      { key: "collection",  label: "Clean Collection",   weight: 20 },
      { key: "footwork_wk", label: "Lateral Footwork",   weight: 15 },
      { key: "catching",    label: "Catching",           weight: 15 },
      { key: "stumping",    label: "Stumping",           weight: 15 },
      { key: "throwing",    label: "Throwing",           weight: 10 },
      { key: "positioning", label: "Positioning",        weight: 10 },
      { key: "athleticism", label: "Athleticism",        weight: 5 },
    ],
  },
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

function rubricWeightTotal(r: RoleRubric): number {
  return round2(r.objective.reduce((a, o) => a + o.weight, 0) +
    r.technical.reduce((a, d) => a + d.weight, 0));
}

function isValidRubric(r: unknown): r is RoleRubric {
  if (!r || typeof r !== "object") return false;
  const rr = r as RoleRubric;
  if (!Array.isArray(rr.objective) || !Array.isArray(rr.technical)) return false;
  if (!rr.objective.every((o) => (o.discipline === "batting" || o.discipline === "bowling") && Number.isFinite(o.weight) && o.weight >= 0)) return false;
  if (!rr.technical.every((d) => typeof d.key === "string" && d.key && Number.isFinite(d.weight) && d.weight >= 0)) return false;
  return rubricWeightTotal(rr) === 100;
}

/** Active rubrics = defaults, per-role overridden by the (validated)
 *  trial_rubrics_v1 settings key. Invalid overrides are ignored loudly. */
export async function activeRubrics(): Promise<{ version: string; roles: Record<string, RoleRubric> }> {
  const roles: Record<string, RoleRubric> = { ...DEFAULT_RUBRICS };
  let version = RUBRIC_VERSION;
  try {
    const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "trial_rubrics_v1")).limit(1);
    const v = row?.value as { version?: unknown; roles?: Record<string, unknown> } | undefined;
    if (v && typeof v === "object") {
      if (typeof v.version === "string" && v.version.trim()) version = v.version.trim().slice(0, 40);
      for (const [role, rub] of Object.entries(v.roles ?? {})) {
        if (role in DEFAULT_RUBRICS && isValidRubric(rub)) roles[role] = rub;
        else if (role in DEFAULT_RUBRICS) logger.warn({ role }, "trial_rubrics_v1 override invalid — using default");
      }
    }
  } catch (e) {
    logger.error({ err: e }, "trial rubric settings read failed — using defaults");
  }
  return { version, roles };
}

/* ─── scoring computation (pure, exported for unit tests) ───────────── */

export function requiredDisciplines(role: string): ("batting" | "bowling")[] {
  if (role === "bowler") return ["bowling"];
  if (role === "all_rounder") return ["batting", "bowling"];
  return ["batting"]; // batsman, wicket_keeper
}

export function computeObjectivePoints(outcomes: string[], discipline: "batting" | "bowling", weight: number): number {
  const map = OUTCOME_POINTS[discipline]!;
  const maxPer = Math.max(...Object.values(map));
  const denom = 6 * maxPer;
  const sum = outcomes.slice(0, 6).reduce((a, o) => a + (map[o] ?? 0), 0);
  return round2((Math.min(sum, denom) / denom) * weight);
}

export interface EvalComputation {
  total: number;
  sections: {
    objective: Record<string, { outcomes: string[]; points: number; weight: number }>;
    technical: Record<string, { raw: number; points: number; weight: number }>;
    total: number;
    rubricVersion: string;
  };
}

/** Throws Error with a user-readable message on invalid input. */
export function computeEvalTotal(
  role: string,
  attempts: { batting: string[]; bowling: string[] },
  technical: Record<string, number>,
  rubric: RoleRubric,
  rubricVersion: string,
): EvalComputation {
  const objective: EvalComputation["sections"]["objective"] = {};
  for (const block of rubric.objective) {
    const outs = attempts[block.discipline] ?? [];
    if (outs.length !== 6) throw new Error(`${block.discipline} attempts incomplete (${outs.length}/6)`);
    objective[block.discipline] = {
      outcomes: outs, weight: block.weight,
      points: computeObjectivePoints(outs, block.discipline, block.weight),
    };
  }
  const tech: EvalComputation["sections"]["technical"] = {};
  for (const dim of rubric.technical) {
    const raw = technical[dim.key];
    if (raw === undefined || raw === null || !Number.isFinite(Number(raw))) {
      throw new Error(`Missing technical score: ${dim.label}`);
    }
    const val = Math.round(Number(raw) * 10) / 10;
    if (val < 0 || val > 10) throw new Error(`${dim.label} must be 0–10`);
    tech[dim.key] = { raw: val, weight: dim.weight, points: round2((val / 10) * dim.weight) };
  }
  const extraKeys = Object.keys(technical).filter((k) => !rubric.technical.some((d) => d.key === k));
  if (extraKeys.length > 0) throw new Error(`Unknown technical dimension: ${extraKeys[0]}`);
  const total = round2(
    Object.values(objective).reduce((a, o) => a + o.points, 0) +
    Object.values(tech).reduce((a, t) => a + t.points, 0),
  );
  return { total, sections: { objective, technical: tech, total, rubricVersion } };
}

/* ─── IST date/time helpers (grounds run on Indian time) ────────────── */

const IST_TZ = "Asia/Kolkata";

export function istDateOf(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: IST_TZ }); // YYYY-MM-DD
}

export function parseSlotDateIst(s: string | null | undefined): string | null {
  if (!s || !String(s).trim()) return null;
  const d = new Date(String(s));
  if (Number.isNaN(d.getTime())) return null;
  return istDateOf(d);
}

export function parseTimeMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const s = String(t).trim();
  let m = /(\d{1,2})[:.](\d{2})\s*(am|pm)?/i.exec(s);
  let hh: number, mm: number, ap: string | undefined;
  if (m) { hh = Number(m[1]); mm = Number(m[2]); ap = m[3]?.toLowerCase(); }
  else {
    m = /^(\d{1,2})\s*(am|pm)$/i.exec(s);
    if (!m) return null;
    hh = Number(m[1]); mm = 0; ap = m[2]!.toLowerCase();
  }
  if (ap === "pm" && hh < 12) hh += 12;
  if (ap === "am" && hh === 12) hh = 0;
  if (hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

function istNowMinutes(): number {
  const parts = new Date().toLocaleTimeString("en-GB", { timeZone: IST_TZ, hour12: false });
  const [h, mn] = parts.split(":");
  return Number(h) * 60 + Number(mn);
}

/* ─── shared resolution helpers ─────────────────────────────────────── */

type Alloc = typeof trialAllocationsTable.$inferSelect;
type Reg = typeof registrationsTable.$inferSelect;

async function findAllocation(b: Record<string, unknown>): Promise<{ alloc?: Alloc; reg?: Reg }> {
  const rawToken = String(b["token"] ?? "").trim().replace(/^BCPL-TRIAL:/i, "");
  const regNumber = String(b["regNumber"] ?? "").trim();
  let alloc: Alloc | undefined;
  let reg: Reg | undefined;
  if (rawToken) {
    [alloc] = await db.select().from(trialAllocationsTable)
      .where(eq(trialAllocationsTable.passToken, rawToken)).limit(1);
    if (alloc) [reg] = await db.select().from(registrationsTable).where(eq(registrationsTable.id, alloc.registrationId)).limit(1);
  } else if (regNumber) {
    [reg] = await db.select().from(registrationsTable)
      .where(sql`lower(${registrationsTable.regNumber}) = ${regNumber.toLowerCase()}`).limit(1);
    if (reg) {
      [alloc] = await db.select().from(trialAllocationsTable)
        .where(and(eq(trialAllocationsTable.registrationId, reg.id), eq(trialAllocationsTable.status, "allocated"))).limit(1);
    }
  }
  return { alloc, reg };
}

async function attemptState(allocationId: string): Promise<{
  batting: { valid: { seq: number; outcome: string }[]; feederErrors: number };
  bowling: { valid: { seq: number; outcome: string }[]; feederErrors: number };
}> {
  const rows = await db.select().from(trialAttemptsTable)
    .where(eq(trialAttemptsTable.allocationId, allocationId))
    .orderBy(trialAttemptsTable.seq, trialAttemptsTable.createdAt);
  const state = {
    batting: { valid: [] as { seq: number; outcome: string }[], feederErrors: 0 },
    bowling: { valid: [] as { seq: number; outcome: string }[], feederErrors: 0 },
  };
  for (const r of rows) {
    const d = r.discipline === "bowling" ? state.bowling : state.batting;
    if (r.isValid) d.valid.push({ seq: r.seq, outcome: r.outcome });
    else d.feederErrors++;
  }
  return state;
}

async function activeEvaluation(registrationId: string): Promise<typeof trialEvaluationsTable.$inferSelect | undefined> {
  const [row] = await db.select().from(trialEvaluationsTable)
    .where(and(eq(trialEvaluationsTable.registrationId, registrationId), eq(trialEvaluationsTable.status, "submitted")))
    .orderBy(desc(trialEvaluationsTable.createdAt)).limit(1);
  return row;
}

/** null = ok; string = blocking error message (403 city scope). */
function scopeBlock(req: Request, city: string | null | undefined): string | null {
  const scope = fieldCityScope(req);
  if (scope === null) return null;
  if (scope.length === 0) return "No city assigned to your staff account — ask the admin to set your city.";
  if (!scope.includes(String(city ?? "").trim().toLowerCase())) return "Outside your assigned city.";
  return null;
}

/* ─── router ────────────────────────────────────────────────────────── */

const GATE_ROLES: AdminRoleName[] = ["GATE_SECURITY", "CHECKIN_STAFF", "STATION_OPERATOR", "TRIAL_EVALUATOR", "VENUE_SUPERVISOR", "HEAD_ASSESSOR", "TRIAL_CITY_MANAGER"];
const CHECKIN_ROLES: AdminRoleName[] = ["CHECKIN_STAFF", "VENUE_SUPERVISOR", "HEAD_ASSESSOR", "TRIAL_CITY_MANAGER"];
const ATTEMPT_ROLES: AdminRoleName[] = ["STATION_OPERATOR", "TRIAL_EVALUATOR", "HEAD_ASSESSOR"];
const SUBMIT_ROLES: AdminRoleName[] = ["TRIAL_EVALUATOR", "HEAD_ASSESSOR"];
const SUPERVISE_ROLES: AdminRoleName[] = ["VENUE_SUPERVISOR", "HEAD_ASSESSOR", "TRIAL_CITY_MANAGER"];

export const staffRouter = Router();
staffRouter.use(requireAdmin);

/* GET /me — staff app shell: who am I, which tools do I get */
staffRouter.get("/me", (req, res) => {
  const a = req.admin!;
  res.json({ email: a.email, name: a.name, role: a.role, cities: a.cities });
});

/* GET /eval/rubrics — active scoring structure (staff app scoring UI) */
staffRouter.get("/eval/rubrics", requireRole(...GATE_ROLES), async (_req, res) => {
  try {
    const { version, roles } = await activeRubrics();
    res.json({ version, roles, outcomes: OUTCOME_POINTS, anchors: SCORE_ANCHORS });
  } catch (e) {
    logger.error({ err: e }, "staff/rubrics failed");
    res.status(500).json({ error: "Failed to load rubrics" });
  }
});

/* POST /scan/gate {token|regNumber} — status-only gate decision (spec §4) */
staffRouter.post("/scan/gate", requireRole(...GATE_ROLES), async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const { alloc, reg } = await findAllocation(b);
    const audit = (code: string, key: string | null): Promise<void> =>
      writeAudit(req, { action: "trial.gate_scan", entity: "trial_allocations", entityKey: key, newValue: { code } });

    const red = async (code: string, label: string, sub: string): Promise<void> => {
      await audit(code, alloc?.id ?? null);
      res.json({ status: "RED", code, label, sub });
    };
    if (!alloc || !reg) { await red("PASS_INVALID", "NOT ELIGIBLE / PASS INVALID", "Pass not recognised — send to help desk."); return; }
    if (alloc.status === "cancelled") { await red("PASS_INVALID", "PASS CANCELLED", "This pass was cancelled — send to help desk."); return; }

    const block = scopeBlock(req, alloc.city);
    if (block === "Outside your assigned city.") { await red("WRONG_VENUE", "WRONG VENUE", `This pass belongs to ${alloc.city}.`); return; }
    if (block) { res.status(403).json({ error: block }); return; }

    if (!["kyc_done", "selected"].includes(reg.phase2Status ?? "")) {
      await red("NOT_ELIGIBLE", "NOT ELIGIBLE / PASS INVALID", "Phase 2 requirements incomplete — send to help desk."); return;
    }
    const evalRow = await activeEvaluation(reg.id);
    if (evalRow) { await red("ALREADY_COMPLETED", "TRIAL ALREADY COMPLETED", "Standard trial already recorded. Supervisor authorisation required for any re-trial."); return; }

    const [slot] = await db.select().from(trialSlotsTable).where(eq(trialSlotsTable.id, alloc.slotId)).limit(1);
    const todayIst = istDateOf(new Date());
    const slotIst = parseSlotDateIst(slot?.slotDate);
    if (slotIst && slotIst !== todayIst) {
      await red("WRONG_DATE", "WRONG DATE", `This pass is for ${slot?.slotDate ?? "another day"}.`); return;
    }

    const base = {
      trialNo: reg.regNumber, role: normalizeRole(reg.role),
      batch: slot?.batchName ?? null, reportingTime: slot?.reportingTime ?? null, slotDate: slot?.slotDate ?? null,
    };
    const [chk] = await db.select().from(trialCheckinsTable).where(eq(trialCheckinsTable.registrationId, reg.id)).limit(1);
    if (chk) {
      await audit("ALREADY_INSIDE", alloc.id);
      res.json({ status: "GREEN", code: "ALREADY_INSIDE", label: "ALREADY CHECKED IN", sub: "Player is already inside — direct to their station.", ...base });
      return;
    }
    const repMin = parseTimeMinutes(slot?.reportingTime);
    if (slotIst === todayIst && repMin !== null && istNowMinutes() < repMin - 120) {
      await audit("EARLY_ARRIVAL", alloc.id);
      res.json({ status: "YELLOW", code: "EARLY_ARRIVAL", label: "EARLY ARRIVAL", sub: `Reporting window ${slot?.reportingTime} — wait in the holding area.`, ...base });
      return;
    }
    await audit("VALID_SLOT", alloc.id);
    res.json({ status: "GREEN", code: "VALID_SLOT", label: "VALID SLOT — ENTRY ALLOWED", sub: "Direct player to check-in.", ...base });
  } catch (e) {
    logger.error({ err: e }, "staff/scan/gate failed");
    res.status(500).json({ error: "Gate scan failed" });
  }
});

/* POST /checkin {token|regNumber, device?} — identity check + wristband */
staffRouter.post("/checkin", requireRole(...CHECKIN_ROLES), async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const { alloc, reg } = await findAllocation(b);
    if (!alloc || !reg) { res.status(404).json({ error: "No valid trial pass found" }); return; }
    if (alloc.status !== "allocated") { res.status(409).json({ error: "This pass was " + alloc.status }); return; }
    const block = scopeBlock(req, alloc.city);
    if (block) { res.status(403).json({ error: block }); return; }
    if (!["kyc_done", "selected"].includes(reg.phase2Status ?? "")) {
      res.status(409).json({ error: "Player is not trial-eligible (Phase 2 status: " + String(reg.phase2Status) + ")" }); return;
    }
    if (await activeEvaluation(reg.id)) {
      res.status(409).json({ error: "TRIAL ALREADY COMPLETED — supervisor authorisation required for re-trial" }); return;
    }
    const [slot] = await db.select().from(trialSlotsTable).where(eq(trialSlotsTable.id, alloc.slotId)).limit(1);
    if (slot && slot.status === "cancelled") { res.status(409).json({ error: "This slot was cancelled — contact supervisor" }); return; }
    const [pUser] = await db.select().from(usersTable).where(eq(usersTable.id, reg.userId)).limit(1);

    try {
      const [chk] = await db.insert(trialCheckinsTable).values({
        allocationId: alloc.id, registrationId: reg.id,
        slotId: alloc.slotId, venueId: alloc.venueId,
        method: b["token"] ? "qr" : "manual",
        staff: req.admin!.email.slice(0, 80),
        device: b["device"] ? String(b["device"]).slice(0, 120) : null,
      }).returning();
      await writeAudit(req, { action: "trial.checkin", entity: "trial_checkins", entityKey: chk!.id, newValue: { registrationId: reg.id, method: b["token"] ? "qr" : "manual" } });
      res.json({
        ok: true,
        checkedInAt: chk!.checkedInAt,
        player: { name: pUser?.name ?? "Player", regNumber: reg.regNumber, role: normalizeRole(reg.role), city: alloc.city },
        slot: slot ? { batch: slot.batchName, date: slot.slotDate, reportingTime: slot.reportingTime } : null,
        wristband: { trialNo: reg.regNumber },
      });
    } catch (e) {
      const code = (e as { cause?: { code?: string }; code?: string }).code ?? (e as { cause?: { code?: string } }).cause?.code;
      if (code === "23505") {
        const [existing] = await db.select().from(trialCheckinsTable).where(eq(trialCheckinsTable.registrationId, reg.id)).limit(1);
        res.status(409).json({ error: "Already checked in", checkedInAt: existing?.checkedInAt ?? null, player: { name: pUser?.name ?? "Player", regNumber: reg.regNumber } });
        return;
      }
      throw e;
    }
  } catch (e) {
    logger.error({ err: e }, "staff/checkin failed");
    res.status(500).json({ error: "Check-in failed" });
  }
});

/* POST /eval/resolve {token|regNumber} — BLIND scoring card (spec §10) */
staffRouter.post("/eval/resolve", requireRole(...ATTEMPT_ROLES, ...SUBMIT_ROLES), async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const { alloc, reg } = await findAllocation(b);
    if (!alloc || !reg) { res.status(404).json({ error: "No valid trial pass found" }); return; }
    const block = scopeBlock(req, alloc.city);
    if (block) { res.status(403).json({ error: block }); return; }
    const [chk] = await db.select().from(trialCheckinsTable).where(eq(trialCheckinsTable.registrationId, reg.id)).limit(1);
    const evalRow = await activeEvaluation(reg.id);
    const [pending] = evalRow
      ? await db.select().from(trialCorrectionRequestsTable)
          .where(and(eq(trialCorrectionRequestsTable.evaluationId, evalRow.id), eq(trialCorrectionRequestsTable.status, "pending"))).limit(1)
      : [undefined];
    /* BLIND: trial number + role + progress only — never name/phone/Phase 1 (spec §10) */
    res.json({
      allocationId: alloc.id,
      trialNo: reg.regNumber,
      role: normalizeRole(reg.role),
      requiredDisciplines: requiredDisciplines(normalizeRole(reg.role)),
      checkedIn: Boolean(chk),
      attempts: await attemptState(alloc.id),
      evaluation: evalRow ? { locked: true, lockedAt: evalRow.lockedAt, correctionPending: Boolean(pending) } : null,
    });
  } catch (e) {
    logger.error({ err: e }, "staff/eval/resolve failed");
    res.status(500).json({ error: "Could not load player card" });
  }
});

/* POST /eval/attempt — record one delivery (six-valid enforcement, spec §13) */
staffRouter.post("/eval/attempt", requireRole(...ATTEMPT_ROLES), async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const allocationId = String(b["allocationId"] ?? "");
    const discipline = String(b["discipline"] ?? "");
    const feederError = b["feederError"] === true;
    let outcome = String(b["outcome"] ?? "");
    if (!allocationId || !["batting", "bowling"].includes(discipline)) { res.status(400).json({ error: "allocationId and discipline (batting|bowling) required" }); return; }

    const [alloc] = await db.select().from(trialAllocationsTable).where(eq(trialAllocationsTable.id, allocationId)).limit(1);
    if (!alloc) { res.status(404).json({ error: "Allocation not found" }); return; }
    const block = scopeBlock(req, alloc.city);
    if (block) { res.status(403).json({ error: block }); return; }
    const [reg] = await db.select().from(registrationsTable).where(eq(registrationsTable.id, alloc.registrationId)).limit(1);
    if (!reg) { res.status(404).json({ error: "Registration missing" }); return; }
    const role = normalizeRole(reg.role);
    if (!requiredDisciplines(role).includes(discipline as "batting" | "bowling")) {
      res.status(400).json({ error: `${discipline} is not assessed for role ${role}` }); return;
    }
    const [chk] = await db.select().from(trialCheckinsTable).where(eq(trialCheckinsTable.registrationId, reg.id)).limit(1);
    if (!chk) { res.status(409).json({ error: "Player is not checked in — scan at check-in first" }); return; }
    if (await activeEvaluation(reg.id)) { res.status(409).json({ error: "Assessment already submitted and locked" }); return; }

    if (feederError) {
      if (discipline !== "batting") { res.status(400).json({ error: "Feeder-error re-bowl applies to batting only — a bowler's own poor delivery still counts (spec §14)" }); return; }
      outcome = "FEEDER_ERROR_REBOWL";
    } else if (!(outcome in (OUTCOME_POINTS[discipline] ?? {}))) {
      res.status(400).json({ error: `Invalid outcome for ${discipline}` }); return;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const [{ n } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(trialAttemptsTable)
        .where(and(eq(trialAttemptsTable.allocationId, allocationId), eq(trialAttemptsTable.discipline, discipline), eq(trialAttemptsTable.isValid, true)));
      if (!feederError && n >= 6) { res.status(409).json({ error: "All 6 valid attempts already recorded — no extra deliveries (spec §12)" }); return; }
      try {
        await db.insert(trialAttemptsTable).values({
          allocationId, registrationId: reg.id, discipline,
          seq: feederError ? 0 : n + 1,
          outcome, isValid: !feederError,
          recordedBy: req.admin!.email.slice(0, 160),
          station: b["station"] ? String(b["station"]).slice(0, 40) : null,
        });
        break;
      } catch (e) {
        const code = (e as { cause?: { code?: string }; code?: string }).code ?? (e as { cause?: { code?: string } }).cause?.code;
        if (code === "23505" && attempt === 0) continue; // raced another device — recount once
        throw e;
      }
    }
    await writeAudit(req, { action: "trial.attempt", entity: "trial_attempts", entityKey: allocationId, newValue: { discipline, outcome, feederError } });
    res.json({ ok: true, attempts: await attemptState(allocationId) });
  } catch (e) {
    logger.error({ err: e }, "staff/eval/attempt failed");
    res.status(500).json({ error: "Failed to record attempt" });
  }
});

/* POST /eval/attempt/undo — remove the most recent attempt (pre-lock only) */
staffRouter.post("/eval/attempt/undo", requireRole(...ATTEMPT_ROLES), async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const allocationId = String(b["allocationId"] ?? "");
    const discipline = String(b["discipline"] ?? "");
    if (!allocationId || !["batting", "bowling"].includes(discipline)) { res.status(400).json({ error: "allocationId and discipline required" }); return; }
    const [alloc] = await db.select().from(trialAllocationsTable).where(eq(trialAllocationsTable.id, allocationId)).limit(1);
    if (!alloc) { res.status(404).json({ error: "Allocation not found" }); return; }
    const block = scopeBlock(req, alloc.city);
    if (block) { res.status(403).json({ error: block }); return; }
    if (await activeEvaluation(alloc.registrationId)) { res.status(409).json({ error: "Assessment already submitted and locked" }); return; }
    const [last] = await db.select().from(trialAttemptsTable)
      .where(and(eq(trialAttemptsTable.allocationId, allocationId), eq(trialAttemptsTable.discipline, discipline)))
      .orderBy(desc(trialAttemptsTable.createdAt)).limit(1);
    if (!last) { res.status(404).json({ error: "No attempts to undo" }); return; }
    await db.delete(trialAttemptsTable).where(eq(trialAttemptsTable.id, last.id));
    await writeAudit(req, { action: "trial.attempt_undo", entity: "trial_attempts", entityKey: last.id, oldValue: { discipline: last.discipline, outcome: last.outcome, seq: last.seq } });
    res.json({ ok: true, attempts: await attemptState(allocationId) });
  } catch (e) {
    logger.error({ err: e }, "staff/eval/attempt/undo failed");
    res.status(500).json({ error: "Failed to undo attempt" });
  }
});

/* POST /eval/submit — compute + LOCK the evaluation (spec §22–23) */
staffRouter.post("/eval/submit", requireRole(...SUBMIT_ROLES), async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const allocationId = String(b["allocationId"] ?? "");
    const technicalRaw = b["technical"];
    if (!allocationId) { res.status(400).json({ error: "allocationId required" }); return; }
    if (!technicalRaw || typeof technicalRaw !== "object" || Array.isArray(technicalRaw)) { res.status(400).json({ error: "technical scores object required" }); return; }

    const [alloc] = await db.select().from(trialAllocationsTable).where(eq(trialAllocationsTable.id, allocationId)).limit(1);
    if (!alloc) { res.status(404).json({ error: "Allocation not found" }); return; }
    const block = scopeBlock(req, alloc.city);
    if (block) { res.status(403).json({ error: block }); return; }
    const [reg] = await db.select().from(registrationsTable).where(eq(registrationsTable.id, alloc.registrationId)).limit(1);
    if (!reg) { res.status(404).json({ error: "Registration missing" }); return; }
    const [chk] = await db.select().from(trialCheckinsTable).where(eq(trialCheckinsTable.registrationId, reg.id)).limit(1);
    if (!chk) { res.status(409).json({ error: "Player is not checked in" }); return; }
    if (await activeEvaluation(reg.id)) { res.status(409).json({ error: "Assessment already submitted and locked — use Request Correction" }); return; }

    const role = normalizeRole(reg.role);
    const { version, roles } = await activeRubrics();
    const rubric = roles[role];
    if (!rubric) { res.status(400).json({ error: `No rubric for role ${role}` }); return; }

    const state = await attemptState(allocationId);
    const attempts = {
      batting: state.batting.valid.map((v) => v.outcome),
      bowling: state.bowling.valid.map((v) => v.outcome),
    };
    const missing = requiredDisciplines(role).filter((d) => attempts[d].length !== 6)
      .map((d) => ({ discipline: d, have: attempts[d].length, need: 6 }));
    if (missing.length > 0) { res.status(409).json({ error: "Required attempts incomplete — coach cannot finalise an incomplete assessment (spec §13)", missing }); return; }

    const technical: Record<string, number> = {};
    for (const [k, v] of Object.entries(technicalRaw as Record<string, unknown>)) technical[k] = Number(v);

    let comp: EvalComputation;
    try {
      comp = computeEvalTotal(role, attempts, technical, rubric, version);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message }); return;
    }

    const notes = b["notes"] ? String(b["notes"]).slice(0, 1000) : null;
    const inserted = await db.transaction(async (tx) => {
      const [row] = await tx.insert(trialEvaluationsTable).values({
        registrationId: reg.id, allocationId: alloc.id, evalRound: 1,
        evaluatorEmail: req.admin!.email.slice(0, 160), evaluatorName: req.admin!.name.slice(0, 120),
        playerRole: role, rubricVersion: version,
        sections: comp.sections, attemptSummary: state,
        totalScore: comp.total.toFixed(2), notes,
      }).returning();
      /* bridge to the legacy admin views (physical_assessments) — result
         (final selection decision) intentionally NOT touched here */
      await tx.insert(physicalAssessmentsTable).values({
        registrationId: reg.id, allocationId: alloc.id, slotId: alloc.slotId,
        city: alloc.city, venue: null, batch: null,
        assessor: req.admin!.email.slice(0, 80), playerRole: role,
        scores: comp.sections as unknown as Record<string, number>,
        finalScore: comp.total.toFixed(2), comments: notes,
      }).onConflictDoUpdate({
        target: physicalAssessmentsTable.registrationId,
        set: {
          scores: comp.sections as unknown as Record<string, number>,
          finalScore: comp.total.toFixed(2),
          assessor: req.admin!.email.slice(0, 80),
          playerRole: role, comments: notes, updatedAt: new Date(),
        },
      });
      return row;
    }).catch((e) => {
      const code = (e as { cause?: { code?: string }; code?: string }).code ?? (e as { cause?: { code?: string } }).cause?.code;
      if (code === "23505") return "raced" as const;
      throw e;
    });
    if (inserted === "raced") { res.status(409).json({ error: "Assessment already submitted by another evaluator" }); return; }

    await writeAudit(req, { action: "trial.evaluation_submit", entity: "trial_evaluations", entityKey: inserted!.id, newValue: { total: comp.total, role, rubricVersion: version } });
    res.json({ evaluation: { id: inserted!.id, totalScore: comp.total, sections: comp.sections, rubricVersion: version, lockedAt: inserted!.lockedAt } });
  } catch (e) {
    logger.error({ err: e }, "staff/eval/submit failed");
    res.status(500).json({ error: "Failed to submit assessment" });
  }
});

/* POST /eval/correction {allocationId, reason} — evaluator asks, supervisor decides */
staffRouter.post("/eval/correction", requireRole(...SUBMIT_ROLES), async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const allocationId = String(b["allocationId"] ?? "");
    const reason = String(b["reason"] ?? "").trim().slice(0, 1000);
    if (!allocationId || !reason) { res.status(400).json({ error: "allocationId and reason required" }); return; }
    const [alloc] = await db.select().from(trialAllocationsTable).where(eq(trialAllocationsTable.id, allocationId)).limit(1);
    if (!alloc) { res.status(404).json({ error: "Allocation not found" }); return; }
    const block = scopeBlock(req, alloc.city);
    if (block) { res.status(403).json({ error: block }); return; }
    const evalRow = await activeEvaluation(alloc.registrationId);
    if (!evalRow) { res.status(404).json({ error: "No locked assessment for this player" }); return; }
    const [pending] = await db.select().from(trialCorrectionRequestsTable)
      .where(and(eq(trialCorrectionRequestsTable.evaluationId, evalRow.id), eq(trialCorrectionRequestsTable.status, "pending"))).limit(1);
    if (pending) { res.status(409).json({ error: "A correction request is already pending for this assessment" }); return; }
    const [row] = await db.insert(trialCorrectionRequestsTable).values({
      evaluationId: evalRow.id, registrationId: alloc.registrationId,
      requestedBy: req.admin!.email.slice(0, 160), reason,
    }).returning();
    await writeAudit(req, { action: "trial.correction_request", entity: "trial_correction_requests", entityKey: row!.id, newValue: { evaluationId: evalRow.id, reason } });
    res.json({ ok: true, request: row });
  } catch (e) {
    logger.error({ err: e }, "staff/eval/correction failed");
    res.status(500).json({ error: "Failed to file correction request" });
  }
});

/* GET /supervisor/corrections — pending queue (city-scoped) */
staffRouter.get("/supervisor/corrections", requireRole(...SUPERVISE_ROLES), async (req, res) => {
  try {
    const rows = await db.select({
      request: trialCorrectionRequestsTable,
      evaluation: trialEvaluationsTable,
      trialNo: registrationsTable.regNumber,
      city: registrationsTable.trialCity,
    }).from(trialCorrectionRequestsTable)
      .innerJoin(trialEvaluationsTable, eq(trialCorrectionRequestsTable.evaluationId, trialEvaluationsTable.id))
      .innerJoin(registrationsTable, eq(trialCorrectionRequestsTable.registrationId, registrationsTable.id))
      .where(eq(trialCorrectionRequestsTable.status, "pending"))
      .orderBy(desc(trialCorrectionRequestsTable.createdAt))
      .limit(200);
    const scope = fieldCityScope(req);
    const list = scope === null ? rows
      : scope.length === 0 ? []
      : rows.filter((r) => scope.includes(String(r.city ?? "").trim().toLowerCase()));
    res.json({
      corrections: list.map((r) => ({
        id: r.request.id, reason: r.request.reason, requestedBy: r.request.requestedBy,
        createdAt: r.request.createdAt, trialNo: r.trialNo, city: r.city,
        evaluation: { id: r.evaluation.id, totalScore: r.evaluation.totalScore, playerRole: r.evaluation.playerRole, evaluatorEmail: r.evaluation.evaluatorEmail, lockedAt: r.evaluation.lockedAt },
      })),
    });
  } catch (e) {
    logger.error({ err: e }, "staff/supervisor/corrections failed");
    res.status(500).json({ error: "Failed to load corrections" });
  }
});

/* POST /supervisor/corrections/:id {approve, note?} — decide (audited, original kept) */
staffRouter.post("/supervisor/corrections/:id", requireRole(...SUPERVISE_ROLES), async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const approve = b["approve"] === true;
    const note = b["note"] ? String(b["note"]).slice(0, 500) : null;
    const [reqRow] = await db.select().from(trialCorrectionRequestsTable).where(eq(trialCorrectionRequestsTable.id, id)).limit(1);
    if (!reqRow || reqRow.status !== "pending") { res.status(404).json({ error: "Pending correction request not found" }); return; }
    const [reg] = await db.select().from(registrationsTable).where(eq(registrationsTable.id, reqRow.registrationId)).limit(1);
    const block = scopeBlock(req, reg?.trialCity);
    if (block) { res.status(403).json({ error: block }); return; }
    const [evalRow] = await db.select().from(trialEvaluationsTable).where(eq(trialEvaluationsTable.id, reqRow.evaluationId)).limit(1);
    if (!evalRow) { res.status(404).json({ error: "Evaluation missing" }); return; }

    await db.transaction(async (tx) => {
      await tx.update(trialCorrectionRequestsTable).set({
        status: approve ? "approved" : "rejected",
        decidedBy: req.admin!.email.slice(0, 160), decisionNote: note, decidedAt: new Date(),
      }).where(eq(trialCorrectionRequestsTable.id, id));
      if (approve) {
        /* original evaluation retained forever — only marked superseded */
        await tx.update(trialEvaluationsTable)
          .set({ status: "superseded", updatedAt: new Date() })
          .where(eq(trialEvaluationsTable.id, evalRow.id));
      }
    });
    await writeAudit(req, {
      action: approve ? "trial.correction_approve" : "trial.correction_reject",
      entity: "trial_correction_requests", entityKey: id,
      oldValue: { evaluationId: evalRow.id, totalScore: evalRow.totalScore },
      newValue: { note },
    });
    res.json({ ok: true, approved: approve });
  } catch (e) {
    logger.error({ err: e }, "staff/supervisor/corrections decide failed");
    res.status(500).json({ error: "Failed to decide correction" });
  }
});

/* GET /supervisor/today — venue ops counters (W1 lite) */
staffRouter.get("/supervisor/today", requireRole(...SUPERVISE_ROLES), async (req, res) => {
  try {
    const scope = fieldCityScope(req);
    if (scope !== null && scope.length === 0) { res.status(403).json({ error: "No city assigned to your staff account" }); return; }
    // node-postgres binds a JS array as one plain-string param → "malformed
    // array literal"; expand to IN ($1,$2,…) with one bound param per city.
    const cityCond = scope === null
      ? sql`TRUE`
      : sql`lower(ta.city) IN (${sql.join(scope.map((c) => sql`${c}`), sql`, `)})`;
    const istToday = sql`(now() AT TIME ZONE 'Asia/Kolkata')::date`;
    const r = await db.execute(sql`SELECT
      (SELECT count(*)::int FROM trial_allocations ta WHERE ta.status = 'allocated' AND ${cityCond}) AS allocated,
      (SELECT count(*)::int FROM trial_checkins tc JOIN trial_allocations ta ON ta.id = tc.allocation_id
        WHERE ${cityCond} AND (tc.checked_in_at AT TIME ZONE 'Asia/Kolkata')::date = ${istToday}) AS checked_in_today,
      (SELECT count(*)::int FROM trial_evaluations te JOIN trial_allocations ta ON ta.id = te.allocation_id
        WHERE te.status = 'submitted' AND ${cityCond} AND (te.locked_at AT TIME ZONE 'Asia/Kolkata')::date = ${istToday}) AS submitted_today,
      (SELECT count(*)::int FROM trial_correction_requests tcr
        JOIN trial_allocations ta ON ta.registration_id = tcr.registration_id AND ta.status IN ('allocated')
        WHERE tcr.status = 'pending' AND ${cityCond}) AS pending_corrections,
      (SELECT count(DISTINCT a.allocation_id)::int FROM trial_attempts a JOIN trial_allocations ta ON ta.id = a.allocation_id
        WHERE ${cityCond} AND NOT EXISTS (SELECT 1 FROM trial_evaluations te2 WHERE te2.allocation_id = a.allocation_id AND te2.status = 'submitted')) AS in_progress
    `);
    // node-postgres driver: db.execute returns a QueryResult, rows live under .rows
    const row = (r as unknown as { rows?: Record<string, number>[] }).rows?.[0];
    res.json({ counters: row ?? {} });
  } catch (e) {
    logger.error({ err: e }, "staff/supervisor/today failed");
    res.status(500).json({ error: "Failed to load counters" });
  }
});

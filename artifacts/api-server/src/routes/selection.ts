/**
 * Final 600 selection engine — admin API (spec §7).
 *
 * Workflow: CLOSE PHYSICAL TRIALS → GENERATE → (job) → PREVIEW → APPROVE → PUBLISH.
 *
 * Routes (all under /api/admin/selection, role-gated — top role only):
 *   GET  /config                      current selection_config (defaults applied)
 *   GET  /aggregates?seasonKey=       SQL aggregates: counts by role/zone/status + score buckets
 *   GET  /trial-status?seasonKey=     physical-trials closure state
 *   POST /trials/close                freeze a population snapshot for the season
 *   POST /trials/reopen               reopen trials → invalidate unpublished batches
 *   GET  /batches?seasonKey=          batch list (versions)
 *   GET  /batches/:id                 batch detail + exception report
 *   GET  /batches/:id/members         cursor-paginated members + server-side filters
 *   POST /generate                    create a batch + start background job (CAS claim)
 *   POST /batches/:id/retry           retry a failed batch (idempotent, no partial results)
 *   POST /batches/:id/approve         approve a preview_ready batch (one approved per season)
 *   POST /batches/:id/publish         publish an approved batch (flips status + stamps only)
 *
 * Score source: physical_assessments.final_score (documented in selectionEngine.ts).
 * Player notifications are intentionally NOT wired here (spec §5).
 */
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  selectionBatchesTable, selectionBatchMembersTable,
  siteSettingsTable,
} from "@workspace/db/schema";
import { and, eq, sql, desc, asc } from "drizzle-orm";
import { requireAdmin, requireRole } from "../middlewares/adminAuth";
import { writeAudit } from "../lib/audit";
import { logger } from "../lib/logger";
import {
  getSelectionConfig, SELECTION_ALGORITHM_VERSION, SELECTION_CONFIG_KEY,
  effectiveCityZoneMap, computedTotal,
} from "../lib/selectionConfig";
import { generateFinal600, PROGRESS_STATES } from "../lib/selectionEngine";

export const adminSelectionRouter: Router = Router();

/* Top-role gate: requireRole() with no args = SUPER_ADMIN only (per adminUsers
   pattern). Selection math changes are the most sensitive admin action. */
adminSelectionRouter.use(requireAdmin, requireRole());

/** Settings key that records the frozen trial-closure snapshot per season. */
const TRIAL_CLOSURE_KEY = "selection_trial_closure";

type ClosureState = {
  seasonKey: string;
  status: "open" | "closed";
  snapshotAt: string | null;
  closedBy: string | null;
  closedAt: string | null;
  reopenedBy: string | null;
  reopenedAt: string | null;
};

async function readClosure(seasonKey: string): Promise<ClosureState> {
  const [row] = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, TRIAL_CLOSURE_KEY)).limit(1);
  const all = (row?.value ?? {}) as Record<string, ClosureState>;
  return all[seasonKey] ?? {
    seasonKey, status: "open", snapshotAt: null,
    closedBy: null, closedAt: null, reopenedBy: null, reopenedAt: null,
  };
}

async function writeClosure(seasonKey: string, next: ClosureState): Promise<void> {
  const [row] = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, TRIAL_CLOSURE_KEY)).limit(1);
  const all = (row?.value ?? {}) as Record<string, ClosureState>;
  all[seasonKey] = next;
  const now = new Date();
  await db.insert(siteSettingsTable)
    .values({ key: TRIAL_CLOSURE_KEY, value: all as unknown as Record<string, unknown>, updatedAt: now })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: all as unknown as Record<string, unknown>, updatedAt: now } });
}

const ELIGIBLE_RESULTS_SQL = sql.raw(`ARRAY['FINAL_SELECTION_PENDING','FINAL_SELECTED']::text[]`);

const roleCase = sql`
  CASE
    WHEN lower(player_role) LIKE 'bowl%' THEN 'bowl'
    WHEN lower(player_role) LIKE 'all%' OR lower(player_role) = 'ar' THEN 'ar'
    WHEN lower(player_role) LIKE 'wicket%' OR lower(player_role) LIKE 'keep%' OR lower(player_role) = 'wk' THEN 'wk'
    ELSE 'bat'
  END`;

/* ── GET /config ── */
adminSelectionRouter.get("/config", async (_req, res) => {
  const cfg = await getSelectionConfig();
  res.json({ key: SELECTION_CONFIG_KEY, config: cfg, computedTargetTotal: computedTotal(cfg), algorithmVersion: SELECTION_ALGORITHM_VERSION });
});

/* ── GET /trial-status ── */
adminSelectionRouter.get("/trial-status", async (req, res) => {
  const seasonKey = String(req.query.seasonKey ?? (await getSelectionConfig()).seasonKey);
  res.json({ closure: await readClosure(seasonKey) });
});

/* ── GET /aggregates ── all SQL aggregates; never loads player rows ── */
adminSelectionRouter.get("/aggregates", async (req, res) => {
  const cfg = await getSelectionConfig();
  const seasonKey = String(req.query.seasonKey ?? cfg.seasonKey);
  const cityZoneMap = effectiveCityZoneMap(cfg);
  const closure = await readClosure(seasonKey);
  const cutoff = closure.snapshotAt ? new Date(closure.snapshotAt) : null;

  // zone CASE for city
  let zoneCase = sql`NULL::text`;
  const zEntries = Object.entries(cityZoneMap);
  if (zEntries.length > 0) {
    let expr = sql`CASE`;
    for (const [city, zone] of zEntries) expr = sql`${expr} WHEN lower(trim(coalesce(city, ''))) = ${city} THEN ${zone}`;
    zoneCase = sql`${expr} ELSE 'UNMAPPED' END`;
  }
  const cutoffPredicate = cutoff ? sql`AND created_at <= ${cutoff.toISOString()}::timestamptz` : sql``;

  const totals = await db.execute(sql`
    SELECT
      count(*) AS total_completed,
      count(*) FILTER (WHERE final_score IS NOT NULL AND result = ANY(${ELIGIBLE_RESULTS_SQL})) AS eligible,
      count(*) FILTER (WHERE result = 'FINAL_NOT_SELECTED') AS not_selected,
      count(*) FILTER (WHERE final_score IS NULL) AS incomplete
    FROM physical_assessments WHERE true ${cutoffPredicate}
  `);

  const byRole = await db.execute(sql`
    SELECT ${roleCase} AS role, count(*) AS n
    FROM physical_assessments
    WHERE final_score IS NOT NULL AND result = ANY(${ELIGIBLE_RESULTS_SQL}) ${cutoffPredicate}
    GROUP BY 1 ORDER BY 1
  `);

  const byZone = await db.execute(sql`
    SELECT ${zoneCase} AS zone, count(*) AS n
    FROM physical_assessments
    WHERE final_score IS NOT NULL AND result = ANY(${ELIGIBLE_RESULTS_SQL}) ${cutoffPredicate}
    GROUP BY 1 ORDER BY 1
  `);

  const byCity = await db.execute(sql`
    SELECT coalesce(city, '—') AS city, count(*) AS n
    FROM physical_assessments
    WHERE final_score IS NOT NULL AND result = ANY(${ELIGIBLE_RESULTS_SQL}) ${cutoffPredicate}
    GROUP BY 1 ORDER BY n DESC LIMIT 100
  `);

  // score distribution buckets (width 5 from 0..100)
  const buckets = await db.execute(sql`
    SELECT width_bucket(final_score, 0, 100, 20) AS bucket, count(*) AS n
    FROM physical_assessments
    WHERE final_score IS NOT NULL AND result = ANY(${ELIGIBLE_RESULTS_SQL}) ${cutoffPredicate}
    GROUP BY 1 ORDER BY 1
  `);

  const t = (totals.rows?.[0] ?? {}) as Record<string, unknown>;
  res.json({
    seasonKey,
    closure,
    totals: {
      completed: Number(t.total_completed ?? 0),
      eligible: Number(t.eligible ?? 0),
      notSelected: Number(t.not_selected ?? 0),
      incomplete: Number(t.incomplete ?? 0),
      finalPoolSize: computedTotal(cfg),
    },
    byRole: (byRole.rows ?? []).map((r: Record<string, unknown>) => ({ role: r.role, n: Number(r.n) })),
    byZone: (byZone.rows ?? []).map((r: Record<string, unknown>) => ({ zone: r.zone, n: Number(r.n) })),
    byCity: (byCity.rows ?? []).map((r: Record<string, unknown>) => ({ city: r.city, n: Number(r.n) })),
    scoreBuckets: (buckets.rows ?? []).map((r: Record<string, unknown>) => {
      const b = Number(r.bucket ?? 0);
      const lo = (b - 1) * 5;
      return { bucket: b, label: `${lo}-${lo + 5}`, n: Number(r.n) };
    }),
  });
});

/* ── POST /trials/close ── freeze the population snapshot ── */
adminSelectionRouter.post("/trials/close", async (req, res) => {
  const cfg = await getSelectionConfig();
  const seasonKey = String(req.body?.seasonKey ?? cfg.seasonKey);
  const current = await readClosure(seasonKey);
  if (current.status === "closed") {
    return void res.status(409).json({ error: "Physical trials already closed for this season", closure: current });
  }
  const now = new Date();
  const next: ClosureState = {
    seasonKey, status: "closed", snapshotAt: now.toISOString(),
    closedBy: req.admin?.email ?? "system", closedAt: now.toISOString(),
    reopenedBy: null, reopenedAt: null,
  };
  await writeClosure(seasonKey, next);
  void writeAudit(req, { action: "selection.trials.close", entity: "selection", entityKey: seasonKey, newValue: next });
  res.json({ ok: true, closure: next });
});

/* ── POST /trials/reopen ── invalidate unpublished batches ── */
adminSelectionRouter.post("/trials/reopen", async (req, res) => {
  const cfg = await getSelectionConfig();
  const seasonKey = String(req.body?.seasonKey ?? cfg.seasonKey);
  const now = new Date();
  const next: ClosureState = {
    seasonKey, status: "open", snapshotAt: null,
    closedBy: null, closedAt: null,
    reopenedBy: req.admin?.email ?? "system", reopenedAt: now.toISOString(),
  };
  await writeClosure(seasonKey, next);
  // Invalidate every batch that is not published (spec §2).
  const invalidated = await db.update(selectionBatchesTable)
    .set({ status: "invalidated", invalidatedAt: now, claimToken: null, updatedAt: now })
    .where(and(
      eq(selectionBatchesTable.seasonKey, seasonKey),
      sql`${selectionBatchesTable.status} <> 'published' AND ${selectionBatchesTable.status} <> 'invalidated'`,
    ))
    .returning({ id: selectionBatchesTable.id });
  void writeAudit(req, { action: "selection.trials.reopen", entity: "selection", entityKey: seasonKey, newValue: { invalidated: invalidated.length } });
  res.json({ ok: true, closure: next, invalidatedBatches: invalidated.length });
});

/* ── GET /batches ── */
adminSelectionRouter.get("/batches", async (req, res) => {
  const seasonKey = String(req.query.seasonKey ?? (await getSelectionConfig()).seasonKey);
  const rows = await db.select().from(selectionBatchesTable)
    .where(eq(selectionBatchesTable.seasonKey, seasonKey))
    .orderBy(desc(selectionBatchesTable.version));
  res.json({ batches: rows });
});

/* ── GET /batches/:id ── */
adminSelectionRouter.get("/batches/:id", async (req, res) => {
  const id = String(req.params.id);
  const [batch] = await db.select().from(selectionBatchesTable).where(eq(selectionBatchesTable.id, id)).limit(1);
  if (!batch) return void res.status(404).json({ error: "Batch not found" });
  res.json({ batch, progressStates: PROGRESS_STATES });
});

/* ── GET /batches/:id/members ── cursor pagination + server-side filters ── */
adminSelectionRouter.get("/batches/:id/members", async (req, res) => {
  const id = String(req.params.id);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
  const cursor = req.query.cursor ? Number(req.query.cursor) : 0; // overallRank cursor
  const zone = req.query.zone ? String(req.query.zone) : null;
  const role = req.query.role ? String(req.query.role) : null;
  const pool = req.query.pool ? String(req.query.pool) : null;

  const conds = [eq(selectionBatchMembersTable.batchId, id)];
  if (zone) conds.push(eq(selectionBatchMembersTable.zone, zone));
  if (role) conds.push(eq(selectionBatchMembersTable.role, role));
  if (pool) conds.push(eq(selectionBatchMembersTable.selectionPool, pool));
  if (cursor > 0) conds.push(sql`${selectionBatchMembersTable.overallRank} > ${cursor}`);

  const rows = await db.select().from(selectionBatchMembersTable)
    .where(and(...conds))
    .orderBy(asc(selectionBatchMembersTable.overallRank))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1]?.overallRank ?? null : null;
  res.json({ members: page, nextCursor, hasMore });
});

/* ── POST /generate ── create batch + start background job (CAS claim) ── */
adminSelectionRouter.post("/generate", async (req, res) => {
  const cfg = await getSelectionConfig();
  const seasonKey = String(req.body?.seasonKey ?? cfg.seasonKey);
  const closure = await readClosure(seasonKey);
  if (closure.status !== "closed" || !closure.snapshotAt) {
    return void res.status(409).json({ error: "Physical trials must be CLOSED (population snapshot frozen) before generating the Final 600." });
  }

  // Next version for this season.
  const [maxRow] = await db.select({ v: sql<number>`coalesce(max(${selectionBatchesTable.version}), 0)` })
    .from(selectionBatchesTable).where(eq(selectionBatchesTable.seasonKey, seasonKey));
  const version = Number(maxRow?.v ?? 0) + 1;
  const claimToken = randomUUID();

  const [batch] = await db.insert(selectionBatchesTable).values({
    seasonKey, version, status: "generating", jobPhase: "preparing_population", jobProgressPct: 5,
    claimToken, algorithmVersion: SELECTION_ALGORITHM_VERSION,
    configSnapshot: cfg as unknown as Record<string, unknown>,
    populationSnapshot: {
      snapshotAt: closure.snapshotAt,
      scoreSource: "physical_assessments.final_score",
      eligiblePredicate: "final_score IS NOT NULL AND result IN (FINAL_SELECTION_PENDING, FINAL_SELECTED) AND created_at <= snapshotAt AND city mapped to a zone",
      zoneMappingVersion: cfg.zoneMappingVersion,
    },
    exceptionReport: [],
    createdBy: req.admin?.email ?? "system",
  }).returning();

  void writeAudit(req, { action: "selection.generate", entity: "selection_batch", entityKey: batch.id, newValue: { seasonKey, version } });

  // Fire-and-forget background job — the HTTP request returns immediately;
  // if the admin closes the browser the job keeps running (spec §3).
  void generateFinal600(batch.id, claimToken).catch((e) => logger.error({ err: e, batchId: batch.id }, "generateFinal600 crashed"));

  res.status(202).json({ ok: true, batchId: batch.id, version, status: "generating" });
});

/* ── POST /batches/:id/retry ── idempotent retry of a failed batch ── */
adminSelectionRouter.post("/batches/:id/retry", async (req, res) => {
  const id = String(req.params.id);
  const claimToken = randomUUID();
  // CAS claim: only a failed batch may be retried, and only one claimer wins.
  const claimed = await db.update(selectionBatchesTable)
    .set({ status: "generating", jobPhase: "preparing_population", jobProgressPct: 5, claimToken, error: null, updatedAt: new Date() })
    .where(and(eq(selectionBatchesTable.id, id), eq(selectionBatchesTable.status, "failed")))
    .returning({ id: selectionBatchesTable.id });
  if (claimed.length === 0) {
    return void res.status(409).json({ error: "Batch is not in a retryable (failed) state." });
  }
  void writeAudit(req, { action: "selection.retry", entity: "selection_batch", entityKey: id });
  void generateFinal600(id, claimToken).catch((e) => logger.error({ err: e, batchId: id }, "retry generateFinal600 crashed"));
  res.status(202).json({ ok: true, batchId: id, status: "generating" });
});

/* ── POST /batches/:id/approve ── one approved per season ── */
adminSelectionRouter.post("/batches/:id/approve", async (req, res) => {
  const id = String(req.params.id);
  const [batch] = await db.select().from(selectionBatchesTable).where(eq(selectionBatchesTable.id, id)).limit(1);
  if (!batch) return void res.status(404).json({ error: "Batch not found" });
  if (batch.status !== "preview_ready") {
    return void res.status(409).json({ error: `Batch must be preview_ready to approve (current: ${batch.status}).` });
  }
  // Enforce single approved batch per season (also guarded by partial unique idx).
  const existing = await db.select({ id: selectionBatchesTable.id, version: selectionBatchesTable.version })
    .from(selectionBatchesTable)
    .where(and(eq(selectionBatchesTable.seasonKey, batch.seasonKey), eq(selectionBatchesTable.status, "approved")));
  if (existing.length > 0) {
    return void res.status(409).json({ error: `Season ${batch.seasonKey} already has an approved batch (V${existing[0]?.version ?? "?"}). Reopen/invalidate it first.` });
  }
  const now = new Date();
  try {
    await db.update(selectionBatchesTable)
      .set({ status: "approved", approvedBy: req.admin?.email ?? "system", approvedAt: now, updatedAt: now })
      .where(and(eq(selectionBatchesTable.id, id), eq(selectionBatchesTable.status, "preview_ready")));
  } catch (e) {
    return void res.status(409).json({ error: "Approve failed — another approved batch exists for this season.", detail: String(e).slice(0, 200) });
  }
  void writeAudit(req, { action: "selection.approve", entity: "selection_batch", entityKey: id });
  res.json({ ok: true, batchId: id, status: "approved" });
});

/* ── POST /batches/:id/publish ── flips status + stamps ONLY (no notifications) ── */
adminSelectionRouter.post("/batches/:id/publish", async (req, res) => {
  const id = String(req.params.id);
  const [batch] = await db.select().from(selectionBatchesTable).where(eq(selectionBatchesTable.id, id)).limit(1);
  if (!batch) return void res.status(404).json({ error: "Batch not found" });
  if (batch.status !== "approved") {
    return void res.status(409).json({ error: `Batch must be approved to publish (current: ${batch.status}).` });
  }
  const now = new Date();
  await db.update(selectionBatchesTable)
    .set({ status: "published", publishedBy: req.admin?.email ?? "system", publishedAt: now, updatedAt: now })
    .where(and(eq(selectionBatchesTable.id, id), eq(selectionBatchesTable.status, "approved")));
  // Intentionally NO player notifications (spec §5): publish only flips status.
  void writeAudit(req, { action: "selection.publish", entity: "selection_batch", entityKey: id });
  res.json({ ok: true, batchId: id, status: "published", note: "Status published — player notifications are not wired yet." });
});

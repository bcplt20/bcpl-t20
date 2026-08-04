/**
 * Final 600 selection engine (background job).
 *
 * SCORE SOURCE (documented decision): the authoritative physical score is
 * `physical_assessments.final_score` (numeric(5,2), 0–100). Rationale:
 *   - physical_assessments has a UNIQUE index on registration_id → exactly one
 *     settled record per player, so ranking is well-defined without dedupe.
 *   - it carries the selection lifecycle field `result`
 *     (FINAL_SELECTION_PENDING / FINAL_SELECTED / FINAL_NOT_SELECTED).
 *   - trial_evaluations.total_score is the staff-app raw capture (numeric(6,2),
 *     multiple eval_round rows, superseded history) — an evaluation feed, not
 *     the settled per-player score. physical_assessments is the source of truth.
 * The engine READS physical_assessments.final_score; it NEVER writes it.
 *
 * SCALABILITY: all ranking happens server-side in SQL window functions over the
 * frozen population. The engine never loads the population into Node memory —
 * it computes ranks, applies zonal + wildcard quotas, and INSERTs the selected
 * members directly with `INSERT … SELECT`. Population size is irrelevant to
 * memory use (spec: population-independent, no fixed count, no whole-population
 * load). Only aggregate counts + the ≤ totalPool selected members ever return.
 *
 * DETERMINISM: same snapshot + same config + same algorithm version ⇒ identical
 * Final 600. Ranking ordering is a total order via the tie-breaker chain ending
 * in registration_id (a deterministic UUID), so ties never depend on row order.
 *
 * FAILURE: on any error the batch flips to `failed` with diagnostics and ALL
 * members inserted so far are deleted — NO partial results. Retry is idempotent:
 * it re-claims via CAS and re-runs from a clean slate.
 *
 * CAS OWNERSHIP (enforced end-to-end): every mutating step requires the batch to
 * still be owned by this worker — i.e. `claim_token = $token AND status =
 * 'generating'`. Before the destructive delete and before each INSERT phase we
 * run a claim-guarded "touch" (assertOwned); if it affects 0 rows the claim was
 * cleared underneath us (trials reopened / batch invalidated / superseded by a
 * retry). We then abort IMMEDIATELY via OwnershipLostError: the whole transaction
 * rolls back (so NO members persist), we do NOT flip the batch to failed (that
 * state now belongs to whoever holds the claim), and we do NOT report success.
 * The final status write is likewise claim-guarded and its affected-row count is
 * checked — a 0-row result means ownership was lost and we abort rather than
 * returning preview_ready while the batch row is untouched.
 */
import { db } from "@workspace/db";
import { selectionBatchesTable, selectionBatchMembersTable } from "@workspace/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { logger } from "./logger";
import {
  ZONES, SELECTION_ROLES,
  effectiveCityZoneMap, parseSelectionConfig, computedTotal,
  type SelectionConfig, type Zone,
} from "./selectionConfig";
import type { RoleKey } from "./phase1Roles";

/** Fine-grained progress states shown in the admin UI (spec §3). */
export const PROGRESS_STATES = [
  "preparing_population",
  "ranking",
  "zonal_allocation",
  "wildcards",
  "validating",
  "preview_ready",
] as const;
export type ProgressState = (typeof PROGRESS_STATES)[number];

const PROGRESS_PCT: Record<ProgressState, number> = {
  preparing_population: 10,
  ranking: 30,
  zonal_allocation: 55,
  wildcards: 75,
  validating: 90,
  preview_ready: 100,
};

/**
 * SQL role normalization: physical_assessments.player_role is already
 * normalized (batsman|bowler|all_rounder|wicket_keeper) but we defensively map
 * every historic spelling to the 4 canonical RoleKey codes used by quotas.
 */
const ROLE_CASE = sql`
  CASE
    WHEN lower(pa.player_role) LIKE 'bowl%' THEN 'bowl'
    WHEN lower(pa.player_role) LIKE 'all%' OR lower(pa.player_role) = 'ar' THEN 'ar'
    WHEN lower(pa.player_role) LIKE 'wicket%' OR lower(pa.player_role) LIKE 'keep%' OR lower(pa.player_role) = 'wk' THEN 'wk'
    ELSE 'bat'
  END`;

/** Role-critical component key per role, read from the scores jsonb. */
const ROLE_CRITICAL_KEY = sql`
  CASE
    WHEN lower(pa.player_role) LIKE 'bowl%' THEN 'control'
    WHEN lower(pa.player_role) LIKE 'all%' OR lower(pa.player_role) = 'ar' THEN 'batting'
    WHEN lower(pa.player_role) LIKE 'wicket%' OR lower(pa.player_role) LIKE 'keep%' OR lower(pa.player_role) = 'wk' THEN 'keeping'
    ELSE 'technique'
  END`;

/** Consistency / control component key per role. */
const CONSISTENCY_KEY = sql`
  CASE
    WHEN lower(pa.player_role) LIKE 'bowl%' THEN 'variation'
    WHEN lower(pa.player_role) LIKE 'all%' OR lower(pa.player_role) = 'ar' THEN 'fitness'
    WHEN lower(pa.player_role) LIKE 'wicket%' OR lower(pa.player_role) LIKE 'keep%' OR lower(pa.player_role) = 'wk' THEN 'hands'
    ELSE 'timing'
  END`;

/**
 * Build the SQL CASE that maps lower(city) → zone from the effective mapping.
 * Cities not in the mapping evaluate to NULL and are excluded from eligibility
 * (surfaced as an unmapped-city exception) — NEVER silently defaulted.
 */
function zoneCaseSql(cityZoneMap: Record<string, Zone>) {
  const entries = Object.entries(cityZoneMap);
  if (entries.length === 0) return sql`NULL::text`;
  let expr = sql`CASE`;
  for (const [city, zone] of entries) {
    expr = sql`${expr} WHEN lower(trim(coalesce(pa.city, ''))) = ${city} THEN ${zone}`;
  }
  return sql`${expr} ELSE NULL END`;
}

/** Result values eligible for selection (excludes FINAL_NOT_SELECTED). */
const ELIGIBLE_RESULTS = ["FINAL_SELECTION_PENDING", "FINAL_SELECTED"];

export interface GenerateResult {
  status: "preview_ready" | "failed" | "ownership_lost";
  batchId: string;
  counts?: Record<string, unknown>;
  exceptionReport?: Array<Record<string, unknown>>;
  error?: string;
}

/**
 * Thrown when a claim-guarded write affects 0 rows mid-run: the batch is no
 * longer owned by this worker (claim cleared / status no longer 'generating').
 * The catch handler treats this specially — it does NOT mark the batch failed
 * (that batch now belongs to someone else) and does NOT report success.
 */
class OwnershipLostError extends Error {
  constructor() { super("selection batch ownership lost (claim token cleared or status changed)"); this.name = "OwnershipLostError"; }
}

/** Minimal executor shape shared by `db` and a transaction handle. */
type Executor = Pick<typeof db, "update">;

/**
 * Claim-guarded no-op touch: bumps updatedAt only when this worker still owns
 * the batch (claim_token = $token AND status = 'generating'). Returns the number
 * of affected rows; 0 ⇒ ownership lost.
 */
async function ownedTouch(exec: Executor, batchId: string, claimToken: string): Promise<number> {
  const rows = await exec.update(selectionBatchesTable)
    .set({ updatedAt: new Date() })
    .where(and(
      eq(selectionBatchesTable.id, batchId),
      eq(selectionBatchesTable.claimToken, sql`${claimToken}::uuid`),
      eq(selectionBatchesTable.status, "generating"),
    ))
    .returning({ id: selectionBatchesTable.id });
  return rows.length;
}

/** Assert ownership before a destructive step; abort the whole job if lost. */
async function assertOwned(exec: Executor, batchId: string, claimToken: string): Promise<void> {
  if ((await ownedTouch(exec, batchId, claimToken)) === 0) throw new OwnershipLostError();
}

/**
 * Claim-guarded phase/progress write. Only advances phase while this worker
 * owns the batch; a 0-row result means ownership was lost → abort.
 */
async function setPhase(exec: Executor, batchId: string, claimToken: string, phase: ProgressState): Promise<void> {
  const rows = await exec.update(selectionBatchesTable)
    .set({ jobPhase: phase, jobProgressPct: PROGRESS_PCT[phase], updatedAt: new Date() })
    .where(and(
      eq(selectionBatchesTable.id, batchId),
      eq(selectionBatchesTable.claimToken, sql`${claimToken}::uuid`),
      eq(selectionBatchesTable.status, "generating"),
    ))
    .returning({ id: selectionBatchesTable.id });
  if (rows.length === 0) throw new OwnershipLostError();
}

/**
 * Mark the batch failed — CAS-guarded so a STALE worker can never fail a batch
 * that has been reclaimed by a newer run. Only flips to failed when this worker
 * still owns the claim AND status is still 'generating'. Best-effort (never
 * throws); if the guarded update affects 0 rows the batch is no longer ours and
 * we leave it alone.
 */
async function failBatch(batchId: string, claimToken: string, e: unknown): Promise<void> {
  try {
    const flipped = await db.update(selectionBatchesTable)
      .set({ status: "failed", jobPhase: null, error: String(e).slice(0, 2000), claimToken: null, updatedAt: new Date() })
      .where(and(
        eq(selectionBatchesTable.id, batchId),
        eq(selectionBatchesTable.claimToken, sql`${claimToken}::uuid`),
        eq(selectionBatchesTable.status, "generating"),
      ))
      .returning({ id: selectionBatchesTable.id });
    if (flipped.length === 0) {
      // Not ours anymore — do not touch members either.
      logger.warn({ batchId }, "Final 600 job failed but batch was already reclaimed/changed — leaving untouched");
      return;
    }
    // We own it: wipe any members from this run (NO partial results).
    await db.delete(selectionBatchMembersTable).where(eq(selectionBatchMembersTable.batchId, batchId)).catch(() => {});
  } catch (inner) {
    logger.error({ err: inner, batchId }, "failBatch cleanup error");
  }
  logger.error({ err: e, batchId }, "Final 600 selection job failed");
}

/**
 * Full generation, run inside a single transaction so the ranking TEMP table
 * lives for the whole job and the member INSERTs are atomic (all-or-nothing —
 * NO partial results). CAS-guarded on claimToken throughout.
 */
export async function generateFinal600(batchId: string, claimToken: string): Promise<GenerateResult> {
  const [batch] = await db.select().from(selectionBatchesTable)
    .where(eq(selectionBatchesTable.id, batchId)).limit(1);
  if (!batch) return { status: "failed", batchId, error: "batch not found" };
  if (batch.claimToken !== claimToken) {
    return { status: "failed", batchId, error: "claim token mismatch" };
  }

  const cfg: SelectionConfig = parseSelectionConfig(batch.configSnapshot);
  const cityZoneMap = effectiveCityZoneMap(cfg);
  const snapAt = (batch.populationSnapshot as { snapshotAt?: string } | null)?.snapshotAt;
  const cutoff = snapAt ? new Date(snapAt) : new Date();

  try {
    // Everything mutating happens inside ONE transaction so a rollback (on error
    // OR ownership loss) leaves zero members behind — NO partial results.
    const zoneCase = zoneCaseSql(cityZoneMap);
    const rankOrder = sql`score DESC, role_critical DESC, consistency DESC, phase1_score DESC, registration_id ASC`;

    let countsSnapshot: Record<string, unknown> | null = null;
    const exceptions: Array<Record<string, unknown>> = [];
    let selectedTotal = 0;
    const byRole: Record<RoleKey, number> = { bat: 0, bowl: 0, ar: 0, wk: 0 };
    const byZone: Record<string, number> = {};
    let populationTotal = 0;
    let eligibleTotal = 0;
    let unmappedCityCount = 0;

    await db.transaction(async (tx) => {
      // Ownership gate #1: we must still own the batch before ANY destructive
      // write. If not, roll back with zero side effects.
      await assertOwned(tx, batchId, claimToken);
      await setPhase(tx, batchId, claimToken, "preparing_population");
      // Clean slate inside the tx (retry idempotency + no leftover members).
      await tx.delete(selectionBatchMembersTable).where(eq(selectionBatchMembersTable.batchId, batchId));
      await setPhase(tx, batchId, claimToken, "ranking");

      // ── ranking: build a session TEMP table holding the ranked eligible pool ──
      await tx.execute(sql`
        CREATE TEMP TABLE sel_rank ON COMMIT DROP AS
        WITH eligible AS (
          SELECT
            pa.registration_id AS registration_id,
            pa.city AS city,
            ${ROLE_CASE} AS role,
            ${zoneCase} AS zone,
            pa.final_score AS score,
            COALESCE((pa.scores ->> (${ROLE_CRITICAL_KEY}))::numeric, 0) AS role_critical,
            COALESCE((pa.scores ->> (${CONSISTENCY_KEY}))::numeric, 0) AS consistency,
            COALESCE(ps.total, 0) AS phase1_score
          FROM physical_assessments pa
          LEFT JOIN phase1_scores ps ON ps.registration_id = pa.registration_id
          WHERE pa.final_score IS NOT NULL
            AND pa.result = ANY(${sql.raw(`ARRAY[${ELIGIBLE_RESULTS.map(r => `'${r}'`).join(",")}]::text[]`)})
            AND pa.created_at <= ${cutoff.toISOString()}::timestamptz
        )
        SELECT
          registration_id, city, role, zone, score, role_critical, consistency, phase1_score,
          row_number() OVER (PARTITION BY zone, role ORDER BY ${rankOrder}) AS zone_role_rank,
          row_number() OVER (PARTITION BY role ORDER BY ${rankOrder}) AS national_role_rank,
          row_number() OVER (ORDER BY ${rankOrder}) AS overall_rank
        FROM eligible
        WHERE zone IS NOT NULL
      `);

      // aggregate diagnostics (SQL, not row loads)
      const popRow = await tx.execute(sql`
        SELECT
          (SELECT count(*) FROM physical_assessments pa
             WHERE pa.final_score IS NOT NULL
               AND pa.result = ANY(${sql.raw(`ARRAY[${ELIGIBLE_RESULTS.map(r => `'${r}'`).join(",")}]::text[]`)})
               AND pa.created_at <= ${cutoff.toISOString()}::timestamptz) AS population,
          (SELECT count(*) FROM sel_rank) AS eligible
      `);
      const pr = (popRow.rows?.[0] ?? {}) as { population?: string | number; eligible?: string | number };
      populationTotal = Number(pr.population ?? 0);
      eligibleTotal = Number(pr.eligible ?? 0);
      unmappedCityCount = populationTotal - eligibleTotal; // in-population but unmapped/no-zone

      const metricsVersion = cfg.metricsVersion;

      // ── zonal_allocation: pick top perZoneRoleQuota[role] per zone+role by zone_role_rank ──
      await assertOwned(tx, batchId, claimToken);
      await setPhase(tx, batchId, claimToken, "zonal_allocation");
      for (const zone of ZONES) {
        byZone[zone] = 0;
        for (const role of SELECTION_ROLES) {
          const quota = cfg.perZoneRoleQuota[role];
          if (quota <= 0) continue;
          // Ownership re-checked before every member INSERT.
          await assertOwned(tx, batchId, claimToken);
          const ins = await tx.execute(sql`
            INSERT INTO selection_batch_members
              (batch_id, registration_id, role, zone, city, selection_pool,
               raw_physical_score, zone_role_rank, national_role_rank, overall_rank,
               derived_metrics, metrics_version)
            SELECT
              ${batchId}::uuid, r.registration_id, r.role, r.zone, r.city, 'zonal',
              r.score, r.zone_role_rank, r.national_role_rank, r.overall_rank,
              jsonb_build_object(
                'rolePercentile', round((1 - (r.national_role_rank::numeric - 1) / NULLIF((SELECT count(*) FROM sel_rank s WHERE s.role = r.role),0)) * 100, 2),
                'zonePercentile', round((1 - (r.zone_role_rank::numeric - 1) / NULLIF((SELECT count(*) FROM sel_rank s WHERE s.role = r.role AND s.zone = r.zone),0)) * 100, 2),
                'roleCritical', r.role_critical,
                'consistency', r.consistency,
                'phase1Score', r.phase1_score
              ),
              ${metricsVersion}
            FROM sel_rank r
            WHERE r.zone = ${zone} AND r.role = ${role} AND r.zone_role_rank <= ${quota}
            RETURNING 1
          `);
          const got = ins.rowCount ?? (ins.rows?.length ?? 0);
          selectedTotal += got;
          byRole[role] += got;
          byZone[zone] += got;
          if (got < quota) {
            exceptions.push({
              type: "SELECTION_CONSTRAINT_EXCEPTION",
              scope: "zonal",
              zone, role,
              required: quota, eligible: got, shortfall: quota - got,
              message: `${zone} ${role.toUpperCase()} SHORTAGE — Required: ${quota}, Eligible: ${got}, Shortfall: ${quota - got}`,
            });
          }
        }
      }

      // ── wildcards: from REMAINING eligible (not already selected), top wildcardRoleQuota[role] nationally ──
      await assertOwned(tx, batchId, claimToken);
      await setPhase(tx, batchId, claimToken, "wildcards");
      for (const role of SELECTION_ROLES) {
        const quota = cfg.wildcardRoleQuota[role];
        if (quota <= 0) continue;
        // Ownership re-checked before every member INSERT.
        await assertOwned(tx, batchId, claimToken);
        const ins = await tx.execute(sql`
          WITH remaining AS (
            SELECT r.*,
                   row_number() OVER (PARTITION BY r.role ORDER BY ${rankOrder}) AS wildcard_rank
            FROM sel_rank r
            WHERE NOT EXISTS (
              SELECT 1 FROM selection_batch_members m
              WHERE m.batch_id = ${batchId}::uuid AND m.registration_id = r.registration_id
            )
          )
          INSERT INTO selection_batch_members
            (batch_id, registration_id, role, zone, city, selection_pool,
             raw_physical_score, zone_role_rank, national_role_rank, overall_rank,
             derived_metrics, metrics_version)
          SELECT
            ${batchId}::uuid, rm.registration_id, rm.role, rm.zone, rm.city, 'wildcard',
            rm.score, rm.zone_role_rank, rm.national_role_rank, rm.overall_rank,
            jsonb_build_object(
              'rolePercentile', round((1 - (rm.national_role_rank::numeric - 1) / NULLIF((SELECT count(*) FROM sel_rank s WHERE s.role = rm.role),0)) * 100, 2),
              'wildcardRank', rm.wildcard_rank,
              'roleCritical', rm.role_critical,
              'consistency', rm.consistency,
              'phase1Score', rm.phase1_score
            ),
            ${metricsVersion}
          FROM remaining rm
          WHERE rm.role = ${role} AND rm.wildcard_rank <= ${quota}
          RETURNING 1
        `);
        const got = ins.rowCount ?? (ins.rows?.length ?? 0);
        selectedTotal += got;
        byRole[role] += got;
        if (got < quota) {
          exceptions.push({
            type: "SELECTION_CONSTRAINT_EXCEPTION",
            scope: "wildcard",
            zone: "NATIONAL",
            role,
            required: quota, eligible: got, shortfall: quota - got,
            message: `NATIONAL WILDCARD ${role.toUpperCase()} SHORTAGE — Required: ${quota}, Eligible: ${got}, Shortfall: ${quota - got}`,
          });
        }
      }

      // ── validating: uniqueness is DB-enforced (batch+reg unique idx); assert totals ──
      await assertOwned(tx, batchId, claimToken);
      await setPhase(tx, batchId, claimToken, "validating");
      if (unmappedCityCount > 0) {
        exceptions.push({
          type: "UNMAPPED_CITY_EXCEPTION",
          scope: "population",
          zone: "—", role: "—",
          required: 0, eligible: 0, shortfall: unmappedCityCount,
          message: `${unmappedCityCount} completed physical-trial player(s) have a city not present in the configured zone mapping (version ${cfg.zoneMappingVersion}) and were excluded — map these cities or review.`,
        });
      }

      const counts = {
        populationTotal, eligible: eligibleTotal, selected: selectedTotal,
        targetTotal: cfg.totalPool, computedTargetTotal: computedTotal(cfg),
        byRole, byZone, unmappedCity: unmappedCityCount,
      };
      countsSnapshot = counts;

      // ── preview_ready ── FINAL status write is claim-guarded AND part of this
      // same transaction, so it commits atomically with the member INSERTs. A
      // 0-row result ⇒ ownership lost ⇒ throw ⇒ the whole tx rolls back (no
      // members persist, batch state untouched). We never return preview_ready
      // while the batch row is not actually updated.
      const finalized = await tx.update(selectionBatchesTable)
        .set({
          status: "preview_ready", jobPhase: "preview_ready", jobProgressPct: 100,
          counts, exceptionReport: exceptions, error: null,
          generatedAt: new Date(), claimToken: null, updatedAt: new Date(),
        })
        .where(and(
          eq(selectionBatchesTable.id, batchId),
          eq(selectionBatchesTable.claimToken, sql`${claimToken}::uuid`),
          eq(selectionBatchesTable.status, "generating"),
        ))
        .returning({ id: selectionBatchesTable.id });
      if (finalized.length === 0) throw new OwnershipLostError();
    });

    const counts = countsSnapshot ?? {};
    logger.info({ batchId, counts, exceptions: exceptions.length }, "Final 600 preview ready");
    return { status: "preview_ready", batchId, counts, exceptionReport: exceptions };
  } catch (e) {
    if (e instanceof OwnershipLostError) {
      // Ownership was lost mid-run: the transaction has rolled back (no members,
      // batch row untouched). Do NOT mark failed, do NOT report success.
      logger.warn({ batchId }, "Final 600 job aborted — claim ownership lost mid-run (no side effects, batch untouched)");
      return { status: "ownership_lost", batchId, error: "ownership lost — batch was reclaimed or invalidated mid-run" };
    }
    await failBatch(batchId, claimToken, e);
    return { status: "failed", batchId, error: String(e) };
  }
}

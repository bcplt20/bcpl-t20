/**
 * Points Table routes
 *
 * Public:
 *   GET  /api/points-table            – full season standings
 *
 * Admin:
 *   POST /api/admin/points-table/seed – seed initial 10-team data
 *   PUT  /api/admin/points-table/:team – update a team's row
 *   POST /api/admin/points-table/result – add win/loss/nr from a match result
 */

import { Router }  from "express";
import { db }      from "@workspace/db";
import { pointsTableEntries } from "@workspace/db/schema";
import { eq, and }            from "drizzle-orm";
import { requireAdmin }       from "../middlewares/adminAuth";
import { recomputePointsTable } from "../lib/pointsEngine";
import { z }                  from "zod";

const router = Router();

const SEASON5_SEED = [
  { team:"Kolkata Tigers",       played:12, won:9, lost:2, noResult:1, points:19, nrr: 1.245, form:["W","W","W","L","W"] },
  { team:"Mumbai Mavericks",     played:12, won:8, lost:3, noResult:1, points:17, nrr: 0.876, form:["W","W","L","W","W"] },
  { team:"Lucknow Nawabs",       played:12, won:7, lost:4, noResult:1, points:15, nrr: 0.543, form:["W","L","W","W","L"] },
  { team:"Hyderabad Hawks",      played:12, won:7, lost:5, noResult:0, points:14, nrr: 0.321, form:["W","W","L","W","L"] },
  { team:"Delhi Suryas",         played:12, won:6, lost:5, noResult:1, points:13, nrr: 0.112, form:["L","W","W","L","W"] },
  { team:"Chennai Thalaivas",    played:12, won:5, lost:6, noResult:1, points:11, nrr:-0.088, form:["W","L","L","W","L"] },
  { team:"Rajasthan Scorchers",  played:12, won:4, lost:7, noResult:1, points: 9, nrr:-0.234, form:["L","W","L","L","W"] },
  { team:"Punjab Warriors",      played:11, won:4, lost:7, noResult:0, points: 8, nrr:-0.456, form:["L","L","W","L","W"] },
  { team:"Bengaluru Rockets",    played:12, won:3, lost:8, noResult:1, points: 7, nrr:-0.678, form:["L","L","W","L","L"] },
  { team:"Ahmedabad Lions",      played:11, won:2, lost:9, noResult:0, points: 4, nrr:-1.234, form:["L","L","L","W","L"] },
];

/* ─── Public ────────────────────────────────────────── */

router.get("/", async (req, res) => {
  const season = Number(req.query.season) || 5;
  const rows = await db.select().from(pointsTableEntries)
    .where(eq(pointsTableEntries.season, season));
  // Sort by points desc, then nrr desc
  rows.sort((a, b) => b.points - a.points || b.nrr - a.nrr);
  // Expose nrr as a signed, 3-decimal number for the frontend.
  const table = rows.map((r) => ({
    ...r,
    nrr: Math.round(r.nrr * 1000) / 1000,
    nrrDisplay: (r.nrr >= 0 ? "+" : "") + (Math.round(r.nrr * 1000) / 1000).toFixed(3),
  }));
  res.json({ season, table });
});

/* ─── Admin ────────────────────────────────────────── */

// POST /api/admin/points-table/recompute — force a full idempotent recompute
// from completed matches (also runs automatically on every finalize/edit).
router.post("/admin/points-table/recompute", requireAdmin, async (req, res) => {
  const season = Number(req.body?.season) || Number(req.query.season) || 5;
  const standings = await recomputePointsTable(season);
  res.json({ success: true, season, standings });
});

// POST /api/admin/points-table/seed
router.post("/admin/points-table/seed", requireAdmin, async (req, res) => {
  const season = Number(req.body?.season) || 5;
  // Clear old entries for this season
  await db.delete(pointsTableEntries).where(eq(pointsTableEntries.season, season));
  await db.insert(pointsTableEntries).values(SEASON5_SEED.map(r => ({ ...r, season })));
  res.json({ success: true, seeded: SEASON5_SEED.length });
});

// PUT /api/admin/points-table/:team
router.put("/admin/points-table/:team", requireAdmin, async (req, res) => {
  const schema = z.object({
    played:   z.number().int().min(0).optional(),
    won:      z.number().int().min(0).optional(),
    lost:     z.number().int().min(0).optional(),
    noResult: z.number().int().min(0).optional(),
    nrr:      z.number().optional(),
    form:     z.array(z.enum(["W","L","N"])).max(10).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const season = Number(req.query.season) || 5;
  const [row] = await db.select().from(pointsTableEntries)
    .where(and(eq(pointsTableEntries.team, String(req.params.team)), eq(pointsTableEntries.season, season)))
    .limit(1);

  if (!row) return void res.status(404).json({ error: "Team not found in points table" });

  const updated = { ...parsed.data };
  // Recalculate points if won/noResult changed
  const won      = parsed.data.won      ?? row.won;
  const noResult = parsed.data.noResult ?? row.noResult;
  const points   = won * 2 + noResult * 1;

  const [newRow] = await db.update(pointsTableEntries)
    .set({ ...updated, points, updatedAt: new Date() })
    .where(eq(pointsTableEntries.id, row.id))
    .returning();

  res.json({ success: true, row: newRow });
});

// POST /api/admin/points-table/result  — DEPRECATED incremental endpoint.
//
// The points table is now the exclusive product of the automatic, idempotent
// recompute (see pointsEngine.recomputePointsTable), which rebuilds every row
// from completed matches. A manual per-match increment would be silently
// overwritten by the next auto recompute and could double-count in the interim,
// so this endpoint no longer mutates counters directly. It instead triggers a
// full, deterministic recompute for the season — the single source of truth.
router.post("/admin/points-table/result", requireAdmin, async (req, res) => {
  const schema = z.object({ season: z.number().int().default(5) });
  const parsed = schema.safeParse(req.body ?? {});
  const season = parsed.success ? parsed.data.season : 5;
  const standings = await recomputePointsTable(season);
  res.json({
    success: true,
    deprecated: true,
    note: "Points table is auto-recomputed from completed matches; this endpoint now just triggers a full recompute.",
    season,
    standings,
  });
});

export default router;

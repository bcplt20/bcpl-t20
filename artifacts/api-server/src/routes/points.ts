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
  res.json({ season, table: rows });
});

/* ─── Admin ────────────────────────────────────────── */

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

// POST /api/admin/points-table/result  — add W/L/NR from a completed match
router.post("/admin/points-table/result", requireAdmin, async (req, res) => {
  const schema = z.object({
    winner:   z.string().optional(),  // team name that won; omit for NR
    loser:    z.string().optional(),
    noResult: z.boolean().default(false),
    season:   z.number().int().default(5),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const { winner, loser, noResult: isNR, season } = parsed.data;

  const updateTeam = async (team: string, isWin: boolean, isNR: boolean) => {
    const [row] = await db.select().from(pointsTableEntries)
      .where(and(eq(pointsTableEntries.team, team), eq(pointsTableEntries.season, season))).limit(1);
    if (!row) return;

    const newPlayed   = row.played + 1;
    const newWon      = isWin ? row.won + 1 : row.won;
    const newLost     = (!isWin && !isNR) ? row.lost + 1 : row.lost;
    const newNR       = isNR ? row.noResult + 1 : row.noResult;
    const newPoints   = newWon * 2 + newNR;
    const newForm     = [...(row.form as string[]).slice(-4), isNR ? "N" : isWin ? "W" : "L"];

    await db.update(pointsTableEntries).set({
      played: newPlayed, won: newWon, lost: newLost, noResult: newNR,
      points: newPoints, form: newForm, updatedAt: new Date(),
    }).where(eq(pointsTableEntries.id, row.id));
  };

  if (isNR) {
    if (winner) await updateTeam(winner, false, true);
    if (loser)  await updateTeam(loser,  false, true);
  } else {
    if (winner) await updateTeam(winner, true,  false);
    if (loser)  await updateTeam(loser,  false, false);
  }

  res.json({ success: true });
});

export default router;

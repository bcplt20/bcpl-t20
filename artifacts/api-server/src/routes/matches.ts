/**
 * Match management routes
 *
 * Public:
 *   GET  /api/matches              – list matches (season, status filters)
 *   GET  /api/matches/:id          – match detail + current score
 *   GET  /api/matches/:id/live     – compact live score (polled by frontend every 5 s)
 *   GET  /api/matches/:id/scorecard – full batting + bowling scorecards
 *
 * Admin (x-bcpl-admin header):
 *   POST /api/admin/matches              – create match
 *   PUT  /api/admin/matches/:id/toss     – record toss result
 *   POST /api/admin/matches/:id/xi       – set playing XI for both teams
 *   PUT  /api/admin/matches/:id/status   – update match status
 *   DELETE /api/admin/matches/:id        – delete match + its scoring data (?force=1)
 */

import { Router }       from "express";
import { db }           from "@workspace/db";
import {
  matchesTable, inningsTable, deliveriesTable, matchXITable,
} from "@workspace/db/schema";
import { eq, and, desc, asc, inArray, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { pgCauseOf }    from "../lib/pgErrors";
import { z }            from "zod";

const router = Router();

/* ─── Helpers ─────────────────────────────────────────── */

/** Aggregate batting & bowling scorecards from deliveries */
async function buildScorecard(inningsId: string) {
  const deliveries = await db
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.inningsId, inningsId))
    .orderBy(asc(deliveriesTable.overNumber), asc(deliveriesTable.deliveryInOver));

  // Batting
  const batMap = new Map<string, {
    name: string; runs: number; balls: number; fours: number; sixes: number; dismissal: string;
  }>();

  // Bowling
  const bowlMap = new Map<string, {
    name: string; overs: number; balls: number; runs: number; wickets: number; wides: number; noBalls: number;
  }>();

  // Fall of wickets
  const fow: { wicket: number; batter: string; runs: number; overStr: string }[] = [];
  let totalWicketsNow = 0;

  for (const d of deliveries) {
    // Batting
    if (!batMap.has(d.batterName)) {
      batMap.set(d.batterName, { name: d.batterName, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: "" });
    }
    const bat = batMap.get(d.batterName)!;
    if (!d.extraType || d.extraType === "leg_bye" || d.extraType === "bye") {  // legal delivery counts for batter
      bat.balls++;
      bat.runs += d.runsOffBat;
      if (d.runsOffBat === 4) bat.fours++;
      if (d.runsOffBat === 6) bat.sixes++;
    }
    if (d.isWicket && d.dismissedBatter === d.batterName) {
      bat.dismissal = buildDismissalStr(d.dismissalType, d.fielderName, d.bowlerName);
    }

    // Bowling
    if (!bowlMap.has(d.bowlerName)) {
      bowlMap.set(d.bowlerName, { name: d.bowlerName, overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 });
    }
    const bowl = bowlMap.get(d.bowlerName)!;
    bowl.runs += d.totalRuns;
    if (!d.extraType || d.extraType === "leg_bye" || d.extraType === "bye") {
      bowl.balls++;
      if (bowl.balls === 6) { bowl.overs++; bowl.balls = 0; }
    }
    if (d.extraType === "wide")    bowl.wides++;
    if (d.extraType === "no_ball") bowl.noBalls++;
    if (d.isWicket && d.dismissalType !== "run_out" && d.dismissalType !== "retired_hurt") {
      bowl.wickets++;
    }

    // FoW
    if (d.isWicket) {
      totalWicketsNow++;
      const innsRow = await db.select().from(inningsTable).where(eq(inningsTable.id, inningsId)).limit(1);
      fow.push({ wicket: totalWicketsNow, batter: d.dismissedBatter || d.batterName,
        runs: innsRow[0]?.totalRuns ?? 0, overStr: `${d.overNumber}.${d.ballInOver}` });
    }
  }

  return {
    batting: Array.from(batMap.values()),
    bowling: Array.from(bowlMap.values()),
    fallOfWickets: fow,
  };
}

function buildDismissalStr(
  type: string | null | undefined,
  fielder: string | null | undefined,
  bowler: string | null | undefined,
): string {
  if (!type) return "";
  const b = bowler || "?";
  const f = fielder || "?";
  if (type === "bowled")          return `b ${b}`;
  if (type === "caught")          return `c ${f} b ${b}`;
  if (type === "lbw")             return `lbw b ${b}`;
  if (type === "run_out")         return `run out (${f})`;
  if (type === "stumped")         return `st ${f} b ${b}`;
  if (type === "hit_wicket")      return `hit wicket b ${b}`;
  if (type === "caught_and_bowled") return `c & b ${b}`;
  if (type === "retired_hurt")    return "retired hurt";
  return "dismissed";
}

/* ─── Public routes ──────────────────────────────────── */

// GET /api/matches
router.get("/", async (req, res) => {
  const season = Number(req.query.season) || 5;
  const status = req.query.status as string | undefined;

  let q = db.select().from(matchesTable).where(eq(matchesTable.season, season)).$dynamic();
  if (status) q = q.where(eq(matchesTable.status, status)) as any;

  const rows = await (q as any).orderBy(asc(matchesTable.matchNo));
  res.json({ matches: rows });
});

// GET /api/matches/:id
router.get("/:id", async (req, res) => {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.id))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  const innings = await db.select().from(inningsTable)
    .where(eq(inningsTable.matchId, match.id))
    .orderBy(asc(inningsTable.inningsNumber));

  res.json({ match, innings });
});

// GET /api/matches/:id/live  (compact — polled every 5s by public website)
router.get("/:id/live", async (req, res) => {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.id))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  const innings = await db.select().from(inningsTable)
    .where(eq(inningsTable.matchId, match.id))
    .orderBy(asc(inningsTable.inningsNumber));

  // Last 6 deliveries for commentary
  const latest = await db.select().from(deliveriesTable)
    .where(eq(deliveriesTable.inningsId, innings[innings.length - 1]?.id ?? ""))
    .orderBy(desc(deliveriesTable.createdAt))
    .limit(6);

  res.json({
    matchId:   match.id,
    matchNo:   match.matchNo,
    team1:     match.team1,
    team2:     match.team2,
    venue:     match.venue,
    status:    match.status,
    winner:    match.winner,
    resultDesc:match.resultDesc,
    innings:   innings.map(i => ({
      number:       i.inningsNumber,
      battingTeam:  i.battingTeam,
      bowlingTeam:  i.bowlingTeam,
      totalRuns:    i.totalRuns,
      totalWickets: i.totalWickets,
      overs:        i.overs,
      balls:        i.balls,
      extras:       i.extras,
      target:       i.target,
      status:       i.status,
    })),
    recentDeliveries: latest.map(d => ({
      over:       `${d.overNumber}.${d.ballInOver}`,
      runs:       d.totalRuns,
      isWicket:   d.isWicket,
      commentary: d.commentary,
    })),
  });
});

// GET /api/matches/:id/scorecard
router.get("/:id/scorecard", async (req, res) => {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.id))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  const innings = await db.select().from(inningsTable)
    .where(eq(inningsTable.matchId, match.id))
    .orderBy(asc(inningsTable.inningsNumber));

  const scorecards = await Promise.all(innings.map(async i => ({
    innings:     i,
    scorecard:   await buildScorecard(i.id),
  })));

  res.json({ match, scorecards });
});

/* ─── Admin routes ───────────────────────────────────── */

// POST /api/admin/matches
router.post("/admin/matches", requireAdmin, async (req, res) => {
  const schema = z.object({
    matchNo:     z.number().int().positive(),
    season:      z.number().int().default(5),
    team1:       z.string().min(2).max(80),
    team2:       z.string().min(2).max(80),
    venue:       z.string().min(2).max(150),
    scheduledAt: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const [match] = await db.insert(matchesTable).values({
    ...parsed.data,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    status: "scheduled",
  }).returning();

  res.json({ success: true, match });
});

// PUT /api/admin/matches/:id/toss
router.put("/admin/matches/:id/toss", requireAdmin, async (req, res) => {
  const schema = z.object({
    tossWinner:   z.string().min(2).max(80),
    tossDecision: z.enum(["bat", "field"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const [match] = await db.update(matchesTable)
    .set({ ...parsed.data, status: "toss_done", updatedAt: new Date() })
    .where(eq(matchesTable.id, String(req.params.id)))
    .returning();

  if (!match) return void res.status(404).json({ error: "Match not found" });
  res.json({ success: true, match });
});

// POST /api/admin/matches/:id/xi  — set playing XI for both teams
router.post("/admin/matches/:id/xi", requireAdmin, async (req, res) => {
  const schema = z.object({
    xi1: z.array(z.object({ name: z.string(), role: z.enum(["BAT","BOWL","AR","WK"]) })).length(11),
    xi2: z.array(z.object({ name: z.string(), role: z.enum(["BAT","BOWL","AR","WK"]) })).length(11),
    battingTeam: z.string(), // which team bats first
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, String(req.params.id))).limit(1);
  if (!match) return void res.status(404).json({ error: "Match not found" });

  const { xi1, xi2, battingTeam } = parsed.data;
  const isTeam1Batting = battingTeam === match.team1;
  const bowlingTeam    = isTeam1Batting ? match.team2 : match.team1;

  // Re-setup = clean restart: wipe old XI records AND any existing innings
  // (deliveries cascade with innings) so a match can never end up with
  // duplicate innings-1 rows after a browser refresh + re-setup.
  await db.delete(matchXITable).where(eq(matchXITable.matchId, match.id));
  await db.delete(inningsTable).where(eq(inningsTable.matchId, match.id));

  // Insert XI records
  const xiRows = [
    ...xi1.map((p, i) => ({ matchId: match.id, team: match.team1, playerName: p.name, playerRole: p.role, battingOrder: i + 1, isPlaying: true })),
    ...xi2.map((p, i) => ({ matchId: match.id, team: match.team2, playerName: p.name, playerRole: p.role, battingOrder: i + 1, isPlaying: true })),
  ];
  await db.insert(matchXITable).values(xiRows);

  // Create 1st innings
  const batXI  = isTeam1Batting ? xi1.map(p=>p.name) : xi2.map(p=>p.name);
  const bowlXI = isTeam1Batting ? xi2.map(p=>p.name) : xi1.map(p=>p.name);

  const [innings] = await db.insert(inningsTable).values({
    matchId:       match.id,
    inningsNumber: 1,
    battingTeam,
    bowlingTeam,
    battingXI: batXI,
    bowlingXI: bowlXI,
    status: "live",
  }).returning();

  // Update match status
  await db.update(matchesTable)
    .set({ status: "live", updatedAt: new Date() })
    .where(eq(matchesTable.id, match.id));

  res.json({ success: true, innings });
});

// PUT /api/admin/matches/:id/status
router.put("/admin/matches/:id/status", requireAdmin, async (req, res) => {
  const schema = z.object({
    status:        z.enum(["scheduled","toss_done","xi_selected","live","innings2","completed","abandoned"]),
    winner:        z.string().optional(),
    resultDesc:    z.string().optional(),
    playerOfMatch: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: parsed.error.issues[0].message });

  const [match] = await db.update(matchesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(matchesTable.id, String(req.params.id)))
    .returning();

  if (!match) return void res.status(404).json({ error: "Match not found" });
  res.json({ success: true, match });
});

/* ── Generic recursive FK sweep for match deletion ────────────────────────
   sweepFkDelete removes the rows of `table` matching (keyColumn IN keyValues)
   plus EVERYTHING that transitively references them, walking real FK edges
   from pg_constraint (single-column FKs, keyed on OIDs — constraint NAMES are
   not unique across tables, so name-based information_schema joins can
   cross-associate). Children are deleted before their parents (post-order),
   so NO ACTION constraints on tables this build has never heard of — at any
   depth, including children of match_xi and FKs referencing columns other
   than id — cannot block the delete.

   Self-referencing tables (thread/hierarchy style) are expanded to closure:
   rows chained onto doomed rows via the self-FK are deleted with them.
   Cycles ACROSS tables are not expanded (the edge back to an ancestor is
   skipped) — if such a topology still blocks the delete it surfaces as a 409
   naming the table, never a blank 500. Composite FKs likewise fall through
   to the named 23503 handler. */
type SweepTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type SweepWarn = (obj: Record<string, unknown>, msg: string) => void;
const SWEEP_MAX_DEPTH = 6;
const SWEEP_OWN_TABLES = new Set(["matches", "innings", "deliveries", "match_xi"]);

type FkEdge = { child_schema: string; child_table: string; child_column: string; parent_column: string };

async function sweepFkDelete(
  tx: SweepTx,
  schema: string,
  table: string,
  keyColumn: string,
  keyValues: unknown[],
  ancestors: string[],
  warn: SweepWarn,
): Promise<void> {
  if (keyValues.length === 0) return;
  if (ancestors.length >= SWEEP_MAX_DEPTH) {
    throw new Error(`FK sweep exceeded depth ${SWEEP_MAX_DEPTH} at ${schema}.${table} — possible FK cycle`);
  }
  const here = `${schema}.${table}`;
  const edgesRes = await tx.execute(sql`
    SELECT child_ns.nspname AS child_schema,
           child.relname    AS child_table,
           att.attname      AS child_column,
           (SELECT a.attname FROM pg_attribute a
            WHERE a.attrelid = con.confrelid AND a.attnum = con.confkey[1]) AS parent_column
    FROM pg_constraint con
    JOIN pg_class child        ON child.oid    = con.conrelid
    JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
    JOIN pg_attribute att      ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND cardinality(con.conkey) = 1
      AND con.confrelid = (SELECT c.oid FROM pg_class c
                           JOIN pg_namespace n ON n.oid = c.relnamespace
                           WHERE n.nspname = ${schema} AND c.relname = ${table})
  `);
  const edges = edgesRes.rows as unknown as FkEdge[];

  /* Self-FK closure: keep absorbing rows that hang onto already-doomed rows
     until nothing new appears, so deleting a chained hierarchy in one
     statement cannot orphan a survivor. */
  const selfEdges = edges.filter(e => `${e.child_schema}.${e.child_table}` === here);
  let idColumn: string | null = null;
  const closureIds: unknown[] = [];
  if (selfEdges.length > 0) {
    idColumn = selfEdges[0].parent_column;
    const identityCols = new Set(selfEdges.map(e => e.parent_column));
    if (identityCols.size > 1) {
      // Multiple identity columns in self-FKs — vanishingly rare; the extra
      // edge falls back to the named-409 path instead of silent mishandling.
      warn({ table: here, columns: [...identityCols] },
        "match delete: multiple self-FK identity columns, closure uses the first");
    }
    const seed = await tx.execute(sql`
      SELECT DISTINCT ${sql.identifier(idColumn)} AS v
      FROM ${sql.identifier(schema)}.${sql.identifier(table)}
      WHERE ${sql.identifier(keyColumn)} IN (${sql.join(keyValues.map(v => sql`${v}`), sql`, `)})
        AND ${sql.identifier(idColumn)} IS NOT NULL
    `);
    const seen = new Set<string>();
    let frontier: unknown[] = [];
    for (const row of seed.rows as Array<{ v: unknown }>) {
      if (!seen.has(String(row.v))) { seen.add(String(row.v)); frontier.push(row.v); closureIds.push(row.v); }
    }
    for (let round = 0; frontier.length > 0; round++) {
      if (round >= 32) throw new Error(`FK sweep: self-reference closure on ${here} did not converge`);
      const next: unknown[] = [];
      for (const se of selfEdges) {
        if (se.parent_column !== idColumn) continue;
        const r = await tx.execute(sql`
          SELECT DISTINCT ${sql.identifier(idColumn)} AS v
          FROM ${sql.identifier(schema)}.${sql.identifier(table)}
          WHERE ${sql.identifier(se.child_column)} IN (${sql.join(frontier.map(v => sql`${v}`), sql`, `)})
            AND ${sql.identifier(idColumn)} IS NOT NULL
        `);
        for (const row of r.rows as Array<{ v: unknown }>) {
          if (!seen.has(String(row.v))) { seen.add(String(row.v)); next.push(row.v); closureIds.push(row.v); }
        }
      }
      frontier = next;
    }
  }

  // Delete-set predicate: the caller's key match, plus the self-closure.
  const pred = () => {
    const kv = sql`${sql.identifier(keyColumn)} IN (${sql.join(keyValues.map(v => sql`${v}`), sql`, `)})`;
    if (!idColumn || closureIds.length === 0) return kv;
    return sql`(${kv} OR ${sql.identifier(idColumn)} IN (${sql.join(closureIds.map(v => sql`${v}`), sql`, `)}))`;
  };

  for (const edge of edges) {
    const childKey = `${edge.child_schema}.${edge.child_table}`;
    if (childKey === here) continue;              // handled by the closure above
    if (ancestors.includes(childKey)) continue;   // cross-table cycle → named 409 fallback
    // Values of the REFERENCED parent column for the rows being deleted
    // (usually id, but an FK may reference any unique column).
    let refValues: unknown[];
    if (edge.parent_column === keyColumn && closureIds.length === 0) {
      refValues = keyValues;
    } else {
      const r = await tx.execute(sql`
        SELECT DISTINCT ${sql.identifier(edge.parent_column)} AS v
        FROM ${sql.identifier(schema)}.${sql.identifier(table)}
        WHERE ${pred()}
          AND ${sql.identifier(edge.parent_column)} IS NOT NULL
      `);
      refValues = (r.rows as Array<{ v: unknown }>).map(x => x.v);
    }
    if (refValues.length === 0) continue;
    // The child call deletes its own rows after clearing its descendants.
    await sweepFkDelete(tx, edge.child_schema, edge.child_table, edge.child_column, refValues, [...ancestors, here], warn);
  }

  const deleted = await tx.execute(sql`
    DELETE FROM ${sql.identifier(schema)}.${sql.identifier(table)}
    WHERE ${pred()}
  `);
  const n = Number((deleted as { rowCount?: number | null }).rowCount ?? 0);
  if (n > 0 && !SWEEP_OWN_TABLES.has(table)) {
    warn({ legacyTable: here, rows: n },
      "match delete: cleared rows from table not in this build's schema");
  }
}

// DELETE /api/admin/matches/:id
// Removes a match and all its scoring data (innings, deliveries, XI).
// If the match already has scoring data (innings / deliveries), the caller
// must pass ?force=1 to confirm; otherwise a 409 is returned describing what
// will be lost. All deletes are child-first via the recursive FK sweep, and
// EVERY failure path returns its real cause — never a blank 500.
router.delete("/admin/matches/:id", requireAdmin, async (req, res) => {
  const matchId = String(req.params.id);

  try {
    const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
    if (!match) return void res.status(404).json({ error: "Match not found" });

    const force = req.query.force === "1" || req.query.force === "true";

    // Confirm-prompt precheck (read-only): when not forcing, describe what a
    // force delete would destroy. The authoritative snapshot is re-taken
    // INSIDE the transaction below, so rows appearing between this read and
    // the delete cannot slip through.
    if (!force) {
      const innings = await db.select({ id: inningsTable.id }).from(inningsTable)
        .where(eq(inningsTable.matchId, matchId));
      let deliveryCount = 0;
      if (innings.length > 0) {
        const deliveries = await db.select({ id: deliveriesTable.id }).from(deliveriesTable)
          .where(inArray(deliveriesTable.inningsId, innings.map(i => i.id)));
        deliveryCount = deliveries.length;
      }
      if (innings.length > 0 || deliveryCount > 0) {
        const lost: string[] = [];
        if (innings.length > 0) lost.push(`${innings.length} innings`);
        if (deliveryCount > 0)  lost.push(`${deliveryCount} scored deliveries`);
        return void res.status(409).json({
          error: `This match has score data. Deleting it will permanently remove ${lost.join(" and ")}. Retry with force to confirm.`,
          requiresForce: true,
          willLose: { innings: innings.length, deliveries: deliveryCount },
        });
      }
    }

    /* The production database has outlived several schema versions (the
       deploy schema push is best-effort), so tables UNKNOWN to this build
       may still hold rows pointing at this match — a plain delete then dies
       with an FK violation. A confirmed delete promises "the match and
       everything attached goes": walk the whole FK graph hanging off this
       match and delete child-first in one transaction (sweepFkDelete). */
    await db.transaction(async (tx) => {
      // Authoritative snapshot inside the transaction.
      const inn = await tx.select({ id: inningsTable.id }).from(inningsTable)
        .where(eq(inningsTable.matchId, matchId));
      const inningsIds = inn.map(i => i.id);
      let deliveryIds: string[] = [];
      if (inningsIds.length > 0) {
        const del = await tx.select({ id: deliveriesTable.id }).from(deliveriesTable)
          .where(inArray(deliveriesTable.inningsId, inningsIds));
        deliveryIds = del.map(d => d.id);
      }
      // Scoring rows appeared between the precheck and this transaction —
      // the admin's earlier confirmation does not cover them.
      if (!force && (inningsIds.length > 0 || deliveryIds.length > 0)) {
        throw Object.assign(new Error("scoring data appeared mid-delete"), { scoringDataAppeared: true });
      }

      await sweepFkDelete(tx, "public", "matches", "id", [matchId], [],
        (obj, msg) => req.log.warn(obj, msg));
    });
  } catch (err) {
    if ((err as { scoringDataAppeared?: boolean } | null)?.scoringDataAppeared) {
      return void res.status(409).json({
        error: "Score data was just recorded for this match. Refresh and retry with force to confirm deleting it too.",
        requiresForce: true,
      });
    }
    const pg = pgCauseOf(err);
    if (pg?.code === "23503") {
      // Still blocked by a foreign key (composite-FK child, cross-table
      // cycle) — say WHICH table instead of a blank 500, and log the detail.
      req.log.error({ pg, matchId }, "match delete blocked by foreign key");
      return void res.status(409).json({
        error: `Match cannot be deleted yet: rows in table "${pg.table ?? "unknown"}" still reference it (constraint ${pg.constraint ?? "?"}). Please share this message with support.`,
      });
    }
    if (pg) {
      // Any other database error (permission denied on a legacy table, a
      // legacy trigger calling a dropped function, …) — surface the real
      // cause to the admin instead of a blank "Internal server error".
      req.log.error({ pg, matchId }, "match delete failed (database error)");
      return void res.status(500).json({
        error: `Match delete failed [DB ${pg.code}${pg.table ? ` on "${pg.table}"` : ""}]: ${pg.message ?? "database error"}. Please share this message with support.`,
      });
    }
    req.log.error({ err: err instanceof Error ? err.message : String(err), matchId }, "match delete failed");
    return void res.status(500).json({
      error: `Match delete failed: ${err instanceof Error ? err.message : "unknown error"}. Please share this message with support.`,
    });
  }

  res.json({ success: true });
});

export default router;

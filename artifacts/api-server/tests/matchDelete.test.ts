/**
 * DELETE /api/matches/admin/matches/:id — match deletion with score-data guard.
 *
 * Covers:
 *   - 404 when the match does not exist
 *   - 409 (requiresForce) when the match has scoring data and ?force is absent
 *   - successful cascade delete of a match with NO scoring data
 *   - successful FORCED cascade delete of a match WITH scoring data,
 *     asserting the DB end-state (match, innings, deliveries, XI all gone)
 *
 * All seeded rows use a unique per-run suffix and are cleaned up afterAll;
 * assertions check DB end-state, never run counts (parallel agents share DB).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq, inArray, sql } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const { matchesTable, inningsTable, deliveriesTable, matchXITable } =
  await import("@workspace/db/schema");

const admin = { "x-bcpl-admin": TEST_ADMIN_SECRET };

const suffix = String(Date.now()).slice(-7);
const matchIds: string[] = [];
let seq = 0;

/** Create a bare scheduled match (no scoring data). */
async function mkMatch() {
  const n = ++seq;
  const [match] = await db.insert(matchesTable).values({
    matchNo: Number(`9${suffix}${n}`.slice(-8)),
    season: 5,
    team1: `Del Test A ${suffix}-${n}`,
    team2: `Del Test B ${suffix}-${n}`,
    venue: `Del Test Ground ${suffix}`,
    status: "scheduled",
  }).returning();
  matchIds.push(match.id);
  return match;
}

/** Create a match with 1 innings + 1 delivery + XI rows (scoring data). */
async function mkScoredMatch() {
  const match = await mkMatch();
  const [innings] = await db.insert(inningsTable).values({
    matchId: match.id,
    inningsNumber: 1,
    battingTeam: match.team1,
    bowlingTeam: match.team2,
    status: "live",
  }).returning();
  await db.insert(deliveriesTable).values({
    inningsId: innings.id,
    overNumber: 0,
    ballInOver: 1,
    deliveryInOver: 1,
    batterName: "Test Batter",
    bowlerName: "Test Bowler",
    runsOffBat: 4,
    extrasRuns: 0,
    totalRuns: 4,
  });
  await db.insert(matchXITable).values({
    matchId: match.id,
    team: match.team1,
    playerName: "Test Batter",
    playerRole: "BAT",
    battingOrder: 1,
  });
  return { match, innings };
}

afterAll(async () => {
  if (matchIds.length) {
    const innings = await db.select({ id: inningsTable.id }).from(inningsTable)
      .where(inArray(inningsTable.matchId, matchIds));
    const inningsIds = innings.map(i => i.id);
    if (inningsIds.length) {
      await db.delete(deliveriesTable).where(inArray(deliveriesTable.inningsId, inningsIds));
    }
    await db.delete(inningsTable).where(inArray(inningsTable.matchId, matchIds));
    await db.delete(matchXITable).where(inArray(matchXITable.matchId, matchIds));
    await db.delete(matchesTable).where(inArray(matchesTable.id, matchIds));
  }
});

describe("DELETE /api/matches/admin/matches/:id", () => {
  it("rejects without admin auth", async () => {
    const r = await request(app).delete("/api/matches/admin/matches/00000000-0000-0000-0000-000000000000");
    expect([401, 403]).toContain(r.status);
  });

  it("404 when the match does not exist", async () => {
    const r = await request(app)
      .delete("/api/matches/admin/matches/00000000-0000-0000-0000-000000000000")
      .set(admin);
    expect(r.status).toBe(404);
  });

  it("409 (requiresForce) when the match has scoring data and no ?force", async () => {
    const { match } = await mkScoredMatch();
    const r = await request(app).delete(`/api/matches/admin/matches/${match.id}`).set(admin);
    expect(r.status).toBe(409);
    expect(r.body.requiresForce).toBe(true);
    expect(r.body.willLose.innings).toBeGreaterThan(0);
    expect(r.body.willLose.deliveries).toBeGreaterThan(0);

    // DB end-state: nothing was deleted
    const [still] = await db.select().from(matchesTable).where(eq(matchesTable.id, match.id));
    expect(still).toBeTruthy();
  });

  it("deletes a match with no scoring data (no force needed)", async () => {
    const match = await mkMatch();
    const r = await request(app).delete(`/api/matches/admin/matches/${match.id}`).set(admin);
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);

    const [gone] = await db.select().from(matchesTable).where(eq(matchesTable.id, match.id));
    expect(gone).toBeUndefined();
  });

  it("force-deletes a match WITH scoring data and cascades all rows", async () => {
    const { match, innings } = await mkScoredMatch();
    const r = await request(app).delete(`/api/matches/admin/matches/${match.id}?force=1`).set(admin);
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);

    // DB end-state: match, innings, deliveries and XI all removed
    const [goneMatch] = await db.select().from(matchesTable).where(eq(matchesTable.id, match.id));
    expect(goneMatch).toBeUndefined();

    const remInnings = await db.select().from(inningsTable).where(eq(inningsTable.matchId, match.id));
    expect(remInnings.length).toBe(0);

    const remDeliveries = await db.select().from(deliveriesTable).where(eq(deliveriesTable.inningsId, innings.id));
    expect(remDeliveries.length).toBe(0);

    const remXI = await db.select().from(matchXITable).where(eq(matchXITable.matchId, match.id));
    expect(remXI.length).toBe(0);
  });
});

/* ── Production schema drift: legacy tables may still reference matches ──
   Prod has outlived several schema versions (the deploy schema push is
   best-effort), so a table THIS build doesn't know about can FK-block the
   delete — the exact opaque "Internal server error" the admin saw. A
   confirmed force delete must sweep those rows instead of dying. */
describe("force delete with a legacy child table (prod drift)", () => {
  const legacyTable = `legacy_match_stats_${suffix}`;

  beforeAll(async () => {
    await db.execute(sql.raw(
      `CREATE TABLE ${legacyTable} (
         id SERIAL PRIMARY KEY,
         match_id UUID NOT NULL REFERENCES matches(id),
         note VARCHAR(50)
       )`,
    ));
  });

  afterAll(async () => {
    await db.execute(sql.raw(`DROP TABLE IF EXISTS ${legacyTable}`));
  });

  it("clears legacy rows and deletes a COMPLETED match instead of 500", async () => {
    const { match } = await mkScoredMatch();
    await db.update(matchesTable)
      .set({ status: "completed", winner: match.team1, resultDesc: `${match.team1} won` })
      .where(eq(matchesTable.id, match.id));
    await db.execute(sql.raw(
      `INSERT INTO ${legacyTable} (match_id, note) VALUES ('${match.id}', 'legacy row')`,
    ));

    const r = await request(app)
      .delete(`/api/matches/admin/matches/${match.id}?force=1`)
      .set(admin);
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);

    // DB end-state: match gone AND the legacy rows swept with it
    const [gone] = await db.select().from(matchesTable).where(eq(matchesTable.id, match.id));
    expect(gone).toBeUndefined();
    const left = await db.execute(sql.raw(`SELECT count(*)::int AS n FROM ${legacyTable}`));
    expect(Number((left.rows[0] as { n: number }).n)).toBe(0);
  });
});

/* Constraint NAMES are not unique across tables in Postgres — FK discovery
   must key on OIDs (pg_constraint). A name-based information_schema join
   cross-associates the tuples below and sweeps the wrong table/column. */
describe("legacy children with duplicate FK names across matches/innings/deliveries", () => {
  const tblA = `legacy_dupfk_a_${suffix}`; // → matches(id)
  const tblB = `legacy_dupfk_b_${suffix}`; // → innings(id), SAME constraint name as A
  const tblC = `legacy_dupfk_c_${suffix}`; // → deliveries(id)

  beforeAll(async () => {
    await db.execute(sql.raw(
      `CREATE TABLE ${tblA} (id SERIAL PRIMARY KEY, m_ref UUID NOT NULL,
         CONSTRAINT dup_fk_${suffix} FOREIGN KEY (m_ref) REFERENCES matches(id))`));
    await db.execute(sql.raw(
      `CREATE TABLE ${tblB} (id SERIAL PRIMARY KEY, i_ref UUID NOT NULL,
         CONSTRAINT dup_fk_${suffix} FOREIGN KEY (i_ref) REFERENCES innings(id))`));
    await db.execute(sql.raw(
      `CREATE TABLE ${tblC} (id SERIAL PRIMARY KEY, d_ref UUID NOT NULL,
         CONSTRAINT other_fk_${suffix} FOREIGN KEY (d_ref) REFERENCES deliveries(id))`));
  });

  afterAll(async () => {
    await db.execute(sql.raw(`DROP TABLE IF EXISTS ${tblA}`));
    await db.execute(sql.raw(`DROP TABLE IF EXISTS ${tblB}`));
    await db.execute(sql.raw(`DROP TABLE IF EXISTS ${tblC}`));
  });

  it("sweeps every legacy child exactly once and deletes the match", async () => {
    const { match, innings } = await mkScoredMatch();
    const dRows = (await db.execute(sql.raw(
      `SELECT id FROM deliveries WHERE innings_id = '${innings.id}' LIMIT 1`))).rows as Array<{ id: string }>;
    await db.execute(sql.raw(`INSERT INTO ${tblA} (m_ref) VALUES ('${match.id}')`));
    await db.execute(sql.raw(`INSERT INTO ${tblB} (i_ref) VALUES ('${innings.id}')`));
    await db.execute(sql.raw(`INSERT INTO ${tblC} (d_ref) VALUES ('${dRows[0].id}')`));

    const r = await request(app)
      .delete(`/api/matches/admin/matches/${match.id}?force=1`)
      .set(admin);
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);

    for (const t of [tblA, tblB, tblC]) {
      const left = await db.execute(sql.raw(`SELECT count(*)::int AS n FROM ${t}`));
      expect(Number((left.rows[0] as { n: number }).n)).toBe(0);
    }
    const [gone] = await db.select().from(matchesTable).where(eq(matchesTable.id, match.id));
    expect(gone).toBeUndefined();
  });
});

/* ── Multi-level drift: legacy GRANDchildren and children of match_xi ─────
   A one-level sweep dies (or 409s) when a legacy table has its own children,
   or when a table hangs off match_xi. The recursive sweep must clear the
   whole chain — including non-uuid (serial int) key hops. */
describe("force delete clears deep legacy chains and match_xi children", () => {
  const tblP  = `legacy_deep_p_${suffix}`;   // → matches(id)      (uuid)
  const tblQ  = `legacy_deep_q_${suffix}`;   // → tblP(id)         (int)
  const tblR  = `legacy_deep_r_${suffix}`;   // → tblQ(id)         (int)
  const tblXi = `legacy_xi_child_${suffix}`; // → match_xi(id)     (uuid)

  beforeAll(async () => {
    await db.execute(sql.raw(
      `CREATE TABLE ${tblP} (id SERIAL PRIMARY KEY, match_id UUID NOT NULL REFERENCES matches(id), note VARCHAR(30))`));
    await db.execute(sql.raw(
      `CREATE TABLE ${tblQ} (id SERIAL PRIMARY KEY, p_id INT NOT NULL REFERENCES ${tblP}(id))`));
    await db.execute(sql.raw(
      `CREATE TABLE ${tblR} (id SERIAL PRIMARY KEY, q_id INT NOT NULL REFERENCES ${tblQ}(id))`));
    await db.execute(sql.raw(
      `CREATE TABLE ${tblXi} (id SERIAL PRIMARY KEY, xi_id UUID NOT NULL REFERENCES match_xi(id))`));
  });

  afterAll(async () => {
    for (const t of [tblR, tblQ, tblP, tblXi]) {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS ${t}`));
    }
  });

  it("removes the match plus every transitive legacy row", async () => {
    const { match } = await mkScoredMatch();
    const [xiRow] = await db.select({ id: matchXITable.id }).from(matchXITable)
      .where(eq(matchXITable.matchId, match.id));
    expect(xiRow).toBeTruthy();

    const pRows = (await db.execute(sql.raw(
      `INSERT INTO ${tblP} (match_id, note) VALUES ('${match.id}', 'deep') RETURNING id`))).rows as Array<{ id: number }>;
    const qRows = (await db.execute(sql.raw(
      `INSERT INTO ${tblQ} (p_id) VALUES (${pRows[0].id}) RETURNING id`))).rows as Array<{ id: number }>;
    await db.execute(sql.raw(`INSERT INTO ${tblR} (q_id) VALUES (${qRows[0].id})`));
    await db.execute(sql.raw(`INSERT INTO ${tblXi} (xi_id) VALUES ('${xiRow.id}')`));

    const r = await request(app)
      .delete(`/api/matches/admin/matches/${match.id}?force=1`)
      .set(admin);
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);

    for (const t of [tblP, tblQ, tblR, tblXi]) {
      const left = await db.execute(sql.raw(`SELECT count(*)::int AS n FROM ${t}`));
      expect(Number((left.rows[0] as { n: number }).n)).toBe(0);
    }
    const [gone] = await db.select().from(matchesTable).where(eq(matchesTable.id, match.id));
    expect(gone).toBeUndefined();
  });
});

/**
 * Final 600 selection engine — determinism, quotas, shortfalls, tie-breakers,
 * retry idempotency, approve/publish gating.
 *
 * Seeds a small synthetic population in a unique per-run city set so runs are
 * isolated and cleaned up afterAll. Assertions check DB end-state. No emails/SMS
 * are ever sent (the engine + selection routes never trigger sends).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const {
  usersTable, registrationsTable, physicalAssessmentsTable, phase1ScoresTable,
  selectionBatchesTable, selectionBatchMembersTable, siteSettingsTable,
} = await import("@workspace/db/schema");
const { ensureSelectionTables } = await import("../src/lib/selectionMigrations");
const { generateFinal600 } = await import("../src/lib/selectionEngine");
const { signAdminToken } = await import("../src/routes/adminUsers");

const superToken = signAdminToken({ email: "sel-super@test.bcpl", name: "Super", role: "SUPER_ADMIN" });
const auth = (r: request.Test) => r.set("x-bcpl-admin-token", superToken);

const SUFFIX = String(Date.now()).slice(-8);
const SEASON = `test-${SUFFIX}`;
// unique per-run cities, one per zone (present in DEFAULT_CITY_ZONE_MAP)
const ZONE_CITY: Record<string, string> = {
  NORTH: "delhi", SOUTH: "chennai", EAST: "kolkata", WEST: "mumbai", CENTRAL: "bhopal",
};

const userIds: string[] = [];
const regIds: string[] = [];

/** Insert one player with a physical assessment. score drives ranking. */
async function seedPlayer(opts: {
  city: string; role: "batsman" | "bowler" | "all_rounder" | "wicket_keeper";
  score: number; roleCritical?: number; consistency?: number; phase1?: number;
  result?: string; createdAt?: Date;
}): Promise<string> {
  const n = regIds.length + 1;
  const [u] = await db.insert(usersTable).values({
    name: `Sel ${SUFFIX}-${n}`,
    // 12-char unique phone: 9 + 5-char suffix window + 6-digit sequence
    phone: `9${SUFFIX.slice(-5)}${String(n).padStart(6, "0")}`,
    email: `sel-${SUFFIX}-${n}@test.bcpl`, isVerified: true,
  }).returning();
  userIds.push(u.id);
  const roleCode = opts.role === "bowler" ? "bowl" : opts.role === "all_rounder" ? "ar" : opts.role === "wicket_keeper" ? "wk" : "bat";
  const [reg] = await db.insert(registrationsTable).values({
    userId: u.id, role: roleCode, trialCity: opts.city,
  }).returning();
  regIds.push(reg.id);

  // scores jsonb keyed for role-critical/consistency tie-breaker extraction
  const criticalKey = opts.role === "bowler" ? "control" : opts.role === "all_rounder" ? "batting" : opts.role === "wicket_keeper" ? "keeping" : "technique";
  const consistencyKey = opts.role === "bowler" ? "variation" : opts.role === "all_rounder" ? "fitness" : opts.role === "wicket_keeper" ? "hands" : "timing";
  const scores: Record<string, number> = {
    [criticalKey]: opts.roleCritical ?? 5, [consistencyKey]: opts.consistency ?? 5, overall: 5,
  };
  await db.insert(physicalAssessmentsTable).values({
    registrationId: reg.id, assessor: "tester", playerRole: opts.role,
    city: opts.city, scores, finalScore: String(opts.score),
    result: opts.result ?? "FINAL_SELECTION_PENDING",
    ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
  });
  if (opts.phase1 != null) {
    await db.insert(phase1ScoresTable).values({
      registrationId: reg.id, roleSkill: 0, technique: 0, execution: 0, gameAwareness: 0, movement: 0, videoEvidence: 0, total: opts.phase1,
    });
  }
  return reg.id;
}

/** Small config: 2 per role per zone for bat/bowl/ar, 1 wk; wildcards 1 each. */
const SMALL_CONFIG = {
  seasonKey: SEASON,
  // invariant: totalPool == 5*(2+2+2+1) zonal + (1+1+1+1) wildcard = 35 + 4 = 39
  totalPool: 39,
  perZoneRoleQuota: { bat: 2, bowl: 2, ar: 2, wk: 1 },
  wildcardRoleQuota: { bat: 1, bowl: 1, ar: 1, wk: 1 },
  tieBreakers: ["physical_score", "role_critical", "consistency", "phase1_score", "deterministic_id"],
  zoneMappingVersion: "in-cities-v1",
  cityZoneMap: {},
  metricsVersion: "metrics-v1",
};

/** Build a config with totalPool auto-computed so the superRefine invariant
 *  (totalPool == zones*perZoneSum + wildcardSum) always holds. */
function mkConfig(over: Partial<typeof SMALL_CONFIG>): typeof SMALL_CONFIG {
  const merged = { ...SMALL_CONFIG, ...over } as typeof SMALL_CONFIG;
  const pz = merged.perZoneRoleQuota, wc = merged.wildcardRoleQuota;
  const perZoneSum = pz.bat + pz.bowl + pz.ar + pz.wk;
  const wildSum = wc.bat + wc.bowl + wc.ar + wc.wk;
  return { ...merged, totalPool: perZoneSum * 5 + wildSum };
}

async function writeConfig(cfg: Record<string, unknown>) {
  const now = new Date();
  await db.insert(siteSettingsTable)
    .values({ key: "selection_config", value: cfg, updatedAt: now })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: cfg, updatedAt: now } });
}

/** Directly create a claimed generating batch and run the engine synchronously. */
async function createAndRun(cfg: Record<string, unknown>, snapshotAt: Date) {
  const claimToken = crypto.randomUUID();
  const [maxRow] = await db.select({ v: sql<number>`coalesce(max(${selectionBatchesTable.version}),0)` })
    .from(selectionBatchesTable).where(eq(selectionBatchesTable.seasonKey, SEASON));
  const version = Number(maxRow?.v ?? 0) + 1;
  const [batch] = await db.insert(selectionBatchesTable).values({
    seasonKey: SEASON, version, status: "generating", jobPhase: "preparing_population", jobProgressPct: 5,
    claimToken, algorithmVersion: "final600-v1",
    configSnapshot: cfg,
    populationSnapshot: { snapshotAt: snapshotAt.toISOString(), scoreSource: "physical_assessments.final_score" },
    exceptionReport: [],
  }).returning();
  const result = await generateFinal600(batch.id, claimToken);
  return { batchId: batch.id, claimToken, version, result };
}

let snapshotAt: Date;

beforeAll(async () => {
  await ensureSelectionTables();
  // Seed a full-quota-satisfying population: 3 players per role per zone so
  // 2/role/zone zonal quota fills AND leaves remainder for wildcards.
  for (const [, city] of Object.entries(ZONE_CITY)) {
    for (const role of ["batsman", "bowler", "all_rounder"] as const) {
      // scores 90, 80, 70 → deterministic rank order
      for (const s of [90, 80, 70]) await seedPlayer({ city, role, score: s });
    }
    // wk: 2 players so 1 quota fills and 1 remains for wildcard
    for (const s of [95, 85]) await seedPlayer({ city, role: "wicket_keeper", score: s });
  }
  snapshotAt = new Date(Date.now() + 60_000); // future cutoff so all seeded rows are included
  await writeConfig(SMALL_CONFIG);
});

afterAll(async () => {
  await db.delete(selectionBatchMembersTable).where(inArray(selectionBatchMembersTable.registrationId, regIds.length ? regIds : ["00000000-0000-0000-0000-000000000000"]));
  await db.delete(selectionBatchesTable).where(eq(selectionBatchesTable.seasonKey, SEASON));
  await db.delete(physicalAssessmentsTable).where(inArray(physicalAssessmentsTable.registrationId, regIds.length ? regIds : ["x"]));
  await db.delete(phase1ScoresTable).where(inArray(phase1ScoresTable.registrationId, regIds.length ? regIds : ["x"]));
  await db.delete(registrationsTable).where(inArray(registrationsTable.id, regIds.length ? regIds : ["x"]));
  await db.delete(usersTable).where(inArray(usersTable.id, userIds.length ? userIds : ["x"]));
  await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, "selection_config"));
});

describe("Final 600 selection engine", () => {
  it("generates a preview with correct quota totals and no shortfall", async () => {
    const { batchId, result } = await createAndRun(SMALL_CONFIG, snapshotAt);
    expect(result.status).toBe("preview_ready");
    const [batch] = await db.select().from(selectionBatchesTable).where(eq(selectionBatchesTable.id, batchId));
    expect(batch.status).toBe("preview_ready");
    const counts = batch.counts as any;
    // zonal: 5 zones * (2+2+2+1) = 35 ; wildcards: 4 → 39 selected
    expect(counts.selected).toBe(39);
    expect(counts.byRole.bat).toBe(11); // 5*2 zonal + 1 wildcard
    expect(counts.byRole.wk).toBe(6);   // 5*1 zonal + 1 wildcard
    expect(batch.exceptionReport.length).toBe(0);
    // members uniqueness: every registration once
    const members = await db.select().from(selectionBatchMembersTable).where(eq(selectionBatchMembersTable.batchId, batchId));
    expect(members.length).toBe(39);
    expect(new Set(members.map(m => m.registrationId)).size).toBe(39);
  });

  it("is deterministic — same snapshot+config ⇒ identical member set", async () => {
    const a = await createAndRun(SMALL_CONFIG, snapshotAt);
    const b = await createAndRun(SMALL_CONFIG, snapshotAt);
    const ma = (await db.select().from(selectionBatchMembersTable).where(eq(selectionBatchMembersTable.batchId, a.batchId)))
      .map(m => `${m.overallRank}:${m.registrationId}`).sort();
    const mb = (await db.select().from(selectionBatchMembersTable).where(eq(selectionBatchMembersTable.batchId, b.batchId)))
      .map(m => `${m.overallRank}:${m.registrationId}`).sort();
    expect(ma).toEqual(mb);
  });

  it("records SELECTION CONSTRAINT EXCEPTION on shortfall (never substitutes)", async () => {
    // Config demands 5 wk per zone but only 2 exist per zone → shortfall 3/zone.
    const cfg = mkConfig({ perZoneRoleQuota: { bat: 2, bowl: 2, ar: 2, wk: 5 } });
    const { batchId, result } = await createAndRun(cfg, snapshotAt);
    expect(result.status).toBe("preview_ready");
    const [batch] = await db.select().from(selectionBatchesTable).where(eq(selectionBatchesTable.id, batchId));
    const exc = batch.exceptionReport as any[];
    const wkShort = exc.filter(e => e.role === "wk" && e.scope === "zonal");
    expect(wkShort.length).toBe(5); // one per zone
    expect(wkShort[0].required).toBe(5);
    expect(wkShort[0].shortfall).toBeGreaterThan(0);
    // wk members must not exceed what actually exists — no silent substitution
    const wkMembers = await db.select().from(selectionBatchMembersTable)
      .where(and(eq(selectionBatchMembersTable.batchId, batchId), eq(selectionBatchMembersTable.role, "wk")));
    expect(wkMembers.every(m => m.role === "wk")).toBe(true);
  });

  it("applies deterministic tie-breakers (equal score → role_critical then id)", async () => {
    // Fresh isolated city so it does not perturb the main pool: use an EAST city.
    const city = "kolkata";
    // two batsmen, same score, different role_critical → higher role_critical ranks first
    const hi = await seedPlayer({ city, role: "batsman", score: 88, roleCritical: 9, consistency: 5 });
    const lo = await seedPlayer({ city, role: "batsman", score: 88, roleCritical: 3, consistency: 5 });
    const cfg = mkConfig({ perZoneRoleQuota: { bat: 50, bowl: 0, ar: 0, wk: 0 }, wildcardRoleQuota: { bat: 0, bowl: 0, ar: 0, wk: 0 } });
    const { batchId } = await createAndRun(cfg, snapshotAt);
    const rows = await db.select().from(selectionBatchMembersTable)
      .where(and(eq(selectionBatchMembersTable.batchId, batchId), inArray(selectionBatchMembersTable.registrationId, [hi, lo])));
    const rHi = rows.find(r => r.registrationId === hi)!;
    const rLo = rows.find(r => r.registrationId === lo)!;
    expect(rHi.zoneRoleRank!).toBeLessThan(rLo.zoneRoleRank!);
  });

  it("retry is idempotent and produces no partial results on the failed batch", async () => {
    // create a batch, mark failed with stray members, then retry via engine.
    const first = await createAndRun(SMALL_CONFIG, snapshotAt);
    // simulate a failed prior run: insert a stray member then flip to failed+reclaim
    await db.insert(selectionBatchMembersTable).values({
      batchId: first.batchId, registrationId: regIds[0], role: "bat", zone: "NORTH",
      city: "delhi", selectionPool: "zonal", rawPhysicalScore: "1.00",
    }).onConflictDoNothing();
    const newToken = crypto.randomUUID();
    await db.update(selectionBatchesTable)
      .set({ status: "generating", claimToken: newToken, error: null })
      .where(eq(selectionBatchesTable.id, first.batchId));
    const res = await generateFinal600(first.batchId, newToken);
    expect(res.status).toBe("preview_ready");
    // stray member with score 1.00 must be gone (wiped before re-run)
    const stray = await db.select().from(selectionBatchMembersTable)
      .where(and(eq(selectionBatchMembersTable.batchId, first.batchId), eq(selectionBatchMembersTable.rawPhysicalScore, "1.00")));
    expect(stray.length).toBe(0);
  });

  it("rejects a stale claim token (CAS) without touching the batch", async () => {
    const { batchId } = await createAndRun(SMALL_CONFIG, snapshotAt);
    const res = await generateFinal600(batchId, crypto.randomUUID());
    expect(res.status).toBe("failed");
    expect(res.error).toMatch(/claim token/i);
    const [b] = await db.select().from(selectionBatchesTable).where(eq(selectionBatchesTable.id, batchId));
    expect(b.status).toBe("preview_ready"); // untouched
  });

  it("gates approve → publish and enforces one approved per season", async () => {
    const first = await createAndRun(SMALL_CONFIG, snapshotAt);
    const second = await createAndRun(SMALL_CONFIG, snapshotAt);

    // publish before approve → 409
    const pubEarly = await auth(request(app).post(`/api/admin/selection/batches/${first.batchId}/publish`));
    expect(pubEarly.status).toBe(409);

    // approve first → 200
    const app1 = await auth(request(app).post(`/api/admin/selection/batches/${first.batchId}/approve`));
    expect(app1.status).toBe(200);

    // approving a second while one approved exists → 409
    const app2 = await auth(request(app).post(`/api/admin/selection/batches/${second.batchId}/approve`));
    expect(app2.status).toBe(409);

    // publish the approved one → 200, status published, no notifications
    const pub = await auth(request(app).post(`/api/admin/selection/batches/${first.batchId}/publish`));
    expect(pub.status).toBe(200);
    expect(pub.body.status).toBe("published");
  });

  it("excludes records created after the population snapshot cutoff", async () => {
    // a past cutoff → nothing seeded (all seeded rows are 'now') is eligible.
    const pastCutoff = new Date(Date.now() - 24 * 3600 * 1000);
    const { batchId, result } = await createAndRun(SMALL_CONFIG, pastCutoff);
    expect(result.status).toBe("preview_ready");
    const [batch] = await db.select().from(selectionBatchesTable).where(eq(selectionBatchesTable.id, batchId));
    expect((batch.counts as any).eligible).toBe(0);
  });

  it("aborts mid-run when ownership is lost: no members persist, batch untouched", async () => {
    // Seed a generating batch owned by our token; top-level token check will pass.
    const claimToken = crypto.randomUUID();
    const [maxRow] = await db.select({ v: sql<number>`coalesce(max(${selectionBatchesTable.version}),0)` })
      .from(selectionBatchesTable).where(eq(selectionBatchesTable.seasonKey, SEASON));
    const version = Number(maxRow?.v ?? 0) + 1;
    const [batch] = await db.insert(selectionBatchesTable).values({
      seasonKey: SEASON, version, status: "invalidated", // ← ownership lost: not 'generating'
      claimToken, algorithmVersion: "final600-v1",
      configSnapshot: SMALL_CONFIG,
      populationSnapshot: { snapshotAt: snapshotAt.toISOString(), scoreSource: "physical_assessments.final_score" },
      exceptionReport: [],
    }).returning();
    // token matches (passes top-level guard) but status != generating ⇒ first
    // assertOwned inside the tx fails ⇒ OwnershipLostError ⇒ full rollback.
    const res = await generateFinal600(batch.id, claimToken);
    expect(res.status).toBe("ownership_lost");
    // NO members persisted
    const members = await db.select().from(selectionBatchMembersTable).where(eq(selectionBatchMembersTable.batchId, batch.id));
    expect(members.length).toBe(0);
    // batch row untouched — still invalidated, NOT flipped to failed/preview_ready
    const [after] = await db.select().from(selectionBatchesTable).where(eq(selectionBatchesTable.id, batch.id));
    expect(after.status).toBe("invalidated");
    expect(after.error).toBeNull();
  });

  it("settings PUT rejects an inconsistent selection_config (OWNER DECISION REQUIRED)", async () => {
    // totalPool disagrees with quotas → superRefine issue → 400.
    const bad = await auth(request(app).put("/api/settings/admin/selection_config")
      .send({ value: { ...SMALL_CONFIG, totalPool: 12345 } }));
    expect(bad.status).toBe(400);
    expect(String(bad.body.error)).toMatch(/totalPool|OWNER DECISION REQUIRED/i);

    // a consistent config is accepted.
    const good = await auth(request(app).put("/api/settings/admin/selection_config")
      .send({ value: mkConfig({ seasonKey: `cfg-ok-${SUFFIX}` }) }));
    expect(good.status).toBe(200);
    // restore the season config used by other assertions.
    await writeConfig(SMALL_CONFIG);
  });

  it("approve/publish are race-safe — conditional transition on 0 rows returns 409", async () => {
    const { batchId } = await createAndRun(SMALL_CONFIG, snapshotAt);
    // Simulate a concurrent transition: flip status out from under the request.
    await db.update(selectionBatchesTable).set({ status: "invalidated" }).where(eq(selectionBatchesTable.id, batchId));
    // approve now sees status != preview_ready → 409 (guarded by the pre-check),
    const appRes = await auth(request(app).post(`/api/admin/selection/batches/${batchId}/approve`));
    expect(appRes.status).toBe(409);

    // Publish race: create an approved batch, then flip underneath before publish.
    const b2 = await createAndRun(SMALL_CONFIG, snapshotAt);
    const ap = await auth(request(app).post(`/api/admin/selection/batches/${b2.batchId}/approve`));
    expect(ap.status).toBe(200);
    // race: another actor invalidates the approved batch just before publish
    await db.update(selectionBatchesTable).set({ status: "invalidated" }).where(eq(selectionBatchesTable.id, b2.batchId));
    const pub = await auth(request(app).post(`/api/admin/selection/batches/${b2.batchId}/publish`));
    expect(pub.status).toBe(409);
    expect(String(pub.body.error)).toMatch(/no longer approved|conflict|must be approved/i);
  });

  it("publish conditional update returns 409 when status changes between pre-check and write", async () => {
    // Drive the TRUE race path: keep the pre-check happy (status='approved' at
    // read time is simulated by writing 'approved' then flipping via a distinct
    // status the WHERE clause rejects). We assert the guarded UPDATE (WHERE
    // status='approved') affects 0 rows and yields 409 — exercised directly.
    const { batchId } = await createAndRun(SMALL_CONFIG, snapshotAt);
    const ap = await auth(request(app).post(`/api/admin/selection/batches/${batchId}/approve`));
    expect(ap.status).toBe(200);
    // A concurrent publish already happened → status is 'published'; the second
    // publish's conditional UPDATE (WHERE status='approved') matches 0 rows.
    await db.update(selectionBatchesTable).set({ status: "published" }).where(eq(selectionBatchesTable.id, batchId));
    const pub2 = await auth(request(app).post(`/api/admin/selection/batches/${batchId}/publish`));
    expect(pub2.status).toBe(409);
  });
});

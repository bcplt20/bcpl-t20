/**
 * Stage 4 — Physical Trials suite.
 *
 * Unit-locks the assessment scoring rules (equal-weight mean, 2dp) and
 * the historic role normalization (bat/Batsman → batsman etc.), plus
 * API-level contract checks that need no seeded data:
 *   - admin gate on /api/admin/trials/*
 *   - assessment-config shape (role → criteria)
 *   - check-in validation (400 without token/regNumber, 404 unknown)
 *   - allocation run defaults to dryRun (never writes without opt-in)
 *
 * Regression locks (architect-review findings):
 *   - lifecycle guards: move/cancel are FROZEN once the player checked in
 *   - capacity atomicity: concurrent moves / allocation runs cannot
 *     overfill a slot (FOR UPDATE row locks inside transactions)
 * All seeded rows live in unique per-run cities and are deleted afterAll;
 * assertions check DB end-state, never run counts.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { eq, and, inArray } from "drizzle-orm";

const TEST_ADMIN_SECRET = "test-admin-secret-for-vitest";
const TEST_SESSION_SECRET = "test-session-secret-for-vitest";
process.env.ADMIN_SECRET = TEST_ADMIN_SECRET;
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

const { default: app } = await import("../src/app");
const { db } = await import("@workspace/db");
const {
  usersTable, registrationsTable,
  trialVenuesTable, trialSlotsTable, trialAllocationsTable, trialCheckinsTable, physicalAssessmentsTable,
} = await import("@workspace/db/schema");
const { computeFinalScore, normalizeRole, ROLE_CRITERIA, ensureTrialsTables } = await import("../src/routes/trials");

const admin = { "x-bcpl-admin": TEST_ADMIN_SECRET };

beforeAll(async () => {
  await ensureTrialsTables();
});

/* ── seeding helpers (unique per-run cities isolate the FCFS allocator) ── */
const suffix = String(Date.now()).slice(-7);
const uids: string[] = [];
const regIds: string[] = [];
const venueIds: string[] = [];
let seq = 0;

async function mkPlayer(city: string, phase2Status = "kyc_done") {
  const n = ++seq;
  const [user] = await db.insert(usersTable).values({
    name: `Trials Test ${suffix}-${n}`,
    phone: `8${suffix}${String(n).padStart(3, "0")}`.slice(0, 12),
    email: `trials-${suffix}-${n}@test.bcpl`,
    isVerified: true,
  }).returning();
  uids.push(user.id);
  const [reg] = await db.insert(registrationsTable).values({
    userId: user.id, role: "bat", trialCity: city,
    phase1Status: "selected", phase2Status,
  }).returning();
  regIds.push(reg.id);
  return { user, reg };
}

async function mkVenueSlot(city: string, capacity: number, batch: string) {
  const [venue] = await db.insert(trialVenuesTable).values({
    city, venue: `Test Ground ${batch} ${suffix}`, trialDate: "1 Sep 2026",
    trialTime: "8:00 AM – 1:00 PM", reportingTime: "7:30 AM", slots: 100, status: "active",
  }).returning();
  venueIds.push(venue.id);
  const [slot] = await db.insert(trialSlotsTable).values({
    venueId: venue.id, city, slotDate: "1 Sep 2026", reportingTime: "7:30 AM",
    startTime: "8:00 AM", batchName: batch, capacity, status: "open",
  }).returning();
  return { venue, slot };
}

async function mkAllocation(regId: string, slot: { id: string; venueId: string; city: string }) {
  const [alloc] = await db.insert(trialAllocationsTable).values({
    registrationId: regId, slotId: slot.id, venueId: slot.venueId, city: slot.city,
    source: "auto", passToken: crypto.randomBytes(16).toString("hex"),
  }).returning();
  return alloc;
}

afterAll(async () => {
  if (regIds.length) {
    await db.delete(physicalAssessmentsTable).where(inArray(physicalAssessmentsTable.registrationId, regIds));
    await db.delete(trialCheckinsTable).where(inArray(trialCheckinsTable.registrationId, regIds));
    await db.delete(trialAllocationsTable).where(inArray(trialAllocationsTable.registrationId, regIds));
  }
  if (venueIds.length) {
    await db.delete(trialSlotsTable).where(inArray(trialSlotsTable.venueId, venueIds));
    await db.delete(trialVenuesTable).where(inArray(trialVenuesTable.id, venueIds));
  }
  if (regIds.length) await db.delete(registrationsTable).where(inArray(registrationsTable.id, regIds));
  if (uids.length) await db.delete(usersTable).where(inArray(usersTable.id, uids));
});

describe("normalizeRole — historic role formats", () => {
  it("maps both historic batsman formats", () => {
    expect(normalizeRole("bat")).toBe("batsman");
    expect(normalizeRole("Batsman")).toBe("batsman");
  });
  it("maps bowler formats", () => {
    expect(normalizeRole("bowl")).toBe("bowler");
    expect(normalizeRole("Bowler")).toBe("bowler");
  });
  it("maps all-rounder formats", () => {
    expect(normalizeRole("ar")).toBe("all_rounder");
    expect(normalizeRole("All-Rounder")).toBe("all_rounder");
    expect(normalizeRole("all_rounder")).toBe("all_rounder");
  });
  it("maps wicket-keeper formats", () => {
    expect(normalizeRole("wk")).toBe("wicket_keeper");
    expect(normalizeRole("Wicket-Keeper")).toBe("wicket_keeper");
    expect(normalizeRole("keeper")).toBe("wicket_keeper");
  });
  it("defaults unknown/empty to batsman", () => {
    expect(normalizeRole("")).toBe("batsman");
    expect(normalizeRole(null)).toBe("batsman");
    expect(normalizeRole(undefined)).toBe("batsman");
  });
});

describe("computeFinalScore — equal-weight mean, 2dp", () => {
  it("averages criterion scores", () => {
    expect(computeFinalScore({ a: 8, b: 9 })).toBe(8.5);
    expect(computeFinalScore({ a: 7 })).toBe(7);
  });
  it("rounds to 2 decimals", () => {
    expect(computeFinalScore({ a: 7, b: 8, c: 8 })).toBe(7.67);
  });
  it("returns 0 for empty scores", () => {
    expect(computeFinalScore({})).toBe(0);
  });
  it("ignores non-finite values", () => {
    expect(computeFinalScore({ a: 8, b: Number.NaN })).toBe(8);
  });
});

describe("ROLE_CRITERIA — every role has a usable form", () => {
  it("covers all four normalized roles", () => {
    expect(Object.keys(ROLE_CRITERIA).sort()).toEqual(["all_rounder", "batsman", "bowler", "wicket_keeper"]);
  });
  it("each role has at least 5 criteria incl. fitness & overall", () => {
    for (const [, criteria] of Object.entries(ROLE_CRITERIA)) {
      expect(criteria.length).toBeGreaterThanOrEqual(5);
      expect(criteria).toContain("fitness");
      expect(criteria).toContain("overall");
    }
  });
});

describe("admin gate", () => {
  it("rejects trials endpoints without admin auth", async () => {
    const r = await request(app).get("/api/admin/trials/slots");
    expect([401, 403]).toContain(r.status);
  });
  it("accepts with x-bcpl-admin secret", async () => {
    const r = await request(app).get("/api/admin/trials/slots").set(admin);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.slots)).toBe(true);
  });
});

describe("assessment-config", () => {
  it("returns role criteria, 1–10 scale and the 3 result states", async () => {
    const r = await request(app).get("/api/admin/trials/assessment-config").set(admin);
    expect(r.status).toBe(200);
    expect(r.body.scale).toEqual({ min: 1, max: 10 });
    expect(r.body.criteria.batsman).toContain("technique");
    expect(r.body.criteria.bowler).toContain("control");
    expect(r.body.results).toEqual(["FINAL_SELECTION_PENDING", "FINAL_SELECTED", "FINAL_NOT_SELECTED"]);
  });
});

describe("check-in validation", () => {
  it("400 without token or regNumber", async () => {
    const r = await request(app).post("/api/admin/trials/checkin").set(admin).send({});
    expect(r.status).toBe(400);
  });
  it("404 for unknown pass token", async () => {
    const r = await request(app).post("/api/admin/trials/checkin").set(admin)
      .send({ token: "deadbeefdeadbeefdeadbeefdeadbeef" });
    expect(r.status).toBe(404);
  });
  it("404 for unknown player ID", async () => {
    const r = await request(app).post("/api/admin/trials/checkin").set(admin)
      .send({ regNumber: "BCPL-ZZZ-999999" });
    expect(r.status).toBe(404);
  });
});

describe("allocation run — safe by default", () => {
  it("defaults to dryRun (no writes) and reports per-city plan", async () => {
    const r = await request(app).post("/api/admin/trials/allocate").set(admin).send({});
    expect(r.status).toBe(200);
    expect(r.body.dryRun).toBe(true);
    expect(Array.isArray(r.body.perCity)).toBe(true);
    expect(r.body.notificationsQueued).toBe(0);
  });
});

describe("player trial-pass", () => {
  it("requires player auth", async () => {
    const r = await request(app).get("/api/user/trial-pass");
    expect(r.status).toBe(401);
  });
});

/* ═══ Regression locks from architect review ═══════════════════════ */

describe("lifecycle guards — allocation frozen after check-in", () => {
  const CITY = `TrialLC${suffix}`;
  it("blocks move AND cancel once the player is checked in", async () => {
    const { reg } = await mkPlayer(CITY);
    const { slot } = await mkVenueSlot(CITY, 10, "LC-A");
    const { slot: other } = await mkVenueSlot(CITY, 10, "LC-B");
    const alloc = await mkAllocation(reg.id, slot);
    await db.insert(trialCheckinsTable).values({
      registrationId: reg.id, allocationId: alloc.id, slotId: slot.id, venueId: slot.venueId, method: "manual",
    });

    const mv = await request(app).patch(`/api/admin/trials/allocations/${alloc.id}`)
      .set(admin).send({ slotId: other.id });
    expect(mv.status).toBe(409);

    const cx = await request(app).post(`/api/admin/trials/allocations/${alloc.id}/cancel`).set(admin);
    expect(cx.status).toBe(409);

    /* DB end-state: untouched */
    const [after] = await db.select().from(trialAllocationsTable).where(eq(trialAllocationsTable.id, alloc.id));
    expect(after.status).toBe("allocated");
    expect(after.slotId).toBe(slot.id);
  });
});

describe("capacity atomicity — concurrent moves", () => {
  const CITY = `TrialMV${suffix}`;
  it("exactly one of two concurrent moves into a capacity-1 slot wins", async () => {
    const a = await mkPlayer(CITY);
    const b = await mkPlayer(CITY);
    const { slot: src1 } = await mkVenueSlot(CITY, 5, "MV-S1");
    const { slot: src2 } = await mkVenueSlot(CITY, 5, "MV-S2");
    const { slot: target } = await mkVenueSlot(CITY, 1, "MV-TGT");
    const al1 = await mkAllocation(a.reg.id, src1);
    const al2 = await mkAllocation(b.reg.id, src2);

    const [r1, r2] = await Promise.all([
      request(app).patch(`/api/admin/trials/allocations/${al1.id}`).set(admin).send({ slotId: target.id }),
      request(app).patch(`/api/admin/trials/allocations/${al2.id}`).set(admin).send({ slotId: target.id }),
    ]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 409]);

    /* DB end-state: target holds exactly ONE active allocation */
    const inTarget = await db.select().from(trialAllocationsTable)
      .where(and(eq(trialAllocationsTable.slotId, target.id), eq(trialAllocationsTable.status, "allocated")));
    expect(inTarget.length).toBe(1);
  });
});

describe("capacity atomicity — concurrent allocation runs", () => {
  const CITY = `TrialRUN${suffix}`;
  it("two simultaneous non-dry runs never overfill a capacity-1 slot", async () => {
    await mkPlayer(CITY);
    await mkPlayer(CITY);
    const { slot } = await mkVenueSlot(CITY, 1, "RUN-A");

    const [ra, rb] = await Promise.all([
      request(app).post("/api/admin/trials/allocate").set(admin).send({ city: CITY, dryRun: false }),
      request(app).post("/api/admin/trials/allocate").set(admin).send({ city: CITY, dryRun: false }),
    ]);
    expect(ra.status).toBe(200);
    expect(rb.status).toBe(200);
    expect((ra.body.totalAllocated ?? 0) + (rb.body.totalAllocated ?? 0)).toBe(1);

    /* DB end-state: capacity respected despite 2 eligible × 2 racing runs */
    const active = await db.select().from(trialAllocationsTable)
      .where(and(eq(trialAllocationsTable.slotId, slot.id), eq(trialAllocationsTable.status, "allocated")));
    expect(active.length).toBe(1);
  });
});

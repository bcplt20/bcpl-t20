/**
 * Physical Trials suite (Stage 4 — admin master journey plan)
 *
 *   trial_venues (existing)  →  trial_slots (batches within a venue/day)
 *   → trial_allocations (player ⇄ slot, unique active per registration,
 *     carries the QR pass token) → trial_checkins (one per registration,
 *     duplicate-proof) → physical_assessments (on-ground scores;
 *     completely separate from the AI score — never overwrites it).
 *
 *   Auto-allocation: players with phase2Status = 'kyc_done'
 *   (= PHASE2_COMPLETE: paid + KYC verified) are assigned to open slots
 *   in their trial city, first-come-first-served by registration date,
 *   respecting slot capacity. Manual override (move / cancel) allowed.
 *
 *   Notifications: real sends ONLY when remindersEnabled() — same gate
 *   as payment reminders (production or REMINDERS_ENABLED=1). Dev runs
 *   are logged dry-runs; no notification_logs rows are written, so the
 *   first enabled run will still notify exactly once (dedupe key
 *   trial_alloc_<registrationId>).
 *
 *   NOTE: deleting a trial venue does not cascade — slots keep their
 *   denormalized city/date and continue to work standalone.
 */
import { Router } from "express";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { db } from "@workspace/db";
import {
  registrationsTable, usersTable, trialVenuesTable,
  trialSlotsTable, trialAllocationsTable, trialCheckinsTable,
  physicalAssessmentsTable, notificationLogsTable,
} from "@workspace/db/schema";
import { and, eq, sql, desc, ilike, or } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { remindersEnabled } from "../lib/reminders";
import { sendEmail, tplTrialPass } from "../lib/email";
import { sendSms } from "../lib/sms";
import { logger } from "../lib/logger";

const SITE_URL = process.env["SITE_URL"] ?? "https://elite-user-experience.replit.app/bcpl-website";

/* ─── startup migration ──────────────────────────────────────────── */

export async function ensureTrialsTables(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS trial_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    city varchar(100) NOT NULL,
    slot_date varchar(50) NOT NULL,
    reporting_time varchar(50) NOT NULL,
    start_time varchar(50) NOT NULL,
    batch_name varchar(80) NOT NULL,
    capacity integer NOT NULL DEFAULT 100,
    status varchar(30) NOT NULL DEFAULT 'open',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS trial_slots_city_idx ON trial_slots (city, status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS trial_slots_venue_idx ON trial_slots (venue_id)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS trial_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid NOT NULL,
    slot_id uuid NOT NULL,
    venue_id uuid NOT NULL,
    city varchar(100) NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'allocated',
    source varchar(20) NOT NULL DEFAULT 'auto',
    allocated_by varchar(80) NOT NULL DEFAULT 'system',
    pass_token varchar(64) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS trial_alloc_active_reg_uidx
    ON trial_allocations (registration_id) WHERE status = 'allocated'`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS trial_alloc_pass_token_uidx
    ON trial_allocations (pass_token)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS trial_alloc_slot_idx ON trial_allocations (slot_id, status)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS trial_checkins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id uuid NOT NULL,
    registration_id uuid NOT NULL,
    slot_id uuid NOT NULL,
    venue_id uuid NOT NULL,
    method varchar(20) NOT NULL DEFAULT 'qr',
    staff varchar(80),
    device varchar(120),
    checked_in_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS trial_checkins_reg_uidx ON trial_checkins (registration_id)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS trial_checkins_alloc_uidx ON trial_checkins (allocation_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS trial_checkins_slot_idx ON trial_checkins (slot_id)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS physical_assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid NOT NULL,
    allocation_id uuid,
    slot_id uuid,
    city varchar(100),
    venue varchar(255),
    batch varchar(80),
    assessor varchar(80) NOT NULL,
    player_role varchar(30) NOT NULL,
    scores jsonb NOT NULL,
    final_score numeric(5,2) NOT NULL,
    comments text,
    result varchar(40) NOT NULL DEFAULT 'FINAL_SELECTION_PENDING',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS physical_assess_reg_uidx ON physical_assessments (registration_id)`);

  // Stage 4 venue upgrade — full address + maps link for the trial pass
  await db.execute(sql`ALTER TABLE trial_venues ADD COLUMN IF NOT EXISTS address text`);
  await db.execute(sql`ALTER TABLE trial_venues ADD COLUMN IF NOT EXISTS maps_url text`);
}

/* ─── domain helpers (exported for unit tests) ───────────────────── */

export const ROLE_CRITERIA: Record<string, string[]> = {
  batsman:       ["technique", "footwork", "timing", "shot_selection", "fitness", "fielding", "overall"],
  bowler:        ["run_up_action", "control", "pace_or_spin", "variation", "fitness", "fielding", "overall"],
  all_rounder:   ["batting", "bowling", "fitness", "fielding", "overall"],
  wicket_keeper: ["keeping", "movement", "hands", "stumping", "batting", "fitness", "overall"],
};

export function normalizeRole(raw: string | null | undefined): string {
  const r = String(raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (r.startsWith("bowl")) return "bowler";
  if (r.startsWith("all") || r === "ar") return "all_rounder";
  if (r.startsWith("wicket") || r === "wk" || r.startsWith("keep")) return "wicket_keeper";
  return "batsman";
}

/** Equal-weight mean of criterion scores (1–10), 2 decimals. */
export function computeFinalScore(scores: Record<string, number>): number {
  const vals = Object.values(scores).filter((v) => typeof v === "number" && Number.isFinite(v));
  if (vals.length === 0) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(mean * 100) / 100;
}

const ASSESSMENT_RESULTS = ["FINAL_SELECTION_PENDING", "FINAL_SELECTED", "FINAL_NOT_SELECTED"] as const;

const normCity = (c: string | null | undefined): string => String(c ?? "").trim().toLowerCase();

function pgCode(e: unknown): string | undefined {
  let cur = e as { code?: string; cause?: unknown } | undefined;
  for (let i = 0; cur && i < 5; i++) {
    if (typeof cur.code === "string") return cur.code;
    cur = cur.cause as { code?: string; cause?: unknown } | undefined;
  }
  return undefined;
}

/* ─── allocation notifications (gated like reminders) ────────────── */

interface AllocNotify {
  registrationId: string; userId: string; name: string;
  venue: string; city: string; slotDate: string; reportingTime: string; batch: string;
}

async function notifyAllocations(rows: AllocNotify[]): Promise<void> {
  if (!remindersEnabled()) {
    logger.info({ count: rows.length }, "trial allocation notify DRY RUN (sends disabled)");
    return;
  }
  for (const r of rows) {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
      if (!user) continue;
      const reserved = await db.insert(notificationLogsTable)
        .values({ userId: r.userId, type: "email", template: "trial_pass", dedupeKey: "trial_alloc_" + r.registrationId })
        .onConflictDoNothing()
        .returning({ id: notificationLogsTable.id });
      if (reserved.length === 0) continue; // already notified
      const email = tplTrialPass(r.name, r.venue, r.city, r.slotDate, r.reportingTime, r.batch);
      const smsText = `BCPL Trial Update: ${r.name}, your physical trial is scheduled at ${r.venue}, ${r.city} on ${r.slotDate}. Reporting time ${r.reportingTime}. Show your Trial Pass QR at entry: ${SITE_URL}/trial-pass`;
      const results = await Promise.allSettled([
        user.email ? sendEmail({ to: user.email, toName: r.name, subject: email.subject, htmlContent: email.htmlContent }) : Promise.resolve({ ok: false }),
        sendSms(user.phone, smsText),
      ]);
      const anyOk = results.some((x) => x.status === "fulfilled" && Boolean((x.value as { ok?: boolean } | null)?.ok));
      if (!anyOk) {
        await db.update(notificationLogsTable)
          .set({ status: "failed", error: "email+sms both failed" })
          .where(eq(notificationLogsTable.id, reserved[0]!.id));
      }
    } catch (e) {
      logger.error({ err: e, registrationId: r.registrationId }, "trial allocation notify failed");
    }
  }
}

/* ─── admin router (mounted at /api/admin/trials) ────────────────── */

export const adminTrialsRouter = Router();
adminTrialsRouter.use(requireAdmin);

/* GET /slots?city= — slots + live assigned/checked-in counts */
adminTrialsRouter.get("/slots", async (req, res) => {
  try {
    const city = req.query["city"] ? String(req.query["city"]) : null;
    const rows = await db.select({
      slot: trialSlotsTable,
      venueName: trialVenuesTable.venue,
      venueStatus: trialVenuesTable.status,
      assigned: sql<number>`(SELECT count(*)::int FROM trial_allocations ta WHERE ta.slot_id = ${trialSlotsTable.id} AND ta.status = 'allocated')`,
      checkedIn: sql<number>`(SELECT count(*)::int FROM trial_checkins tc WHERE tc.slot_id = ${trialSlotsTable.id})`,
    }).from(trialSlotsTable)
      .leftJoin(trialVenuesTable, eq(trialSlotsTable.venueId, trialVenuesTable.id))
      .where(city ? ilike(trialSlotsTable.city, city) : undefined)
      .orderBy(trialSlotsTable.city, trialSlotsTable.createdAt);
    res.json({ slots: rows });
  } catch (e) {
    logger.error({ err: e }, "trials/slots list failed");
    res.status(500).json({ error: "Failed to load slots" });
  }
});

/* POST /slots — create batch inside a venue (defaults from the venue) */
adminTrialsRouter.post("/slots", async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const venueId = String(b["venueId"] ?? "");
    const batchName = String(b["batchName"] ?? "").trim();
    if (!venueId || !batchName) { res.status(400).json({ error: "venueId and batchName required" }); return; }
    const [venue] = await db.select().from(trialVenuesTable).where(eq(trialVenuesTable.id, venueId)).limit(1);
    if (!venue) { res.status(404).json({ error: "Venue not found" }); return; }
    const capacity = Math.max(1, Math.min(2000, Number(b["capacity"] ?? 100) || 100));
    const [row] = await db.insert(trialSlotsTable).values({
      venueId,
      city: venue.city,
      slotDate: String(b["slotDate"] ?? venue.trialDate),
      reportingTime: String(b["reportingTime"] ?? venue.reportingTime),
      startTime: String(b["startTime"] ?? venue.trialTime),
      batchName,
      capacity,
      notes: b["notes"] ? String(b["notes"]) : null,
    }).returning();
    res.json({ slot: row });
  } catch (e) {
    logger.error({ err: e }, "trials/slots create failed");
    res.status(500).json({ error: "Failed to create slot" });
  }
});

/* PATCH /slots/:id */
adminTrialsRouter.patch("/slots/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (b["batchName"] !== undefined) upd["batchName"] = String(b["batchName"]).trim();
    if (b["capacity"] !== undefined) upd["capacity"] = Math.max(1, Math.min(2000, Number(b["capacity"]) || 1));
    if (b["slotDate"] !== undefined) upd["slotDate"] = String(b["slotDate"]);
    if (b["reportingTime"] !== undefined) upd["reportingTime"] = String(b["reportingTime"]);
    if (b["startTime"] !== undefined) upd["startTime"] = String(b["startTime"]);
    if (b["notes"] !== undefined) upd["notes"] = b["notes"] ? String(b["notes"]) : null;
    if (b["status"] !== undefined) {
      const s = String(b["status"]);
      if (!["open", "closed", "completed", "cancelled"].includes(s)) { res.status(400).json({ error: "Invalid status" }); return; }
      upd["status"] = s;
    }
    const [row] = await db.update(trialSlotsTable).set(upd).where(eq(trialSlotsTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Slot not found" }); return; }
    res.json({ slot: row });
  } catch (e) {
    logger.error({ err: e }, "trials/slots patch failed");
    res.status(500).json({ error: "Failed to update slot" });
  }
});

/* DELETE /slots/:id — blocked while active allocations exist */
adminTrialsRouter.delete("/slots/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const [{ n } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` })
      .from(trialAllocationsTable)
      .where(and(eq(trialAllocationsTable.slotId, id), eq(trialAllocationsTable.status, "allocated")));
    if (n > 0) { res.status(409).json({ error: `Slot has ${n} active allocation(s) — move or cancel them first` }); return; }
    await db.delete(trialSlotsTable).where(eq(trialSlotsTable.id, id));
    res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, "trials/slots delete failed");
    res.status(500).json({ error: "Failed to delete slot" });
  }
});

/* PATCH /venues/:id — Stage 4 venue upgrade fields (address, maps) */
adminTrialsRouter.patch("/venues/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (b["address"] !== undefined) upd["address"] = b["address"] ? String(b["address"]) : null;
    if (b["mapsUrl"] !== undefined) upd["mapsUrl"] = b["mapsUrl"] ? String(b["mapsUrl"]) : null;
    const [row] = await db.update(trialVenuesTable).set(upd).where(eq(trialVenuesTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Venue not found" }); return; }
    res.json({ venue: row });
  } catch (e) {
    logger.error({ err: e }, "trials/venues patch failed");
    res.status(500).json({ error: "Failed to update venue" });
  }
});

/* POST /allocate {city?, dryRun?} — auto-allocation (dryRun default TRUE) */
adminTrialsRouter.post("/allocate", async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const dryRun = b["dryRun"] !== false;
    const cityFilter = b["city"] ? normCity(String(b["city"])) : null;
    const allocatedBy = b["by"] ? String(b["by"]).slice(0, 80) : "system";

    /* Non-dry runs execute inside ONE transaction that takes FOR UPDATE row
       locks on every open slot, so concurrent allocation runs and manual
       moves serialize on the capacity check instead of overfilling batches.
       (Venue names come from a separate query — FOR UPDATE cannot lock the
       nullable side of an outer join.) The partial unique index on active
       allocations stays as the per-player backstop (23505 → skip). */
    const run = async (exec: typeof db) => {
      const slotsQ = exec.select().from(trialSlotsTable)
        .where(eq(trialSlotsTable.status, "open"))
        .orderBy(trialSlotsTable.createdAt);
      const slotRecs = dryRun ? await slotsQ : await slotsQ.for("update");
      const venueRows = await exec.select({ id: trialVenuesTable.id, venue: trialVenuesTable.venue }).from(trialVenuesTable);
      const venueNames = new Map(venueRows.map((v) => [v.id, v.venue]));
      const counts = await exec.select({ slotId: trialAllocationsTable.slotId, n: sql<number>`count(*)::int` })
        .from(trialAllocationsTable)
        .where(eq(trialAllocationsTable.status, "allocated"))
        .groupBy(trialAllocationsTable.slotId);
      const used = new Map(counts.map((c) => [c.slotId, c.n]));
      const slotsByCity = new Map<string, { id: string; venueId: string; city: string; venueName: string; slotDate: string; reportingTime: string; batchName: string; remaining: number }[]>();
      for (const s of slotRecs) {
        const key = normCity(s.city);
        if (cityFilter && key !== cityFilter) continue;
        const remaining = s.capacity - (used.get(s.id) ?? 0);
        const list = slotsByCity.get(key) ?? [];
        list.push({ id: s.id, venueId: s.venueId, city: s.city, venueName: venueNames.get(s.venueId) ?? "", slotDate: s.slotDate, reportingTime: s.reportingTime, batchName: s.batchName, remaining });
        slotsByCity.set(key, list);
      }

      const eligible = await exec.select({
        id: registrationsTable.id, userId: registrationsTable.userId,
        fullName: usersTable.name, trialCity: registrationsTable.trialCity,
      }).from(registrationsTable)
        .innerJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
        .where(and(
          eq(registrationsTable.phase2Status, "kyc_done"),
          sql`NOT EXISTS (SELECT 1 FROM trial_allocations ta WHERE ta.registration_id = ${registrationsTable.id} AND ta.status = 'allocated')`,
        ))
        .orderBy(registrationsTable.createdAt);

      const perCity = new Map<string, { city: string; eligible: number; allocated: number; unallocated: number }>();
      const created: AllocNotify[] = [];
      for (const reg of eligible) {
        const key = normCity(reg.trialCity);
        if (cityFilter && key !== cityFilter) continue;
        const stat = perCity.get(key) ?? { city: reg.trialCity ?? "?", eligible: 0, allocated: 0, unallocated: 0 };
        stat.eligible++;
        const slot = (slotsByCity.get(key) ?? []).find((x) => x.remaining > 0);
        if (!slot) { stat.unallocated++; perCity.set(key, stat); continue; }
        if (!dryRun) {
          try {
            await exec.insert(trialAllocationsTable).values({
              registrationId: reg.id, slotId: slot.id, venueId: slot.venueId, city: slot.city,
              source: "auto", allocatedBy, passToken: crypto.randomBytes(16).toString("hex"),
            });
            created.push({
              registrationId: reg.id, userId: reg.userId, name: reg.fullName ?? "Player",
              venue: slot.venueName, city: slot.city, slotDate: slot.slotDate,
              reportingTime: slot.reportingTime, batch: slot.batchName,
            });
          } catch (e) {
            if (pgCode(e) === "23505") { stat.unallocated++; perCity.set(key, stat); continue; } // raced — already allocated
            throw e;
          }
        }
        slot.remaining--;
        stat.allocated++;
        perCity.set(key, stat);
      }
      return { perCity, created };
    };

    const { perCity, created } = dryRun
      ? await run(db)
      : await db.transaction((tx) => run(tx as unknown as typeof db));

    if (!dryRun && created.length > 0) {
      void notifyAllocations(created).catch((e) => logger.error({ err: e }, "notifyAllocations crashed"));
    }
    res.json({
      dryRun,
      totalAllocated: [...perCity.values()].reduce((a, c) => a + c.allocated, 0),
      totalUnallocated: [...perCity.values()].reduce((a, c) => a + c.unallocated, 0),
      perCity: [...perCity.values()].sort((a, c) => a.city.localeCompare(c.city)),
      notificationsQueued: dryRun ? 0 : created.length,
      notificationsEnabled: remindersEnabled(),
    });
  } catch (e) {
    logger.error({ err: e }, "trials/allocate failed");
    res.status(500).json({ error: "Allocation run failed" });
  }
});

/* GET /allocations?city=&slotId=&q= */
adminTrialsRouter.get("/allocations", async (req, res) => {
  try {
    const city = req.query["city"] ? String(req.query["city"]) : null;
    const slotId = req.query["slotId"] ? String(req.query["slotId"]) : null;
    const q = req.query["q"] ? String(req.query["q"]).trim() : null;
    const conds = [] as ReturnType<typeof eq>[];
    if (city) conds.push(ilike(trialAllocationsTable.city, city) as never);
    if (slotId) conds.push(eq(trialAllocationsTable.slotId, slotId) as never);
    if (q) conds.push(or(ilike(usersTable.name, `%${q}%`), ilike(registrationsTable.regNumber, `%${q}%`)) as never);
    const rows = await db.select({
      alloc: trialAllocationsTable,
      fullName: usersTable.name,
      regNumber: registrationsTable.regNumber,
      role: registrationsTable.role,
      phone: usersTable.phone,
      batchName: trialSlotsTable.batchName,
      slotDate: trialSlotsTable.slotDate,
      reportingTime: trialSlotsTable.reportingTime,
      venueName: trialVenuesTable.venue,
      checkedInAt: trialCheckinsTable.checkedInAt,
      assessedAt: physicalAssessmentsTable.createdAt,
      assessResult: physicalAssessmentsTable.result,
    }).from(trialAllocationsTable)
      .innerJoin(registrationsTable, eq(trialAllocationsTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .leftJoin(trialSlotsTable, eq(trialAllocationsTable.slotId, trialSlotsTable.id))
      .leftJoin(trialVenuesTable, eq(trialAllocationsTable.venueId, trialVenuesTable.id))
      .leftJoin(trialCheckinsTable, eq(trialCheckinsTable.allocationId, trialAllocationsTable.id))
      .leftJoin(physicalAssessmentsTable, eq(physicalAssessmentsTable.registrationId, trialAllocationsTable.registrationId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(trialAllocationsTable.createdAt))
      .limit(500);
    res.json({ allocations: rows });
  } catch (e) {
    logger.error({ err: e }, "trials/allocations list failed");
    res.status(500).json({ error: "Failed to load allocations" });
  }
});

/* PATCH /allocations/:id {slotId} — manual move (capacity-checked) */
adminTrialsRouter.patch("/allocations/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const slotId = String(b["slotId"] ?? "");
    if (!slotId) { res.status(400).json({ error: "slotId required" }); return; }
    const [alloc] = await db.select().from(trialAllocationsTable).where(eq(trialAllocationsTable.id, id)).limit(1);
    if (!alloc) { res.status(404).json({ error: "Allocation not found" }); return; }
    if (alloc.status !== "allocated") { res.status(409).json({ error: "Only active allocations can be moved" }); return; }
    /* lifecycle guard — once the player is on the ground, the allocation is frozen */
    const [checkin] = await db.select({ id: trialCheckinsTable.id }).from(trialCheckinsTable)
      .where(eq(trialCheckinsTable.registrationId, alloc.registrationId)).limit(1);
    if (checkin) { res.status(409).json({ error: "Player already checked in — allocation cannot be moved" }); return; }
    const [assessed] = await db.select({ id: physicalAssessmentsTable.id }).from(physicalAssessmentsTable)
      .where(eq(physicalAssessmentsTable.registrationId, alloc.registrationId)).limit(1);
    if (assessed) { res.status(409).json({ error: "Player already assessed — allocation cannot be moved" }); return; }

    /* capacity check + move inside one transaction with a FOR UPDATE lock on
       the target slot, so concurrent moves/runs cannot overfill it */
    const moved = await db.transaction(async (tx) => {
      const [slot] = await tx.select().from(trialSlotsTable)
        .where(eq(trialSlotsTable.id, slotId)).limit(1).for("update");
      if (!slot) return { err: 404, msg: "Target slot not found" };
      if (slot.status !== "open") return { err: 409, msg: "Target slot is not open" };
      const [{ n } = { n: 0 }] = await tx.select({ n: sql<number>`count(*)::int` })
        .from(trialAllocationsTable)
        .where(and(eq(trialAllocationsTable.slotId, slotId), eq(trialAllocationsTable.status, "allocated")));
      if (n >= slot.capacity) return { err: 409, msg: "Target slot is full" };
      const [row] = await tx.update(trialAllocationsTable).set({
        slotId, venueId: slot.venueId, city: slot.city, source: "manual",
        allocatedBy: b["by"] ? String(b["by"]).slice(0, 80) : "admin",
        updatedAt: new Date(),
      }).where(and(eq(trialAllocationsTable.id, id), eq(trialAllocationsTable.status, "allocated"))).returning();
      if (!row) return { err: 409, msg: "Allocation changed concurrently — reload and retry" };
      return { row };
    });
    if (moved.err !== undefined) { res.status(moved.err).json({ error: moved.msg ?? "Move failed" }); return; }
    res.json({ allocation: moved.row });
  } catch (e) {
    logger.error({ err: e }, "trials/allocations move failed");
    res.status(500).json({ error: "Failed to move allocation" });
  }
});

/* POST /allocations/:id/cancel */
adminTrialsRouter.post("/allocations/:id/cancel", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const [alloc] = await db.select().from(trialAllocationsTable).where(eq(trialAllocationsTable.id, id)).limit(1);
    if (!alloc || alloc.status !== "allocated") { res.status(404).json({ error: "Active allocation not found" }); return; }
    /* lifecycle guard — checked-in / assessed players cannot be cancelled */
    const [checkin] = await db.select({ id: trialCheckinsTable.id }).from(trialCheckinsTable)
      .where(eq(trialCheckinsTable.registrationId, alloc.registrationId)).limit(1);
    if (checkin) { res.status(409).json({ error: "Player already checked in — allocation cannot be cancelled" }); return; }
    const [assessed] = await db.select({ id: physicalAssessmentsTable.id }).from(physicalAssessmentsTable)
      .where(eq(physicalAssessmentsTable.registrationId, alloc.registrationId)).limit(1);
    if (assessed) { res.status(409).json({ error: "Player already assessed — allocation cannot be cancelled" }); return; }
    const [row] = await db.update(trialAllocationsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(trialAllocationsTable.id, id), eq(trialAllocationsTable.status, "allocated")))
      .returning();
    if (!row) { res.status(404).json({ error: "Active allocation not found" }); return; }
    res.json({ allocation: row });
  } catch (e) {
    logger.error({ err: e }, "trials/allocations cancel failed");
    res.status(500).json({ error: "Failed to cancel allocation" });
  }
});

/* POST /checkin {token | regNumber, staff?, device?} — QR / manual check-in */
adminTrialsRouter.post("/checkin", async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const rawToken = String(b["token"] ?? "").trim().replace(/^BCPL-TRIAL:/i, "");
    const regNumber = String(b["regNumber"] ?? "").trim();
    if (!rawToken && !regNumber) { res.status(400).json({ error: "token or regNumber required" }); return; }

    let alloc: typeof trialAllocationsTable.$inferSelect | undefined;
    if (rawToken) {
      [alloc] = await db.select().from(trialAllocationsTable)
        .where(eq(trialAllocationsTable.passToken, rawToken)).limit(1);
    } else {
      const [reg] = await db.select({ id: registrationsTable.id }).from(registrationsTable)
        .where(ilike(registrationsTable.regNumber, regNumber)).limit(1);
      if (!reg) { res.status(404).json({ error: "Player not found for that ID" }); return; }
      [alloc] = await db.select().from(trialAllocationsTable)
        .where(and(eq(trialAllocationsTable.registrationId, reg.id), eq(trialAllocationsTable.status, "allocated"))).limit(1);
    }
    if (!alloc) { res.status(404).json({ error: "No valid trial pass found" }); return; }
    if (alloc.status !== "allocated") { res.status(409).json({ error: "This pass was " + alloc.status }); return; }

    const [reg] = await db.select().from(registrationsTable).where(eq(registrationsTable.id, alloc.registrationId)).limit(1);
    if (!reg) { res.status(404).json({ error: "Registration missing" }); return; }
    const [pUser] = await db.select().from(usersTable).where(eq(usersTable.id, reg.userId)).limit(1);
    if (!["kyc_done", "selected"].includes(reg.phase2Status ?? "")) {
      res.status(409).json({ error: "Player is not trial-eligible (Phase 2 status: " + String(reg.phase2Status) + ")" });
      return;
    }
    const [slot] = await db.select().from(trialSlotsTable).where(eq(trialSlotsTable.id, alloc.slotId)).limit(1);
    if (slot && ["cancelled"].includes(slot.status)) { res.status(409).json({ error: "This slot was cancelled — reallocate the player" }); return; }

    try {
      const [chk] = await db.insert(trialCheckinsTable).values({
        allocationId: alloc.id, registrationId: alloc.registrationId,
        slotId: alloc.slotId, venueId: alloc.venueId,
        method: rawToken ? "qr" : "manual",
        staff: b["staff"] ? String(b["staff"]).slice(0, 80) : null,
        device: b["device"] ? String(b["device"]).slice(0, 120) : null,
      }).returning();
      res.json({
        ok: true,
        checkedInAt: chk!.checkedInAt,
        player: { name: pUser?.name ?? "Player", regNumber: reg.regNumber, role: reg.role, city: alloc.city },
        slot: slot ? { batch: slot.batchName, date: slot.slotDate, reportingTime: slot.reportingTime } : null,
      });
    } catch (e) {
      if (pgCode(e) === "23505") {
        const [existing] = await db.select().from(trialCheckinsTable)
          .where(eq(trialCheckinsTable.registrationId, alloc.registrationId)).limit(1);
        res.status(409).json({
          error: "Already checked in",
          checkedInAt: existing?.checkedInAt ?? null,
          player: { name: pUser?.name ?? "Player", regNumber: reg.regNumber },
        });
        return;
      }
      throw e;
    }
  } catch (e) {
    logger.error({ err: e }, "trials/checkin failed");
    res.status(500).json({ error: "Check-in failed" });
  }
});

/* GET /checkins?city=&slotId= — recent check-ins */
adminTrialsRouter.get("/checkins", async (req, res) => {
  try {
    const city = req.query["city"] ? String(req.query["city"]) : null;
    const slotId = req.query["slotId"] ? String(req.query["slotId"]) : null;
    const conds = [] as never[];
    if (city) conds.push(ilike(trialAllocationsTable.city, city) as never);
    if (slotId) conds.push(eq(trialCheckinsTable.slotId, slotId) as never);
    const rows = await db.select({
      checkin: trialCheckinsTable,
      fullName: usersTable.name,
      regNumber: registrationsTable.regNumber,
      role: registrationsTable.role,
      city: trialAllocationsTable.city,
      batchName: trialSlotsTable.batchName,
    }).from(trialCheckinsTable)
      .innerJoin(registrationsTable, eq(trialCheckinsTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .innerJoin(trialAllocationsTable, eq(trialCheckinsTable.allocationId, trialAllocationsTable.id))
      .leftJoin(trialSlotsTable, eq(trialCheckinsTable.slotId, trialSlotsTable.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(trialCheckinsTable.checkedInAt))
      .limit(300);
    res.json({ checkins: rows });
  } catch (e) {
    logger.error({ err: e }, "trials/checkins list failed");
    res.status(500).json({ error: "Failed to load check-ins" });
  }
});

/* GET /assessment-config — role-specific criteria (1–10 each, equal weights) */
adminTrialsRouter.get("/assessment-config", (_req, res) => {
  res.json({ criteria: ROLE_CRITERIA, scale: { min: 1, max: 10 }, weighting: "equal", results: ASSESSMENT_RESULTS });
});

/* POST /assessments — record physical trial scores (separate from AI score) */
adminTrialsRouter.post("/assessments", async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const registrationId = String(b["registrationId"] ?? "");
    const assessor = String(b["assessor"] ?? "").trim();
    const comments = b["comments"] ? String(b["comments"]).slice(0, 2000) : null;
    const scoresRaw = b["scores"];
    if (!registrationId || !assessor) { res.status(400).json({ error: "registrationId and assessor required" }); return; }
    if (!scoresRaw || typeof scoresRaw !== "object" || Array.isArray(scoresRaw)) { res.status(400).json({ error: "scores object required" }); return; }

    const [reg] = await db.select().from(registrationsTable).where(eq(registrationsTable.id, registrationId)).limit(1);
    if (!reg) { res.status(404).json({ error: "Registration not found" }); return; }
    const role = normalizeRole(reg.role);
    const allowed = new Set(ROLE_CRITERIA[role] ?? []);
    const scores: Record<string, number> = {};
    for (const [k, v] of Object.entries(scoresRaw as Record<string, unknown>)) {
      const num = Number(v);
      if (!allowed.has(k)) { res.status(400).json({ error: `Unknown criterion "${k}" for role ${role}` }); return; }
      if (!Number.isFinite(num) || num < 1 || num > 10) { res.status(400).json({ error: `Score for "${k}" must be 1–10` }); return; }
      scores[k] = Math.round(num * 10) / 10;
    }
    if (Object.keys(scores).length === 0) { res.status(400).json({ error: "At least one criterion score required" }); return; }

    const [alloc] = await db.select().from(trialAllocationsTable)
      .where(and(eq(trialAllocationsTable.registrationId, registrationId), eq(trialAllocationsTable.status, "allocated"))).limit(1);
    const [chk] = await db.select().from(trialCheckinsTable)
      .where(eq(trialCheckinsTable.registrationId, registrationId)).limit(1);
    if (!alloc && !chk) { res.status(409).json({ error: "Player has no trial allocation/check-in — allocate first" }); return; }
    const slotId = chk?.slotId ?? alloc?.slotId ?? null;
    const [slot] = slotId ? await db.select().from(trialSlotsTable).where(eq(trialSlotsTable.id, slotId)).limit(1) : [undefined];
    const [venue] = alloc ? await db.select().from(trialVenuesTable).where(eq(trialVenuesTable.id, alloc.venueId)).limit(1) : [undefined];

    let result = String(b["result"] ?? "FINAL_SELECTION_PENDING");
    if (!ASSESSMENT_RESULTS.includes(result as typeof ASSESSMENT_RESULTS[number])) result = "FINAL_SELECTION_PENDING";
    const finalScore = computeFinalScore(scores);

    const [row] = await db.insert(physicalAssessmentsTable).values({
      registrationId, allocationId: alloc?.id ?? null, slotId,
      city: alloc?.city ?? reg.trialCity, venue: venue?.venue ?? null, batch: slot?.batchName ?? null,
      assessor, playerRole: role, scores, finalScore: finalScore.toFixed(2), comments, result,
    }).onConflictDoUpdate({
      target: physicalAssessmentsTable.registrationId,
      set: { scores, finalScore: finalScore.toFixed(2), comments, assessor, result, playerRole: role, updatedAt: new Date() },
    }).returning();
    res.json({ assessment: row });
  } catch (e) {
    logger.error({ err: e }, "trials/assessments save failed");
    res.status(500).json({ error: "Failed to save assessment" });
  }
});

/* PATCH /assessments/:id {result, comments?} — final selection decision */
adminTrialsRouter.patch("/assessments/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const upd: Record<string, unknown> = { updatedAt: new Date() };
    if (b["result"] !== undefined) {
      const r = String(b["result"]);
      if (!ASSESSMENT_RESULTS.includes(r as typeof ASSESSMENT_RESULTS[number])) { res.status(400).json({ error: "Invalid result" }); return; }
      upd["result"] = r;
    }
    if (b["comments"] !== undefined) upd["comments"] = b["comments"] ? String(b["comments"]).slice(0, 2000) : null;
    const [row] = await db.update(physicalAssessmentsTable).set(upd).where(eq(physicalAssessmentsTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Assessment not found" }); return; }
    res.json({ assessment: row });
  } catch (e) {
    logger.error({ err: e }, "trials/assessments patch failed");
    res.status(500).json({ error: "Failed to update assessment" });
  }
});

/* GET /assessments?city=&result=&q= */
adminTrialsRouter.get("/assessments", async (req, res) => {
  try {
    const city = req.query["city"] ? String(req.query["city"]) : null;
    const result = req.query["result"] ? String(req.query["result"]) : null;
    const q = req.query["q"] ? String(req.query["q"]).trim() : null;
    const conds = [] as never[];
    if (city) conds.push(ilike(physicalAssessmentsTable.city, city) as never);
    if (result) conds.push(eq(physicalAssessmentsTable.result, result) as never);
    if (q) conds.push(or(ilike(usersTable.name, `%${q}%`), ilike(registrationsTable.regNumber, `%${q}%`)) as never);
    const rows = await db.select({
      assessment: physicalAssessmentsTable,
      fullName: usersTable.name,
      regNumber: registrationsTable.regNumber,
      role: registrationsTable.role,
    }).from(physicalAssessmentsTable)
      .innerJoin(registrationsTable, eq(physicalAssessmentsTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(physicalAssessmentsTable.updatedAt))
      .limit(500);
    res.json({ assessments: rows });
  } catch (e) {
    logger.error({ err: e }, "trials/assessments list failed");
    res.status(500).json({ error: "Failed to load assessments" });
  }
});

/* GET /overview — per-city trial funnel (also feeds dashboard ops) */
adminTrialsRouter.get("/overview", async (_req, res) => {
  try {
    const eligible = await db.select({ city: registrationsTable.trialCity, n: sql<number>`count(*)::int` })
      .from(registrationsTable)
      .where(eq(registrationsTable.phase2Status, "kyc_done"))
      .groupBy(registrationsTable.trialCity);
    const allocated = await db.select({ city: trialAllocationsTable.city, n: sql<number>`count(*)::int` })
      .from(trialAllocationsTable)
      .where(eq(trialAllocationsTable.status, "allocated"))
      .groupBy(trialAllocationsTable.city);
    const checkedIn = await db.select({ city: trialAllocationsTable.city, n: sql<number>`count(*)::int` })
      .from(trialCheckinsTable)
      .innerJoin(trialAllocationsTable, eq(trialCheckinsTable.allocationId, trialAllocationsTable.id))
      .groupBy(trialAllocationsTable.city);
    const assessed = await db.select({ city: physicalAssessmentsTable.city, result: physicalAssessmentsTable.result, n: sql<number>`count(*)::int` })
      .from(physicalAssessmentsTable)
      .groupBy(physicalAssessmentsTable.city, physicalAssessmentsTable.result);
    const capacity = await db.select({ city: trialSlotsTable.city, cap: sql<number>`coalesce(sum(capacity),0)::int` })
      .from(trialSlotsTable)
      .where(eq(trialSlotsTable.status, "open"))
      .groupBy(trialSlotsTable.city);

    const cities = new Map<string, { city: string; eligible: number; allocated: number; checkedIn: number; assessed: number; finalSelected: number; finalNotSelected: number; openCapacity: number }>();
    const get = (c: string | null): { city: string; eligible: number; allocated: number; checkedIn: number; assessed: number; finalSelected: number; finalNotSelected: number; openCapacity: number } => {
      const key = normCity(c);
      const cur = cities.get(key) ?? { city: c ?? "?", eligible: 0, allocated: 0, checkedIn: 0, assessed: 0, finalSelected: 0, finalNotSelected: 0, openCapacity: 0 };
      cities.set(key, cur);
      return cur;
    };
    for (const r of eligible) get(r.city).eligible += r.n;
    for (const r of allocated) get(r.city).allocated += r.n;
    for (const r of checkedIn) get(r.city).checkedIn += r.n;
    for (const r of assessed) {
      const c = get(r.city);
      c.assessed += r.n;
      if (r.result === "FINAL_SELECTED") c.finalSelected += r.n;
      if (r.result === "FINAL_NOT_SELECTED") c.finalNotSelected += r.n;
    }
    for (const r of capacity) get(r.city).openCapacity += r.cap;
    res.json({ cities: [...cities.values()].sort((a, b2) => b2.eligible - a.eligible) });
  } catch (e) {
    logger.error({ err: e }, "trials/overview failed");
    res.status(500).json({ error: "Failed to load overview" });
  }
});

/* ─── player router (mounted at /api/user) ───────────────────────── */

export const userTrialsRouter = Router();

/* GET /trial-pass — the player's digital trial pass (QR) */
userTrialsRouter.get("/trial-pass", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [reg] = await db.select().from(registrationsTable)
      .where(eq(registrationsTable.userId, req.user!.userId)).limit(1);
    if (!reg) { res.status(404).json({ error: "no_registration" }); return; }
    const [pUser] = await db.select().from(usersTable).where(eq(usersTable.id, reg.userId)).limit(1);
    const [alloc] = await db.select().from(trialAllocationsTable)
      .where(and(eq(trialAllocationsTable.registrationId, reg.id), eq(trialAllocationsTable.status, "allocated"))).limit(1);
    if (!alloc) { res.status(404).json({ error: "no_allocation" }); return; }
    const [slot] = await db.select().from(trialSlotsTable).where(eq(trialSlotsTable.id, alloc.slotId)).limit(1);
    const [venue] = await db.select().from(trialVenuesTable).where(eq(trialVenuesTable.id, alloc.venueId)).limit(1);
    const [chk] = await db.select().from(trialCheckinsTable)
      .where(eq(trialCheckinsTable.registrationId, reg.id)).limit(1);
    const qrDataUrl = await QRCode.toDataURL("BCPL-TRIAL:" + alloc.passToken, { margin: 1, width: 320 });
    res.json({
      player: { name: pUser?.name ?? "Player", regNumber: reg.regNumber, role: reg.role, city: reg.trialCity },
      venue: venue ? { name: venue.venue, city: venue.city, address: venue.address ?? null, mapsUrl: venue.mapsUrl ?? null } : null,
      slot: slot ? { batch: slot.batchName, date: slot.slotDate, reportingTime: slot.reportingTime, startTime: slot.startTime } : null,
      checkedInAt: chk?.checkedInAt ?? null,
      qrDataUrl,
    });
  } catch (e) {
    logger.error({ err: e }, "user/trial-pass failed");
    res.status(500).json({ error: "Failed to load trial pass" });
  }
});

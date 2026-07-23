import { pgTable, uuid, varchar, integer, numeric, timestamp, text, jsonb } from "drizzle-orm/pg-core";

/* ─── Physical Trials suite (Stage 4) ───────────────────────────────
   trial_venues (existing) → trial_slots (batches within a venue day)
   → trial_allocations (player ⇄ slot, QR pass token)
   → trial_checkins (one per registration, ground check-in)
   → physical_assessments (on-ground scores — NEVER overwrites AI score)
   Indexes/uniques are created in ensureTrialsTables() via raw SQL,
   matching the repo's startup-migration pattern. */

export const trialSlotsTable = pgTable("trial_slots", {
  id:            uuid("id").primaryKey().defaultRandom(),
  venueId:       uuid("venue_id").notNull(),
  city:          varchar("city", { length: 100 }).notNull(),
  slotDate:      varchar("slot_date", { length: 50 }).notNull(),        // mirrors trial_venues.trialDate format
  reportingTime: varchar("reporting_time", { length: 50 }).notNull(),
  startTime:     varchar("start_time", { length: 50 }).notNull(),
  batchName:     varchar("batch_name", { length: 80 }).notNull(),       // e.g. "Batch A", "Morning 1"
  capacity:      integer("capacity").default(100).notNull(),
  status:        varchar("status", { length: 30 }).default("open").notNull(), // open | closed | completed | cancelled
  notes:         text("notes"),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type TrialSlot = typeof trialSlotsTable.$inferSelect;

export const trialAllocationsTable = pgTable("trial_allocations", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull(),
  slotId:         uuid("slot_id").notNull(),
  venueId:        uuid("venue_id").notNull(),
  city:           varchar("city", { length: 100 }).notNull(),
  status:         varchar("status", { length: 30 }).default("allocated").notNull(), // allocated | cancelled | completed
  source:         varchar("source", { length: 20 }).default("auto").notNull(),      // auto | manual
  allocatedBy:    varchar("allocated_by", { length: 80 }).default("system").notNull(),
  passToken:      varchar("pass_token", { length: 64 }).notNull(),                  // QR payload (unique via raw index)
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type TrialAllocation = typeof trialAllocationsTable.$inferSelect;

export const trialCheckinsTable = pgTable("trial_checkins", {
  id:             uuid("id").primaryKey().defaultRandom(),
  allocationId:   uuid("allocation_id").notNull(),
  registrationId: uuid("registration_id").notNull(),   // unique via raw index — hard duplicate-check-in guard
  slotId:         uuid("slot_id").notNull(),
  venueId:        uuid("venue_id").notNull(),
  method:         varchar("method", { length: 20 }).default("qr").notNull(), // qr | manual
  staff:          varchar("staff", { length: 80 }),
  device:         varchar("device", { length: 120 }),
  checkedInAt:    timestamp("checked_in_at", { withTimezone: true }).defaultNow().notNull(),
});
export type TrialCheckin = typeof trialCheckinsTable.$inferSelect;

export const physicalAssessmentsTable = pgTable("physical_assessments", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull(),   // unique via raw index — one physical record per player
  allocationId:   uuid("allocation_id"),
  slotId:         uuid("slot_id"),
  city:           varchar("city", { length: 100 }),
  venue:          varchar("venue", { length: 255 }),
  batch:          varchar("batch", { length: 80 }),
  assessor:       varchar("assessor", { length: 80 }).notNull(),
  playerRole:     varchar("player_role", { length: 30 }).notNull(),      // normalized: batsman|bowler|all_rounder|wicket_keeper
  scores:         jsonb("scores").$type<Record<string, number>>().notNull(), // criterion → 1..10
  finalScore:     numeric("final_score", { precision: 5, scale: 2 }).notNull(),
  comments:       text("comments"),
  result:         varchar("result", { length: 40 }).default("FINAL_SELECTION_PENDING").notNull(), // FINAL_SELECTION_PENDING | FINAL_SELECTED | FINAL_NOT_SELECTED
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type PhysicalAssessment = typeof physicalAssessmentsTable.$inferSelect;

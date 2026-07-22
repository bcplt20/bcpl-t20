import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

// Employment + emergency-contact details collected on the KYC page
// (after Phase 2 payment — the pre-payment form only has declarations).
// One row per registration, upserted on KYC submit.
export const playerProfilesTable = pgTable("player_profiles", {
  id:                uuid("id").primaryKey().defaultRandom(),
  registrationId:    uuid("registration_id").notNull().unique().references(() => registrationsTable.id),
  company:           varchar("company",            { length: 150 }),
  jobTitle:          varchar("job_title",          { length: 150 }),
  experience:        varchar("experience",         { length: 20 }),
  linkedin:          varchar("linkedin",           { length: 200 }),
  tshirtSize:        varchar("tshirt_size",        { length: 5 }),
  emergencyName:     varchar("emergency_name",     { length: 100 }),
  emergencyRelation: varchar("emergency_relation", { length: 30 }),
  emergencyPhone:    varchar("emergency_phone",    { length: 15 }),
  bloodGroup:        varchar("blood_group",        { length: 5 }),
  createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PlayerProfile = typeof playerProfilesTable.$inferSelect;

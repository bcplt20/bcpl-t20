import { pgTable, uuid, varchar, integer, timestamp, text } from "drizzle-orm/pg-core";

export const trialVenuesTable = pgTable("trial_venues", {
  id:             uuid("id").primaryKey().defaultRandom(),
  city:           varchar("city",           { length: 100 }).notNull(),
  venue:          varchar("venue",          { length: 255 }).notNull(),
  trialDate:      varchar("trial_date",     { length: 50 }).notNull(),   // e.g. "12 August 2025"
  trialTime:      varchar("trial_time",     { length: 50 }).notNull(),   // e.g. "8:00 AM – 12:00 PM"
  reportingTime:  varchar("reporting_time", { length: 50 }).notNull(),   // e.g. "7:30 AM"
  slots:          integer("slots").default(100).notNull(),
  notes:          text("notes"),
  status:         varchar("status", { length: 30 }).default("upcoming").notNull(), // upcoming | active | completed
  announcedAt:    timestamp("announced_at", { withTimezone: true }),
  createdAt:      timestamp("created_at",   { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at",   { withTimezone: true }).defaultNow().notNull(),
});

export type TrialVenue = typeof trialVenuesTable.$inferSelect;

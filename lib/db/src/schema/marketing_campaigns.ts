import { pgTable, uuid, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";

/** Manual ad-spend tracker for marketing campaigns (budget/spend bookkeeping only —
 *  no fabricated leads/conversions/ROI). */
export const marketingCampaignsTable = pgTable("marketing_campaigns", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      varchar("name", { length: 150 }).notNull(),
  channel:   varchar("channel", { length: 40 }).default("Other").notNull(),
  budget:    numeric("budget", { precision: 12, scale: 2 }).default("0").notNull(),
  spent:     numeric("spent",  { precision: 12, scale: 2 }).default("0").notNull(),
  startDate: varchar("start_date", { length: 20 }),
  endDate:   varchar("end_date",   { length: 20 }),
  goal:      varchar("goal", { length: 100 }),
  status:    varchar("status", { length: 20 }).default("active").notNull(), // active | paused | completed
  notes:     text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MarketingCampaign = typeof marketingCampaignsTable.$inferSelect;

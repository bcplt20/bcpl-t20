import { pgTable, varchar, json, timestamp } from "drizzle-orm/pg-core";

/** Simple key-value store for site-wide settings managed from the admin panel
 *  (e.g. sample trial videos shown on the video-upload page). */
export const siteSettingsTable = pgTable("site_settings", {
  key:       varchar("key", { length: 100 }).primaryKey(),
  value:     json("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettingsTable.$inferSelect;

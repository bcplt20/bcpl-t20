import { pgTable, uuid, varchar, integer, real, timestamp, json } from "drizzle-orm/pg-core";

export const pointsTableEntries = pgTable("points_table", {
  id:        uuid("id").primaryKey().defaultRandom(),
  season:    integer("season").default(5).notNull(),
  team:      varchar("team", { length: 80 }).notNull(),
  played:    integer("played").default(0).notNull(),
  won:       integer("won").default(0).notNull(),
  lost:      integer("lost").default(0).notNull(),
  noResult:  integer("no_result").default(0).notNull(),
  points:    integer("points").default(0).notNull(),       // won*2 + noResult*1
  nrr:       real("nrr").default(0).notNull(),             // stored as float, e.g. 0.842
  form:      json("form").$type<string[]>().default([]).notNull(), // ["W","L","W","W","L"]
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PointsEntry    = typeof pointsTableEntries.$inferSelect;
export type NewPointsEntry = typeof pointsTableEntries.$inferInsert;

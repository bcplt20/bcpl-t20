import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { matchesTable } from "./matches";

/** Playing XI for each team in a match */
export const matchXITable = pgTable("match_xi", {
  id:        uuid("id").primaryKey().defaultRandom(),
  matchId:   uuid("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  team:      varchar("team",   { length: 80 }).notNull(),
  playerName:varchar("player_name", { length: 100 }).notNull(),
  playerRole:varchar("player_role", { length: 10 }).notNull(), // BAT | BOWL | AR | WK
  battingOrder: integer("batting_order").notNull(),             // 1–11
  isPlaying: boolean("is_playing").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MatchXI    = typeof matchXITable.$inferSelect;
export type NewMatchXI = typeof matchXITable.$inferInsert;

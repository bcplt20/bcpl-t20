import { pgTable, uuid, varchar, integer, timestamp, text } from "drizzle-orm/pg-core";

/** One match in the league schedule */
export const matchesTable = pgTable("matches", {
  id:           uuid("id").primaryKey().defaultRandom(),
  matchNo:      integer("match_no").notNull(),
  season:       integer("season").default(5).notNull(),
  team1:        varchar("team1", { length: 80 }).notNull(),
  team2:        varchar("team2", { length: 80 }).notNull(),
  venue:        varchar("venue",  { length: 150 }).notNull(),
  scheduledAt:  timestamp("scheduled_at", { withTimezone: true }),
  // toss
  tossWinner:   varchar("toss_winner",   { length: 80 }),
  tossDecision: varchar("toss_decision", { length: 10 }), // "bat" | "field"
  // status: scheduled | toss_done | xi_selected | live | innings2 | completed | abandoned
  status:       varchar("status", { length: 20 }).default("scheduled").notNull(),
  // result
  winner:       varchar("winner",  { length: 80 }),
  resultDesc:   text("result_desc"),           // e.g. "Mumbai won by 14 runs"
  playerOfMatch: varchar("player_of_match", { length: 100 }),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Match    = typeof matchesTable.$inferSelect;
export type NewMatch = typeof matchesTable.$inferInsert;

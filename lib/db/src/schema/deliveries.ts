import { pgTable, uuid, integer, varchar, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { inningsTable } from "./innings";

/**
 * One delivery (ball) within an innings.
 * Extra deliveries (wide, no-ball) are included.
 */
export const deliveriesTable = pgTable("deliveries", {
  id:              uuid("id").primaryKey().defaultRandom(),
  inningsId:       uuid("innings_id").notNull().references(() => inningsTable.id, { onDelete: "cascade" }),
  overNumber:      integer("over_number").notNull(),     // 0-based (over 1 = 0, over 20 = 19)
  ballInOver:      integer("ball_in_over").notNull(),    // legal ball count in over (1-6)
  deliveryInOver:  integer("delivery_in_over").notNull(),// sequential within over (including extras)
  // Players
  batterName:      varchar("batter_name",  { length: 100 }).notNull(),
  bowlerName:      varchar("bowler_name",  { length: 100 }).notNull(),
  // Runs
  runsOffBat:      integer("runs_off_bat").default(0).notNull(),
  extrasRuns:      integer("extras_runs").default(0).notNull(),
  extraType:       varchar("extra_type", { length: 10 }), // null | "wide" | "no_ball" | "leg_bye" | "bye"
  totalRuns:       integer("total_runs").notNull(),        // runsOffBat + extrasRuns
  // Wicket
  isWicket:        boolean("is_wicket").default(false).notNull(),
  dismissalType:   varchar("dismissal_type", { length: 30 }),
  // "bowled" | "caught" | "lbw" | "run_out" | "stumped" | "hit_wicket" | "caught_and_bowled" | "retired_hurt"
  dismissedBatter: varchar("dismissed_batter", { length: 100 }),
  fielderName:     varchar("fielder_name",      { length: 100 }), // for caught, run_out, stumped
  // Commentary
  commentary:      text("commentary"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Delivery    = typeof deliveriesTable.$inferSelect;
export type NewDelivery = typeof deliveriesTable.$inferInsert;

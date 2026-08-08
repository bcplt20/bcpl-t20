import { pgTable, uuid, integer, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { matchesTable } from "./matches";

/** Admin-attached highlight clip for a specific ball. Match moments themselves
 *  are DERIVED from deliveries at read time; this table only stores the optional
 *  clip URL / caption an admin pins to an (innings, over, ball). */
export const matchMomentsTable = pgTable("match_moments", {
  id:            uuid("id").primaryKey().defaultRandom(),
  matchId:       uuid("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  inningsNumber: integer("innings_number").notNull(),
  overNumber:    integer("over_number").notNull(),  // 0-based, matches deliveries
  ballInOver:    integer("ball_in_over").notNull(),
  clipUrl:       varchar("clip_url", { length: 1000 }).notNull(),
  caption:       varchar("caption", { length: 200 }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("match_moments_ball_uq").on(t.matchId, t.inningsNumber, t.overNumber, t.ballInOver),
]);

export type MatchMoment = typeof matchMomentsTable.$inferSelect;

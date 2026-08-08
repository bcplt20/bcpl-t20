import { pgTable, uuid, varchar, integer, timestamp, json, index } from "drizzle-orm/pg-core";
import { matchesTable } from "./matches";

/** One innings within a match */
export const inningsTable = pgTable("innings", {
  id:            uuid("id").primaryKey().defaultRandom(),
  matchId:       uuid("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
  inningsNumber: integer("innings_number").notNull(), // 1 or 2
  battingTeam:   varchar("batting_team",  { length: 80 }).notNull(),
  bowlingTeam:   varchar("bowling_team",  { length: 80 }).notNull(),
  // Playing XIs stored as JSON arrays of player name strings
  battingXI:     json("batting_xi").$type<string[]>().default([]).notNull(),
  bowlingXI:     json("bowling_xi").$type<string[]>().default([]).notNull(),
  // Running totals (updated on every delivery)
  totalRuns:     integer("total_runs").default(0).notNull(),
  totalWickets:  integer("total_wickets").default(0).notNull(),
  overs:         integer("overs").default(0).notNull(),   // completed overs
  balls:         integer("balls").default(0).notNull(),   // balls in current over
  extras:        integer("extras").default(0).notNull(),
  target:        integer("target"),                       // set for 2nd innings only
  // ── DLS (Duckworth–Lewis–Stern) fields ──────────────────────────────────
  // Original overs allocated to this innings (20 for a full T20). Kept explicit
  // so a rain reduction can never lose the original allocation.
  originalOvers:  integer("original_overs").default(20).notNull(),
  // Revised overs allocation after a rain interruption (null = never reduced).
  revisedOvers:   integer("revised_overs"),
  // Interruption log — each = {oversLeftAtStop, wicketsLostAtStop, oversLeftAtResume}.
  dlsInterruptions: json("dls_interruptions").$type<Array<{ oversLeftAtStop: number; wicketsLostAtStop: number; oversLeftAtResume: number }>>().default([]).notNull(),
  // status: live | completed
  status:        varchar("status", { length: 20 }).default("live").notNull(),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("innings_match_id_idx").on(t.matchId),
]);

export type Innings    = typeof inningsTable.$inferSelect;
export type NewInnings = typeof inningsTable.$inferInsert;

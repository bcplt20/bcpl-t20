import { pgTable, uuid, varchar, integer, timestamp, text, boolean, json } from "drizzle-orm/pg-core";

/** One BCPL franchise team (per season) */
export const teamsTable = pgTable("teams", {
  id:          uuid("id").primaryKey().defaultRandom(),
  season:      integer("season").default(5).notNull(),
  slug:        varchar("slug", { length: 60 }).notNull().unique(),
  name:        varchar("name", { length: 80 }).notNull(),
  city:        varchar("city", { length: 80 }).default("").notNull(),
  color:       varchar("color", { length: 9 }).default("#FF6B00").notNull(),
  secondColor: varchar("second_color", { length: 9 }).default("#F59E0B").notNull(),
  logoUrl:     text("logo_url").default("").notNull(),
  captain:     varchar("captain", { length: 100 }).default("").notNull(),
  coach:       varchar("coach", { length: 100 }).default("").notNull(),
  owner:       varchar("owner", { length: 120 }).default("").notNull(),
  homeGround:  varchar("home_ground", { length: 120 }).default("").notNull(),
  titlesWon:   integer("titles_won").default(0).notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** A squad member of a franchise team */
export const teamPlayersTable = pgTable("team_players", {
  id:            uuid("id").primaryKey().defaultRandom(),
  teamId:        uuid("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  name:          varchar("name", { length: 100 }).notNull(),
  role:          varchar("role", { length: 20 }).default("Batsman").notNull(), // Batsman | Bowler | All-rounder | Wicket-keeper
  age:           integer("age"),
  state:         varchar("state", { length: 80 }).default("").notNull(),
  photoUrl:      text("photo_url").default("").notNull(),
  battingStyle:  varchar("batting_style", { length: 40 }).default("").notNull(),
  bowlingStyle:  varchar("bowling_style", { length: 40 }).default("").notNull(),
  jerseyNo:      varchar("jersey_no", { length: 6 }).default("").notNull(),
  nationality:   varchar("nationality", { length: 20 }).default("Indian").notNull(),
  isCaptain:     boolean("is_captain").default(false).notNull(),
  isViceCaptain: boolean("is_vice_captain").default(false).notNull(),
  auctionPrice:  varchar("auction_price", { length: 20 }).default("").notNull(),
  /** Last-season stat block: { matches, runs, avg, sr, wickets, economy, fifties, centuries, sixes, fours, bestBowl, bestBat } */
  stats:         json("stats").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Team          = typeof teamsTable.$inferSelect;
export type NewTeam       = typeof teamsTable.$inferInsert;
export type TeamPlayer    = typeof teamPlayersTable.$inferSelect;
export type NewTeamPlayer = typeof teamPlayersTable.$inferInsert;

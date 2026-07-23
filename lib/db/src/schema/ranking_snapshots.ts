import { pgTable, uuid, integer, real, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

/**
 * Frozen rank captured at result release so a player's issued result card
 * never changes as new players register afterwards.
 */
export const rankingSnapshotsTable = pgTable("ranking_snapshots", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull().unique().references(() => registrationsTable.id),
  cityRank:       integer("city_rank"),
  cityTotal:      integer("city_total"),
  roleRank:       integer("role_rank"),
  roleTotal:      integer("role_total"),
  percentile:     real("percentile"),
  snapshotAt:     timestamp("snapshot_at", { withTimezone: true }).defaultNow().notNull(),
});

export type RankingSnapshot = typeof rankingSnapshotsTable.$inferSelect;

import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";

/** Admin-editable reward ladder for the player referral program.
 *  threshold = number of PAID referrals needed (paid = friend completed
 *  Phase 1 payment — free signups are trivially farmable, so they never
 *  count toward rewards). Seeded with suggested defaults on first run. */
export const referralRewardTiersTable = pgTable("referral_reward_tiers", {
  id:        uuid("id").primaryKey().defaultRandom(),
  threshold: integer("threshold").notNull().unique(),
  reward:    varchar("reward", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Manual payout bookkeeping: which milestone rewards were actually handed out
 *  (owner gives cap/jersey/cash by hand; admin marks it here so nothing is
 *  double-counted). reward text is snapshotted at grant time so later tier
 *  edits don't rewrite history. UNIQUE(code, threshold) in DDL. */
export const referralRewardGrantsTable = pgTable("referral_reward_grants", {
  id:        uuid("id").primaryKey().defaultRandom(),
  code:      varchar("code", { length: 30 }).notNull(),
  threshold: integer("threshold").notNull(),
  reward:    varchar("reward", { length: 200 }).notNull(),
  givenAt:   timestamp("given_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ReferralRewardTier  = typeof referralRewardTiersTable.$inferSelect;
export type ReferralRewardGrant = typeof referralRewardGrantsTable.$inferSelect;

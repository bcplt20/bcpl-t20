import { pgTable, uuid, varchar, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/** Referral / affiliate links: bcplt20.com/r/CODE
 *  kind: 'influencer' (Marketing → Referrals) | 'agent' (Affiliates view)
 *      | 'player' (auto-generated personal codes for the player referral program). */
export const referralCodesTable = pgTable("referral_codes", {
  id:             uuid("id").primaryKey().defaultRandom(),
  code:           varchar("code", { length: 30 }).notNull().unique(),
  name:           varchar("name", { length: 100 }).notNull(),
  kind:           varchar("kind", { length: 20 }).default("influencer").notNull(),
  platform:       varchar("platform", { length: 30 }).default("Other").notNull(),
  city:           varchar("city", { length: 50 }),
  phone:          varchar("phone", { length: 15 }),
  email:          varchar("email", { length: 255 }),
  /** Owning player (kind='player' codes only) — one personal code per user. */
  userId:         uuid("user_id").unique().references(() => usersTable.id),
  /** % of attributed revenue owed as commission (agents). */
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  /** Manual payout bookkeeping — how much has actually been paid to the agent. */
  paidOut:        numeric("paid_out", { precision: 12, scale: 2 }).default("0").notNull(),
  active:         boolean("active").default(true).notNull(),
  clicks:         integer("clicks").default(0).notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodesTable.$inferSelect;

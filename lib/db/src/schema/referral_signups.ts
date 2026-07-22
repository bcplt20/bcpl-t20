import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

/** Attribution join table: which referral code brought a registration.
 *  Kept separate from registrations so referral tracking never touches that schema.
 *  registration_id is UNIQUE — first attributed code wins. */
export const referralSignupsTable = pgTable("referral_signups", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull().unique().references(() => registrationsTable.id),
  code:           varchar("code", { length: 30 }).notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ReferralSignup = typeof referralSignupsTable.$inferSelect;

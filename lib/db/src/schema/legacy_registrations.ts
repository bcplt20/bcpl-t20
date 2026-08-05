import { pgTable, serial, varchar, integer, date, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Legacy registrations imported from the old WordPress site (bcpl-t20.com)
 * via CSV exports. Kept fully separate from the live `users`/`registrations`
 * tables so historic data can never pollute the current season. Import is
 * idempotent: (source, legacy_reg_id) is unique, re-uploads skip existing rows.
 */
export const legacyRegistrationsTable = pgTable("legacy_registrations", {
  id:            serial("id").primaryKey(),
  /** Which CSV batch this row came from: 'paid' | 'unpaid' */
  source:        varchar("source", { length: 16 }).notNull(),
  /** "Registration ID" from the legacy system */
  legacyRegId:   integer("legacy_reg_id").notNull(),
  firstName:     varchar("first_name", { length: 120 }).notNull(),
  lastName:      varchar("last_name",  { length: 120 }),
  phone:         varchar("phone",      { length: 15 }).notNull(),
  email:         varchar("email",      { length: 255 }),
  dob:           date("dob"),
  state:         varchar("state",      { length: 120 }),
  city:          varchar("city",       { length: 120 }),
  trialCity:     varchar("trial_city", { length: 120 }),
  role:          varchar("role",       { length: 60 }),
  trialStatus:   varchar("trial_status",   { length: 40 }),
  paymentStatus: varchar("payment_status", { length: 40 }),
  /** Amount in paise (₹2360.00 → 236000); 0 when the legacy row was ₹0 */
  amountPaise:   integer("amount_paise").notNull().default(0),
  paymentDate:   timestamp("payment_date",      { withTimezone: true }),
  referralCode:  varchar("referral_code", { length: 80 }),
  legacyUpdatedAt: timestamp("legacy_updated_at", { withTimezone: true }),
  importedAt:    timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("legacy_registrations_source_regid_uq").on(t.source, t.legacyRegId),
  index("legacy_registrations_phone_idx").on(t.phone),
]);

export type LegacyRegistration = typeof legacyRegistrationsTable.$inferSelect;

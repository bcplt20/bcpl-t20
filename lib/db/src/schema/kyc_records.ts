import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

export const kycRecordsTable = pgTable("kyc_records", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull().references(() => registrationsTable.id),
  profession:     varchar("profession",     { length: 100 }),
  aadhaarRef:     varchar("aadhaar_ref",    { length: 100 }),
  panRef:         varchar("pan_ref",        { length: 100 }),
  cashfreeKycId:  varchar("cashfree_kyc_id", { length: 100 }),
  // pending | verified | failed
  status:         varchar("status", { length: 20 }).default("pending").notNull(),
  // false = Cashfree auto-verify unavailable, PAN needs manual review by admin
  panVerified:    boolean("pan_verified").default(true).notNull(),
  verifiedAt:     timestamp("verified_at",  { withTimezone: true }),
  createdAt:      timestamp("created_at",   { withTimezone: true }).defaultNow().notNull(),
});

export type KycRecord = typeof kycRecordsTable.$inferSelect;

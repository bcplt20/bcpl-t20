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
  // true = player completed Aadhaar OTP successfully
  aadhaarVerified: boolean("aadhaar_verified").default(false).notNull(),
  verifiedAt:     timestamp("verified_at",  { withTimezone: true }),
  /* ── Employment / professional verification (Stage 6) ──
     Category chosen by the player; status set by KYC team.
     employment_status: pending | verified | failed | more_information_required */
  employmentCategory:      varchar("employment_category", { length: 40 }),
  employmentStatus:        varchar("employment_status", { length: 32 }).default("pending").notNull(),
  employmentVerifiedAt:    timestamp("employment_verified_at", { withTimezone: true }),
  employmentMethod:        varchar("employment_method", { length: 60 }),
  employmentReference:     varchar("employment_reference", { length: 200 }),
  employmentFailureReason: varchar("employment_failure_reason", { length: 500 }),
  createdAt:      timestamp("created_at",   { withTimezone: true }).defaultNow().notNull(),
});

export type KycRecord = typeof kycRecordsTable.$inferSelect;

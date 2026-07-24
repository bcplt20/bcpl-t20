import { pgTable, uuid, varchar, timestamp, boolean, integer, date, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { registrationsTable } from "./registrations";

/**
 * Server-side autosave for incomplete Phase-1 registrations ("drafts").
 *
 * A draft is NOT a registered player — it converts into a registrations row
 * only after OTP verification + /register/phase1, and becomes PHASE1_ACTIVE
 * only when the Phase-1 payment succeeds. OTP values are NEVER stored here.
 * Unverified phone numbers on drafts must never receive automated messages
 * (the number may be mistyped or belong to someone else).
 */
export const registrationDraftsTable = pgTable("registration_drafts", {
  id:            uuid("id").primaryKey().defaultRandom(),
  draftNumber:   varchar("draft_number", { length: 20 }).unique().notNull(), // REG-DRAFT-XXXXXX
  clientKey:     varchar("client_key",   { length: 64 }).notNull(),          // anonymous browser key (resume before OTP)
  fullName:      varchar("full_name",    { length: 100 }),
  email:         varchar("email",        { length: 255 }),
  phone:         varchar("phone",        { length: 15 }),
  dob:           date("dob"),
  calculatedAge: integer("calculated_age"),
  role:          varchar("role",         { length: 20 }),                    // bat | bowl | wk | ar
  trialCity:     varchar("trial_city",   { length: 50 }),
  mobileVerified: boolean("mobile_verified").default(false).notNull(),       // set ONLY by the server OTP-verify hook
  otpRequestedAt: timestamp("otp_requested_at", { withTimezone: true }),
  lastCompletedStep: varchar("last_completed_step", { length: 20 }),         // about | contact | cricket | review
  // DRAFT_STARTED | CONTACT_ENTERED | OTP_PENDING | OTP_VERIFIED | PROFILE_COMPLETE | PAYMENT_PENDING | PHASE1_ACTIVE | ABANDONED
  status:        varchar("status", { length: 20 }).default("DRAFT_STARTED").notNull(),
  // NOT_STARTED | INITIATED | PENDING | SUCCESS | FAILED
  phase1PaymentStatus: varchar("phase1_payment_status", { length: 20 }).default("NOT_STARTED").notNull(),
  userId:        uuid("user_id").references(() => usersTable.id),
  registrationId: uuid("registration_id").references(() => registrationsTable.id),
  source:        jsonb("source").$type<Record<string, string>>(),            // utm_* / ref / device label — privacy-light
  startedAt:      timestamp("started_at",       { withTimezone: true }).defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
  abandonedAt:    timestamp("abandoned_at",     { withTimezone: true }),
});

export type RegistrationDraft = typeof registrationDraftsTable.$inferSelect;

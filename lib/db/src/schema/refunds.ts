import { pgTable, uuid, varchar, timestamp, integer, numeric, text } from "drizzle-orm/pg-core";

/**
 * Stage 5 — dedicated refund tracking.
 *
 * MANUAL workflow only: refunds are created by finance admins, never by
 * code paths. Non-selection must NOT auto-create a refund; eligibility
 * follows the approved BCPL Refund & Cancellation Policy.
 *
 * Lifecycle: requested → approved | rejected ; approved → processed.
 * rejected / processed are terminal.
 */
export const refundsTable = pgTable("refunds", {
  id:             uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull(),
  phase:          integer("phase").notNull(),                  // 1 | 2
  paymentId:      uuid("payment_id"),                          // phase{1,2}_payments.id
  paymentRef:     varchar("payment_ref", { length: 100 }),     // cashfree order id snapshot
  amount:         numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reason:         varchar("reason", { length: 40 }).notNull(), // duplicate_payment | technical_issue | event_cancellation | player_cancellation | other_approved
  reasonNote:     text("reason_note"),
  eligibility:    varchar("eligibility", { length: 20 }).default("policy_review").notNull(), // policy_review | eligible | not_eligible
  status:         varchar("status", { length: 20 }).default("requested").notNull(),          // requested | approved | rejected | processed
  requestedBy:    varchar("requested_by", { length: 80 }),
  decidedBy:      varchar("decided_by", { length: 80 }),
  decidedAt:      timestamp("decided_at", { withTimezone: true }),
  processedBy:    varchar("processed_by", { length: 80 }),
  processedAt:    timestamp("processed_at", { withTimezone: true }),
  refundRef:      varchar("refund_ref", { length: 100 }),      // gateway / UTR reference entered at processing
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type RefundRecord = typeof refundsTable.$inferSelect;

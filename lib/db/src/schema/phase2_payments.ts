import { pgTable, uuid, numeric, varchar, timestamp } from "drizzle-orm/pg-core";
import { registrationsTable } from "./registrations";

export const phase2PaymentsTable = pgTable("phase2_payments", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  registrationId:     uuid("registration_id").notNull().references(() => registrationsTable.id),
  amount:             numeric("amount", { precision: 10, scale: 2 }).notNull(),
  cashfreeOrderId:    varchar("cashfree_order_id",   { length: 100 }).notNull().unique(),
  cashfreePaymentId:  varchar("cashfree_payment_id", { length: 100 }),
  status:             varchar("status", { length: 20 }).default("pending").notNull(), // pending | success | failed
  paidAt:             timestamp("paid_at",    { withTimezone: true }),
  createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Phase2Payment = typeof phase2PaymentsTable.$inferSelect;

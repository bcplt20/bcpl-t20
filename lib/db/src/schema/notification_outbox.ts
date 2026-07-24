import { pgTable, uuid, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Durable retry queue for failed notification sends (email/SMS).
 * A row is created ONLY when a provider send fails (never for OTPs).
 * The outbox sweep retries with exponential backoff until the message
 * is sent or max_attempts is exhausted (status becomes "dead").
 *
 * Live-row dedupe: a partial unique index on dedupe_key applies only while
 * status IN ('pending','sending') — identical failures merge into one queued
 * row, but a message re-sent later (after success) is not blocked.
 */
export const notificationOutboxTable = pgTable("notification_outbox", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id"), // nullable — admin alerts have no player
  channel:       varchar("channel", { length: 10 }).notNull(), // email | sms
  recipient:     varchar("recipient", { length: 160 }).notNull(),
  recipientName: varchar("recipient_name", { length: 120 }),
  template:      varchar("template", { length: 60 }).notNull().default("unknown"),
  /** email: { subject, htmlContent } · sms: { message } */
  payload:       jsonb("payload").notNull(),
  dedupeKey:     varchar("dedupe_key", { length: 160 }),
  status:        varchar("status", { length: 20 }).notNull().default("pending"), // pending | sending | sent | dead
  attempts:      integer("attempts").notNull().default(0),
  maxAttempts:   integer("max_attempts").notNull().default(5),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).defaultNow().notNull(),
  lastError:     varchar("last_error", { length: 500 }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  sentAt:        timestamp("sent_at", { withTimezone: true }),
});

export type NotificationOutboxRow = typeof notificationOutboxTable.$inferSelect;

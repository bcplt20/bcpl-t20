import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const otpSessionsTable = pgTable("otp_sessions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  phone:     varchar("phone",    { length: 15  }).notNull(),
  otpCode:   varchar("otp_code", { length: 6   }).notNull(),
  purpose:   varchar("purpose",  { length: 30  }).notNull(), // register | login
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt:    timestamp("used_at",    { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("otp_sessions_phone_idx").on(t.phone, t.purpose),
]);

export type OtpSession = typeof otpSessionsTable.$inferSelect;

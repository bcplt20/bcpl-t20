import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notificationLogsTable = pgTable("notification_logs", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => usersTable.id),
  type:      varchar("type",     { length: 20 }).notNull(), // email | sms | whatsapp
  template:  varchar("template", { length: 50 }).notNull(),
  status:    varchar("status",   { length: 20 }).default("sent").notNull(), // sent | failed | skipped
  error:     varchar("error",    { length: 500 }), // provider error when status = failed/skipped
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogsTable.$inferSelect;

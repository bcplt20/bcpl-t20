import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/** In-app notification inbox. A row is ALWAYS written for every notification
 *  event (KYC result, Phase-1 result, Phase-2 paid, video reupload, reminders,
 *  match/trial nudges) even when push delivery is gated off — the app renders
 *  the inbox regardless. `data` carries a small deep-link payload. */
export const notificationsInboxTable = pgTable("notifications_inbox", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => usersTable.id),
  type:      varchar("type", { length: 40 }).notNull(),
  title:     varchar("title", { length: 160 }).notNull(),
  body:      text("body").notNull(),
  data:      jsonb("data"),
  readAt:    timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("notifications_inbox_user_idx").on(t.userId, t.createdAt),
]);

export type NotificationInbox = typeof notificationsInboxTable.$inferSelect;

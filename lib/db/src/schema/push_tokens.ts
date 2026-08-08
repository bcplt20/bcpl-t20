import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/** Expo push tokens for the mobile app. One row per (user, device token).
 *  expo_token is globally UNIQUE — the same physical device that logs into a
 *  new account re-points its token to that account (register is idempotent). */
export const pushTokensTable = pgTable("push_tokens", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     uuid("user_id").notNull().references(() => usersTable.id),
  expoToken:  varchar("expo_token", { length: 200 }).notNull().unique(),
  platform:   varchar("platform", { length: 10 }).default("unknown").notNull(), // ios | android | unknown
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PushToken = typeof pushTokensTable.$inferSelect;

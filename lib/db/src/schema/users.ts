import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        varchar("name",  { length: 100 }).notNull(),
  phone:       varchar("phone", { length: 15 }).notNull().unique(),
  email:       varchar("email", { length: 255 }).notNull().unique(),
  isVerified:  boolean("is_verified").default(false).notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

import { pgTable, uuid, varchar, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        varchar("name",  { length: 100 }).notNull(),
  phone:       varchar("phone", { length: 15 }).notNull().unique(),
  email:       varchar("email", { length: 255 }).notNull().unique(),
  // Date of birth (YYYY-MM-DD). Nullable: legacy users registered before the DOB gate.
  dob:         date("dob"),
  // Profile avatar: either "preset:<id>" (one of a fixed preset list) or the
  // literal "photo" (a user-uploaded image stored at media/avatars/<id>.jpg).
  // Nullable: users without a chosen avatar fall back to a default icon.
  avatar:      varchar("avatar", { length: 60 }),
  isVerified:  boolean("is_verified").default(false).notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

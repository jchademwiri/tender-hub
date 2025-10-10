// src/db/schema.ts
import { pgTable, text, varchar, timestamp, uuid, integer } from "drizzle-orm/pg-core";


/**
 * Provinces Table
 * Stores a list of provinces (e.g. Gauteng, Mpumalanga).
 */
export const provinces = pgTable("provinces", {
   id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  code: varchar("code", { length: 10 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Publishers Table
 * Each publisher belongs to one province.
 */
export const publishers = pgTable("publishers", {
   id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  province_id: uuid("province_id").notNull(), // FK to provinces.id
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * TypeScript types
 */
export type Province = typeof provinces.$inferSelect;
export type Publisher = typeof publishers.$inferSelect;
export type NewPublisher = typeof publishers.$inferInsert;

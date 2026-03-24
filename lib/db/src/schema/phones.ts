import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const phonesTable = pgTable("phones", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPhoneSchema = createInsertSchema(phonesTable).omit({ id: true, createdAt: true });
export type InsertPhone = z.infer<typeof insertPhoneSchema>;
export type Phone = typeof phonesTable.$inferSelect;

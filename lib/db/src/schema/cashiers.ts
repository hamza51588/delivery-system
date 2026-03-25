import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cashiersTable = pgTable("cashiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCashierSchema = createInsertSchema(cashiersTable).omit({ id: true, createdAt: true });
export type InsertCashier = z.infer<typeof insertCashierSchema>;
export type Cashier = typeof cashiersTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliveryAreasTable = pgTable("delivery_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliveryAreaSchema = createInsertSchema(deliveryAreasTable).omit({ id: true, createdAt: true });
export type InsertDeliveryArea = z.infer<typeof insertDeliveryAreaSchema>;
export type DeliveryArea = typeof deliveryAreasTable.$inferSelect;

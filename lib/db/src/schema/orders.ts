import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  address: text("address").notNull(),
  orderDetails: text("order_details").notNull(),
  notes: text("notes"),
  deliveryArea: text("delivery_area"),
  deliveryFee: integer("delivery_fee"),
  paymentMethod: text("payment_method").default("cash"),
  paymentReceiptImage: text("payment_receipt_image"),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  locationLink: text("location_link"),
  status: text("status").notNull().default("pending"),
  assignedDriverId: integer("assigned_driver_id"),
  assignedDriverName: text("assigned_driver_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

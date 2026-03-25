import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  address: text("address").notNull(),
  orderDetails: text("order_details").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  assignedDriverId: integer("assigned_driver_id"),
  assignedDriverName: text("assigned_driver_name"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  locationLink: text("location_link"),
  deliveryArea: text("delivery_area"),
  deliveryAreaPrice: integer("delivery_area_price"),
  paymentMethod: text("payment_method").notNull().default("cash"),
  paymentReceiptImage: text("payment_receipt_image"),
  paymentVerified: boolean("payment_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true, createdAt: true, status: true,
  assignedDriverId: true, assignedDriverName: true,
  paymentVerified: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

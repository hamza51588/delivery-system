import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const promoCodesTable = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // كود الخصم (مثل FAST20)
  discountValue: integer("discount_value").notNull(), // قيمة الخصم بالريال
  isActive: boolean("is_active").default(true).notNull(), // هل الكود شغال أم متوقف؟
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

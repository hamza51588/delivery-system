import { Router } from "express";
import { db } from "@workspace/db";
import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { eq, sql } from "drizzle-orm";

// تعريف الجدول محلياً لتجنب أخطاء الاستيراد
export const promoCodesTable = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountValue: integer("discount_value").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const router = Router();

// 🌟 دالة سحرية: تقوم ببناء الجدول في قاعدة البيانات فور تشغيل السيرفر
const initTable = async () => {
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS promo_codes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                discount_value INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT true NOT NULL,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);
        console.log("✅ Promo Codes table is ready!");
    } catch (e) {
        console.error("❌ DB Init Error:", e);
    }
};
initTable();

// مسار فحص الكوبون للزبون
router.post("/promos/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "الرجاء إدخال الكود" });

    const result = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, code.toUpperCase())).limit(1);
    const promo = result[0];

    if (!promo || !promo.isActive) {
      return res.status(404).json({ error: "كود الخصم غير صحيح أو منتهي" });
    }
    res.json({ valid: true, discountValue: promo.discountValue, code: promo.code });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ في السيرفر" });
  }
});

// مسار إضافة الكوبون للإدارة
router.post("/promos", async (req, res) => {
  try {
    const { code, discountValue } = req.body;
    await db.insert(promoCodesTable).values({
        code: code.toUpperCase(),
        discountValue: parseInt(discountValue)
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "الكود موجود مسبقاً أو حدث خطأ" });
  }
});

export default router;

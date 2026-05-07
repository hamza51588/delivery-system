import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// حارس قاعدة البيانات: يبني الجدول بالقوة ويتأكد من وجوده
const ensureTable = async () => {
    try {
        await db.execute(sql`CREATE TABLE IF NOT EXISTS promo_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            discount_value INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );`);
        console.log("🎟️ Promo table is verified and ready!");
    } catch(e) {
        console.error("❌ Table Creation Error:", e);
    }
};
ensureTable();

router.post("/promos/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "الرجاء إدخال الكود" });

    const query = await db.execute(sql`SELECT * FROM promo_codes WHERE code = ${code.toUpperCase()} LIMIT 1`);
    const promo = (query.rows || query)[0];

    if (!promo || !promo.is_active) {
      return res.status(404).json({ error: "كود الخصم غير صحيح أو منتهي" });
    }
    res.json({ valid: true, discountValue: promo.discount_value, code: promo.code });
  } catch (error) {
    console.error("❌ Validate Error:", error);
    res.status(500).json({ error: "حدث خطأ في السيرفر" });
  }
});

router.post("/promos", async (req, res) => {
  try {
    const { code, discountValue } = req.body;
    await db.execute(sql`
        INSERT INTO promo_codes (code, discount_value) 
        VALUES (${code.toUpperCase()}, ${parseInt(discountValue)})
    `);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Insert Promo Error:", error);
    res.status(500).json({ error: "الكود موجود مسبقاً أو حدث خطأ" });
  }
});

export default router;

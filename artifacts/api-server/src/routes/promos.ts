import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// مسار فحص الكوبون للزبون
router.post("/promos/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "الرجاء إدخال الكود" });

    // استعلام SQL مباشر
    const query = await db.execute(sql`SELECT * FROM promo_codes WHERE code = ${code.toUpperCase()} LIMIT 1`);
    const promo = (query.rows || query)[0];

    if (!promo || !promo.is_active) {
      return res.status(404).json({ error: "كود الخصم غير صحيح أو منتهي" });
    }
    res.json({ valid: true, discountValue: promo.discount_value, code: promo.code });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ في السيرفر" });
  }
});

// مسار إضافة الكوبون للإدارة
router.post("/promos", async (req, res) => {
  try {
    const { code, discountValue } = req.body;
    // حقن البيانات بـ SQL مباشر رغماً عن المكتبة
    await db.execute(sql`
        INSERT INTO promo_codes (code, discount_value) 
        VALUES (${code.toUpperCase()}, ${parseInt(discountValue)})
    `);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "الكود موجود مسبقاً أو حدث خطأ" });
  }
});

export default router;

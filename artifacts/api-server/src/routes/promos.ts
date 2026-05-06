import { Router } from "express";
import { db } from "@workspace/db";
import { promoCodesTable } from "../../../../lib/db/src/schema/promos"; // استدعاء مباشر ومضمون للجدول
import { eq } from "drizzle-orm";

const router = Router();

// مسار: فحص الكود من قبل الزبون
router.post("/promos/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "الرجاء إدخال الكود" });

    // البحث عن الكود في قاعدة البيانات
    const result = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, code.toUpperCase())).limit(1);
    const promo = result[0];

    if (!promo || !promo.isActive) {
      return res.status(404).json({ error: "كود الخصم غير صحيح أو منتهي الصلاحية" });
    }

    res.json({ valid: true, discountValue: promo.discountValue, code: promo.code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "حدث خطأ في السيرفر" });
  }
});

// مسار: جلب كل الكوبونات للوحة الإدارة
router.get("/promos", async (req, res) => {
  try {
    const promos = await db.select().from(promoCodesTable);
    res.json(promos);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// مسار: إضافة كوبون جديد من لوحة الإدارة
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

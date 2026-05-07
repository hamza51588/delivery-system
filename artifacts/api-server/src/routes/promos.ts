import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

const ensureTable = async () => {
    try {
        await db.execute(sql`CREATE TABLE IF NOT EXISTS promo_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            discount_value INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );`);
        // ترقية الجدول ليدعم العدد والوقت
        await db.execute(sql`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 0;`);
        await db.execute(sql`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;`);
        await db.execute(sql`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;`);
        console.log("🎟️ Promo table upgraded with limits & expiry!");
    } catch(e) {
        console.error("❌ Table Upgrade Error:", e);
    }
};
ensureTable();

// فحص الكوبون للزبون
router.post("/promos/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "الرجاء إدخال الكود" });

    const query = await db.execute(sql`SELECT * FROM promo_codes WHERE code = ${code.toUpperCase()} LIMIT 1`);
    const promo = (query.rows || query)[0];

    if (!promo || !promo.is_active) {
      return res.status(404).json({ error: "كود الخصم غير صحيح أو معطل" });
    }
    
    // فحص العدد
    if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) {
      return res.status(400).json({ error: "عذراً، تم الوصول للحد الأقصى لاستخدام هذا الكود 😔" });
    }
    
    // فحص الوقت
    if (promo.expires_at && new Date() > new Date(promo.expires_at)) {
      return res.status(400).json({ error: "عذراً، انتهت صلاحية هذا الكود ⏱️" });
    }

    res.json({ valid: true, discountValue: promo.discount_value, code: promo.code });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ في السيرفر" });
  }
});

// إضافة الكوبون من الإدارة
router.post("/promos", async (req, res) => {
  try {
    const { code, discountValue, maxUses, expiryDays } = req.body;
    
    let expiresAt = null;
    if (expiryDays && parseInt(expiryDays) > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays)); // حساب يوم الانتهاء
    }
    const limit = maxUses && parseInt(maxUses) > 0 ? parseInt(maxUses) : 0;

    await db.execute(sql`
        INSERT INTO promo_codes (code, discount_value, max_uses, expires_at) 
        VALUES (${code.toUpperCase()}, ${parseInt(discountValue)}, ${limit}, ${expiresAt ? expiresAt.toISOString() : null})
    `);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "الكود موجود مسبقاً أو حدث خطأ" });
  }
});

// مسار لزيادة عداد الاستخدام (سنربطه لاحقاً)
router.post("/promos/use", async (req, res) => {
    try {
        const { code } = req.body;
        await db.execute(sql`UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ${code.toUpperCase()}`);
        res.json({ success: true });
    } catch(e) {}
});

export default router;

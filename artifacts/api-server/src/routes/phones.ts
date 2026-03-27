import { Router, type IRouter } from "express";
import { db, phonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// 1. جلب كل الأرقام
router.get("/phones", async (_req, res) => {
  try {
    const phones = await db.select().from(phonesTable);
    res.json(phones);
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب الأرقام" });
  }
});

// 2. إضافة رقم جديد (الكود المرن والمصلح)
router.post("/phones", async (req, res) => {
  try {
    // نأخذ الرقم بأي اسم يرسله الموقع (phone أو number)
    const phoneInput = req.body.phone || req.body.number;

    if (!phoneInput) {
      return res.status(400).json({ error: "رقم الهاتف مطلوب" });
    }

    const [newPhone] = await db
      .insert(phonesTable)
      .values({ 
        phone: phoneInput.toString().trim() 
      })
      .returning();
    
    res.status(201).json(newPhone);
  } catch (error) {
    console.error("Error saving phone:", error);
    res.status(500).json({ error: "فشل في حفظ الرقم" });
  }
});

// 3. حذف رقم
router.delete("/phones/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(phonesTable).where(eq(phonesTable.id, id)).returning();
    
    if (!deleted) {
      return res.status(404).json({ error: "الرقم غير موجود" });
    }
    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: "فشل في حذف الرقم" });
  }
});

export default router;

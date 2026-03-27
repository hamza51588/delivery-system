import { Router } from "express";
import { db, driversTable, ordersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router = Router();

// جلب جميع السائقين
router.get("/drivers", async (_req, res) => {
  try {
    const drivers = await db.select().from(driversTable);
    res.json(drivers);
  } catch (e) { res.status(500).json({ error: "خطأ في الجلب" }); }
});

// إضافة سائق جديد
router.post("/drivers", async (req, res) => {
  try {
    const [driver] = await db.insert(driversTable).values(req.body).returning();
    res.json(driver);
  } catch (e) { res.status(500).json({ error: "خطأ في الإضافة" }); }
});

// حذف السائق (فك الارتباط الكامل ثم الحذف)
router.delete("/drivers/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    // 1. فك ارتباط السائق بجميع الطلبات (تصفير الاسم والمعرف)
    // هذا يكسر قفل الحماية في قاعدة البيانات
    await db.update(ordersTable)
      .set({ 
        assignedDriverId: null,
        assignedDriverName: null 
      })
      .where(eq(ordersTable.assignedDriverId, id));

    // 2. الآن نحذف السائق من جدول السائقين
    const [deleted] = await db.delete(driversTable)
      .where(eq(driversTable.id, id))
      .returning();

    if (!deleted) return res.status(404).json({ error: "السائق غير موجود" });
    
    res.json({ success: true, message: "تم الحذف بنجاح" });
  } catch (error) {
    console.error("Critical Delete Error:", error);
    res.status(500).json({ error: "فشل الحذف بسبب قيود قاعدة البيانات" });
  }
});

export default router;

import { Router } from "express";
import { db, driversTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// جلب جميع السائقين
router.get("/drivers", async (_req, res) => {
  const drivers = await db.select().from(driversTable);
  res.json(drivers);
});

// إضافة سائق جديد
router.post("/drivers", async (req, res) => {
  const [driver] = await db.insert(driversTable).values(req.body).returning();
  res.json(driver);
});

// حذف سائق (مع تنظيف الارتباطات)
router.delete("/drivers/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    // خطوة الأمان: تصفير اسم السائق في الطلبات المرتبطة به لكي لا ينهار النظام
    await db.update(ordersTable)
      .set({ assignedDriverId: null })
      .where(eq(ordersTable.assignedDriverId, id));

    // الآن نحذف السائق بقلب قوي
    await db.delete(driversTable).where(eq(driversTable.id, id));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Driver Error:", error);
    res.status(500).json({ error: "فشل حذف السائق" });
  }
});

export default router;

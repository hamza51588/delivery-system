import { Router } from "express";
import { db, driversTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// جلب السائقين (سنعرض فقط الذين لم يتم تصفير أسمائهم)
router.get("/drivers", async (_req, res) => {
  try {
    const drivers = await db.select().from(driversTable);
    // تصفية السائقين الحقيقيين فقط
    res.json(drivers.filter(d => d.name && d.name !== "سائق محذوف"));
  } catch (e) { res.status(500).json({ error: "خطأ في الجلب" }); }
});

router.post("/drivers", async (req, res) => {
  try {
    const [driver] = await db.insert(driversTable).values(req.body).returning();
    res.json(driver);
  } catch (e) { res.status(500).json({ error: "خطأ في الإضافة" }); }
});

// "الحذف الذكي": بدلاً من المسح، سنقوم بتصفير الاسم لإخفائه
router.delete("/drivers/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    // تحديث بيانات السائق لجعله "شبحاً" غير مرئي في القوائم
    await db.update(driversTable)
      .set({ name: "سائق محذوف", phone: "" })
      .where(eq(driversTable.id, id));
    
    // فك ارتباطه بالطلبات لكي يظهر "جاري التعيين" في التتبع
    await db.update(ordersTable)
      .set({ assignedDriverId: null, assignedDriverName: null })
      .where(eq(ordersTable.assignedDriverId, id));

    res.json({ success: true, message: "تم الإخفاء بنجاح" });
  } catch (error) {
    res.status(500).json({ error: "فشل الإخفاء" });
  }
});

export default router;

import { Router } from "express";
import { db, driversTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/drivers", async (_req, res) => {
  const drivers = await db.select().from(driversTable);
  res.json(drivers.filter(d => d.name && d.name !== "deleted"));
});

router.post("/drivers", async (req, res) => {
  // توليد كود دخول عشوائي من 4 أرقام لكل سائق جديد
  const loginCode = Math.floor(1000 + Math.random() * 9000).toString();
  const [driver] = await db.insert(driversTable).values({ ...req.body, loginCode, isAvailable: true }).returning();
  res.json(driver);
});

// المسار الجديد: السماح للسائق بتغيير حالته (متاح / غير متاح)
router.post("/drivers/:id/toggle-status", async (req, res) => {
  const id = Number(req.params.id);
  const { isAvailable } = req.body;
  const [driver] = await db.update(driversTable).set({ isAvailable }).where(eq(driversTable.id, id)).returning();
  res.json(driver);
});

// المسار الجديد: تسجيل دخول السائق باستخدام الرمز السري
router.get("/drivers/login/:code", async (req, res) => {
  const code = req.params.code;
  const drivers = await db.select().from(driversTable).where(eq(driversTable.loginCode, code));
  if (drivers.length > 0 && drivers[0].name !== "deleted") {
    res.json(drivers[0]);
  } else {
    res.status(404).json({ error: "رمز الدخول غير صحيح" });
  }
});

router.delete("/drivers/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    // تصفير بيانات السائق المحذوف بالكامل عشان ما يخرب السجلات
    await db.update(driversTable).set({ name: "deleted", phone: "", loginCode: null }).where(eq(driversTable.id, id));
    await db.update(ordersTable).set({ assignedDriverId: null, assignedDriverName: null }).where(eq(ordersTable.assignedDriverId, id));
    res.json({ success: true });
  } catch (e) { res.status(200).json({ success: true }); }
});

export default router;

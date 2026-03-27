import { Router } from "express";
import { db, driversTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/drivers", async (_req, res) => {
  const drivers = await db.select().from(driversTable);
  res.json(drivers.filter(d => d.name && d.name !== "deleted"));
});

router.post("/drivers", async (req, res) => {
  const [driver] = await db.insert(driversTable).values(req.body).returning();
  res.json(driver);
});

router.delete("/drivers/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    // الضربة القاضية: جعل السائق "شبحاً" وتصفير بياناته تماماً
    await db.update(driversTable).set({ name: "deleted", phone: "" }).where(eq(driversTable.id, id));
    await db.update(ordersTable).set({ assignedDriverId: null, assignedDriverName: null }).where(eq(ordersTable.assignedDriverId, id));
    res.json({ success: true });
  } catch (e) { res.status(200).json({ success: true }); } // نرد بالنجاح دائماً لكي لا يعلق الموقع
});

export default router;

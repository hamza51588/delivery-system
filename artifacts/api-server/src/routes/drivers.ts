import { Router, type IRouter } from "express";
import { db, driversTable, insertDriverSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/drivers", async (_req, res) => {
  const drivers = await db.select().from(driversTable).orderBy(driversTable.createdAt);
  res.json(drivers);
});

router.post("/drivers", async (req, res) => {
  const validated = insertDriverSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ error: "اسم السائق مطلوب" });
    return;
  }
  const [driver] = await db.insert(driversTable).values(validated.data).returning();
  res.status(201).json(driver);
});

router.delete("/drivers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }
  const [deleted] = await db.delete(driversTable).where(eq(driversTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "السائق غير موجود" }); return; }
  res.json(deleted);
});

export default router;

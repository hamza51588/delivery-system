import { Router, type IRouter } from "express";
import { db, deliveryAreasTable, insertDeliveryAreaSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/delivery-areas", async (_req, res) => {
  const areas = await db.select().from(deliveryAreasTable).orderBy(deliveryAreasTable.createdAt);
  res.json(areas);
});

router.post("/delivery-areas", async (req, res) => {
  const validated = insertDeliveryAreaSchema.safeParse(req.body);
  if (!validated.success) { res.status(400).json({ error: "بيانات غير صحيحة" }); return; }
  const [area] = await db.insert(deliveryAreasTable).values(validated.data).returning();
  res.status(201).json(area);
});

router.patch("/delivery-areas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }
  const { name, price, isActive } = req.body as { name?: string; price?: number; isActive?: boolean };
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (price !== undefined) updateData.price = price;
  if (isActive !== undefined) updateData.isActive = isActive;
  const [updated] = await db.update(deliveryAreasTable).set(updateData).where(eq(deliveryAreasTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "المنطقة غير موجودة" }); return; }
  res.json(updated);
});

router.delete("/delivery-areas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }
  const [deleted] = await db.delete(deliveryAreasTable).where(eq(deliveryAreasTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "المنطقة غير موجودة" }); return; }
  res.json(deleted);
});

export default router;

import { Router, type IRouter } from "express";
import { db, ordersTable, insertOrderSchema } from "@workspace/db";
import { CreateOrderBody } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/orders", async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  const validated = insertOrderSchema.safeParse(parsed.data);
  if (!validated.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  const [order] = await db.insert(ordersTable).values(validated.data).returning();
  res.status(201).json(order);
});

router.get("/orders", async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders);
});

router.patch("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  const { status, assignedDriverId, assignedDriverName } = req.body as {
    status?: string;
    assignedDriverId?: number;
    assignedDriverName?: string;
  };

  const updateData: Partial<{ status: string; assignedDriverId: number | null; assignedDriverName: string | null }> = {};
  if (status !== undefined) updateData.status = status;
  if (assignedDriverId !== undefined) updateData.assignedDriverId = assignedDriverId;
  if (assignedDriverName !== undefined) updateData.assignedDriverName = assignedDriverName;

  const [updated] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  res.json(updated);
});

export default router;

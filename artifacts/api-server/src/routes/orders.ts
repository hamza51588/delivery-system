import { Router, type IRouter } from "express";
import { db, ordersTable, insertOrderSchema } from "@workspace/db";
import { CreateOrderBody } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

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

export default router;

import { Router, type IRouter } from "express";
import { db, cashiersTable, insertCashierSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/cashiers", async (_req, res) => {
  const cashiers = await db.select().from(cashiersTable).orderBy(cashiersTable.createdAt);
  res.json(cashiers);
});

router.post("/cashiers", async (req, res) => {
  const validated = insertCashierSchema.safeParse(req.body);
  if (!validated.success) { res.status(400).json({ error: "اسم الصراف مطلوب" }); return; }
  const [cashier] = await db.insert(cashiersTable).values(validated.data).returning();
  res.status(201).json(cashier);
});

router.delete("/cashiers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }
  const [deleted] = await db.delete(cashiersTable).where(eq(cashiersTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "الصراف غير موجود" }); return; }
  res.json(deleted);
});

export default router;

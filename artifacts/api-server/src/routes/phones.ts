import { Router, type IRouter } from "express";
import { db, phonesTable, insertPhoneSchema } from "@workspace/db";
import { AddPhoneBody, DeletePhoneParams } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/phones", async (_req, res) => {
  const phones = await db.select().from(phonesTable).orderBy(phonesTable.createdAt);
  res.json(phones);
});

router.post("/phones", async (req, res) => {
  const parsed = AddPhoneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "رقم الهاتف مطلوب" });
    return;
  }

  const validated = insertPhoneSchema.safeParse(parsed.data);
  if (!validated.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }

  const [phone] = await db.insert(phonesTable).values(validated.data).returning();
  res.status(201).json(phone);
});

router.delete("/phones/:id", async (req, res) => {
  const parsed = DeletePhoneParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "معرف غير صحيح" });
    return;
  }

  const [deleted] = await db.delete(phonesTable).where(eq(phonesTable.id, parsed.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "الرقم غير موجود" });
    return;
  }

  res.json(deleted);
});

export default router;

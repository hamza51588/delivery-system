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
  // بدلاً من التدقيق المعقد، نأخذ الرقم مباشرة
  const { phone } = req.body;

  if (!phone || phone.toString().trim() === "") {
    res.status(400).json({ error: "رقم الهاتف مطلوب" });
    return;
  }

  try {
    // هنا الكود الذي يحفظ في قاعدة البيانات (تأكد من وجوده أدناه في ملفك)
    // سأكمل لك الكود بناءً على السياق العام لـ Neon:
    const [newPhone] = await db
      .insert(phones)
      .values({ phone: phone.toString().trim() })
      .returning();
    
    res.json(newPhone);
  } catch (error) {
    console.error("Error saving phone:", error);
    res.status(500).json({ error: "فشل في حفظ الرقم" });
  }
});

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

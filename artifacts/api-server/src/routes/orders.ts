import { Router, type IRouter } from "express";
import { db, ordersTable, insertOrderSchema, driversTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";

const router: IRouter = Router();

const BOT_TOKEN = "7846459199:AAFuDhDJ9__6W5dZVLvew5qTND_CxhycQSc";
const CHAT_ID = "1841557437";

async function sendTelegramAlert(order: any) {
  const message = `🔔 *طلب جديد وصل يا مدير!*\n━━━━━━━━━━━━\n👤 العميل: ${order.customerName}\n📞 الهاتف: ${order.customerPhone}\n💰 الإجمالي: ${order.totalPrice} ريال\n📍 العنوان: ${order.deliveryArea || "غير محدد"}`;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: "Markdown" })
    });
  } catch (e) { console.error("Telegram Failed", e); }
}

router.post("/orders", async (req, res) => {
  try {
    const validated = insertOrderSchema.safeParse(req.body);
    if (!validated.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
    const [order] = await db.insert(ordersTable).values(validated.data).returning();
    if (order) await sendTelegramAlert(order);
    res.status(201).json(order);
  } catch (e) { res.status(500).json({ error: "خطأ في الحفظ" }); }
});

router.get("/orders/track", async (req, res) => {
  const id = Number(req.query.id);
  const phone = String(req.query.phone || "").trim();

  try {
    const results = await db.select().from(ordersTable).where(and(eq(ordersTable.id, id), eq(ordersTable.customerPhone, phone)));
    const order = results[0];

    if (!order) return res.status(404).json({ error: "الطلب غير موجود" });

    let driverPhone = ""; // تركناها فارغة لكي تختفي السماعة إذا لم يتم التعيين
    if (order.assignedDriverId) {
      const driverResults = await db.select().from(driversTable).where(eq(driversTable.id, order.assignedDriverId));
      if (driverResults[0]) {
        driverPhone = driverResults[0].phone || "";
      }
    }

    res.json({
      ...order,
      assignedDriverName: order.assignedDriverName || "جاري التعيين...", // وداعاً لكلمة null
      assignedDriverPhone: driverPhone
    });
  } catch (error) {
    console.error("Tracking Error:", error);
    res.status(500).json({ error: "حدث خطأ داخلي" });
  }
});

router.get("/orders", async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders);
});

/* تم إصلاح هذا القسم لكي لا تعلق لوحة التحكم */
router.patch("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { status, assignedDriverId, assignedDriverName, paymentVerified } = req.body;
    const updateData: any = {};
    
    if (status !== undefined) updateData.status = status;
    if (assignedDriverId !== undefined) updateData.assignedDriverId = assignedDriverId;
    if (assignedDriverName !== undefined) updateData.assignedDriverName = assignedDriverName;
    if (paymentVerified !== undefined) updateData.paymentVerified = paymentVerified;

    const [updated] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id)).returning();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "خطأ في التحديث" });
  }
});

export default router;

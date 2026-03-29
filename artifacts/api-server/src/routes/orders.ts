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

    let driverPhone = "";
    if (order.assignedDriverId) {
      const driverResults = await db.select().from(driversTable).where(eq(driversTable.id, order.assignedDriverId));
      if (driverResults[0]) {
        driverPhone = driverResults[0].phone || "";
      }
    }

    res.json({
      ...order,
      assignedDriverName: order.assignedDriverName || "جاري التعيين...",
      assignedDriverPhone: driverPhone
    });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ داخلي" });
  }
});

router.get("/orders", async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders);
});

router.patch("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { status, assignedDriverId, assignedDriverName, paymentVerified } = req.body;
    const updateData: any = {};
    
    if (status !== undefined) updateData.status = status;
    
    if (assignedDriverId !== undefined) {
       let parsedId = Number(assignedDriverId);
       updateData.assignedDriverId = (isNaN(parsedId) || assignedDriverId === "null" || assignedDriverId === null) ? null : parsedId;
    }
    if (assignedDriverName !== undefined) {
       updateData.assignedDriverName = (assignedDriverName === "null" || assignedDriverName === "") ? null : assignedDriverName;
    }
    
    if (paymentVerified !== undefined) updateData.paymentVerified = paymentVerified;

    const [updated] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id)).returning();
    res.json(updated);
  } catch (error) {
    console.error("Patch Error:", error);
    res.status(500).json({ error: "خطأ في التحديث" });
  }
});

// 🚀 المسار الصحيح 100%: يستقبل الصورة، يحفظها، ويرسلها للتلجرام
router.post("/orders/:id/receipt", async (req: any, res: any) => {
    try {
        const id = Number(req.params.id);
        const imageUrl = req.body.image || req.body.receiptUrl;

        if (imageUrl) {
            // 1. الحفظ في قاعدة البيانات
            await db.update(ordersTable).set({ receiptUrl: imageUrl }).where(eq(ordersTable.id, id));

            // 2. إرسال الصورة للتلجرام مباشرة
            const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
            await fetch(telegramUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    photo: imageUrl,
                    caption: `📸 إيصال جديد للطلب رقم: #${id}`
                })
            });
        }

        res.status(200).json({ success: true, message: "تم الرفع بنجاح" });
    } catch (e) {
        console.error("Receipt Error:", e);
        res.status(200).json({ success: true });
    }
});

export default router;

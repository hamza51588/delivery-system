import { Router, type IRouter } from "express";
import { db, ordersTable, insertOrderSchema } from "@workspace/db";
import { desc, eq, gte, and } from "drizzle-orm";

const router: IRouter = Router();

// --- إعدادات التليجرام الخاصة بحمزة ---
const BOT_TOKEN = "7846459199:AAFuDhDJ9__6W5dZVLvew5qTND_CxhycQSc";
const CHAT_ID = "1841557437";

async function sendTelegramAlert(order: any) {
  const message = `
🔔 *طلب جديد وصل يا مدير!*
━━━━━━━━━━━━
👤 *العميل:* ${order.customerName}
📞 *الهاتف:* ${order.customerPhone}
📍 *العنوان:* ${order.deliveryArea || "غير محدد"}
💰 *الإجمالي:* ${order.totalPrice || 0} ريال
💳 *الدفع:* ${order.paymentMethod === 'cash' ? 'كاش' : 'تحويل'}
━━━━━━━━━━━━
🚚 *يرجى مراجعة لوحة التحكم للتنفيذ.*
  `;

  try {
    // استخدمنا fetch المدمج في Node.js 18+ لإرسال الإشعار
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });
    console.log("Telegram notification sent successfully!");
  } catch (e) {
    console.error("Telegram Notification Failed", e);
  }
}
// ------------------------------------

/* Create order */
router.post("/orders", async (req, res) => {
  const validated = insertOrderSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ error: "بيانات غير صحيحة", details: validated.error.issues });
    return;
  }
  
  // حفظ الطلب في قاعدة البيانات (Neon)
  const [order] = await db.insert(ordersTable).values(validated.data).returning();
  
  // 🔥 إرسال التنبيه فوراً للتليجرام بعد نجاح الحفظ
  if (order) {
    await sendTelegramAlert(order);
  }

  res.status(201).json(order);
});

/* Get all orders (admin) */
router.get("/orders", async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders);
});

/* Public order tracking by id + phone */
router.get("/orders/track", async (req, res) => {
  const id = Number(req.query.id);
  const phone = String(req.query.phone || "").trim();
  if (isNaN(id) || !phone) { res.status(400).json({ error: "بيانات غير صحيحة" }); return; }
  const [order] = await db.select({
    id: ordersTable.id,
    customerName: ordersTable.customerName,
    status: ordersTable.status,
    assignedDriverName: ordersTable.assignedDriverName,
    assignedDriverPhone: ordersTable.assignedDriverPhone,
    deliveryArea: ordersTable.deliveryArea,
    paymentMethod: ordersTable.paymentMethod,
    paymentVerified: ordersTable.paymentVerified,
    createdAt: ordersTable.createdAt,
  }).from(ordersTable).where(and(eq(ordersTable.id, id), eq(ordersTable.customerPhone, phone)));
  if (!order) { res.status(404).json({ error: "لم يتم العثور على الطلب" }); return; }
  res.json(order);
});

/* Update order (admin) */
router.patch("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }

  const {
    status, assignedDriverId, assignedDriverName,
    paymentVerified,
  } = req.body as {
    status?: string;
    assignedDriverId?: number | null;
    assignedDriverName?: string | null;
    paymentVerified?: boolean;
  };

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (assignedDriverId !== undefined) updateData.assignedDriverId = assignedDriverId;
  if (assignedDriverName !== undefined) updateData.assignedDriverName = assignedDriverName;
  if (paymentVerified !== undefined) updateData.paymentVerified = paymentVerified;

  const [updated] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  res.json(updated);
});

/* Upload payment receipt */
router.post("/orders/:id/receipt", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "معرف غير صحيح" }); return; }
  const { image } = req.body as { image?: string };
  if (!image) { res.status(400).json({ error: "الصورة مطلوبة" }); return; }
  const [updated] = await db.update(ordersTable).set({ paymentReceiptImage: image }).where(eq(ordersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  res.json({ ok: true });
});

/* Stats: count by period */
router.get("/orders/stats", async (_req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [allOrders, todayOrders, monthOrders, yearOrders] = await Promise.all([
    db.select({ id: ordersTable.id, status: ordersTable.status, createdAt: ordersTable.createdAt, paymentMethod: ordersTable.paymentMethod }).from(ordersTable),
    db.select({ id: ordersTable.id }).from(ordersTable).where(gte(ordersTable.createdAt, startOfDay)),
    db.select({ id: ordersTable.id }).from(ordersTable).where(gte(ordersTable.createdAt, startOfMonth)),
    db.select({ id: ordersTable.id }).from(ordersTable).where(gte(ordersTable.createdAt, startOfYear)),
  ]);

  const countByStatus = allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    today: todayOrders.length,
    thisMonth: monthOrders.length,
    thisYear: yearOrders.length,
    total: allOrders.length,
    byStatus: countByStatus,
  });
});

export default router;

import { Router, type IRouter } from "express";
import { db, ordersTable, insertOrderSchema, driversTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";
import { driverLocations } from "./drivers";
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

// 🚀 [تهيئة Firebase للسيرفر]
try {
  // السيرفر يحتاج مفتاح خاص اسمه serviceAccountKey.json للاتصال بقوقل
  const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Firebase Admin Initialized Successfully!");
  } else {
    console.log("⚠️ Firebase Admin Key not found. Push notifications will be mocked in console.");
  }
} catch (e) {
  console.log("⚠️ Error initializing Firebase Admin:", e);
}

const router: IRouter = Router();

// 🔔 ذاكرة سريعة لحفظ (FCM Tokens) أرقام الجوالات التعريفية مؤقتاً
const fcmTokens = new Map<number, string>();

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

// 📲 دالة إرسال الإشعار للجوال
async function sendPushNotification(orderId: number, title: string, body: string) {
  const token = fcmTokens.get(orderId);
  if (!token) return; // العميل ما فتح التطبيق أو ما سمح بالإشعارات
  
  try {
    if (admin.apps.length > 0) {
      await admin.messaging().send({
        token,
        notification: { title, body },
        android: { notification: { sound: "default" } }
      });
      console.log(`✅ Push sent to Order #${orderId}: ${title}`);
    } else {
      console.log(`[MOCK PUSH] To Order #${orderId} -> ${title}: ${body}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send Push to Order #${orderId}`, error);
  }
}

// 📍 مسار جديد: الجوال يرسل رقمه التعريفي للسيرفر
router.post("/orders/:id/fcm-token", (req, res) => {
  const id = Number(req.params.id);
  const { token } = req.body;
  if (token) fcmTokens.set(id, token);
  res.json({ success: true });
});

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
    let driverLat = null;
    let driverLng = null;

    if (order.assignedDriverId) {
      const driverResults = await db.select().from(driversTable).where(eq(driversTable.id, order.assignedDriverId));
      if (driverResults[0]) driverPhone = driverResults[0].phone || "";
      const loc = driverLocations.get(order.assignedDriverId);
      if (loc) { driverLat = loc.lat; driverLng = loc.lng; }
    }
    res.json({ ...order, assignedDriverName: order.assignedDriverName || "جاري التعيين...", assignedDriverPhone: driverPhone, driverLat, driverLng });
  } catch (error) { res.status(500).json({ error: "حدث خطأ داخلي" }); }
});

router.get("/orders", async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const enrichedOrders = orders.map(o => {
     if (o.assignedDriverId && driverLocations.has(o.assignedDriverId)) {
         const loc = driverLocations.get(o.assignedDriverId);
         return { ...o, driverLat: loc?.lat, driverLng: loc?.lng };
     }
     return o;
  });
  res.json(enrichedOrders);
});

router.patch("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { status, assignedDriverId, assignedDriverName, paymentVerified, notes } = req.body;
    const updateData: any = {};
    
    // إرسال إشعار إذا تغيرت الحالة
    if (status !== undefined) {
       updateData.status = status;
       if (status === "delivering") sendPushNotification(id, "طلبك في الطريق 🛵", "الكابتن استلم طلبك وهو متوجه إليك الآن!");
       if (status === "delivered") sendPushNotification(id, "تم التسليم بنجاح ✅", "شكراً لتعاملك معنا، نتمنى لك يوماً سعيداً!");
    }
    
    // إرسال إشعار إذا أرسل المدير رسالة
    if (notes !== undefined) {
       updateData.notes = notes;
       try {
         const parsed = JSON.parse(notes);
         if (Array.isArray(parsed) && parsed.length > 0) {
            const lastMsg = parsed[parsed.length - 1];
            if (lastMsg.isCustom) sendPushNotification(id, "رسالة جديدة من الإدارة 💬", lastMsg.text);
         }
       } catch {}
    }

    if (assignedDriverId !== undefined) {
       let parsedId = Number(assignedDriverId);
       updateData.assignedDriverId = (isNaN(parsedId) || assignedDriverId === "null" || assignedDriverId === null) ? null : parsedId;
    }
    if (assignedDriverName !== undefined) updateData.assignedDriverName = (assignedDriverName === "null" || assignedDriverName === "") ? null : assignedDriverName;
    if (paymentVerified !== undefined) updateData.paymentVerified = paymentVerified;
    
    const [updated] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id)).returning();
    res.json(updated);
  } catch (error) { res.status(500).json({ error: "خطأ في التحديث" }); }
});

router.post("/orders/:id/receipt", async (req: any, res: any) => {
    try {
        const id = Number(req.params.id);
        const imageUrl = req.body.image || req.body.receiptUrl || "";
        if (imageUrl) {
            const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
            fetch(tgUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: CHAT_ID, photo: imageUrl, caption: `📸 إيصال جديد للطلب: #${id}` })
            }).catch(() => {});
            await db.update(ordersTable).set({ paymentReceiptImage: imageUrl }).where(eq(ordersTable.id, id));
        }
        res.status(200).json({ success: true });
    } catch (e) { res.status(200).json({ success: true }); }
});

export default router;

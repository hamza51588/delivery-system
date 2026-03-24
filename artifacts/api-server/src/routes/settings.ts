import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: "وصلني",
  siteTagline: "أسرع خدمة توصيل",
  heroTitle: "توصيل سريع،",
  heroTitleHighlight: "مضمون وموثوق",
  heroDescription: "اطلب الآن وسنقوم بتوصيل طلبك بأسرع وقت ممكن. نحن نهتم بكل التفاصيل لضمان وصول طلبك بأمان.",
  availabilityText: "متاحون الآن للخدمة",
  formTitle: "سجل طلبك الآن",
  formSubtitle: "أدخل تفاصيل الطلب وسنتواصل معك فوراً",
  successMessage: "تم استلام طلبك بنجاح، وجاري تحويلك إلى الواتساب...",
  primaryColor: "#FF6B35",
  whatsappTemplate: "🛵 *طلب توصيل جديد*\n👤 *الاسم:* {customerName}\n📞 *الهاتف:* {customerPhone}\n📍 *العنوان:* {address}\n📦 *الطلب:* {orderDetails}\n📝 *ملاحظات:* {notes}",
  footerText: "جميع الحقوق محفوظة.",
};

async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settingsTable);
  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

router.get("/settings", async (_req, res) => {
  const settings = await getAllSettings();
  res.json(settings);
});

router.put("/settings", async (req, res) => {
  const body = req.body as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") continue;
    await db
      .insert(settingsTable)
      .values({ key, value })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  }

  const settings = await getAllSettings();
  res.json(settings);
});

export default router;

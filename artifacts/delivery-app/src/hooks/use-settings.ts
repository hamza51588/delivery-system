import { Package } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroDescription: string;
  availabilityText: string;
  formTitle: string;
  formSubtitle: string;
  successMessage: string;
  primaryColor: string;
  whatsappTemplate: string;
  footerText: string;
  adminPin: string;
  logoImage: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "المدار السريع",
  siteTagline: "أسرع خدمة توصيل",
  heroTitle: "توصيل سريع،",
  heroTitleHighlight: "مضمون وموثوق",
  heroDescription: "اطلب الآن وسنقوم بتوصيل طلبك بأسرع وقت ممكن.",
  availabilityText: "متاحون الآن للخدمة",
  formTitle: "سجل طلبك الآن",
  formSubtitle: "أدخل تفاصيل الطلب وسنتواصل معك فوراً",
  successMessage: "تم استلام طلبك بنجاح، سيتواصل معك فريقنا قريباً!",
  primaryColor: "#FF6B35",
  whatsappTemplate: "🛵 *طلب توصيل جديد*\n👤 *الاسم:* {customerName}\n📞 *الهاتف:* {customerPhone}\n📍 *العنوان:* {address}\n📦 *الطلب:* {orderDetails}\n📝 *ملاحظات:* {notes}\n🗺️ *المنطقة:* {area}\n💵 *الدفع:* {paymentMethod} | *التوصيل:* {deliveryFee}",
  footerText: "حمزة محمد المروني للتواصل 775864948  .",
  adminPin: "1234",
  logoImage: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
};

async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch( "https://workspaceapi-server-production-af1a.up.railway.app/api/settings");
  if (!res.ok) return DEFAULT_SETTINGS;
  return res.json();
}

async function saveSettings(data: SiteSettings): Promise<SiteSettings> {
  const res = await fetch( "https://workspaceapi-server-production-af1a.up.railway.app/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("فشل حفظ الإعدادات");
  return res.json();
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 60000,
    placeholderData: DEFAULT_SETTINGS,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: (data) => { qc.setQueryData(["settings"], data); },
  });
}

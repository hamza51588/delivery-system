import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Trash2, Phone as PhoneIcon, Plus, MapPin, User, Clock,
  FileText, Package, Settings, Save, Palette, Lock,
  MessageCircle, Truck, CheckCircle2, XCircle, Image as ImageIcon,
  ChevronDown, BarChart3, TrendingUp, Calendar, ExternalLink,
  CreditCard, Eye, Edit2, ToggleLeft, ToggleRight, Banknote,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useOrders, useUpdateOrder, useOrderStats, Order } from "@/hooks/use-orders";
import { usePhones, useAddPhone, useDeletePhone } from "@/hooks/use-phones";
import { useSettings, useUpdateSettings, SiteSettings } from "@/hooks/use-settings";
import { useDrivers, useAddDriver, useDeleteDriver } from "@/hooks/use-drivers";
import { useDeliveryAreas, useAddDeliveryArea, useUpdateDeliveryArea, useDeleteDeliveryArea } from "@/hooks/use-delivery-areas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── status map ─── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: "قيد الانتظار",  color: "bg-yellow-100 text-yellow-700" },
  assigned:   { label: "تم التعيين",    color: "bg-blue-100 text-blue-700" },
  delivering: { label: "جاري التوصيل", color: "bg-orange-100 text-orange-700" },
  delivered:  { label: "تم التوصيل",   color: "bg-green-100 text-green-700" },
  cancelled:  { label: "ملغي",          color: "bg-red-100 text-red-700" },
};

/* ─── schemas ─── */
const phoneSchema = z.object({ phoneNumber: z.string().min(6), label: z.string().optional() });
const driverSchema = z.object({ name: z.string().min(2, "الاسم مطلوب"), phone: z.string().optional() });
const areaSchema = z.object({ name: z.string().min(1, "اسم المنطقة مطلوب"), price: z.coerce.number().min(0) });
const settingsSchema = z.object({
  siteName: z.string().min(1), siteTagline: z.string().min(1),
  heroTitle: z.string().min(1), heroTitleHighlight: z.string().min(1),
  heroDescription: z.string().min(1), availabilityText: z.string().min(1),
  formTitle: z.string().min(1), formSubtitle: z.string().min(1),
  successMessage: z.string().min(1), primaryColor: z.string().min(4),
  whatsappTemplate: z.string().min(1), footerText: z.string().min(1),
  adminPin: z.string().min(4), logoImage: z.string(),
  bankName: z.string(), bankAccountName: z.string(), bankAccountNumber: z.string(),
});

/* ═══ PIN LOCK ═══ */
function PinLock({ correctPin, onUnlock }: { correctPin: string; onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const check = () => {
    if (pin === correctPin) { onUnlock(); }
    else { setError(true); setPin(""); setTimeout(() => setError(false), 1200); }
  };
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-orange-400 text-white flex items-center justify-center shadow-xl shadow-primary/30">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">لوحة التحكم</h2>
        <p className="text-gray-500 font-medium">أدخل الرمز السري للوصول</p>
      </div>
      <Card className={`w-full max-w-sm border-0 shadow-xl rounded-3xl ${error ? "ring-2 ring-red-400" : ""}`}>
        <CardContent className="p-8 flex flex-col gap-5">
          <input ref={inputRef} type="password" inputMode="numeric" maxLength={8} value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="● ● ● ●"
            className="w-full text-center text-3xl tracking-[0.5em] h-16 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none bg-gray-50 font-bold" />
          {error && <p className="text-center text-red-500 font-bold text-sm">❌ الرمز غير صحيح</p>}
          <Button onClick={check} className="w-full h-12 rounded-xl font-bold text-base">دخول</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══ RECEIPT MODAL ═══ */
function ReceiptModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <p className="font-bold text-gray-900">سند التحويل</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 font-bold text-xl">✕</button>
        </div>
        <img src={src} alt="سند التحويل" className="w-full max-h-[70vh] object-contain p-4" />
      </div>
    </div>
  );
}

/* ═══ ORDER CARD ═══ */
function OrderCard({
  order, phones, drivers, settings, isDriversLoading,
  onAssign, onChangeStatus, onVerifyPayment, onWhatsApp,
}: {
  order: Order;
  phones: ReturnType<typeof usePhones>["data"];
  drivers: ReturnType<typeof useDrivers>["data"];
  settings: SiteSettings | undefined;
  isDriversLoading: boolean;
  onAssign: (order: Order, driver: NonNullable<ReturnType<typeof useDrivers>["data"]>[number] | null) => void;
  onChangeStatus: (id: number, status: string) => void;
  onVerifyPayment: (id: number, verified: boolean) => void;
  onWhatsApp: (order: Order) => void;
}) {
  const [showDrivers, setShowDrivers] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const st = STATUS_MAP[order.status] || STATUS_MAP.pending;

  return (
    <>
      {showReceipt && order.paymentReceiptImage && (
        <ReceiptModal src={order.paymentReceiptImage} onClose={() => setShowReceipt(false)} />
      )}
      <Card className="border border-border/50 shadow-md hover:shadow-xl transition-all rounded-2xl overflow-hidden">
        <div className={`h-1.5 w-full ${order.paymentMethod === "bank_transfer" ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gradient-to-r from-primary to-orange-400"}`}></div>
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-gray-400">#{order.id}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${st.color}`}>{st.label}</span>
                {order.paymentMethod === "bank_transfer" && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${order.paymentVerified ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {order.paymentVerified ? "✓ سند مقبول" : "🔄 تحويل مصرفي"}
                  </span>
                )}
              </div>
              <p className="font-bold text-gray-900 flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> {order.customerName}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5" dir="ltr">
                <PhoneIcon className="w-3.5 h-3.5 text-primary" /> {order.customerPhone}
              </p>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" /> {format(new Date(order.createdAt), 'hh:mm a', { locale: ar })}
            </span>
          </div>

          {/* Order details */}
          <div className="bg-orange-50/60 p-3 rounded-xl">
            <p className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-1"><Package className="w-3.5 h-3.5" /> تفاصيل الطلب</p>
            <p className="text-sm font-semibold text-gray-800">{order.orderDetails}</p>
          </div>

          {/* Address + GPS */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span className="font-medium flex-1">{order.address}</span>
          </div>
          {order.locationLink && (
            <a href={order.locationLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg">
              <ExternalLink className="w-3.5 h-3.5" /> فتح الموقع في خرائط قوقل
            </a>
          )}

          {/* Delivery area */}
          {order.deliveryArea && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-bold text-gray-700">المنطقة: {order.deliveryArea}</span>
              {order.deliveryAreaPrice !== null && order.deliveryAreaPrice !== undefined && (
                <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-lg">
                  {order.deliveryAreaPrice > 0 ? `${order.deliveryAreaPrice.toLocaleString()} ريال` : "مجاناً"}
                </span>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-2.5 rounded-xl">
              <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{order.notes}</span>
            </div>
          )}

          {/* Payment receipt */}
          {order.paymentMethod === "bank_transfer" && (
            <div className={`p-3 rounded-xl border ${order.paymentVerified ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" /> سند تحويل مصرفي
                </p>
                <div className="flex items-center gap-2">
                  {order.paymentReceiptImage && (
                    <button onClick={() => setShowReceipt(true)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold bg-white border border-blue-200 px-2 py-1 rounded-lg">
                      <Eye className="w-3.5 h-3.5" /> عرض السند
                    </button>
                  )}
                  {!order.paymentVerified ? (
                    <button onClick={() => onVerifyPayment(order.id, true)}
                      className="flex items-center gap-1 text-xs text-white bg-green-500 hover:bg-green-600 font-bold px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> قبول
                    </button>
                  ) : (
                    <button onClick={() => onVerifyPayment(order.id, false)}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-bold bg-white border border-red-200 px-2 py-1 rounded-lg">
                      <XCircle className="w-3.5 h-3.5" /> إلغاء التحقق
                    </button>
                  )}
                </div>
              </div>
              {!order.paymentReceiptImage && <p className="text-xs text-gray-500 mt-1">لم يرفع الزبون صورة السند بعد</p>}
            </div>
          )}

          {/* Driver assignment */}
          <div className="pt-1">
            {order.assignedDriverName ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-700">{order.assignedDriverName}</span>
                </div>
                <button onClick={() => onAssign(order, null)} className="text-xs text-red-400 hover:text-red-600 font-bold">إلغاء</button>
              </div>
            ) : (
              <div className="relative">
                <button onClick={() => setShowDrivers(v => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-bold text-gray-600 border border-dashed border-gray-300 rounded-xl hover:border-primary hover:text-primary transition-colors">
                  <span className="flex items-center gap-2"><Truck className="w-4 h-4" /> تعيين سائق</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showDrivers && (
                  <div className="absolute z-10 top-full mt-1 right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {isDriversLoading ? <p className="p-3 text-sm text-gray-500">جاري التحميل...</p>
                      : drivers?.length === 0 ? <p className="p-3 text-sm text-gray-500">لا يوجد سائقون</p>
                      : drivers?.map(d => (
                        <button key={d.id} onClick={() => { onAssign(order, d); setShowDrivers(false); }}
                          className="w-full text-right px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2">
                          <Truck className="w-4 h-4" /> {d.name}
                          {d.phone && <span className="text-gray-400 font-normal text-xs" dir="ltr">{d.phone}</span>}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <button onClick={() => setShowStatus(v => !v)}
                className="w-full flex items-center justify-between gap-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:border-primary transition-colors">
                <span>الحالة</span><ChevronDown className="w-3 h-3" />
              </button>
              {showStatus && (
                <div className="absolute z-10 bottom-full mb-1 right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <button key={key} onClick={() => { onChangeStatus(order.id, key); setShowStatus(false); }}
                      className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-gray-50 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg ${val.color}`}>{val.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onWhatsApp(order)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
              <MessageCircle className="w-4 h-4" /> واتساب
            </button>
            {order.status === "delivered" && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
            {order.status === "cancelled" && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
          </div>

          <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'yyyy/MM/dd', { locale: ar })}</p>
        </CardContent>
      </Card>
    </>
  );
}

/* ═══ MAIN ADMIN ═══ */
export default function Admin() {
  const { toast } = useToast();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("admin_unlocked") === "1");

  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const { data: stats } = useOrderStats();
  const { data: phones, isLoading: isPhonesLoading } = usePhones();
  const { data: settings, isLoading: isSettingsLoading } = useSettings();
  const { data: drivers, isLoading: isDriversLoading } = useDrivers();
  const { data: areas, isLoading: isAreasLoading } = useDeliveryAreas();

  const addPhone = useAddPhone();
  const deletePhone = useDeletePhone();
  const updateSettings = useUpdateSettings();
  const addDriver = useAddDriver();
  const deleteDriver = useDeleteDriver();
  const updateOrder = useUpdateOrder();
  const addArea = useAddDeliveryArea();
  const updateArea = useUpdateDeliveryArea();
  const deleteArea = useDeleteDeliveryArea();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({ resolver: zodResolver(phoneSchema), defaultValues: { phoneNumber: "", label: "" } });
  const driverForm = useForm<z.infer<typeof driverSchema>>({ resolver: zodResolver(driverSchema), defaultValues: { name: "", phone: "" } });
  const areaForm = useForm<z.infer<typeof areaSchema>>({ resolver: zodResolver(areaSchema), defaultValues: { name: "", price: 0 } });
  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: "وصلني", siteTagline: "أسرع خدمة توصيل",
      heroTitle: "توصيل سريع،", heroTitleHighlight: "مضمون وموثوق",
      heroDescription: "اطلب الآن وسنقوم بتوصيل طلبك بأسرع وقت ممكن.",
      availabilityText: "متاحون الآن للخدمة",
      formTitle: "سجل طلبك الآن", formSubtitle: "أدخل تفاصيل الطلب وسنتواصل معك فوراً",
      successMessage: "تم استلام طلبك بنجاح، سيتواصل معك فريقنا قريباً!",
      primaryColor: "#FF6B35",
      whatsappTemplate: "🛵 *طلب توصيل جديد*\n👤 *الاسم:* {customerName}\n📞 *الهاتف:* {customerPhone}\n📍 *العنوان:* {address}\n📦 *الطلب:* {orderDetails}\n📝 *ملاحظات:* {notes}",
      footerText: "جميع الحقوق محفوظة.", adminPin: "1234", logoImage: "",
      bankName: "بنك العملاقي", bankAccountName: "", bankAccountNumber: "",
    },
  });

  useEffect(() => { if (settings) settingsForm.reset(settings as z.infer<typeof settingsSchema>); }, [settings]);

  const handleUnlock = () => { sessionStorage.setItem("admin_unlocked", "1"); setUnlocked(true); };

  if (!unlocked) return <PinLock correctPin={settings?.adminPin || "1234"} onUnlock={handleUnlock} />;

  /* Handlers */
  const onAddPhone = async (data: z.infer<typeof phoneSchema>) => {
    try { await addPhone.mutateAsync({ data }); toast({ title: "تم إضافة الرقم" }); phoneForm.reset(); }
    catch { toast({ title: "خطأ", variant: "destructive" }); }
  };
  const onAddDriver = async (data: z.infer<typeof driverSchema>) => {
    try { await addDriver.mutateAsync(data); toast({ title: "تم إضافة السائق" }); driverForm.reset(); }
    catch { toast({ title: "خطأ", variant: "destructive" }); }
  };
  const onAddArea = async (data: z.infer<typeof areaSchema>) => {
    try { await addArea.mutateAsync(data); toast({ title: "تم إضافة المنطقة" }); areaForm.reset(); }
    catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  const onAssign = async (order: Order, driver: NonNullable<typeof drivers>[number] | null) => {
    try {
      await updateOrder.mutateAsync({ id: order.id, data: { assignedDriverId: driver?.id ?? null, assignedDriverName: driver?.name ?? null, status: driver ? "assigned" : "pending" } });
      toast({ title: driver ? `تم تعيين ${driver.name}` : "تم إلغاء التعيين" });
    } catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  const onChangeStatus = async (id: number, status: string) => {
    try { await updateOrder.mutateAsync({ id, data: { status } }); toast({ title: "تم تحديث الحالة" }); }
    catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  const onVerifyPayment = async (id: number, verified: boolean) => {
    try {
      await updateOrder.mutateAsync({ id, data: { paymentVerified: verified, status: verified ? "delivering" : "pending" } });
      toast({ title: verified ? "✅ تم قبول السند وتغيير الحالة إلى جاري التوصيل" : "تم إلغاء التحقق" });
    } catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  const onWhatsApp = (order: Order) => {
    const tpl = settings?.whatsappTemplate || "🛵 *طلب #{id}*\n👤 {customerName}\n📞 {customerPhone}\n📍 {address}\n📦 {orderDetails}\n📝 {notes}";
    let text = tpl
      .replace("{id}", String(order.id))
      .replace("{customerName}", order.customerName)
      .replace("{customerPhone}", order.customerPhone)
      .replace("{address}", order.address)
      .replace("{orderDetails}", order.orderDetails)
      .replace("{notes}", order.notes || "لا يوجد");
    if (order.locationLink) text += `\n🗺️ الموقع: ${order.locationLink}`;
    const encoded = encodeURIComponent(text);
    const targetPhones = phones && phones.length > 0 ? phones.map(p => p.phoneNumber) : ["967775864948"];
    targetPhones.forEach((ph, i) => {
      setTimeout(() => window.open(`https://wa.me/${ph.replace(/\D/g, "")}?text=${encoded}`, "_blank"), i * 200);
    });
  };

  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => settingsForm.setValue("logoImage", reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSaveSettings = async (data: z.infer<typeof settingsSchema>) => {
    try { await updateSettings.mutateAsync(data as SiteSettings); toast({ title: "✅ تم حفظ الإعدادات" }); }
    catch { toast({ title: "خطأ في الحفظ", variant: "destructive" }); }
  };

  const pendingBank = orders?.filter(o => o.paymentMethod === "bank_transfer" && !o.paymentVerified && o.status !== "cancelled").length || 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 font-medium mt-1">إدارة الطلبات، السائقين، المناطق، والإعدادات</p>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-500 gap-2"
          onClick={() => { sessionStorage.removeItem("admin_unlocked"); setUnlocked(false); }}>
          <Lock className="w-4 h-4" /> قفل
        </Button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Calendar className="w-5 h-5" />, label: "اليوم", value: stats.today, color: "text-orange-600 bg-orange-50" },
            { icon: <TrendingUp className="w-5 h-5" />, label: "هذا الشهر", value: stats.thisMonth, color: "text-blue-600 bg-blue-50" },
            { icon: <BarChart3 className="w-5 h-5" />, label: "هذه السنة", value: stats.thisYear, color: "text-purple-600 bg-purple-50" },
            { icon: <Package className="w-5 h-5" />, label: "الإجمالي", value: stats.total, color: "text-green-600 bg-green-50" },
          ].map(stat => (
            <Card key={stat.label} className="border-0 shadow-md rounded-2xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>{stat.icon}</div>
                <div>
                  <p className="text-xs font-bold text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status breakdown */}
      {stats && Object.keys(stats.byStatus).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_MAP).map(([key, val]) => {
            const count = stats.byStatus[key] || 0;
            if (!count) return null;
            return (
              <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${val.color}`}>
                {val.label}: {count}
              </span>
            );
          })}
          {pendingBank > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-700">
              <CreditCard className="w-3.5 h-3.5" /> سنوتات بانتظار التحقق: {pendingBank}
            </span>
          )}
        </div>
      )}

      <Tabs defaultValue="orders" dir="rtl">
        <TabsList className="w-full grid grid-cols-5 h-14 bg-gray-100 p-1 rounded-xl mb-8">
          {[
            { value: "orders",  icon: <Package className="w-4 h-4" />, label: "الطلبات" },
            { value: "drivers", icon: <Truck className="w-4 h-4" />, label: "السائقون" },
            { value: "areas",   icon: <MapPin className="w-4 h-4" />, label: "المناطق" },
            { value: "phones",  icon: <PhoneIcon className="w-4 h-4" />, label: "واتساب" },
            { value: "settings",icon: <Settings className="w-4 h-4" />, label: "الإعدادات" },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value}
              className="rounded-lg font-bold text-xs sm:text-sm gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── ORDERS ── */}
        <TabsContent value="orders" className="space-y-6">
          {isOrdersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
          ) : orders?.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-500">لا يوجد طلبات بعد</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders?.map(order => (
                <OrderCard key={order.id} order={order} phones={phones} drivers={drivers}
                  settings={settings} isDriversLoading={isDriversLoading}
                  onAssign={onAssign} onChangeStatus={onChangeStatus}
                  onVerifyPayment={onVerifyPayment} onWhatsApp={onWhatsApp} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── DRIVERS ── */}
        <TabsContent value="drivers" className="space-y-8">
          <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> إضافة سائق جديد</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <Form {...driverForm}>
                <form onSubmit={driverForm.handleSubmit(onAddDriver)} className="flex flex-col sm:flex-row gap-4">
                  <FormField control={driverForm.control} name="name" render={({ field }) => (
                    <FormItem className="flex-1"><FormControl><Input placeholder="اسم السائق" className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={driverForm.control} name="phone" render={({ field }) => (
                    <FormItem className="flex-1"><FormControl><Input placeholder="رقم الهاتف (اختياري)" dir="ltr" className="h-12 rounded-xl text-right" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={addDriver.isPending} className="h-12 px-8 rounded-xl font-bold">إضافة</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isDriversLoading ? [1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />) :
              drivers?.length === 0 ? <p className="text-gray-500 col-span-2 text-center py-8">لا يوجد سائقون بعد</p> :
              drivers?.map(driver => (
                <div key={driver.id} className="flex items-center justify-between p-5 bg-white border border-border/50 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Truck className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{driver.name}</p>
                      {driver.phone && <p className="text-sm text-gray-500" dir="ltr">{driver.phone}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("حذف هذا السائق؟")) deleteDriver.mutateAsync(driver.id); }}
                    className="text-red-500 hover:bg-red-50 h-10 w-10 rounded-xl"><Trash2 className="w-5 h-5" /></Button>
                </div>
              ))
            }
          </div>
        </TabsContent>

        {/* ── AREAS ── */}
        <TabsContent value="areas" className="space-y-8">
          <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> إضافة منطقة توصيل</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <Form {...areaForm}>
                <form onSubmit={areaForm.handleSubmit(onAddArea)} className="flex flex-col sm:flex-row gap-4">
                  <FormField control={areaForm.control} name="name" render={({ field }) => (
                    <FormItem className="flex-1"><FormControl><Input placeholder="اسم المنطقة (مثال: سيئون، المدينة الجديدة)" className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={areaForm.control} name="price" render={({ field }) => (
                    <FormItem className="w-40">
                      <FormControl><Input type="number" min="0" placeholder="السعر (ريال)" className="h-12 rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={addArea.isPending} className="h-12 px-8 rounded-xl font-bold">إضافة</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> المناطق ({areas?.length ?? 0})</h3>
            {isAreasLoading ? [1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />) :
              areas?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">لا يوجد مناطق مضافة بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {areas?.map(area => (
                    <div key={area.id} className={`flex items-center justify-between p-4 border rounded-2xl shadow-sm transition-all ${area.isActive ? "bg-white border-border/50" : "bg-gray-50 border-gray-200 opacity-60"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${area.isActive ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-400"}`}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{area.name}</p>
                          <p className="text-sm font-bold text-primary">{area.price > 0 ? `${area.price.toLocaleString()} ريال` : "مجاناً"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateArea.mutateAsync({ id: area.id, isActive: !area.isActive })}
                          className={`text-xs font-bold flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-colors ${area.isActive ? "text-green-700 bg-green-50 border-green-200" : "text-gray-500 bg-gray-100 border-gray-200"}`}>
                          {area.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {area.isActive ? "نشط" : "مخفي"}
                        </button>
                        <Button variant="ghost" size="icon"
                          onClick={() => { if (confirm("حذف هذه المنطقة؟")) deleteArea.mutateAsync(area.id); }}
                          className="text-red-500 hover:bg-red-50 h-9 w-9 rounded-xl"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </TabsContent>

        {/* ── PHONES ── */}
        <TabsContent value="phones" className="space-y-8">
          <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> إضافة رقم واتساب</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onAddPhone)} className="flex flex-col sm:flex-row gap-4">
                  <FormField control={phoneForm.control} name="phoneNumber" render={({ field }) => (
                    <FormItem className="flex-1"><FormControl><Input placeholder="رقم الهاتف (مثال: 967775864948)" dir="ltr" className="h-12 text-right rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={phoneForm.control} name="label" render={({ field }) => (
                    <FormItem className="flex-1"><FormControl><Input placeholder="وصف (اختياري)" className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={addPhone.isPending} className="h-12 px-8 rounded-xl font-bold">إضافة</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isPhonesLoading ? [1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />) :
              phones?.length === 0 ? <p className="text-gray-500 col-span-2 text-center py-8">لا يوجد أرقام مضافة</p> :
              phones?.map(phone => (
                <div key={phone.id} className="flex items-center justify-between p-5 bg-white border border-border/50 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><PhoneIcon className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg" dir="ltr">{phone.phoneNumber}</p>
                      {phone.label && <p className="text-sm font-medium text-gray-500">{phone.label}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"
                    onClick={() => { if (confirm("حذف هذا الرقم؟")) deletePhone.mutateAsync({ id: phone.id }); }}
                    className="text-red-500 hover:bg-red-50 h-10 w-10 rounded-xl"><Trash2 className="w-5 h-5" /></Button>
                </div>
              ))
            }
          </div>
        </TabsContent>

        {/* ── SETTINGS ── */}
        <TabsContent value="settings" className="space-y-6">
          {isSettingsLoading ? <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div> : (
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-6">

                {/* Logo + Branding */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-lg font-bold flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> الهوية والشعار</CardTitle></CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-orange-400 text-white flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                        {settingsForm.watch("logoImage") ? <img src={settingsForm.watch("logoImage")} alt="logo" className="w-full h-full object-cover" /> : <Package className="w-10 h-10" />}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors">
                          <ImageIcon className="w-4 h-4" /> رفع الشعار
                          <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                        </label>
                        {settingsForm.watch("logoImage") && <button type="button" onClick={() => settingsForm.setValue("logoImage", "")} className="text-xs text-red-500 font-bold text-right">✕ إزالة الشعار</button>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField control={settingsForm.control} name="siteName" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">اسم الموقع</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={settingsForm.control} name="siteTagline" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">الشعار الفرعي</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={settingsForm.control} name="footerText" render={({ field }) => (
                        <FormItem className="sm:col-span-2"><FormLabel className="font-bold">نص الفوتر</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                {/* Bank + PIN + Color */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-lg font-bold flex items-center gap-2"><Banknote className="w-5 h-5 text-primary" /> الدفع المصرفي والأمان</CardTitle></CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField control={settingsForm.control} name="bankName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold">اسم البنك</FormLabel><FormControl><Input placeholder="بنك العملاقي" className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="bankAccountName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold">اسم صاحب الحساب</FormLabel><FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="bankAccountNumber" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold">رقم الحساب</FormLabel><FormControl><Input dir="ltr" className="h-12 rounded-xl text-right" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="adminPin" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold flex items-center gap-2"><Lock className="w-4 h-4" /> الرمز السري للإدارة</FormLabel>
                        <FormControl><Input type="text" inputMode="numeric" placeholder="1234" className="h-12 rounded-xl tracking-widest text-center font-bold" maxLength={8} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="primaryColor" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="font-bold">اللون الأساسي</FormLabel>
                        <div className="flex items-center gap-3 mt-1">
                          <input type="color" value={field.value} onChange={field.onChange} className="w-14 h-12 rounded-xl cursor-pointer border border-gray-200 p-1" />
                          <FormControl><Input className="h-12 rounded-xl flex-1" {...field} /></FormControl>
                          <div className="w-12 h-12 rounded-xl border border-gray-200" style={{ backgroundColor: field.value }} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Hero */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-lg font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> القسم الرئيسي</CardTitle></CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { name: "availabilityText" as const, label: "نص التوفر", col: "sm:col-span-2" },
                      { name: "heroTitle" as const, label: "العنوان (السطر الأول)" },
                      { name: "heroTitleHighlight" as const, label: "العنوان الملون (السطر الثاني)" },
                      { name: "heroDescription" as const, label: "وصف الخدمة", col: "sm:col-span-2" },
                      { name: "formTitle" as const, label: "عنوان النموذج" },
                      { name: "formSubtitle" as const, label: "وصف النموذج" },
                      { name: "successMessage" as const, label: "رسالة النجاح", col: "sm:col-span-2" },
                    ].map(f => (
                      <FormField key={f.name} control={settingsForm.control} name={f.name} render={({ field }) => (
                        <FormItem className={f.col || ""}><FormLabel className="font-bold">{f.label}</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    ))}
                  </CardContent>
                </Card>

                {/* WhatsApp template */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-lg font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5 text-green-600" /> قالب رسالة الواتساب</CardTitle></CardHeader>
                  <CardContent className="pt-6">
                    <FormField control={settingsForm.control} name="whatsappTemplate" render={({ field }) => (
                      <FormItem>
                        <FormDescription className="text-xs text-gray-500 leading-relaxed mb-2">
                          المتغيرات: {["{id}", "{customerName}", "{customerPhone}", "{address}", "{orderDetails}", "{notes}"].map(v => (
                            <code key={v} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs ml-1">{v}</code>
                          ))}
                          <br /><em className="text-gray-400">رابط الموقع يُضاف تلقائياً إذا توفر</em>
                        </FormDescription>
                        <FormControl><Textarea className="rounded-xl resize-none font-mono text-sm" rows={7} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <div className="flex justify-end pb-6">
                  <Button type="submit" disabled={updateSettings.isPending}
                    className="h-14 px-10 rounded-xl font-bold text-lg shadow-lg shadow-primary/30">
                    {updateSettings.isPending ? <span className="flex items-center gap-2">جاري الحفظ... <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span></span>
                      : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> حفظ جميع الإعدادات</span>}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

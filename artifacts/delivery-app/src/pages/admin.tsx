import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Trash2, Phone as PhoneIcon, Plus, MapPin, User, Clock,
  FileText, Package, Settings, Save, Palette, Lock,
  MessageCircle, Truck, CheckCircle2, XCircle, Image as ImageIcon,
  ChevronDown,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useOrders, useUpdateOrder } from "@/hooks/use-orders";
import { usePhones, useAddPhone, useDeletePhone } from "@/hooks/use-phones";
import { useSettings, useUpdateSettings, SiteSettings } from "@/hooks/use-settings";
import { useDrivers, useAddDriver, useDeleteDriver } from "@/hooks/use-drivers";
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

/* ─── helpers ─── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: "قيد الانتظار",  color: "bg-yellow-100 text-yellow-700" },
  assigned:   { label: "تم التعيين",    color: "bg-blue-100 text-blue-700" },
  delivering: { label: "جاري التوصيل", color: "bg-orange-100 text-orange-700" },
  delivered:  { label: "تم التوصيل",   color: "bg-green-100 text-green-700" },
  cancelled:  { label: "ملغي",          color: "bg-red-100 text-red-700" },
};

/* ─── schemas ─── */
const phoneSchema = z.object({
  phoneNumber: z.string().min(6, "رقم الهاتف مطلوب"),
  label: z.string().optional(),
});
const driverSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().optional(),
});
const settingsSchema = z.object({
  siteName: z.string().min(1), siteTagline: z.string().min(1),
  heroTitle: z.string().min(1), heroTitleHighlight: z.string().min(1),
  heroDescription: z.string().min(1), availabilityText: z.string().min(1),
  formTitle: z.string().min(1), formSubtitle: z.string().min(1),
  successMessage: z.string().min(1), primaryColor: z.string().min(4),
  whatsappTemplate: z.string().min(1), footerText: z.string().min(1),
  adminPin: z.string().min(4, "الرمز يجب أن يكون 4 أرقام على الأقل"),
  logoImage: z.string(),
});

/* ═══════════════════════════════════════════
   PIN LOCK SCREEN
═══════════════════════════════════════════ */
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
      <Card className={`w-full max-w-sm border-0 shadow-xl rounded-3xl transition-all ${error ? "ring-2 ring-red-400 shake" : ""}`}>
        <CardContent className="p-8 flex flex-col gap-5">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="● ● ● ●"
            className="w-full text-center text-3xl tracking-[0.5em] h-16 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none bg-gray-50 font-bold"
          />
          {error && <p className="text-center text-red-500 font-bold text-sm">❌ الرمز غير صحيح</p>}
          <Button onClick={check} className="w-full h-12 rounded-xl font-bold text-base">
            دخول
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN ADMIN PAGE
═══════════════════════════════════════════ */
export default function Admin() {
  const { toast } = useToast();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("admin_unlocked") === "1");

  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const { data: phones, isLoading: isPhonesLoading } = usePhones();
  const { data: settings, isLoading: isSettingsLoading } = useSettings();
  const { data: drivers, isLoading: isDriversLoading } = useDrivers();

  const addPhone = useAddPhone();
  const deletePhone = useDeletePhone();
  const updateSettings = useUpdateSettings();
  const addDriver = useAddDriver();
  const deleteDriver = useDeleteDriver();
  const updateOrder = useUpdateOrder();

  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);
  const [statusChangingId, setStatusChangingId] = useState<number | null>(null);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "", label: "" },
  });
  const driverForm = useForm<z.infer<typeof driverSchema>>({
    resolver: zodResolver(driverSchema),
    defaultValues: { name: "", phone: "" },
  });
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
    },
  });

  useEffect(() => {
    if (settings) settingsForm.reset(settings as z.infer<typeof settingsSchema>);
  }, [settings]);

  const handleUnlock = () => {
    sessionStorage.setItem("admin_unlocked", "1");
    setUnlocked(true);
  };

  if (!unlocked) {
    return <PinLock correctPin={settings?.adminPin || "1234"} onUnlock={handleUnlock} />;
  }

  /* Phone handlers */
  const onAddPhone = async (data: z.infer<typeof phoneSchema>) => {
    try { await addPhone.mutateAsync({ data }); toast({ title: "تم إضافة الرقم" }); phoneForm.reset(); }
    catch { toast({ title: "خطأ في إضافة الرقم", variant: "destructive" }); }
  };
  const onDeletePhone = async (id: number) => {
    if (!confirm("حذف هذا الرقم؟")) return;
    try { await deletePhone.mutateAsync({ id }); toast({ title: "تم الحذف" }); }
    catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  /* Driver handlers */
  const onAddDriver = async (data: z.infer<typeof driverSchema>) => {
    try { await addDriver.mutateAsync(data); toast({ title: "تم إضافة السائق" }); driverForm.reset(); }
    catch { toast({ title: "خطأ في إضافة السائق", variant: "destructive" }); }
  };
  const onDeleteDriver = async (id: number) => {
    if (!confirm("حذف هذا السائق؟")) return;
    try { await deleteDriver.mutateAsync(id); toast({ title: "تم حذف السائق" }); }
    catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  /* Order handlers */
  const buildWhatsApp = (order: NonNullable<typeof orders>[number], phones: NonNullable<typeof phones>) => {
    const tpl = settings?.whatsappTemplate || "🛵 *طلب #{id}*\n👤 {customerName}\n📞 {customerPhone}\n📍 {address}\n📦 {orderDetails}\n📝 {notes}";
    const text = tpl
      .replace("{id}", String(order.id))
      .replace("{customerName}", order.customerName)
      .replace("{customerPhone}", order.customerPhone)
      .replace("{address}", order.address)
      .replace("{orderDetails}", order.orderDetails)
      .replace("{notes}", order.notes || "لا يوجد");
    const encoded = encodeURIComponent(text);
    const targetPhones = phones && phones.length > 0 ? phones.map(p => p.phoneNumber) : ["967775864948"];
    targetPhones.forEach((ph, i) => {
      const clean = ph.replace(/\D/g, "");
      setTimeout(() => window.open(`https://wa.me/${clean}?text=${encoded}`, "_blank"), i * 200);
    });
  };

  const assignDriver = async (orderId: number, driver: NonNullable<typeof drivers>[number] | null) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, data: { assignedDriverId: driver?.id ?? null, assignedDriverName: driver?.name ?? null, status: driver ? "assigned" : "pending" } });
      toast({ title: driver ? `تم تعيين ${driver.name}` : "تم إلغاء التعيين" });
    } catch { toast({ title: "خطأ", variant: "destructive" }); }
    setAssigningOrderId(null);
  };

  const changeStatus = async (orderId: number, status: string) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, data: { status } });
      toast({ title: "تم تحديث الحالة" });
    } catch { toast({ title: "خطأ", variant: "destructive" }); }
    setStatusChangingId(null);
  };

  /* Logo upload */
  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      settingsForm.setValue("logoImage", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* Settings save */
  const onSaveSettings = async (data: z.infer<typeof settingsSchema>) => {
    try { await updateSettings.mutateAsync(data as SiteSettings); toast({ title: "✅ تم حفظ الإعدادات" }); }
    catch { toast({ title: "خطأ في الحفظ", variant: "destructive" }); }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 font-medium mt-1">إدارة الطلبات، السائقين، الأرقام، وإعدادات الموقع</p>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-500 gap-2"
          onClick={() => { sessionStorage.removeItem("admin_unlocked"); setUnlocked(false); }}>
          <Lock className="w-4 h-4" /> قفل
        </Button>
      </div>

      <Tabs defaultValue="orders" dir="rtl">
        <TabsList className="w-full grid grid-cols-4 h-14 bg-gray-100 p-1 rounded-xl mb-8">
          {[
            { value: "orders", icon: <Package className="w-4 h-4" />, label: "الطلبات" },
            { value: "drivers", icon: <Truck className="w-4 h-4" />, label: "السائقون" },
            { value: "phones", icon: <PhoneIcon className="w-4 h-4" />, label: "الواتساب" },
            { value: "settings", icon: <Settings className="w-4 h-4" />, label: "الإعدادات" },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value}
              className="rounded-lg font-bold text-sm gap-1.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
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
              {orders?.map((order) => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                return (
                  <Card key={order.id} className="border border-border/50 shadow-md hover:shadow-xl transition-all rounded-2xl overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-primary to-orange-400"></div>
                    <CardContent className="p-5 space-y-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-400">#{order.id}</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${st.color}`}>{st.label}</span>
                          </div>
                          <p className="font-bold text-gray-900 flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> {order.customerName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5" dir="ltr">
                            <PhoneIcon className="w-3.5 h-3.5 text-primary" /> {order.customerPhone}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {format(new Date(order.createdAt), 'hh:mm a', { locale: ar })}
                        </span>
                      </div>

                      {/* Order details */}
                      <div className="bg-orange-50/60 p-3 rounded-xl">
                        <p className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-1"><Package className="w-3.5 h-3.5" /> تفاصيل الطلب</p>
                        <p className="text-sm font-semibold text-gray-800">{order.orderDetails}</p>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="font-medium">{order.address}</span>
                      </div>
                      {order.notes && (
                        <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-2.5 rounded-xl">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <span>{order.notes}</span>
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
                            <button onClick={() => assignDriver(order.id, null)} className="text-xs text-red-400 hover:text-red-600 font-bold">إلغاء</button>
                          </div>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={() => setAssigningOrderId(assigningOrderId === order.id ? null : order.id)}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-bold text-gray-600 border border-dashed border-gray-300 rounded-xl hover:border-primary hover:text-primary transition-colors"
                            >
                              <span className="flex items-center gap-2"><Truck className="w-4 h-4" /> تعيين سائق</span>
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            {assigningOrderId === order.id && (
                              <div className="absolute z-10 top-full mt-1 right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                {isDriversLoading ? <p className="p-3 text-sm text-gray-500">جاري التحميل...</p>
                                  : drivers?.length === 0 ? <p className="p-3 text-sm text-gray-500">لا يوجد سائقون مضافون</p>
                                  : drivers?.map(d => (
                                    <button key={d.id} onClick={() => assignDriver(order.id, d)}
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

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {/* Status */}
                        <div className="relative flex-1">
                          <button
                            onClick={() => setStatusChangingId(statusChangingId === order.id ? null : order.id)}
                            className="w-full flex items-center justify-between gap-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:border-primary transition-colors"
                          >
                            <span>الحالة</span><ChevronDown className="w-3 h-3" />
                          </button>
                          {statusChangingId === order.id && (
                            <div className="absolute z-10 bottom-full mb-1 right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                              {Object.entries(STATUS_MAP).map(([key, val]) => (
                                <button key={key} onClick={() => changeStatus(order.id, key)}
                                  className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-gray-50 flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-lg ${val.color}`}>{val.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* WhatsApp */}
                        <button
                          onClick={() => phones && buildWhatsApp(order, phones)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" /> واتساب
                        </button>
                        {/* Status indicators */}
                        {order.status === "delivered" && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                        {order.status === "cancelled" && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                      </div>

                      <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'yyyy/MM/dd', { locale: ar })}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── DRIVERS ── */}
        <TabsContent value="drivers" className="space-y-8">
          <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-border/50">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> إضافة سائق جديد
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...driverForm}>
                <form onSubmit={driverForm.handleSubmit(onAddDriver)} className="flex flex-col sm:flex-row gap-4">
                  <FormField control={driverForm.control} name="name" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl><Input placeholder="اسم السائق" className="h-12 rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={driverForm.control} name="phone" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl><Input placeholder="رقم الهاتف (اختياري)" dir="ltr" className="h-12 rounded-xl text-right" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={addDriver.isPending} className="h-12 px-8 rounded-xl font-bold">
                    {addDriver.isPending ? "جاري..." : "إضافة"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" /> السائقون ({drivers?.length ?? 0})
            </h3>
            {isDriversLoading ? (
              <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : drivers?.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">لا يوجد سائقون مضافون بعد</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers?.map(driver => (
                  <div key={driver.id} className="flex items-center justify-between p-5 bg-white border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{driver.name}</p>
                        {driver.phone && <p className="text-sm text-gray-500 font-medium" dir="ltr">{driver.phone}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteDriver(driver.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── PHONES ── */}
        <TabsContent value="phones" className="space-y-8">
          <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-border/50">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> إضافة رقم واتساب
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onAddPhone)} className="flex flex-col sm:flex-row gap-4">
                  <FormField control={phoneForm.control} name="phoneNumber" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl><Input placeholder="رقم الهاتف (مثال: 967775864948)" dir="ltr" className="h-12 text-right rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={phoneForm.control} name="label" render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl><Input placeholder="وصف (اختياري)" className="h-12 rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={addPhone.isPending} className="h-12 px-8 rounded-xl font-bold">
                    {addPhone.isPending ? "..." : "إضافة"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PhoneIcon className="w-5 h-5 text-primary" /> الأرقام الحالية
            </h3>
            {isPhonesLoading ? (
              <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : phones?.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">لا يوجد أرقام مضافة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phones?.map(phone => (
                  <div key={phone.id} className="flex items-center justify-between p-5 bg-white border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <PhoneIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg" dir="ltr">{phone.phoneNumber}</p>
                        {phone.label && <p className="text-sm font-medium text-gray-500">{phone.label}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onDeletePhone(phone.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── SETTINGS ── */}
        <TabsContent value="settings" className="space-y-6">
          {isSettingsLoading ? (
            <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : (
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-6">

                {/* Branding + Logo */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-border/50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" /> الهوية والشعار
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    {/* Logo upload */}
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-orange-400 text-white flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                        {settingsForm.watch("logoImage") ? (
                          <img src={settingsForm.watch("logoImage")} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-10 h-10" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="font-bold text-gray-800">شعار الموقع</p>
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors">
                          <ImageIcon className="w-4 h-4" /> رفع صورة الشعار
                          <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                        </label>
                        {settingsForm.watch("logoImage") && (
                          <button type="button" onClick={() => settingsForm.setValue("logoImage", "")}
                            className="text-xs text-red-500 hover:text-red-700 font-bold text-right">
                            ✕ إزالة الشعار
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField control={settingsForm.control} name="siteName" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">اسم الموقع</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={settingsForm.control} name="siteTagline" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">الشعار الفرعي</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={settingsForm.control} name="footerText" render={({ field }) => (
                        <FormItem className="sm:col-span-2"><FormLabel className="font-bold">نص الفوتر</FormLabel>
                          <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                {/* PIN + Color */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-border/50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" /> اللون والأمان
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField control={settingsForm.control} name="primaryColor" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">اللون الأساسي</FormLabel>
                        <div className="flex items-center gap-3 mt-1">
                          <input type="color" value={field.value} onChange={field.onChange}
                            className="w-14 h-12 rounded-xl cursor-pointer border border-gray-200 p-1" />
                          <FormControl><Input className="h-12 rounded-xl flex-1" {...field} /></FormControl>
                          <div className="w-12 h-12 rounded-xl border border-gray-200" style={{ backgroundColor: field.value }} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="adminPin" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold flex items-center gap-2"><Lock className="w-4 h-4" /> الرمز السري للإدارة</FormLabel>
                        <FormControl><Input type="text" inputMode="numeric" placeholder="1234" className="h-12 rounded-xl tracking-widest text-center font-bold" maxLength={8} {...field} /></FormControl>
                        <FormDescription>الرمز الحالي المُستخدم لفتح لوحة التحكم</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Hero */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-border/50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" /> القسم الرئيسي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField control={settingsForm.control} name="availabilityText" render={({ field }) => (
                      <FormItem className="sm:col-span-2"><FormLabel className="font-bold">نص التوفر</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="heroTitle" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold">العنوان (السطر الأول)</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="heroTitleHighlight" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold">العنوان الملون (السطر الثاني)</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="heroDescription" render={({ field }) => (
                      <FormItem className="sm:col-span-2"><FormLabel className="font-bold">وصف الخدمة</FormLabel>
                        <FormControl><Textarea className="rounded-xl resize-none" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Form texts */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-border/50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" /> نموذج الطلب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField control={settingsForm.control} name="formTitle" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold">عنوان النموذج</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="formSubtitle" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold">وصف النموذج</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={settingsForm.control} name="successMessage" render={({ field }) => (
                      <FormItem className="sm:col-span-2"><FormLabel className="font-bold">رسالة النجاح</FormLabel>
                        <FormControl><Input className="h-12 rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* WhatsApp template */}
                <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-border/50">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-green-600" /> قالب رسالة الواتساب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FormField control={settingsForm.control} name="whatsappTemplate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">نص الرسالة</FormLabel>
                        <FormDescription className="text-xs text-gray-500 leading-relaxed">
                          المتغيرات المتاحة:&nbsp;
                          {["{id}", "{customerName}", "{customerPhone}", "{address}", "{orderDetails}", "{notes}"].map(v => (
                            <code key={v} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs ml-1">{v}</code>
                          ))}
                        </FormDescription>
                        <FormControl>
                          <Textarea className="rounded-xl resize-none font-mono text-sm mt-2" rows={7} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <div className="flex justify-end pb-6">
                  <Button type="submit" disabled={updateSettings.isPending}
                    className="h-14 px-10 rounded-xl font-bold text-lg shadow-lg shadow-primary/30">
                    {updateSettings.isPending
                      ? <span className="flex items-center gap-2">جاري الحفظ... <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span></span>
                      : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> حفظ جميع الإعدادات</span>
                    }
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

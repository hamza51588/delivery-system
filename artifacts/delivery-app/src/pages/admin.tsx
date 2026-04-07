import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Trash2, Phone as PhoneIcon, Plus, MapPin, User, Clock,
  FileText, Settings, Save, Palette, Lock,
  MessageCircle, Truck, CheckCircle2, XCircle, Image as ImageIcon,
  ChevronDown, BarChart3, TrendingUp, Calendar, ExternalLink,
  CreditCard, Eye, ToggleLeft, ToggleRight, Banknote, Bell, Send, Package
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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── الحالات والألوان ─── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: "قيد الانتظار",  color: "bg-yellow-100 text-yellow-700" },
  assigned:   { label: "تم التعيين",    color: "bg-blue-100 text-blue-700" },
  delivering: { label: "جاري التوصيل", color: "bg-orange-100 text-orange-700" },
  delivered:  { label: "تم التوصيل",   color: "bg-green-100 text-green-700" },
  cancelled:  { label: "ملغي",          color: "bg-red-100 text-red-700" },
};

/* ─── التحقق من صحة البيانات ─── */
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
  adminPin: z.string().min(4), logoImage: z.string().optional(),
  bankName: z.string(), bankAccountName: z.string().optional(), bankAccountNumber: z.string().optional(),
});

/* ═══ نافذة القفل (PIN) ═══ */
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="w-20 h-20 rounded-3xl bg-primary text-white flex items-center justify-center shadow-xl mb-6 shadow-primary/30">
        <Lock className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-6">لوحة التحكم</h2>
      <Card className={`w-full max-w-sm border-0 shadow-2xl rounded-3xl ${error ? "ring-2 ring-red-500" : ""}`}>
        <CardContent className="p-8 space-y-6">
          <input 
            ref={inputRef} type="password" inputMode="numeric" maxLength={8} 
            value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} 
            onKeyDown={e => e.key === "Enter" && check()} 
            placeholder="● ● ● ●" 
            className="w-full text-center text-3xl tracking-[0.5em] h-16 rounded-2xl border-2 border-gray-100 focus:border-primary outline-none bg-gray-50 font-bold" 
          />
          <Button onClick={check} className="w-full h-14 rounded-2xl font-bold text-lg">دخول النظام</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══ نافذة السند ═══ */
function ReceiptModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose} dir="rtl">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <p className="font-bold flex items-center gap-2 text-blue-700">
            <ImageIcon className="w-5 h-5"/> صورة السند
          </p>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">✕</button>
        </div>
        <div className="p-4 bg-gray-100 flex items-center justify-center">
          <img src={src} alt="سند" className="max-w-full max-h-[70vh] rounded-xl shadow-lg border-2 border-white" />
        </div>
      </div>
    </div>
  );
}

/* ═══ كرت الطلب بدون خريطة ═══ */
function OrderCard({ order, drivers, onAssign, onChangeStatus, onVerifyPayment, onWhatsApp, onChangeNotes }: any) {
  const [showStatus, setShowStatus] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showMsgInput, setShowMsgInput] = useState(false);
  const [msgText, setMsgText] = useState("");
  
  const [optStatus, setOptStatus] = useState(order.status);
  const [optDriver, setOptDriver] = useState(order.assignedDriverName);
  const [optVerified, setOptVerified] = useState(order.paymentVerified);

  useEffect(() => { setOptStatus(order.status); }, [order.status]);
  useEffect(() => { setOptDriver(order.assignedDriverName); }, [order.assignedDriverName]);
  useEffect(() => { setOptVerified(order.paymentVerified); }, [order.paymentVerified]);

  const st = STATUS_MAP[optStatus] || STATUS_MAP.pending;
  const isReceiptImage = order.paymentReceiptImage && order.paymentReceiptImage.startsWith('data:image');
  const receiptText = order.paymentReceiptImage && !isReceiptImage ? order.paymentReceiptImage : null;

  const handleFastStatus = (key: string) => { 
    setShowStatus(false); 
    setOptStatus(key); 
    onChangeStatus(order.id, key); 
  };
  
  const handleFastAssign = (d: any) => { 
    setOptDriver(d ? d.name : null); 
    setOptStatus(d ? "assigned" : "pending"); 
    onAssign(order, d); 
  };

  const handleFastVerify = (verified: boolean) => {
    setOptVerified(verified); 
    setOptStatus(verified ? "delivering" : "pending");
    onVerifyPayment(order.id, verified);
  };

  const handleSendMsg = () => {
    if (!msgText.trim()) return;
    let notesArr = [];
    try {
      notesArr = JSON.parse(order.notes || "[]");
      if (!Array.isArray(notesArr)) notesArr = [];
    } catch {
      notesArr = order.notes ? [{text: order.notes, time: new Date().toISOString()}] : [];
    }
    notesArr.push({ text: msgText, time: new Date().toISOString(), isCustom: true });
    onChangeNotes(order.id, JSON.stringify(notesArr));
    setMsgText("");
    setShowMsgInput(false);
  };

  return (
    <>
      {showReceipt && isReceiptImage && <ReceiptModal src={order.paymentReceiptImage!} onClose={() => setShowReceipt(false)} />}
      <Card className="border border-border/50 shadow-md hover:shadow-xl transition-all rounded-[2rem] overflow-hidden relative">
        
        <div className={`h-1.5 w-full ${order.paymentMethod === "bank_transfer" ? "bg-blue-600" : "bg-primary"}`}></div>
        
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-gray-400">#{order.id}</span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${st.color}`}>{st.label}</span>
              </div>
              <p className="font-black flex items-center gap-1.5 text-gray-900 leading-tight">
                <User className="w-4 h-4 text-primary" /> {order.customerName}
              </p>
              <p className="text-xs font-bold text-gray-500 mt-1" dir="ltr">{order.customerPhone}</p>
            </div>
            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" /> {format(new Date(order.createdAt), 'hh:mm a', { locale: ar })}
            </span>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <div className="text-xs font-bold text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100 flex gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{order.address}</span>
            </div>
            {order.locationLink && (
              <a href={order.locationLink} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-50 py-3 rounded-2xl border border-blue-100 font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                <ExternalLink className="w-4 h-4" /> فتح موقع الزبون (GPS)
              </a>
            )}
          </div>

          <div className="bg-orange-50/60 p-3 rounded-2xl border border-orange-100">
            <p className="text-[10px] font-black text-orange-600 mb-1 flex items-center gap-1">
              <Package className="w-4 h-4"/> تفاصيل الطلب:
            </p>
            <p className="text-xs font-bold text-gray-800 leading-relaxed">{order.orderDetails}</p>
          </div>

          {order.paymentMethod === "bank_transfer" && (
            <div className={`p-3 rounded-2xl border ${optVerified ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-gray-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" /> الدفع المصرفي
                </p>
                {!optVerified ? (
                  <button onClick={() => handleFastVerify(true)} className="text-[10px] bg-green-600 text-white px-3 py-1.5 rounded-lg font-black shadow-sm">قبول</button>
                ) : (
                  <button onClick={() => handleFastVerify(false)} className="text-[10px] bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-black">إلغاء</button>
                )}
              </div>
              
              {isReceiptImage ? (
                <button onClick={() => setShowReceipt(true)} className="w-full flex items-center justify-center gap-2 bg-white text-blue-700 border border-blue-200 py-2.5 rounded-xl text-xs font-black shadow-sm hover:bg-blue-50 transition-colors">
                  <Eye className="w-4 h-4" /> عرض صورة السند
                </button>
              ) : receiptText ? (
                <div className="p-2.5 bg-white rounded-xl text-center font-black text-blue-900 border border-blue-100 text-xs shadow-sm">
                  رقم الحوالة: {receiptText}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 text-center italic mt-1">لم يتم إرفاق سند</p>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            {optDriver ? (
              <div className="flex items-center justify-between bg-gray-50 border p-2.5 rounded-2xl shadow-sm">
                <div className="text-xs font-black flex items-center gap-2 text-gray-700">
                  <Truck className="w-4 h-4 text-primary" /> {optDriver}
                </div>
                <button onClick={() => handleFastAssign(null)} className="text-[10px] text-red-500 font-black hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">إلغاء</button>
              </div>
            ) : (
              <div className="overflow-x-auto flex gap-2 pb-1 no-scrollbar">
                {Array.isArray(drivers) && drivers.map((d: any) => (
                  <button key={d.id} onClick={() => handleFastAssign(d)} className="flex-shrink-0 snap-start px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-gray-500 hover:border-primary hover:text-primary hover:bg-orange-50 transition-all">
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <button onClick={() => setShowStatus(!showStatus)} className="w-full flex justify-between items-center p-3 text-[10px] font-black border rounded-2xl bg-white hover:border-primary transition-all">
                <span>تغيير الحالة</span><ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showStatus && (
                <div className="absolute z-10 bottom-full w-full bg-white border border-gray-200 rounded-2xl shadow-2xl mb-2 overflow-hidden">
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <button key={key} onClick={() => handleFastStatus(key)} className="w-full text-right p-3 text-[10px] font-black hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <span className={`px-2 py-1 rounded-lg ${val.color} block w-fit`}>{val.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowMsgInput(!showMsgInput)} className={`p-3 border rounded-2xl transition-all shadow-sm ${showMsgInput ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={() => onWhatsApp(order)} className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-2xl hover:bg-green-100 transition-all shadow-sm shadow-green-600/10">
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>

          {/* صندوق كتابة الإشعار */}
          {showMsgInput && (
            <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100 flex gap-2 animate-in fade-in zoom-in duration-200">
              <Input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="اكتب إشعار للعميل هنا..." className="h-10 text-xs font-bold border-red-200 focus:border-red-400 bg-white" />
              <Button onClick={handleSendMsg} className="h-10 px-4 bg-red-600 hover:bg-red-700 text-xs font-black shadow-md"><Send className="w-4 h-4 rtl:-scale-x-100" /></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("admin_unlocked") === "1");

  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const { data: stats } = useOrderStats();
  const { data: phones } = usePhones();
  const { data: settings } = useSettings();
  const { data: drivers, isLoading: isDriversLoading } = useDrivers();
  const { data: areas } = useDeliveryAreas();

  const addPhone = useAddPhone();
  const deletePhone = useDeletePhone();
  const updateSettings = useUpdateSettings();
  const addDriver = useAddDriver();
  const deleteDriver = useDeleteDriver();
  const updateOrder = useUpdateOrder();
  const addArea = useAddDeliveryArea();
  const updateArea = useUpdateDeliveryArea();
  const deleteArea = useDeleteDeliveryArea();

  const phoneForm = useForm({ defaultValues: { phoneNumber: "", label: "" } });
  const driverForm = useForm({ defaultValues: { name: "", phone: "" } });
  const areaForm = useForm({ defaultValues: { name: "", price: 0 } });
  
  const settingsForm = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: { 
      siteName: "", siteTagline: "", heroTitle: "", heroTitleHighlight: "", 
      heroDescription: "", availabilityText: "", formTitle: "", formSubtitle: "", 
      successMessage: "", primaryColor: "#FF6B35", whatsappTemplate: "", 
      footerText: "", adminPin: "", logoImage: "", bankName: "", 
    },
  });

  useEffect(() => { 
    if (settings) settingsForm.reset(settings as any); 
  }, [settings]);

  if (!unlocked) {
    return <PinLock correctPin={settings?.adminPin || "1234"} onUnlock={() => { sessionStorage.setItem("admin_unlocked", "1"); setUnlocked(true); }} />;
  }

  const onAssign = async (order: Order, driver: any | null) => { 
    try { await updateOrder.mutateAsync({ id: order.id, data: { assignedDriverId: driver?.id ?? null, assignedDriverName: driver?.name ?? null, status: driver ? "assigned" : "pending" } }); } 
    catch { toast({ title: "خطأ", variant: "destructive" }); } 
  };
  
  const onChangeStatus = async (id: number, status: string) => { 
    try { await updateOrder.mutateAsync({ id, data: { status } }); } 
    catch { toast({ title: "خطأ", variant: "destructive" }); } 
  };
  
  const onVerifyPayment = async (id: number, verified: boolean) => { 
    try { await updateOrder.mutateAsync({ id, data: { paymentVerified: verified, status: verified ? "delivering" : "pending" } }); } 
    catch { toast({ title: "خطأ", variant: "destructive" }); } 
  };

  const onChangeNotes = async (id: number, notes: string) => { 
    try { await updateOrder.mutateAsync({ id, data: { notes } }); toast({ title: "تم إرسال الإشعار للعميل 📨" }); } 
    catch {} 
  };

  const onWhatsApp = (order: Order) => {
     const tpl = settings?.whatsappTemplate || "🛵 *طلب جديد #{id}*\n👤 {customerName}\n📍 {address}";
     const text = tpl.replace("{id}", String(order.id))
                     .replace("{customerName}", order.customerName)
                     .replace("{customerPhone}", order.customerPhone)
                     .replace("{address}", order.address)
                     .replace("{orderDetails}", order.orderDetails);
     window.open(`https://wa.me/${phones?.[0]?.phoneNumber?.replace(/\D/g, "") || "967775864948"}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => settingsForm.setValue("logoImage", reader.result as string, { shouldDirty: true });
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-24" dir="rtl">
      
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">لوحة التحكم</h1>
        </div>
        <Button variant="ghost" onClick={() => { sessionStorage.removeItem("admin_unlocked"); setUnlocked(false); }} className="text-gray-400 hover:text-red-500 transition-colors">
          <Lock className="w-5 h-5 ml-2" /> خروج
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
           {[
             { label: "اليوم", val: stats.today, c: "bg-orange-50 text-orange-600", i: <Calendar className="w-4 h-4"/> }, 
             { label: "الشهر", val: stats.thisMonth, c: "bg-blue-50 text-blue-600", i: <TrendingUp className="w-4 h-4"/> }, 
             { label: "السنة", val: stats.thisYear, c: "bg-purple-50 text-purple-600", i: <BarChart3 className="w-4 h-4"/> }, 
             { label: "الإجمالي", val: stats.total, c: "bg-green-50 text-green-600", i: <Package className="w-4 h-4"/> }
           ].map(s => (
             <div key={s.label} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02] shadow-sm">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${s.c}`}>
                 {s.val}
               </div>
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">{s.i} {s.label}</p>
                 <p className="text-lg font-black text-gray-900">{s.val}</p>
               </div>
             </div>
           ))}
        </div>
      )}

      {/* ─── التبويبات الرئيسية ─── */}
      <Tabs defaultValue="orders" dir="rtl" className="w-full">
        <div className="px-4">
          <TabsList className="w-full grid grid-cols-5 h-auto bg-gray-100/50 border border-gray-200 p-1.5 rounded-[2rem] shadow-inner mb-8 overflow-hidden">
            <TabsTrigger value="orders" className="font-black text-[10px] py-4 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center justify-center gap-2"><Package className="w-4 h-4"/> الطلبات</TabsTrigger>
            <TabsTrigger value="drivers" className="font-black text-[10px] py-4 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center justify-center gap-2"><Truck className="w-4 h-4"/> السائقون</TabsTrigger>
            <TabsTrigger value="areas" className="font-black text-[10px] py-4 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center justify-center gap-2"><MapPin className="w-4 h-4"/> المناطق</TabsTrigger>
            <TabsTrigger value="phones" className="font-black text-[10px] py-4 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center justify-center gap-2"><PhoneIcon className="w-4 h-4"/> واتساب</TabsTrigger>
            <TabsTrigger value="settings" className="font-black text-[10px] py-4 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center justify-center gap-2"><Settings className="w-4 h-4"/> الإعدادات</TabsTrigger>
          </TabsList>
        </div>

        {/* ─── قسم الطلبات ─── */}
        <TabsContent value="orders" className="px-4">
          {isOrdersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-72 rounded-[2rem]"/></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders?.map(o => <OrderCard key={o.id} order={o} drivers={drivers} onAssign={onAssign} onChangeStatus={onChangeStatus} onVerifyPayment={onVerifyPayment} onWhatsApp={onWhatsApp} onChangeNotes={onChangeNotes} />)}
            </div>
          )}
        </TabsContent>

        {/* ─── قسم السائقين ─── */}
        <TabsContent value="drivers" className="space-y-6 px-4">
          <Card className="rounded-[2rem] border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-sm font-black flex items-center gap-2 text-primary"><Plus className="w-4 h-4"/> إضافة سائق جديد</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <Form {...driverForm}>
                <form onSubmit={driverForm.handleSubmit((d) => addDriver.mutate(d))} className="flex gap-4">
                  <FormField control={driverForm.control} name="name" render={({field})=>(<Input placeholder="اسم السائق" className="h-14 rounded-2xl border-gray-200" {...field}/>)}/>
                  <Button type="submit" disabled={addDriver.isPending} className="h-14 px-10 rounded-2xl font-black">إضافة</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers?.map(d => (
              <div key={d.id} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                 <div className="flex items-center gap-4">
                   <div className={`w-3 h-3 rounded-full ${d.isAvailable !== false ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-red-500'}`}></div>
                   <div>
                     <p className="font-black text-gray-900 leading-none">{d.name}</p>
                     <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg mt-2 w-fit border border-blue-100 tracking-widest">كود الدخول: {d.loginCode}</p>
                   </div>
                 </div>
                 <Button variant="ghost" onClick={() => { if(confirm("حذف؟")) deleteDriver.mutate(d.id) }} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5"/></Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─── قسم المناطق ─── */}
        <TabsContent value="areas" className="space-y-6 px-4">
          <Card className="rounded-[2rem] border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-sm font-black flex items-center gap-2 text-primary"><Plus className="w-4 h-4"/> إضافة منطقة توصيل</CardTitle></CardHeader>
             <CardContent className="pt-6">
               <Form {...areaForm}>
                 <form onSubmit={areaForm.handleSubmit((d) => addArea.mutate(d))} className="flex gap-4">
                   <FormField control={areaForm.control} name="name" render={({field})=>(<Input placeholder="اسم المنطقة" className="h-14 rounded-2xl flex-1" {...field}/>)}/>
                   <FormField control={areaForm.control} name="price" render={({field})=>(<Input type="number" placeholder="السعر" className="h-14 rounded-2xl w-32" {...field}/>)}/>
                   <Button type="submit" className="h-14 px-10 rounded-2xl font-black">إضافة</Button>
                 </form>
               </Form>
             </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areas?.map(a => (
              <div key={a.id} className={`p-5 rounded-[1.5rem] border flex justify-between items-center transition-all ${a.isActive ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                 <div>
                   <p className="font-black text-gray-900">{a.name}</p>
                   <p className="text-sm text-primary font-black mt-0.5">{a.price} ريال</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => updateArea.mutate({id: a.id, isActive: !a.isActive})} className={`p-2.5 rounded-xl border transition-all ${a.isActive ? 'bg-green-50 text-green-600 border-green-200 shadow-sm' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>
                      {a.isActive ? <ToggleRight className="w-6 h-6"/> : <ToggleLeft className="w-6 h-6"/>}
                    </button>
                    <Button variant="ghost" onClick={() => deleteArea.mutate(a.id)} className="text-red-400 hover:text-red-600 h-11 w-11 rounded-xl"><Trash2 className="w-5 h-5"/></Button>
                 </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─── قسم أرقام الواتساب ─── */}
        <TabsContent value="phones" className="space-y-6 px-4">
           <Card className="rounded-[2rem] border-0 shadow-sm overflow-hidden">
             <CardHeader className="bg-gray-50/50 border-b"><CardTitle className="text-sm font-black flex items-center gap-2 text-green-700"><MessageCircle className="w-4 h-4"/> أرقام واتساب الإدارة</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit((d) => addPhone.mutate({data: d}))} className="flex gap-4">
                    <FormField control={phoneForm.control} name="phoneNumber" render={({field})=>(<Input placeholder="الرقم (مثال: 967...)" className="h-14 rounded-2xl flex-1 text-right font-bold" dir="ltr" {...field}/>)}/>
                    <Button type="submit" className="h-14 px-10 rounded-2xl font-black bg-green-600 hover:bg-green-700">إضافة</Button>
                  </form>
                </Form>
              </CardContent>
           </Card>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phones?.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 flex justify-between items-center shadow-sm hover:border-green-200 transition-colors">
                   <div className="font-black text-gray-900" dir="ltr">{p.phoneNumber}</div>
                   <Button variant="ghost" onClick={() => deletePhone.mutate({id: p.id})} className="text-red-400 hover:text-red-600 h-11 w-11 rounded-xl"><Trash2 className="w-5 h-5"/></Button>
                </div>
              ))}
           </div>
        </TabsContent>

        {/* ─── قسم الإعدادات الشاملة ─── */}
        <TabsContent value="settings" className="space-y-8 px-4 pb-24">
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit((d) => updateSettings.mutate(d as any))} className="space-y-8">
            
            {/* الهوية */}
            <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden">
               <CardHeader className="bg-gray-50 border-b"><CardTitle className="text-lg flex items-center gap-2 font-black text-primary"><Palette className="w-5 h-5"/> الهوية والبراند</CardTitle></CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-primary text-white flex items-center justify-center shadow-2xl overflow-hidden shrink-0 border-4 border-white">
                      {settingsForm.watch("logoImage") ? <img src={settingsForm.watch("logoImage")} alt="logo" className="w-full h-full object-cover" /> : <Package className="w-12 h-12" />}
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-right">
                      <p className="font-black text-gray-700">شعار التطبيق الرسمي</p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-sm font-black transition-all shadow-sm">
                        <ImageIcon className="w-5 h-5" /> رفع شعار جديد
                        <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={settingsForm.control} name="siteName" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">اسم الموقع</FormLabel><Input className="h-14 rounded-2xl border-gray-200 font-bold" {...field}/></FormItem>)}/>
                    <FormField control={settingsForm.control} name="primaryColor" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">اللون الأساسي</FormLabel><div className="flex gap-2"><Input type="color" className="w-16 h-14 p-1 rounded-2xl cursor-pointer" {...field}/><Input className="h-14 rounded-2xl flex-1 font-mono text-xs font-bold" {...field}/></div></FormItem>)}/>
                    <FormField control={settingsForm.control} name="siteTagline" render={({field})=>(<FormItem className="md:col-span-2"><FormLabel className="font-black text-xs text-gray-500">الشعار اللفظي (Tagline)</FormLabel><Input className="h-14 rounded-2xl border-gray-200 font-bold" {...field}/></FormItem>)}/>
                  </div>
               </CardContent>
            </Card>

            {/* النصوص */}
            <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden">
               <CardHeader className="bg-gray-50 border-b"><CardTitle className="text-lg flex items-center gap-2 font-black text-blue-700"><Settings className="w-5 h-5"/> نصوص الواجهة</CardTitle></CardHeader>
               <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={settingsForm.control} name="availabilityText" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">نص التوفر</FormLabel><Input className="h-14 rounded-2xl font-bold border-gray-200" {...field}/></FormItem>)}/>
                  <FormField control={settingsForm.control} name="heroTitle" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">العنوان الرئيسي</FormLabel><Input className="h-14 rounded-2xl font-bold border-gray-200" {...field}/></FormItem>)}/>
                  <FormField control={settingsForm.control} name="heroTitleHighlight" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">الكلمة الملونة</FormLabel><Input className="h-14 rounded-2xl font-bold border-gray-200" {...field}/></FormItem>)}/>
                  <FormField control={settingsForm.control} name="formTitle" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">عنوان النموذج</FormLabel><Input className="h-14 rounded-2xl font-bold border-gray-200" {...field}/></FormItem>)}/>
                  <FormField control={settingsForm.control} name="formSubtitle" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">وصف النموذج</FormLabel><Input className="h-14 rounded-2xl font-bold border-gray-200" {...field}/></FormItem>)}/>
                  <FormField control={settingsForm.control} name="successMessage" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">رسالة النجاح</FormLabel><Input className="h-14 rounded-2xl font-bold border-gray-200" {...field}/></FormItem>)}/>
                  <FormField control={settingsForm.control} name="heroDescription" render={({field})=>(<FormItem className="md:col-span-2"><FormLabel className="font-black text-xs text-gray-500">وصف الخدمة</FormLabel><Textarea className="rounded-[1.5rem] font-bold p-4" {...field}/></FormItem>)}/>
                  <FormField control={settingsForm.control} name="footerText" render={({field})=>(<FormItem className="md:col-span-2"><FormLabel className="font-black text-xs text-gray-500">نص الفوتر</FormLabel><Input className="h-14 rounded-2xl font-bold border-gray-200" {...field}/></FormItem>)}/>
               </CardContent>
            </Card>

            {/* الحسابات البنكية */}
            <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden">
               <CardHeader className="bg-gray-50 border-b"><CardTitle className="text-lg flex items-center gap-2 font-black text-green-700"><Banknote className="w-5 h-5"/> الحسابات البنكية والأمان</CardTitle></CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-[2.5rem] p-6 space-y-6 shadow-inner">
                     <div className="flex justify-between items-center px-2">
                       <label className="font-black text-blue-900 text-lg">البنوك المتاحة للعملاء</label>
                       <button type="button" onClick={()=>{ 
                           let cur = []; 
                           try { 
                             const v = settingsForm.getValues("bankName"); 
                             if(v.startsWith("[")) cur = JSON.parse(v); 
                             else if(v) cur = [{bank:v, name: settingsForm.getValues("bankAccountName"), number: settingsForm.getValues("bankAccountNumber")}]; 
                           } catch(e){} 
                           cur.push({bank:"بنك جديد", name:"", number:""}); 
                           settingsForm.setValue("bankName", JSON.stringify(cur), {shouldDirty:true}); 
                       }} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-lg shadow-blue-600/30 hover:scale-105 transition-transform">+ إضافة حساب</button>
                     </div>
                     <FormField control={settingsForm.control} name="bankName" render={({field})=>{ 
                        let banks: any[] = []; 
                        try { 
                          if(field.value && typeof field.value === 'string' && field.value.startsWith("[")) {
                            banks = JSON.parse(field.value); 
                          } else if(field.value) {
                            banks = [{bank: field.value, name: settingsForm.getValues("bankAccountName"), number: settingsForm.getValues("bankAccountNumber")}]; 
                          }
                        } catch(e){} 
                        return (
                          <div className="space-y-4">
                            {banks.map((b:any, i:number)=>(
                               <div key={i} className="bg-white p-4 rounded-3xl border border-blue-100 flex gap-3 flex-wrap sm:flex-nowrap shadow-sm">
                                  <Input className="flex-1 font-black text-xs h-12" placeholder="البنك" value={b.bank} onChange={e=>{ const nb = [...banks]; nb[i].bank = e.target.value; field.onChange(JSON.stringify(nb)); }}/> 
                                  <Input className="flex-1 font-black text-xs h-12" placeholder="الاسم" value={b.name} onChange={e=>{ const nb = [...banks]; nb[i].name = e.target.value; field.onChange(JSON.stringify(nb)); }}/> 
                                  <Input className="flex-1 font-mono text-sm text-left h-12" dir="ltr" placeholder="الرقم" value={b.number} onChange={e=>{ const nb = [...banks]; nb[i].number = e.target.value; field.onChange(JSON.stringify(nb)); }}/> 
                                  <button type="button" onClick={()=>{ const nb = banks.filter((_:any,idx:number)=>idx!==i); field.onChange(JSON.stringify(nb)); }} className="text-red-500 font-black px-3 hover:bg-red-50 rounded-2xl transition-colors">✕</button>
                               </div>
                            ))}
                          </div>
                        ) 
                     }}/>
                  </div>
                  <FormField control={settingsForm.control} name="adminPin" render={({field})=>(<FormItem><FormLabel className="font-black text-xs text-gray-500">رمز PIN لوحة التحكم (للحماية)</FormLabel><Input className="h-16 rounded-[1.5rem] text-center tracking-[0.6em] font-black text-2xl border-gray-200 bg-gray-50 shadow-inner" {...field}/></FormItem>)}/>
               </CardContent>
            </Card>

            {/* قالب الواتس */}
            <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden">
               <CardHeader className="bg-green-50 border-b border-green-100"><CardTitle className="text-lg flex items-center gap-2 font-black text-green-800"><MessageCircle className="w-5 h-5 text-green-600"/> قالب رسالة الواتساب</CardTitle></CardHeader>
               <CardContent className="p-8">
                 <FormField control={settingsForm.control} name="whatsappTemplate" render={({field})=>(<FormItem><FormControl><Textarea rows={10} className="rounded-[2rem] font-mono text-sm leading-relaxed p-6 bg-gray-50 border-gray-200 font-bold" {...field}/></FormControl></FormItem>)}/>
                 
                 <div className="flex justify-end pt-8">
                   <Button type="submit" disabled={updateSettings.isPending} className="h-16 px-16 rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/40 hover:scale-[1.03] transition-all bg-primary hover:bg-primary/90 text-white">
                     حفظ الإعدادات كاملة <Save className="mr-3 w-6 h-6"/>
                   </Button>
                 </div>
               </CardContent>
            </Card>

          </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

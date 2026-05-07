import { PackageIcon } from "lucide-react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Send, MapPin, Phone, User, Package as PackageIcon,
  FileText, CheckCircle2, LocateFixed, Loader2,
  CreditCard, Banknote, Image as ImageIcon, ExternalLink, Camera as CameraIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useCreateOrder, useUploadReceipt } from "@/hooks/use-orders";
import { useSettings } from "@/hooks/use-settings";
import { useDeliveryAreas } from "@/hooks/use-delivery-areas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب ويجب أن يكون حرفين على الأقل"),
  customerPhone: z.string().min(6, "رقم الهاتف مطلوب"),
  address: z.string().min(3, "الرجاء كتابة العنوان"),
  orderDetails: z.string().min(3, "الرجاء كتابة تفاصيل الطلب"),
  notes: z.string().optional(),
  deliveryArea: z.string().optional(),
  paymentMethod: z.enum(["cash", "bank_transfer"]),
});
type FormValues = z.infer<typeof formSchema>;

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch (e) {
    return `${lat}, ${lng}`;
  }
}

export default function Home() {

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<"loading" | "success" | "error" | null>(null);
  const [promoMessage, setPromoMessage] = useState("");

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoStatus("loading");
    try {
      const res = await fetch("https://workspaceapi-server-production-af1a.up.railway.app/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discountValue);
        setPromoStatus("success");
        setPromoMessage(`✅ تم تفعيل الخصم: ${data.discountValue} ريال`);
      } else {
        setDiscount(0);
        setPromoStatus("error");
        setPromoMessage(data.error || "❌ الكود غير صحيح أو منتهي");
      }
    } catch (e) {
      setPromoStatus("error");
      setPromoMessage("⚠️ تأكد من اتصالك بالإنترنت");
    }
  };

  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const uploadReceipt = useUploadReceipt();
  
  const { data: areas } = useDeliveryAreas();
  const activeAreas = areas?.filter(a => a.isActive) || [];

  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsLink, setGpsLink] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // --- الحقول الجديدة للحوالة ---
  const [transferNumber, setTransferNumber] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const { data: settings } = useSettings();
  const s = settings;

  const [selectedBank, setSelectedBank] = useState<string>("الكريمي");
  
  const { BANK_DATA, AVAILABLE_BANKS } = useMemo(() => {
    const data: any = {};
    try {
      if (s?.bankName && s.bankName.includes("|")) {
      let arr = [];
      try {
        if (s.bankName && s.bankName.startsWith("[")) {
          arr = JSON.parse(s.bankName);
        } else if (s.bankName) {
          arr = s.bankName.split("\n").map(l => {
            const parts = l.split("|").map(x => x.trim());
            return { bank: parts[0], name: parts[1] || "", number: parts[2] || "" };
          }).filter(x => x.bank);
        }
      } catch(e) { arr = []; }
        if (Array.isArray(arr)) {
          arr.forEach((b: any) => {
            if (b.bank) data[b.bank] = { name: b.name || "", number: b.number || "" };
          });
        }
      } else if (s?.bankName) {
        data[s.bankName] = { name: s?.bankAccountName || "", number: s?.bankAccountNumber || "" };
      }
    } catch(e) { console.error("Parse error:", e); }

    const keys = Object.keys(data);
    const available = keys.length > 0 ? keys : (s?.bankName && !s.bankName.includes("|") ? [s.bankName] : []);

    const proxy = new Proxy(data, {
      get: (target, prop: string) => target[prop] || { name: "", number: "" }
    });

    return { BANK_DATA: proxy, AVAILABLE_BANKS: available };
  }, [s?.bankName, s?.bankAccountName, s?.bankAccountNumber]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "", customerPhone: "", address: "",
      orderDetails: "", notes: "", deliveryArea: "",
      paymentMethod: "cash",
    },
  });

  const paymentMethod = form.watch("paymentMethod");
  const selectedArea = form.watch("deliveryArea");
  const selectedAreaData = activeAreas.find(a => a.name === selectedArea);

    const handleLocate = () => {
    if (!navigator.geolocation) { toast({ title: "GPS غير مدعوم" }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lng } = pos.coords;
        const address = await reverseGeocode(lat, lng);
        const link = `http://maps.google.com/?q=${lat},${lng}`;
        form.setValue("address", address + " [GPS]:" + link, { shouldValidate: true });
        setGpsCoords({ lat, lng }); setGpsLink(link);
        toast({ title: "✅ تم تحديد الموقع" });
      } catch { toast({ title: "خطأ في العنوان" }); } finally { setLocating(false); }
    }, () => setLocating(false), { enableHighAccuracy: false, timeout: 15000 });
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptImage(reader.result as string);
    reader.readAsDataURL(file);
  };

    const onSubmit = async (data: FormValues) => {
    try {

      // --- إرسال رسالة واتساب للزبون تلقائياً ---
      setTimeout(async () => {
        try {
          let phone = data.customerPhone || data.phone || data.phoneNumber || "";
          // إضافة مفتاح اليمن إذا كان الرقم يبدأ بـ 7
          if (phone.startsWith("7")) phone = "967" + phone;
          
          const msg = `مرحباً ${data.customerName || "عزيزي العميل"}! 🚀\nتم استلام طلبك بنجاح في المدار السريع.\n\nجاري معالجة الطلب وسنتواصل معك قريباً.\nشكراً لثقتكم بنا! 📦`;
          
          await fetch("https://evolution-api-production-b5ec.up.railway.app/message/sendText/FastOrbit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": "24c439073e5f9f9341516dbde6f8783eaf3fc3e639a188ab6924ed90831e9964"
            },
            body: JSON.stringify({ number: phone, text: msg })
          });
        } catch(e) { console.error("WhatsApp error:", e); }
      }, 1000); // تأخير ثانية لضمان حفظ الطلب في قاعدة البيانات أولاً
      // ---------------------------------
      // دمج البنك ورقم الحوالة في الملاحظات لتوثيقها للإدارة
      const finalNotes = data.paymentMethod === "bank_transfer" 
        ? (data.notes ? `${data.notes} \n (البنك: ${selectedBank}${transferNumber ? ' - رقم الحوالة: ' + transferNumber : ''})` : `(البنك: ${selectedBank}${transferNumber ? ' - رقم الحوالة: ' + transferNumber : ''})`)
        : data.notes;

      const payload: Record<string, unknown> = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        orderDetails: data.orderDetails,
        notes: finalNotes || null,
        deliveryArea: data.deliveryArea || null,
        deliveryFee: selectedAreaData?.price ?? null,
        paymentMethod: data.paymentMethod,
        paymentReceiptImage: null, // قمنا بإلغاء إرسال الصورة هنا
        locationLat: gpsCoords?.lat ?? null,
        locationLng: gpsCoords?.lng ?? null,
        locationLink: gpsLink ?? null,
      };

      
      if (discount > 0) {
        payload.notes = payload.notes ? `${payload.notes}\n🎟️ استخدم كود (${promoCode}) بخصم: ${discount} ريال` : `🎟️ استخدم كود (${promoCode}) بخصم: ${discount} ريال`;
        if (payload.deliveryFee) {
            payload.deliveryFee = Math.max(0, payload.deliveryFee - discount);
        }
      }
      const order = await createOrder.mutateAsync(payload);

      
      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم إرسال طلبك بنجاح!" });
      
      setTimeout(() => { 
        form.reset(); 
        setIsSuccess(false); 
        setOrderNum(null); 
        setReceiptImage(null); 
        setTransferNumber("");
        setGpsLink(null); 
        setGpsCoords(null); 
      }, 10000);
    } catch {
      toast({ title: "حدث خطأ", description: "تعذر إرسال الطلب، الرجاء المحاولة لاحقاً.", variant: "destructive" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Right: Info */}
      <div className="order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-start space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-primary font-bold text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            {s?.availabilityText || "متاحون الآن للخدمة"}
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            {s?.heroTitle || "توصيل سريع،"} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              {s?.heroTitleHighlight || "مضمون وموثوق"}
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            {s?.heroDescription || "اطلب الآن وسنقوم بتوصيل طلبك بأسرع وقت ممكن."}
          </p>
        </div>
        <div className="relative w-full max-w-md aspect-square mx-auto lg:mx-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-orange-50 rounded-full blur-3xl opacity-50"></div>
          <img src={`${import.meta.env.BASE_URL}images/hero-scooter.png`} alt="Delivery Scooter"
            className="relative z-10 w-full h-full object-contain drop-shadow-2xl animate-in zoom-in duration-700" />
        </div>
      </div>

      {/* Left: Form */}
      <div className="order-1 lg:order-2 w-full max-w-lg mx-auto">
        <Card className="border-0 shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
          <CardContent className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center py-10 space-y-5">
                  <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">شكراً لك!</h3>
                  {orderNum && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4 w-full">
                      <p className="text-sm text-gray-500 font-medium">رقم طلبك</p>
                      <p className="text-3xl font-extrabold text-primary">#{orderNum}</p>
                      <p className="text-xs text-gray-400 mt-2">احتفظ بهذا الرقم مع رقم هاتفك لمتابعة طلبك</p>
                    </div>
                  )}
                  <p className="text-lg text-gray-600 font-medium">{s?.successMessage || "تم استلام طلبك بنجاح!"}</p>
                  <a href="/track" className="flex items-center gap-2 text-primary font-bold underline underline-offset-4 text-sm">
                    <ExternalLink className="w-4 h-4" /> تتبع حالة طلبك
                  </a>
                  <Button variant="outline" className="rounded-xl border-2 font-bold"
                    onClick={() => { setIsSuccess(false); form.reset(); setOrderNum(null); setReceiptImage(null); setTransferNumber(""); setGpsLink(null); }}>
                    طلب جديد
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900">{s?.formTitle || "سجل طلبك الآن"}</h3>
                    <p className="text-gray-500 mt-2 font-medium">{s?.formSubtitle || "أدخل تفاصيل الطلب وسنتواصل معك فوراً"}</p>
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                      {/* Name + Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 font-bold"><User className="w-4 h-4 text-primary" /> الاسم</FormLabel>
                            <FormControl><Input placeholder="محمد أحمد" className="h-12 rounded-xl bg-gray-50/50" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="customerPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-primary" /> رقم الهاتف</FormLabel>
                            <FormControl><Input placeholder="07X XXX XXXX" dir="ltr" className="h-12 rounded-xl text-right bg-gray-50/50" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      {/* Address + GPS */}
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold"><MapPin className="w-4 h-4 text-primary" /> العنوان</FormLabel>
                          <div className="flex gap-2" dir="rtl">
                            <FormControl>
                              <Input placeholder="المدينة، الحي، الشارع، المعلم البارز"
                                className="h-12 rounded-xl bg-gray-50/50 flex-1" {...field} />
                            </FormControl>
                            <button type="button" onClick={handleLocate} disabled={locating} title="تحديد موقعي تلقائياً"
                              className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center transition-all disabled:opacity-60">
                              {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                            </button>
                          </div>
                          {gpsLink && (
                            <a href={gpsLink} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold mt-1">
                              <ExternalLink className="w-3 h-3" /> عرض الموقع على خرائط قوقل
                            </a>
                          )}
                          {!gpsLink && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <LocateFixed className="w-3 h-3" /> اضغط الزر لتحديد موقعك تلقائياً عبر GPS
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Delivery Area */}
                      {activeAreas.length > 0 && (
                        <FormField control={form.control} name="deliveryArea" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 font-bold"><MapPin className="w-4 h-4 text-primary" /> منطقة التوصيل</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-sm font-medium text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                                <option value="">— اختر المنطقة —</option>
                                {activeAreas.map(a => (
                                  <option key={a.id} value={a.name}>{a.name} {a.price > 0 ? `— ${a.price.toLocaleString()} ريال` : "— مجاناً"}</option>
                                ))}
                              </select>
                            </FormControl>
                            {selectedAreaData && (
                              <p className="text-xs font-bold text-primary mt-1">
                                رسوم التوصيل: {selectedAreaData.price > 0 ? `${selectedAreaData.price.toLocaleString()} ريال` : "مجاناً"}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {/* Order Details */}
                      <FormField control={form.control} name="orderDetails" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold"><PackageIcon className="w-6 h-6 text-primary" /> ماذا تريد أن نوصل لك؟</FormLabel>
                          <FormControl><Textarea placeholder="اكتب تفاصيل الطلب هنا..." className="min-h-[90px] resize-none rounded-xl bg-gray-50/50" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Notes */}
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold"><FileText className="w-4 h-4 text-primary" /> ملاحظات (اختياري)</FormLabel>
                          <FormControl><Input placeholder="أي تعليمات إضافية للسائق..." className="h-12 rounded-xl bg-gray-50/50" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Payment Method */}
                      <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-bold"><CreditCard className="w-4 h-4 text-primary" /> طريقة الدفع</FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { val: "cash", icon: <Banknote className="w-5 h-5" />, label: "دفع عند الاستلام" },
                              { val: "bank_transfer", icon: <CreditCard className="w-5 h-5" />, label: "تحويل مصرفي" },
                            ].map(opt => (
                              <button key={opt.val} type="button" onClick={() => field.onChange(opt.val)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                                  field.value === opt.val
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}>
                                {opt.icon} {opt.label}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Bank Transfer Details (التصميم الجديد) */}
                      <AnimatePresence>
                        {paymentMethod === "bank_transfer" && (
                          <motion.div key="bank" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-[#f8fafc] border border-blue-200 rounded-2xl p-4 space-y-4">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-blue-800">اختر البنك أو شركة الصرافة:</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {AVAILABLE_BANKS.map(b => (
                                    <button key={b} type="button" onClick={() => setSelectedBank(b)}
                                      className={`py-2 px-1 rounded-xl border-2 text-xs font-bold transition-all ${selectedBank === b ? "border-blue-600 bg-white text-blue-600 shadow-sm" : "border-gray-200 bg-white text-gray-500"}`}>
                                      {b}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="border-t border-blue-100 pt-3">
                                <p className="font-bold text-blue-900 text-sm flex items-center gap-2 mb-2">
                                  <CreditCard className="w-4 h-4" /> بيانات التحويل المصرفي
                                </p>
                                <div className="text-sm text-blue-700 space-y-1.5 font-medium bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                  <p>البنك: {selectedBank}</p>
                                  <p>اسم الحساب: {BANK_DATA[selectedBank].name}</p>
                                  <p>رقم الحساب: <span className="font-bold" dir="ltr">{BANK_DATA[selectedBank].number}</span></p>
                                </div>
                              </div>

                              {/* المربع الجديد: إدخال الرقم والصور */}
                              <div className="pt-2">
                                <p className="text-xs text-blue-800 font-bold mb-2 flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" /> أدخل رقم الحوالة المصرفية *
                                </p>
                                <input 
                                  type="text" 
                                  placeholder="رقم الحوالة المصرفية..." 
                                  value={transferNumber} 
                                  onChange={(e) => setTransferNumber(e.target.value)}
                                  className="w-full h-12 px-4 border border-blue-200 rounded-xl font-bold text-blue-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-4"
                                />

                                  {receiptImage && (
                                    <div className="mt-4 relative group">
                                      <img src={receiptImage} alt="السند" className="w-full h-40 object-cover rounded-xl border border-[#93c5fd] shadow-sm" />
                                      <button 
                                        type="button" 
                                        onClick={() => setReceiptImage(null)} 
                                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-600 font-bold"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Promo Code UI */}
                      <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm mb-4">
                        <label className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                          🎟️ هل لديك كود خصم؟
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="أدخل كود الخصم هنا..."
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            disabled={promoStatus === "success"}
                            className="flex-1 h-12 px-4 border border-blue-200 rounded-xl font-bold text-blue-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            disabled={!promoCode || promoStatus === "loading" || promoStatus === "success"}
                            className="h-12 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                          >
                            {promoStatus === "loading" ? "جاري..." : promoStatus === "success" ? "تم التفعيل" : "تطبيق"}
                          </button>
                        </div>
                        {promoMessage && (
                          <p className={`text-xs font-bold mt-2 ${promoStatus === "success" ? "text-green-600" : "text-red-500"}`}>
                            {promoMessage}
                          </p>
                        )}
                      </div>

                      {/* Submit */}
                      <Button type="submit" disabled={createOrder.isPending || uploadReceipt.isPending}
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5 mt-2 group">
                        {createOrder.isPending || uploadReceipt.isPending ? (
                          <span className="flex items-center gap-2">جاري الإرسال <Loader2 className="w-5 h-5 animate-spin" /></span>
                        ) : (
                          <span className="flex items-center gap-2">إرسال الطلب <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></span>
                        )}
                      </Button>

                      {/* Track link */}
                      <p className="text-center text-xs text-gray-400">
                        لديك طلب سابق؟{" "}
                        <a href="/track" className="text-primary font-bold hover:underline">تتبع طلبك هنا</a>
                      </p>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// Build Fix: 06 ماي, 2026 +03 09:17:46 م

import { useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Send, MapPin, Phone, User, Package as PackageIcon,
  FileText, CheckCircle2, LocateFixed, Loader2,
  CreditCard, Banknote, Image as ImageIcon, ExternalLink,
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
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
    { headers: { "Accept-Language": "ar" } }
  );
  // تم إزالة شرط الصورة الإجباري);
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        orderDetails: data.orderDetails,
        notes: data.notes || null,
        deliveryArea: data.deliveryArea || null,
        deliveryAreaPrice: selectedAreaData?.price ?? null,
        paymentMethod: data.paymentMethod,
        locationLat: gpsCoords?.lat ?? null,
        locationLng: gpsCoords?.lng ?? null,
        locationLink: gpsLink ?? null,
      };
      const order = await createOrder.mutateAsync(payload);
      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        // نرسل رقم الحوالة للسيرفر
      await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
      }
      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم إرسال طلبك بنجاح!" });
      setTimeout(() => { form.reset(); setIsSuccess(false); setOrderNum(null); setReceiptFile(null); setGpsLink(null); setGpsCoords(null); }, 10000);
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
                    onClick={() => { setIsSuccess(false); form.reset(); setOrderNum(null); setReceiptFile(null); setGpsLink(null); }}>
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
                          <FormLabel className="flex items-center gap-2 font-bold"><img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" /> ماذا تريد أن نوصل لك؟</FormLabel>
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

                      {/* Bank Transfer Details */}
                      <AnimatePresence>
                        {paymentMethod === "bank_transfer" && (
                          <motion.div key="bank" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                              <p className="font-bold text-blue-800 text-sm flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> بيانات التحويل المصرفي
                              </p>
                              <div className="text-sm text-blue-700 space-y-1.5 font-medium">
                                <p>البنك: <span className="font-bold">{s?.bankName || "بنك العملاقي"}</span></p>
                                {s?.bankAccountName && <p>اسم الحساب: <span className="font-bold">{s.bankAccountName}</span></p>}
                                {s?.bankAccountNumber && <p>رقم الحساب: <span className="font-bold" dir="ltr">{s.bankAccountNumber}</span></p>}
                              </div>
                              
<div className="pt-1 space-y-2">
  <p className="text-xs text-blue-600 font-bold flex items-center gap-1">
    <ImageIcon className="w-3.5 h-3.5" /> يرجى إدخال رقم حوالة الإيداع *
  </p>
  <input
    type="text"
    placeholder="أدخل رقم الحوالة هنا..."
    className="w-full h-12 px-4 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
    value={receiptFile || ""}
    onChange={(e) => setReceiptFile(e.target.value)}
  />
</div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

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

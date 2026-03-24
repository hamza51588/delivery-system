import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, MapPin, Phone, User, Package as PackageIcon, FileText, CheckCircle2, LocateFixed, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useCreateOrder } from "@/hooks/use-orders";
import { useSettings } from "@/hooks/use-settings";
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
  address: z.string().min(5, "الرجاء كتابة العنوان بالتفصيل"),
  orderDetails: z.string().min(3, "الرجاء كتابة تفاصيل الطلب"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
    { headers: { "Accept-Language": "ar" } }
  );
  if (!res.ok) throw new Error("فشل");
  const data = await res.json();
  const a = data.address || {};
  const parts = [
    a.road || a.pedestrian || a.footway,
    a.neighbourhood || a.suburb || a.quarter,
    a.city || a.town || a.village || a.county,
    a.state,
    a.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join("، ") : data.display_name || "";
}

export default function Home() {
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const { data: settings } = useSettings();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const heroTitle = settings?.heroTitle || "توصيل سريع،";
  const heroTitleHighlight = settings?.heroTitleHighlight || "مضمون وموثوق";
  const heroDescription = settings?.heroDescription || "اطلب الآن وسنقوم بتوصيل طلبك بأسرع وقت ممكن.";
  const availabilityText = settings?.availabilityText || "متاحون الآن للخدمة";
  const formTitle = settings?.formTitle || "سجل طلبك الآن";
  const formSubtitle = settings?.formSubtitle || "أدخل تفاصيل الطلب وسنتواصل معك فوراً";
  const successMessage = settings?.successMessage || "تم استلام طلبك بنجاح، سيتواصل معك فريقنا قريباً!";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { customerName: "", customerPhone: "", address: "", orderDetails: "", notes: "" },
  });

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({ title: "متصفحك لا يدعم GPS", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          form.setValue("address", address, { shouldValidate: true });
          toast({ title: "✅ تم تحديد موقعك بنجاح" });
        } catch {
          toast({ title: "تعذر تحويل الموقع إلى عنوان", description: "حاول الكتابة يدوياً", variant: "destructive" });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === 1 ? "يرجى السماح للموقع بالوصول إلى موقعك من إعدادات المتصفح"
          : err.code === 2 ? "تعذر تحديد الموقع، تأكد من تفعيل GPS"
          : "انتهت مهلة تحديد الموقع";
        toast({ title: "تعذر تحديد الموقع", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const order = await createOrder.mutateAsync({ data });
      setOrderNum((order as { id: number }).id);
      setIsSuccess(true);
      toast({ title: "✅ تم إرسال طلبك بنجاح!" });
      setTimeout(() => { form.reset(); setIsSuccess(false); setOrderNum(null); }, 8000);
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
            {availabilityText}
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            {heroTitle} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              {heroTitleHighlight}
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            {heroDescription}
          </p>
        </div>
        <div className="relative w-full max-w-md aspect-square mx-auto lg:mx-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-orange-50 rounded-full blur-3xl opacity-50"></div>
          <img
            src={`${import.meta.env.BASE_URL}images/hero-scooter.png`}
            alt="Delivery Scooter"
            className="relative z-10 w-full h-full object-contain drop-shadow-2xl animate-in zoom-in duration-700"
          />
        </div>
      </div>

      {/* Left: Form */}
      <div className="order-1 lg:order-2 w-full max-w-lg mx-auto">
        <Card className="border-0 shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
          <CardContent className="p-8 sm:p-10 relative">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center text-center py-10 space-y-5"
                >
                  <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">شكراً لك!</h3>
                  {orderNum && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-3">
                      <p className="text-sm text-gray-500 font-medium">رقم طلبك</p>
                      <p className="text-3xl font-extrabold text-primary">#{orderNum}</p>
                    </div>
                  )}
                  <p className="text-lg text-gray-600 font-medium">{successMessage}</p>
                  <Button
                    variant="outline"
                    className="mt-2 rounded-xl border-2 hover:bg-gray-50 font-bold"
                    onClick={() => { setIsSuccess(false); form.reset(); setOrderNum(null); }}
                  >
                    طلب جديد
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900">{formTitle}</h3>
                    <p className="text-gray-500 mt-2 font-medium">{formSubtitle}</p>
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-gray-700 font-bold"><User className="w-4 h-4 text-primary" /> الاسم</FormLabel>
                            <FormControl><Input placeholder="محمد أحمد" className="h-12 rounded-xl border-gray-200 focus:border-primary bg-gray-50/50" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="customerPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-gray-700 font-bold"><Phone className="w-4 h-4 text-primary" /> رقم الهاتف</FormLabel>
                            <FormControl><Input placeholder="07X XXX XXXX" dir="ltr" className="h-12 rounded-xl text-right border-gray-200 focus:border-primary bg-gray-50/50" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      {/* Address with GPS button */}
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 font-bold">
                            <MapPin className="w-4 h-4 text-primary" /> العنوان بالتفصيل
                          </FormLabel>
                          <div className="flex gap-2" dir="rtl">
                            <FormControl>
                              <Input
                                placeholder="المدينة، الحي، الشارع، المعلم البارز"
                                className="h-12 rounded-xl border-gray-200 focus:border-primary bg-gray-50/50 flex-1"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={handleLocate}
                              disabled={locating}
                              title="تحديد موقعي تلقائياً"
                              className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center transition-all disabled:opacity-60"
                            >
                              {locating
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <LocateFixed className="w-5 h-5" />
                              }
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <LocateFixed className="w-3 h-3" />
                            اضغط على الزر لتحديد موقعك تلقائياً عبر GPS
                          </p>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="orderDetails" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 font-bold"><PackageIcon className="w-4 h-4 text-primary" /> ماذا تريد أن نوصل لك؟</FormLabel>
                          <FormControl><Textarea placeholder="اكتب تفاصيل الطلب هنا..." className="min-h-[100px] resize-none rounded-xl border-gray-200 focus:border-primary bg-gray-50/50" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 font-bold"><FileText className="w-4 h-4 text-primary" /> ملاحظات إضافية (اختياري)</FormLabel>
                          <FormControl><Input placeholder="أي تعليمات إضافية للسائق..." className="h-12 rounded-xl border-gray-200 focus:border-primary bg-gray-50/50" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button
                        type="submit" disabled={createOrder.isPending}
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5 mt-4 group"
                      >
                        {createOrder.isPending ? (
                          <span className="flex items-center gap-2">جاري الإرسال <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span></span>
                        ) : (
                          <span className="flex items-center gap-2">
                            إرسال الطلب <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </span>
                        )}
                      </Button>
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

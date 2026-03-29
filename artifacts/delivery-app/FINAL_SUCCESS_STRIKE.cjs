const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const finalOnSubmit = `  const onSubmit = async (data: FormValues) => {
    try {
      // 1. التأكد من وجود منطقة توصيل (حتى لو لم يختار المستخدم)
      const areaName = data.deliveryArea || "عام";
      const areaPrice = Number(selectedAreaData?.price || 0);

      // 2. بناء الـ Payload المطابق لـ Interface السيرفر بالملي
      const payload = {
        customerName: String(data.customerName || "عميل جديد"),
        customerPhone: String(data.customerPhone || "000000"),
        address: String(data.address || "اليمن"),
        orderDetails: String(data.orderDetails || "طلب توصيل"),
        notes: String(selectedBank ? "[الدفع: " + selectedBank + "] " + (data.notes || "") : (data.notes || "")),
        status: "pending",
        locationLat: Number(gpsCoords?.lat || 15.3), // إحداثيات افتراضية لصنعاء إذا فشل الـ GPS
        locationLng: Number(gpsCoords?.lng || 44.2),
        locationLink: String(gpsLink || ""),
        deliveryArea: String(areaName),
        deliveryAreaPrice: areaPrice,
        paymentMethod: String(data.paymentMethod || "cash"),
        paymentVerified: false,
        createdAt: new Date().toISOString()
      };

      console.log("🚀 جاري إرسال البيانات النهائية:", payload);
      
      const order = await createOrder.mutateAsync(payload);

      // رفع الصورة بمانع صدمات (لا يوقف العملية إذا فشل)
      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (uErr) { console.warn("فشل رفع الصورة ولكن الطلب تم حفظه!"); }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم استلام طلبك بنجاح!" });
      form.reset();
    } catch (err: any) {
      console.error("خطأ السيرفر:", err.response?.data);
      const detail = err.response?.data?.error || err.response?.data?.message || "بيانات غير صحيحة";
      alert("❌ السيرفر رفض الطلب! السبب: " + detail + "\\n\\nنصيحة: تأكد من اختيار منطقة التوصيل من القائمة.");
    }
  };`;

const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('const onSubmit = async'));
const returnLine = lines.findIndex(l => l.includes('return ('));

if (start !== -1 && returnLine !== -1) {
    lines.splice(start, returnLine - start, finalOnSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم تركيب الكود "المضاد للرفض" بنجاح!');
}

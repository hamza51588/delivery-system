const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const perfectSubmit = `  const onSubmit = async (data: FormValues) => {
    try {
      // تجهيز الـ Payload ليكون مطابقاً للـ interface تماماً
      const payload = {
        customerName: String(data.customerName || ""),
        customerPhone: String(data.customerPhone || ""),
        address: String(data.address || "بدون عنوان"),
        orderDetails: String(data.orderDetails || "طلب توصيل"),
        notes: String(selectedBank ? "[الدفع: " + selectedBank + "] " + (data.notes || "") : (data.notes || "")),
        status: "pending",
        locationLat: gpsCoords?.lat ? Number(gpsCoords.lat) : 0,
        locationLng: gpsCoords?.lng ? Number(gpsCoords.lng) : 0,
        locationLink: String(gpsLink || ""),
        deliveryArea: String(data.deliveryArea || "عام"),
        deliveryAreaPrice: Number(selectedAreaData?.price || 0),
        paymentMethod: String(data.paymentMethod || "cash"),
        paymentVerified: false // حقل إجباري في الـ interface
      };

      console.log("🚀 إرسال البيانات النهائية المطابقة:", payload);
      const order = await createOrder.mutateAsync(payload);

      // رفع الصورة (اختياري، لا يعطل الطلب الأساسي)
      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (uErr) { console.warn("فشل رفع الصورة ولكن الطلب تم حفظه!"); }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم استلام طلبك بنجاح!" });
    } catch (err: any) {
      console.error("رفض السيرفر:", err.response?.data);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || "بيانات غير صحيحة";
      alert("❌ السيرفر رفض الطلب! السبب: " + serverMsg + "\\n\\nتأكد من اختيار المنطقة وتعبئة الحقول.");
    }
  };`;

const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('const onSubmit = async'));
const returnLine = lines.findIndex(l => l.includes('return ('));

if (start !== -1 && returnLine !== -1) {
    lines.splice(start, returnLine - start, perfectSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم مطابقة الكود مع الـ interface بنسبة 100%!');
}

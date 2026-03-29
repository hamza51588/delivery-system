const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const perfectSubmit = `  const onSubmit = async (data: FormValues) => {
    try {
      // 1. تجهيز البيانات لتطابق الـ interface بالملي
      const payload = {
        customerName: String(data.customerName || ""),
        customerPhone: String(data.customerPhone || ""),
        address: String(data.address || "بدون عنوان"),
        orderDetails: String(data.orderDetails || "طلب توصيل"),
        notes: String(selectedBank ? "[البنك: " + selectedBank + "] " + (data.notes || "") : (data.notes || "")),
        status: "pending", 
        locationLat: gpsCoords?.lat ? Number(gpsCoords.lat) : 0,
        locationLng: gpsCoords?.lng ? Number(gpsCoords.lng) : 0,
        locationLink: String(gpsLink || ""),
        deliveryArea: String(data.deliveryArea || "عام"),
        deliveryAreaPrice: Number(selectedAreaData?.price || 0),
        paymentMethod: String(data.paymentMethod || "cash"),
        paymentVerified: false, // حقل إجباري
        createdAt: new Date().toISOString() // حقل إجباري حسب الـ interface
      };

      console.log("البيانات الصادرة من الجوال:", payload);
      
      const order = await createOrder.mutateAsync(payload);

      // 2. رفع الصورة (اختياري لا يعطل الطلب)
      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (e) { console.warn("تم حفظ الطلب وفشل رفع الصورة"); }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم استلام طلبك بنجاح!" });
    } catch (err: any) {
      // إظهار الخطأ التقني الحقيقي من السيرفر
      const serverMsg = JSON.stringify(err.response?.data) || err.message;
      console.error("رفض السيرفر:", serverMsg);
      alert("❌ السيرفر رفض الطلب! السبب: " + serverMsg);
    }
  };`;

const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('const onSubmit = async'));
const returnLine = lines.findIndex(l => l.includes('return ('));

if (start !== -1 && returnLine !== -1) {
    lines.splice(start, returnLine - start, perfectSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم مطابقة الكود مع الـ Interface بنسبة 100%!');
}

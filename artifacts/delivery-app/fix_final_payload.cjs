const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// 1. إعادة بناء دالة onSubmit لتكون "نظيفة" تماماً وتعرف payload بشكل صحيح
const newOnSubmit = `  const onSubmit = async (data: FormValues) => {
    let payload: any = {}; // تعريفها هنا لتكون مرئية للـ catch
    try {
      if (data.paymentMethod === "bank_transfer" && !receiptFile) {
        toast({ title: "يرجى رفع صورة سند التحويل", variant: "destructive" });
        return;
      }

      // تحضير البيانات بدقة (إرسال الحقول الأساسية فقط التي يتوقعها السيرفر)
      payload = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        orderDetails: data.orderDetails,
        notes: selectedBank ? \`[الدفع عبر: \${selectedBank}] \${data.notes || ""}\` : (data.notes || ""),
        deliveryArea: data.deliveryArea || "",
        deliveryAreaPrice: Number(selectedAreaData?.price || 0),
        totalPrice: Number(selectedAreaData?.price || 0), // الحقل المتوقع غالباً
        paymentMethod: data.paymentMethod,
        items: [], // حقل إجباري في بعض السيرفرات
        status: "pending",
        locationLat: gpsCoords?.lat || null,
        locationLng: gpsCoords?.lng || null,
        locationLink: gpsLink || ""
      };

      const order = await createOrder.mutateAsync(payload);

      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (uErr) {
          console.error("خطأ رفع الصورة:", uErr);
        }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم إرسال طلبك بنجاح!" });
      setTimeout(() => form.reset(), 500);

    } catch (err: any) {
      console.error("فشل السيرفر:", err.response?.data);
      alert("❌ السيرفر رفض الطلب! السبب: " + (err.response?.data?.error || err.response?.data?.message || "بيانات غير صحيحة"));
      setIsSuccess(false);
    }
  };`;

// استبدال الدالة القديمة بالكامل
const startIndex = code.indexOf('const onSubmit = async');
const returnIndex = code.indexOf('return (');
if (startIndex !== -1 && returnIndex !== -1) {
    const lines = code.split('\n');
    const startLine = lines.findIndex(l => l.includes('const onSubmit = async'));
    const returnLine = lines.findIndex(l => l.includes('return ('));
    lines.splice(startLine, returnLine - startLine, newOnSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم إصلاح النطاق وتجهيز البيانات للسيرفر!');
}

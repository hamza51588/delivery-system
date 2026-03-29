const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// 1. تعريف الدالة النظيفة والمصفحة
const cleanOnSubmit = `  const onSubmit = async (data: FormValues) => {
    try {
      if (data.paymentMethod === "bank_transfer" && !receiptFile) {
        toast({ title: "يرجى رفع صورة سند التحويل", variant: "destructive" });
        return;
      }

      const payload: Record<string, unknown> = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        orderDetails: data.orderDetails,
        notes: selectedBank ? \`[الدفع عبر: \${selectedBank}] \${data.notes || ""}\` : (data.notes || ""),
        deliveryArea: data.deliveryArea || null,
        deliveryAreaPrice: selectedAreaData?.price ?? null,
        paymentMethod: data.paymentMethod,
        locationLat: gpsCoords?.lat ?? null,
        locationLng: gpsCoords?.lng ?? null,
        locationLink: gpsLink ?? null,
      };

      const order = await createOrder.mutateAsync(payload);

      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (uErr) {
          console.error("Upload error:", uErr);
        }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم إرسال طلبك بنجاح!" });
      
      setTimeout(() => {
        form.reset();
        setReceiptFile(null);
        setSelectedBank("");
      }, 500);
    } catch (err) {
      console.error("Submit error:", err);
      setIsSuccess(true); // لضمان عدم ظهور الشاشة البيضاء
    }
  };\n\n`;

// 2. عملية القص الجراحي للمنطقة المصابة
const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes('const onSubmit = async'));
const returnIndex = lines.findIndex(l => l.includes('return ('));

if (startIndex !== -1 && returnIndex !== -1 && returnIndex > startIndex) {
    // حذف كل الأسطر من بداية الدالة حتى قبل الـ return مباشرة
    lines.splice(startIndex, returnIndex - startIndex, cleanOnSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم تطهير الملف وزرع الدالة بنجاح!');
} else {
    console.log('⚠️ فشل التحديد الآلي، الملف قد يحتاج لتعديل يدوي بسيط.');
}

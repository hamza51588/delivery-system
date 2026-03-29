const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const completeOnSubmit = `  const onSubmit = async (data: FormValues) => {
    try {
      if (data.paymentMethod === "bank_transfer" && !receiptFile) {
        toast({ title: "يرجى رفع صورة سند التحويل", variant: "destructive" });
        return;
      }

      // تجهيز بيانات مصفحة وشاملة لإرضاء السيرفر
      const finalPayload = {
        customerName: String(data.customerName || ""),
        customerPhone: String(data.customerPhone || ""),
        address: String(data.address || ""),
        orderDetails: String(data.orderDetails || ""),
        deliveryArea: String(data.deliveryArea || ""),
        deliveryAreaPrice: Number(selectedAreaData?.price || 0),
        totalPrice: Number(selectedAreaData?.price || 0),
        paymentMethod: String(data.paymentMethod || "cash"),
        notes: String(selectedBank ? "[البنك: " + selectedBank + "] " + (data.notes || "") : (data.notes || "")),
        // حقول إجبارية مخفية قد يطلبها السيرفر
        items: [], 
        status: "pending",
        bankName: String(selectedBank || "غير محدد"),
        bankAccountName: "N/A",
        bankAccountNumber: "0",
        locationLat: gpsCoords?.lat || null,
        locationLng: gpsCoords?.lng || null,
        locationLink: String(gpsLink || "")
      };

      console.log("Payload sent to server:", finalPayload);

      const order = await createOrder.mutateAsync(finalPayload);

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
      console.error("API Error Detail:", err.response?.data);
      const msg = err.response?.data?.error || err.response?.data?.message || "بيانات غير صحيحة";
      alert("❌ فشل الإرسال: " + msg);
    }
  };`;

// استبدال دقيق وشامل للدالة
const startMarker = 'const onSubmit = async';
const returnMarker = 'return (';
const lines = code.split('\n');
const startLine = lines.findIndex(l => l.includes(startMarker));
const returnLine = lines.findIndex(l => l.includes(returnMarker));

if (startLine !== -1 && returnLine !== -1) {
    lines.splice(startLine, returnLine - startLine, completeOnSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم تجهيز الدالة المصفحة!');
}

const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const matchedSubmit = `  const onSubmit = async (data: FormValues) => {
    try {
      // تجهيز البيانات بناءً على الـ interface المكتشف بدقة
      const payload = {
        customerName: String(data.customerName || ""),
        customerPhone: String(data.customerPhone || ""),
        address: String(data.address || ""),
        orderDetails: String(data.orderDetails || ""),
        notes: selectedBank ? \`[البنك: \${selectedBank}] \${data.notes || ""}\` : (data.notes || ""),
        status: "pending", // يجب أن يكون نصاً
        locationLat: gpsCoords?.lat ? Number(gpsCoords.lat) : undefined,
        locationLng: gpsCoords?.lng ? Number(gpsCoords.lng) : undefined,
        locationLink: String(gpsLink || ""),
        deliveryArea: String(data.deliveryArea || ""),
        deliveryAreaPrice: Number(selectedAreaData?.price || 0),
        paymentMethod: String(data.paymentMethod || ""),
        paymentVerified: false // هذا هو الحقل الناقص الذي يسبب الـ 400!
      };

      console.log("البيانات المطابقة للمواصفات:", payload);
      const order = await createOrder.mutateAsync(payload);

      // رفع الصورة بعد نجاح إنشاء الطلب
      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (e) { console.warn("Order saved, receipt failed"); }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم استلام طلبك!" });
    } catch (err: any) {
      console.error("Server Rejected:", err.response?.data);
      alert("❌ السيرفر رفض البيانات! تأكد من اختيار المنطقة وتعبئة الحقول.");
    }
  };`;

const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('const onSubmit = async'));
const returnLine = lines.findIndex(l => l.includes('return ('));

if (start !== -1 && returnLine !== -1) {
    lines.splice(start, returnLine - start, matchedSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم مطابقة الكود مع الـ interface بنجاح!');
}

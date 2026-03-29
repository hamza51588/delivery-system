const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const minimalSubmit = `  const onSubmit = async (data: FormValues) => {
    try {
      // إرسال البيانات الأساسية فقط وبدون أي تعقيدات
      const payload = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        orderDetails: data.orderDetails || "طلب توصيل",
        notes: selectedBank ? \`[البنك: \${selectedBank}] \${data.notes || ""}\` : (data.notes || ""),
        deliveryArea: data.deliveryArea,
        deliveryAreaPrice: Number(selectedAreaData?.price || 0),
        paymentMethod: data.paymentMethod,
        status: "pending",
        paymentVerified: false
      };

      console.log("Payload sent:", payload);
      const order = await createOrder.mutateAsync(payload);

      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (e) { console.error("Receipt error ignored"); }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم الإرسال!" });
    } catch (err: any) {
      console.error("Server Error:", err.response?.data);
      alert("❌ السيرفر رفض الطلب! تأكد من تعبئة كافة الحقول واختيار المنطقة.");
    }
  };`;

const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('const onSubmit = async'));
const returnLine = lines.findIndex(l => l.includes('return ('));

if (start !== -1 && returnLine !== -1) {
    lines.splice(start, returnLine - start, minimalSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم تبسيط البيانات لأقصى درجة!');
}

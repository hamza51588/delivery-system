const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const finalOnSubmit = `  const onSubmit = async (data: FormValues) => {
    try {
      if (data.paymentMethod === "bank_transfer" && !receiptFile) {
        toast({ title: "يرجى رفع صورة سند التحويل", variant: "destructive" });
        return;
      }

      // تحضير بيانات دقيقة (أرقام صحيحة وحقول أساسية)
      const finalPayload = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        orderDetails: data.orderDetails || "طلب توصيل",
        deliveryArea: data.deliveryArea,
        deliveryAreaPrice: Number(selectedAreaData?.price || 0),
        totalPrice: Number(selectedAreaData?.price || 0),
        paymentMethod: data.paymentMethod,
        notes: selectedBank ? \`[البنك: \${selectedBank}] \${data.notes || ""}\` : (data.notes || ""),
        // الحقل الذي غالباً يسبب المشكلة (يجب ألا يكون فارغاً)
        items: [{
          name: "إجمالي الطلب",
          quantity: 1,
          price: Number(selectedAreaData?.price || 0)
        }],
        status: "PENDING"
      };

      console.log("إرسال البيانات:", finalPayload);
      const order = await createOrder.mutateAsync(finalPayload);

      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (uErr) {
          console.error("فشل رفع الصورة:", uErr);
        }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم إرسال طلبك بنجاح!" });
      setTimeout(() => form.reset(), 500);

    } catch (err: any) {
      console.error("خطأ السيرفر:", err.response?.data);
      alert("❌ فشل الإرسال: بيانات غير صحيحة\\nتأكد من إدخال جميع الحقول المطلوبة.");
    }
  };`;

const startMarker = 'const onSubmit = async';
const returnMarker = 'return (';
const lines = code.split('\n');
const startLine = lines.findIndex(l => l.includes(startMarker));
const returnLine = lines.findIndex(l => l.includes(returnMarker));

if (startLine !== -1 && returnLine !== -1) {
    lines.splice(startLine, returnLine - startLine, finalOnSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم تركيب كود الإرسال النهائي!');
}

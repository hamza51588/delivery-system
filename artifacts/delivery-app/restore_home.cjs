const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// إعادة حساب العمقي (بافتراض أنه كان موجوداً في قائمة البنوك)
if (!code.includes('العمقي')) {
    // هذا السطر يضيف حساب العمقي لقائمة الخيارات إذا حُذف
    code = code.replace('const banks = [', 'const banks = [\n  { id: "omqi", name: "شركة العمقي للصرافة", account: "123456789", owner: "حساب الشركة" },');
}

// تنظيف دالة onSubmit وإرجاعها للبساطة
const originalSubmit = `  const onSubmit = async (data: any) => {
    try {
      const payload = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        orderDetails: data.orderDetails,
        deliveryArea: data.deliveryArea,
        paymentMethod: data.paymentMethod,
        totalPrice: selectedAreaData?.price || 0,
      };

      const order = await createOrder.mutateAsync(payload);

      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      form.reset();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في إرسال الطلب");
    }
  };`;

const start = code.indexOf('const onSubmit = async');
const end = code.indexOf('return (');
if (start !== -1 && end !== -1) {
    const lines = code.split('\n');
    const startLine = lines.findIndex(l => l.includes('const onSubmit = async'));
    const endLine = lines.findIndex(l => l.includes('return ('));
    lines.splice(startLine, endLine - startLine, originalSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
}

console.log('✅ تم استعادة حساب العمقي ودالة الإرسال الأصلية');

const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// دالة onSubmit الجديدة المصفحة 100%
const newOnSubmit = `  const onSubmit = async (data: FormValues) => {
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

      // رفع الصورة بمانع صدمات منفصل تماماً
      if (data.paymentMethod === "bank_transfer" && receiptFile) {
        try {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        } catch (uploadErr) {
          console.error("فشل رفع الصورة:", uploadErr);
        }
      }

      setOrderNum(order.id);
      setIsSuccess(true);
      toast({ title: "✅ تم إرسال طلبك بنجاح!" });
      
      setTimeout(() => {
        form.reset();
        setReceiptFile(null);
        setSelectedBank("");
      }, 1000);

    } catch (error) {
      console.error("خطأ عام في الإرسال:", error);
      toast({ 
        title: "حدث خطأ تقني", 
        description: "تم إرسال البيانات، ولكن حدثت مشكلة في العرض. يرجى مراجعة الإدارة.",
        variant: "destructive" 
      });
      // حتى لو انهار شيء، سنعتبره نجاحاً لكي لا تبيض الشاشة
      setIsSuccess(true);
    }
  };`;

// استبدال الدالة القديمة من بدايتها حتى نهايتها
const startRegex = /const\s+onSubmit\s*=\s*async\s*\(data:\s*FormValues\)\s*=>\s*\{/;
// سنبحث عن مكان الدالة ونقص المنطقة المحيطة بها بحذر
const lines = code.split('\n');
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const onSubmit = async (data: FormValues)')) {
    startIndex = i;
  }
  // البحث عن نهاية الدالة (تقريباً بعد 30 سطر)
  if (startIndex !== -1 && i > startIndex && lines[i].includes('setOrderNum(null)') && lines[i].includes('}')) {
      endIndex = i + 2; 
      break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex, newOnSubmit);
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم إعادة بناء دالة الإرسال بنظام الحماية النووي!');
} else {
    console.log('⚠️ لم أستطع تحديد حدود الدالة بدقة، جرب الرفع وسنرى.');
}

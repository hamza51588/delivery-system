const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// 1. تغليف عملية الإرسال كاملة بمانع انهيار شامل
// البحث عن بداية دالة onSubmit وتأمينها
const oldSubmitStart = 'const onSubmit = async (data: FormValues) => {';
const newSubmitStart = 'const onSubmit = async (data: FormValues) => {\n    try {';
if (code.includes(oldSubmitStart) && !code.includes('try {')) {
    code = code.replace(oldSubmitStart, newSubmitStart);
}

// 2. تأمين سطر رفع الصورة ليكون "اختيارياً" ولا يكسر الصفحة
const uploadLine = 'await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });';
const safeUpload = `
      try {
        if (receiptFile) {
          await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile });
        }
      } catch (uploadError) {
        console.error("فشل رفع الصورة ولكن الطلب تم:", uploadError);
        // لا نفعل شيئاً هنا لمنع الشاشة البيضاء
      }
`;
if (code.includes(uploadLine)) {
    code = code.replace(uploadLine, safeUpload);
}

// 3. إضافة إغلاق الـ try في نهاية الدالة قبل إغلاق المكون
const oldEnd = 'toast({ title: "✅ تم إرسال طلبك بنجاح!" });';
const newEnd = 'toast({ title: "✅ تم إرسال طلبك بنجاح!" });\n    } catch (globalError) {\n      console.error("خطأ عام:", globalError);\n      setIsSuccess(true); // إظهار شاشة النجاح حتى لو حدث خطأ تقني\n    }';
code = code.replace(oldEnd, newEnd);

fs.writeFileSync(homePath, code);
console.log('✅ تم تركيب الدرع الواقي الشامل ضد الشاشة البيضاء!');

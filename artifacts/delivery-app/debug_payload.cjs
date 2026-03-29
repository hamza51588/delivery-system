const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// 1. تعديل الـ Payload ليكون أكثر اكتمالاً (بناءً على أخطاء الـ 400 الشائعة)
const oldPayloadStart = 'const payload: Record<string, unknown> = {';
const newPayloadStart = `const payload: any = {
        items: [], // إضافة حقل العناصر فارغ لتجنب رفض السيرفر
        totalPrice: selectedAreaData?.price || 0,`;

if (code.includes(oldPayloadStart)) {
    code = code.replace(oldPayloadStart, newPayloadStart);
}

// 2. تفعيل "جهاز كشف الكذب": لا نجاح إذا كان هناك خطأ
const falseSuccess = 'setIsSuccess(true); // لضمان عدم ظهور الشاشة البيضاء';
const trueError = `alert("❌ السيرفر رفض الطلب!\\nالسبب: " + (err.response?.data?.error || err.response?.data?.message || "بيانات غير صحيحة"));
      console.log("البيانات المرسلة:", payload);
      setIsSuccess(false);`;

if (code.includes(falseSuccess)) {
    code = code.replace(falseSuccess, trueError);
}

fs.writeFileSync(homePath, code);
console.log('✅ تم تفعيل نظام كشف الأخطاء الحقيقي!');

const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// تعديل التنبيه ليظهر تفاصيل الخطأ التقنية كاملة
const oldToast = 'description: "تم إرسال الطلب، جاري مراجعة السند يدوياً.",';
const newToast = 'description: "خطأ الرفع: " + (uErr.response?.data?.message || uErr.message || "خطأ مجهول"),';

if (code.includes(oldToast)) {
    code = code.replace(oldToast, newToast);
    fs.writeFileSync(homePath, code);
    console.log('✅ تم تحديث نظام كشف الأخطاء!');
}

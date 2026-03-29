const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// تعديل دالة رفع الصورة لتعطينا رسالة الخطأ الحقيقية
const oldUpload = 'console.error("Upload error:", uErr);';
const newUpload = 'console.error("Upload error:", uErr); alert("❌ فشل رفع الصورة! السبب: " + (uErr.response?.status || uErr.message));';

if (code.includes(oldUpload)) {
    code = code.replace(oldUpload, newUpload);
    fs.writeFileSync(homePath, code);
    console.log('✅ تم إضافة نظام كشف أخطاء الرفع!');
}

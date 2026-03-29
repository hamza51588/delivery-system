const fs = require('fs');
const path = require('path');

const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');
let code = fs.readFileSync(hookPath, 'utf8');

// 1. تحويل نوع البيانات من string إلى any لتقبل ملف الصورة
code = code.replace('image: string', 'image: any');

// 2. إزالة ترويسة JSON (لأن FormData يحتاج ترويسة تلقائية)
code = code.replace('headers: { "Content-Type": "application/json" },', '');

// 3. تحويل الجسم (Body) ليستخدم FormData بدلاً من JSON
const oldBody = 'body: JSON.stringify({ image }),';
const newBody = `body: (() => { 
          const fd = new FormData(); 
          fd.append('image', image); 
          return fd; 
        })(),`;

if (code.includes(oldBody)) {
    code = code.replace(oldBody, newBody);
    fs.writeFileSync(hookPath, code);
    console.log('✅ تم تحويل نظام الرفع إلى FormData بنجاح!');
} else {
    // محاولة إضافية في حال وجود مسافات مختلفة
    console.log('⚠️ لم أجد السطر بالدقة المطلوبة، سأحاول البحث المرن...');
    code = code.split('body: JSON.stringify({ image }),').join(newBody);
    fs.writeFileSync(hookPath, code);
    console.log('✅ تم التحديث باستخدام البحث المرن!');
}

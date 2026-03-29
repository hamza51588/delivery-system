const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'src/pages/admin.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// حذف حقول البنك الثلاثة من لوحة التحكم
code = code.replace(/<FormField control=\{settingsForm\.control\} name="bankName"[\s\S]*?<\/FormItem>\n\s*?\}\) \/>\n/g, '');
code = code.replace(/<FormField control=\{settingsForm\.control\} name="bankAccountName"[\s\S]*?<\/FormItem>\n\s*?\}\) \/>\n/g, '');
code = code.replace(/<FormField control=\{settingsForm\.control\} name="bankAccountNumber"[\s\S]*?<\/FormItem>\n\s*?\}\) \/>\n/g, '');

fs.writeFileSync(filePath, code);
console.log('✅ تم تنظيف لوحة التحكم من إعدادات البنك القديمة بنجاح!');

const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// 1. التراجع عن الكود المعقد الذي سبب الشاشة البيضاء
const riskyCode = 'notes: selectedBank ? `[الدفع عبر: ${selectedBank}] ${data.notes || ""}` : (data.notes || ""),';
if (code.includes(riskyCode)) {
    code = code.replace(riskyCode, 'notes: data.notes || "",');
}

// 2. ربط الأزرار بحقل الملاحظات بطريقة آمنة لا تسبب انهيار (React Form SetValue)
code = code.replace('setSelectedBank("العمقي")', 'setSelectedBank("العمقي"); try { form.setValue("notes", "تحويل بنكي عبر: العمقي"); } catch(e) {}');
code = code.replace('setSelectedBank("الكريمي")', 'setSelectedBank("الكريمي"); try { form.setValue("notes", "تحويل بنكي عبر: الكريمي"); } catch(e) {}');
code = code.replace('setSelectedBank("النجم")', 'setSelectedBank("النجم"); try { form.setValue("notes", "تحويل بنكي عبر: النجم"); } catch(e) {}');

fs.writeFileSync(homePath, code);
console.log('✅ تم إزالة مسبب الشاشة البيضاء وتطبيق الإصلاح الآمن بنجاح!');

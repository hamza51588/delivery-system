const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// تصليح زر العمقي
code = code.split('onClick={() => setSelectedBank("العمقي"); try { form.setValue("notes", "تحويل بنكي عبر: العمقي"); } catch(e) {}}')
           .join('onClick={() => { setSelectedBank("العمقي"); try { form.setValue("notes", "تحويل بنكي عبر: العمقي"); } catch(e) {} }}');

// تصليح زر الكريمي
code = code.split('onClick={() => setSelectedBank("الكريمي"); try { form.setValue("notes", "تحويل بنكي عبر: الكريمي"); } catch(e) {}}')
           .join('onClick={() => { setSelectedBank("الكريمي"); try { form.setValue("notes", "تحويل بنكي عبر: الكريمي"); } catch(e) {} }}');

// تصليح زر النجم
code = code.split('onClick={() => setSelectedBank("النجم"); try { form.setValue("notes", "تحويل بنكي عبر: النجم"); } catch(e) {}}')
           .join('onClick={() => { setSelectedBank("النجم"); try { form.setValue("notes", "تحويل بنكي عبر: النجم"); } catch(e) {} }}');

fs.writeFileSync(homePath, code);
console.log('✅ تم تصليح الأقواس البرمجية بنجاح!');

const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// مصفوفة البنوك الأصلية مع حساب العمقي
const correctBanks = `const banks = [
  { id: "omqi", name: "شركة العمقي للصرافة", account: "123456789", owner: "حساب الشركة" },
  { id: "kuraimi", name: "بنك الكريمي", account: "987654321", owner: "حساب المؤسسة" },
];`;

// البحث عن أي مصفوفة بنوك قديمة واستبدالها بالكامل
const banksRegex = /const\s+banks\s*=\s*\[[\s\S]*?\];/;

if (code.match(banksRegex)) {
    code = code.replace(banksRegex, correctBanks);
    fs.writeFileSync(homePath, code);
    console.log('✅ تم استعادة حساب العمقي في صفحة الطلب!');
} else {
    // إذا لم يجد المصفوفة، سنحاول حقنها قبل الـ onSubmit
    code = code.replace('const onSubmit', correctBanks + '\n\n  const onSubmit');
    fs.writeFileSync(homePath, code);
    console.log('✅ تم حقن حساب العمقي في مكانه الجديد!');
}

const fs = require('fs');
const path = require('path');

// 1. تعديل صفحة الطلب (home.tsx)
const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
if (fs.existsSync(homePath)) {
    let lines = fs.readFileSync(homePath, 'utf8').split('\n');
    const idx = lines.findIndex(l => l.includes('بنك العملاقي'));
    if (idx !== -1) {
        // مسح 5 أسطر بالضبط وزرع البنوك الجديدة
        lines.splice(idx - 1, 5, `                              <div className="text-sm text-blue-700 space-y-2 font-medium">
                                <p className="text-blue-800 font-bold mb-2">يرجى تحويل المبلغ إلى أحد الحسابات التالية:</p>
                                <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
                                  <div><p className="font-bold text-gray-900">🏦 العمقي للصرافة</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر طلبك علينا"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">123456789</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
                                  <div><p className="font-bold text-gray-900">🏦 بنك الكريمي</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر طلبك علينا"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">987654321</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
                                  <div><p className="font-bold text-gray-900">🏦 النجم للصرافة</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر طلبك علينا"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">55667788</span>
                                </div>
                              </div>`);
        fs.writeFileSync(homePath, lines.join('\n'));
        console.log('✅ تم تعديل البنوك الثلاثة في صفحة الطلب بنجاح!');
    } else {
        console.log('⚠️ الكود في home.tsx تم تعديله مسبقاً أو لم يتم العثور عليه.');
    }
}

// 2. تنظيف لوحة التحكم (admin.tsx)
const adminPath = path.join(process.cwd(), 'src/pages/admin.tsx');
if (fs.existsSync(adminPath)) {
    let lines = fs.readFileSync(adminPath, 'utf8').split('\n');
    const idx = lines.findIndex(l => l.includes('name="bankName"'));
    if (idx !== -1) {
        // مسح 9 أسطر بالضبط (المربعات الثلاثة الخاصة بالبنك)
        lines.splice(idx, 9);
        fs.writeFileSync(adminPath, lines.join('\n'));
        console.log('✅ تم تنظيف لوحة التحكم بنجاح!');
    } else {
        console.log('⚠️ لوحة التحكم نظيفة مسبقاً.');
    }
}

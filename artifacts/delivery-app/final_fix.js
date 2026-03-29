const fs = require('fs');
const path = require('path');

// --- 1. تعديل ملف لوحة التحكم (admin.tsx) ---
const adminPath = path.join(process.cwd(), 'src/pages/admin.tsx');
if (fs.existsSync(adminPath)) {
    let adminCode = fs.readFileSync(adminPath, 'utf8');
    // حذف حقول البنك الثلاثة بدقة
    const adminRegex = /<FormField control=\{settingsForm\.control\} name="bankName"[\s\S]*?<FormField control=\{settingsForm\.control\} name="bankAccountNumber"[\s\S]*?<\/FormItem>\s*\}\) \/>/g;
    adminCode = adminCode.replace(adminRegex, '/* تم نقل إعدادات البنك للكود البرمجي */');
    fs.writeFileSync(adminPath, adminCode);
    console.log('✅ تم تنظيف لوحة التحكم بنجاح!');
}

// --- 2. تعديل ملف صفحة الطلب (home.tsx) ---
const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
if (fs.existsSync(homePath)) {
    let homeCode = fs.readFileSync(homePath, 'utf8');
    
    // الكود الجديد للصرافات الثلاثة
    const newBanksUI = `<div className="text-sm text-blue-700 space-y-2 font-medium">
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
                              </div>`;

    // استبدال المربع القديم بالجديد
    const homeRegex = /<div className="text-sm text-blue-700 space-y-1\.5 font-medium">[\s\S]*?<\/div>/;
    homeCode = homeCode.replace(homeRegex, newBanksUI);
    
    fs.writeFileSync(homePath, homeCode);
    console.log('✅ تم إضافة الصرافات الثلاثة لصفحة الطلب!');
}

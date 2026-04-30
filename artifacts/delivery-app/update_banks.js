const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. تغيير اسم الزر لتوضيح تعدد الخيارات
code = code.replace('label: "تحويل مصرفي"', 'label: "تحويل / صرافة"');

// 2. زرع قائمة الصرافات (العمقي، الكريمي، النجم)
const regex = /<div className="text-sm text-blue-700 space-y-1\.5 font-medium">[\s\S]*?<\/div>/;

const newBankDetails = `<div className="text-sm text-blue-700 space-y-2 font-medium">
                                <p className="text-blue-800 font-bold mb-2">يرجى تحويل المبلغ إلى أحد الحسابات التالية:</p>
                                
                                <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-gray-900">🏦 العمقي للصرافة</p>
                                    <p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر المدار السريع"}</p>
                                  </div>
                                  <span className="font-bold text-primary" dir="ltr">123456789</span>
                                </div>

                                <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-gray-900">🏦 بنك الكريمي</p>
                                    <p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر المدار السريع"}</p>
                                  </div>
                                  <span className="font-bold text-primary" dir="ltr">987654321</span>
                                </div>

                                <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-gray-900">🏦 النجم للصرافة</p>
                                    <p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر المدار السريع"}</p>
                                  </div>
                                  <span className="font-bold text-primary" dir="ltr">55667788</span>
                                </div>
                              </div>`;

code = code.replace(regex, newBankDetails);

fs.writeFileSync(filePath, code);
console.log('✅ تم إضافة العمقي والكريمي والنجم وتحديث خيارات الدفع بنجاح!');

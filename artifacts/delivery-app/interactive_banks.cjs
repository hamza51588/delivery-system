const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
if (fs.existsSync(homePath)) {
    let code = fs.readFileSync(homePath, 'utf8');

    // 1. إضافة State جديد لاختيار البنك في بداية المكون
    if (!code.includes('const [selectedBank, setSelectedBank]')) {
        code = code.replace('const [receiptFile, setReceiptFile] = useState', 'const [selectedBank, setSelectedBank] = useState("");\n  const [receiptFile, setReceiptFile] = useState');
    }

    // 2. تعديل كود عرض البنوك ليكون تفاعلياً وقابل للضغط
    const newInteractiveUI = `                              <div className="text-sm text-blue-700 space-y-2 font-medium">
                                <p className="text-blue-800 font-bold mb-2">اضغط لاختيار البنك الذي ستُحول إليه:</p>
                                
                                <button type="button" onClick={() => setSelectedBank("العمقي")} className={\`w-full bg-white p-2.5 rounded-xl border-2 transition-all flex justify-between items-center \${selectedBank === "العمقي" ? "border-primary bg-orange-50" : "border-blue-100"}\`}>
                                  <div className="text-right"><p className="font-bold text-gray-900">🏦 العمقي للصرافة</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر المدار السريع"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">123456789</span>
                                </button>

                                <button type="button" onClick={() => setSelectedBank("الكريمي")} className={\`w-full bg-white p-2.5 rounded-xl border-2 transition-all flex justify-between items-center \${selectedBank === "الكريمي" ? "border-primary bg-orange-50" : "border-blue-100"}\`}>
                                  <div className="text-right"><p className="font-bold text-gray-900">🏦 بنك الكريمي</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر المدار السريع"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">987654321</span>
                                </button>

                                <button type="button" onClick={() => setSelectedBank("النجم")} className={\`w-full bg-white p-2.5 rounded-xl border-2 transition-all flex justify-between items-center \${selectedBank === "النجم" ? "border-primary bg-orange-50" : "border-blue-100"}\`}>
                                  <div className="text-right"><p className="font-bold text-gray-900">🏦 النجم للصرافة</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر المدار السريع"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">55667788</span>
                                </button>
                                {selectedBank && <p className="text-center text-xs text-primary font-bold">✅ اخترت الدفع عبر: {selectedBank}</p>}
                              </div>`;

    // استبدال كود البنوك القديم بالتفاعلي
    const bankAreaRegex = /<div className="text-sm text-blue-700 space-y-2 font-medium">[\s\S]*?<\/div>/;
    code = code.replace(bankAreaRegex, newInteractiveUI);

    // 3. تعديل وظيفة الإرسال لدمج البنك المختار مع الملاحظات
    const submitRegex = /notes: data\.notes \|\| "",/g;
    code = code.replace(submitRegex, 'notes: selectedBank ? `[الدفع عبر: ${selectedBank}] ${data.notes || ""}` : (data.notes || ""),');

    fs.writeFileSync(homePath, code);
    console.log('✅ تم تحويل البنوك إلى أزرار تفاعلية وربطها بالملاحظات!');
}

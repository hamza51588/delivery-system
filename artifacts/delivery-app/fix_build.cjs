const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// 1. التأكد من وجود متغير selectedBank
if (!code.includes('const [selectedBank, setSelectedBank]')) {
    code = code.replace('const [receiptFile, setReceiptFile] = useState', 'const [selectedBank, setSelectedBank] = useState("");\n  const [receiptFile, setReceiptFile] = useState');
}

// 2. تحديد بداية ونهاية المنطقة المتضررة وقصها
const startMarker = '<CreditCard className="w-4 h-4" /> بيانات التحويل المصرفي\n                              </p>';
const endMarker = '<div className="pt-1">';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const before = code.substring(0, startIndex + startMarker.length);
    const after = code.substring(endIndex);
    
    // الكود التفاعلي السليم
    const newMiddle = `\n                              <div className="text-sm text-blue-700 space-y-2 font-medium mt-3 mb-3">
                                <p className="text-blue-800 font-bold mb-2">اضغط لاختيار البنك الذي ستُحول إليه:</p>
                                <button type="button" onClick={() => setSelectedBank("العمقي")} className={\`w-full bg-white p-2.5 rounded-xl border-2 transition-all flex justify-between items-center \${selectedBank === "العمقي" ? "border-primary bg-orange-50" : "border-transparent"}\`}>
                                  <div className="text-right"><p className="font-bold text-gray-900">🏦 العمقي للصرافة</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر طلبك علينا"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">123456789</span>
                                </button>
                                <button type="button" onClick={() => setSelectedBank("الكريمي")} className={\`w-full bg-white p-2.5 rounded-xl border-2 transition-all flex justify-between items-center \${selectedBank === "الكريمي" ? "border-primary bg-orange-50" : "border-transparent"}\`}>
                                  <div className="text-right"><p className="font-bold text-gray-900">🏦 بنك الكريمي</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر طلبك علينا"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">987654321</span>
                                </button>
                                <button type="button" onClick={() => setSelectedBank("النجم")} className={\`w-full bg-white p-2.5 rounded-xl border-2 transition-all flex justify-between items-center \${selectedBank === "النجم" ? "border-primary bg-orange-50" : "border-transparent"}\`}>
                                  <div className="text-right"><p className="font-bold text-gray-900">🏦 النجم للصرافة</p><p className="text-xs text-gray-500">الاسم: {s?.bankAccountName || "متجر طلبك علينا"}</p></div>
                                  <span className="font-bold text-primary" dir="ltr">55667788</span>
                                </button>
                                {selectedBank && <p className="text-center text-xs text-primary font-bold mt-2">✅ اخترت الدفع عبر: {selectedBank}</p>}
                              </div>\n                              `;
                              
    code = before + newMiddle + after;
    
    // 3. تحديث الإرسال لإضافة الملاحظات
    const submitRegex = /notes: data\.notes \|\| "",/g;
    if (code.match(submitRegex)) {
         code = code.replace(submitRegex, 'notes: selectedBank ? `[الدفع عبر: ${selectedBank}] ${data.notes || ""}` : (data.notes || ""),');
    }

    fs.writeFileSync(homePath, code);
    console.log('✅ تم إصلاح الأقواس التالفة وزرع البنوك التفاعلية بنجاح!');
} else {
    console.log('⚠️ لم يتم العثور على المكان، يبدو أن الملف يحتاج لتدخل يدوي.');
}

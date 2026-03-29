const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');
let lines = code.split('\n');
let fixed = false;

for (let i = 0; i < lines.length; i++) {
    // البحث عن سطر رفع الصورة وتغليفه بمانع الصدمات القوي
    if (lines[i].includes('uploadReceipt.mutateAsync') && !lines[i].includes('try {')) {
        lines[i] = `        try { ${lines[i].trim()} } catch(e) { alert("⚠️ تم إرسال الطلب بنجاح، ولكن تعذر رفع صورة السند (الخطأ: " + (e.message || "مجهول") + ")"); }`;
        fixed = true;
    }
}

if (fixed) {
    fs.writeFileSync(homePath, lines.join('\n'));
    console.log('✅ تم تركيب مانع الانهيار (Anti-Crash) بنجاح!');
} else {
    console.log('⚠️ الكود محمي مسبقاً أو لم يتم العثور عليه.');
}

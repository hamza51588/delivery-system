const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// البحث عن سطر رفع الصورة واستبداله بنسخة محمية بمانع الصدمات
const regex = /await\s+uploadReceipt\.mutateAsync\(\{\s*id:\s*order\.id,\s*image:\s*receiptFile\s*\}\);/g;
const safeCode = 'try { await uploadReceipt.mutateAsync({ id: order.id, image: receiptFile }); } catch (err) { console.error("فشل رفع الصورة:", err); }';

if (code.match(regex)) {
    code = code.replace(regex, safeCode);
    fs.writeFileSync(homePath, code);
    console.log('✅ تم تركيب مانع الصدمات لرفع الصور بنجاح!');
} else {
    console.log('⚠️ لم يتم العثور على الكود المطلوب.');
}

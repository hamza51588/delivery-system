const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const omqiData = '{ id: "omqi", name: "شركة العمقي للصرافة", account: "123456789", owner: "حساب الشركة" },';

if (!code.includes('omqi')) {
    // استبدال بسيط ومباشر للنص
    code = code.replace('const banks = [', 'const banks = [\n  ' + omqiData);
    fs.writeFileSync(homePath, code);
    console.log('✅ تم استعادة حساب العمقي بنجاح');
} else {
    console.log('ℹ️ حساب العمقي موجود مسبقاً');
}

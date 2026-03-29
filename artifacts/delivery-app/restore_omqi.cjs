const fs = require('fs');
const path = require('path');

const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let code = fs.readFileSync(homePath, 'utf8');

// إضافة حساب العمقي إذا لم يكن موجوداً
const omqiAccount = '{ id: "omqi", name: "شركة العمقي للصرافة", account: "123456789", owner: "حساب الشركة" },';
if (!code.includes('omqi')) {
    code = code.replace('const banks = [', \`const banks = [\n  \${omqiAccount}\`);
    fs.writeFileSync(homePath, code);
    console.log('✅ تم استعادة حساب العمقي');
} else {
    console.log('ℹ️ حساب العمقي موجود بالفعل');
}

const fs = require('fs');
const path = require('path');

const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');
let lines = fs.readFileSync(hookPath, 'utf8').split('\n');

// 1. تحديد بداية الدالة (نبحث عن السطر الذي يحتوي على اسم الدالة)
const startIndex = lines.findIndex(l => l.includes('export function useUploadReceipt'));

if (startIndex !== -1) {
    // 2. الكود الجديد المصفح (Base64)
    const cleanFunction = [
        'export function useUploadReceipt() {',
        '  const qc = useQueryClient();',
        '  return useMutation({',
        '    mutationFn: async ({ id, image }: { id: number; image: any }) => {',
        '      const toBase64 = (file: File) => new Promise((resolve, reject) => {',
        '        const reader = new FileReader();',
        '        reader.readAsDataURL(file);',
        '        reader.onload = () => resolve(reader.result);',
        '        reader.onerror = error => reject(error);',
        '      });',
        '',
        '      let imageData = image;',
        '      if (image instanceof File) {',
        '        imageData = await toBase64(image);',
        '      }',
        '',
        '      const res = await fetch(`https://delivery-system-s41p.onrender.com/api/orders/${id}/receipt`, {',
        '        method: "POST",',
        '        headers: { "Content-Type": "application/json" },',
        '        body: JSON.stringify({ image: imageData }),',
        '      });',
        '',
        '      if (!res.ok) throw new Error("فشل رفع الصورة");',
        '      return res.json();',
        '    },',
        '    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),',
        '  });',
        '}'
    ];

    // 3. حذف 40 سطراً من بداية الدالة لضمان تنظيف كل الأقواس الزائدة
    lines.splice(startIndex, 40); 
    
    // 4. زرع الدالة النظيفة في نفس المكان
    lines.splice(startIndex, 0, ...cleanFunction);

    fs.writeFileSync(hookPath, lines.join('\n'));
    console.log('✅ تم تطهير الملف وزرع دالة Base64 بنجاح!');
} else {
    console.log('❌ لم أجد الدالة المطلوبة في الملف.');
}

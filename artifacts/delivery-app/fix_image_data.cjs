const fs = require('fs');
const path = require('path');

const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');
let code = fs.readFileSync(hookPath, 'utf8');

// دالة الرفع الجديدة التي تحول الصورة لنص قبل الإرسال (توافق كامل)
const base64Function = `export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image }: { id: number; image: any }) => {
      // تحويل الملف إلى Base64 لضمان وصوله للسيرفر كنص
      const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      let imageData = image;
      if (image instanceof File) {
        imageData = await toBase64(image);
      }

      const res = await fetch(\`https://delivery-system-s41p.onrender.com/api/orders/\${id}/receipt\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("سيرفر الرفع رفض الصورة: " + errorText);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}`;

// استبدال الدالة القديمة (التي تبدأ من export function useUploadReceipt)
const oldFuncRegex = /export function useUploadReceipt\(\) \{[\s\S]*?\}\s*\}/;
if (code.match(oldFuncRegex)) {
    code = code.replace(oldFuncRegex, base64Function);
    fs.writeFileSync(hookPath, code);
    console.log('✅ تم تحديث نظام الرفع ليدعم تحويل الصور (Base64) بنجاح!');
} else {
    // محاولة استبدال المنطقة يدوياً إذا لم يتطابق الريجكس
    const startIndex = code.indexOf('export function useUploadReceipt');
    if (startIndex !== -1) {
        const lines = code.split('\n');
        const startLine = lines.findIndex(l => l.includes('export function useUploadReceipt'));
        // نبحث عن أول سطر فارغ أو نهاية الملف بعد الدالة
        lines.splice(startLine, 15, base64Function); 
        fs.writeFileSync(hookPath, lines.join('\n'));
        console.log('✅ تم التعديل يدوياً بنجاح!');
    }
}

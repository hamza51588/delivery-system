const fs = require('fs');
const path = require('path');

const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');

if (fs.existsSync(hookPath)) {
    let code = fs.readFileSync(hookPath, 'utf8');
    
    // البحث عن دالة useUploadReceipt وتغيير محتواها ليستخدم FormData
    // هذا التعديل يضمن تحويل الـ image إلى ملف حقيقي قبل الإرسال
    const oldPart = /export\s+const\s+useUploadReceipt\s*=\s*\(\)\s*=>\s*\{[\s\S]*?mutationFn:\s*async\s*\(\{\s*id,\s*image\s*\}\)\s*=>\s*\{[\s\S]*?await\s+api\.post\(\`\/orders\/\$\{id\}\/upload\`,\s*\{\s*image\s*\}\);?[\s\S]*?\}/;
    
    const newPart = `export const useUploadReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image }: { id: string | number; image: File }) => {
      const formData = new FormData();
      formData.append('image', image);
      return api.post(\`/orders/\${id}/upload\`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }`;

    if (code.match(oldPart)) {
        code = code.replace(oldPart, newPart);
        fs.writeFileSync(hookPath, code);
        console.log('✅ تم تحصين Hook الرفع بنظام FormData بنجاح!');
    } else {
        // إذا لم يتطابق النمط المعقد، سنجرب استبدال السطر مباشرة بشكل أبسط
        const simpleSearch = /await\s+api\.post\(\`\/orders\/\$\{id\}\/upload\`,\s*\{\s*image\s*\}\)/;
        const simpleReplace = `const fd = new FormData(); fd.append('image', image); await api.post(\`/orders/\${id}/upload\`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })`;
        
        if (code.match(simpleSearch)) {
            code = code.replace(simpleSearch, simpleReplace);
            fs.writeFileSync(hookPath, code);
            console.log('✅ تم إصلاح سطر الرفع المباشر!');
        } else {
            console.log('⚠️ لم أتمكن من العثور على الكود، ربما تم تعديله سابقاً.');
        }
    }
} else {
    console.log('❌ الملف غير موجود في المسار المحدد.');
}

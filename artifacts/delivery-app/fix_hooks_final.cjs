const fs = require('fs');
const path = require('path');

const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');
let code = fs.readFileSync(hookPath, 'utf8');

// 1. تحديد بداية المنطقة المتضررة (من دالة الرفع)
const startMarker = 'export function useUploadReceipt';
const startIndex = code.indexOf(startMarker);

if (startIndex !== -1) {
    // سنحتفظ بالكود الذي يسبق دالة الرفع فقط
    const cleanPrefix = code.substring(0, startIndex);

    // 2. كتابة الجزء الجديد بالكامل (الرفع + التتبع) لضمان سلامة الأقواس
    const newHooksCode = `export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image }: { id: number; image: any }) => {
      const toBase64 = (file: File) => new Promise((resolve, reject) => {
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

      if (!res.ok) throw new Error("فشل رفع الصورة");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useTrackOrder(id?: string, phone?: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'track', id, phone],
    queryFn: () => trackOrder(id!, phone!),
    enabled: !!id && !!phone,
    refetchInterval: 15000,
  });
}`;

    // دمج الكود النظيف
    fs.writeFileSync(hookPath, cleanPrefix + newHooksCode);
    console.log('✅ تم إعادة بناء الـ Hooks بالكامل وبشكل متناسق!');
} else {
    console.log('❌ لم يتم العثور على نقطة البداية المطلوبة.');
}

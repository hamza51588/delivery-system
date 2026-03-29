const fs = require('fs');
const path = require('path');

const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');

const originalHooks = `import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ORDERS_KEY = "orders";

export function useOrders() {
  return useQuery({
    queryKey: [ORDERS_KEY],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data;
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/orders", payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image }: { id: number; image: any }) => {
      const res = await fetch(\`https://delivery-system-s41p.onrender.com/api/orders/\${id}/receipt\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) throw new Error("Failed to upload");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useTrackOrder(id?: string, phone?: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'track', id, phone],
    queryFn: async () => {
      const res = await api.get(\`/orders/track?id=\${id}&phone=\${phone}\`);
      return res.data;
    },
    enabled: !!id && !!phone,
  });
}`;

fs.writeFileSync(hookPath, originalHooks);
console.log('✅ تم استعادة ملف الـ Hooks للحالة الأصلية');

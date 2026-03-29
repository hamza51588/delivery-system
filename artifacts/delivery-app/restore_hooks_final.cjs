const fs = require('fs');
const path = require('path');

const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');

const originalHooks = `import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ORDERS_KEY = "orders";
const API_BASE = "https://delivery-system-s41p.onrender.com/api";

export function useOrders() {
  return useQuery({
    queryKey: [ORDERS_KEY],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE}/orders\`);
      return res.json();
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(\`\${API_BASE}/orders\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image }: { id: number; image: any }) => {
      const res = await fetch(\`\${API_BASE}/orders/\${id}/receipt\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useTrackOrder(id?: string, phone?: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'track', id, phone],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE}/orders/track?id=\${id}&phone=\${phone}\`);
      return res.json();
    },
    enabled: !!id && !!phone,
  });
}`;

fs.writeFileSync(hookPath, originalHooks);
console.log('✅ تم إصلاح الـ Hooks وإزالة التبعيات المفقودة');

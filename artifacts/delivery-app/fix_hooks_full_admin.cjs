const fs = require('fs');
const path = require('path');
const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');

const content = `import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ORDERS_KEY = "orders";
const API_BASE = "https://delivery-system-s41p.onrender.com/api";

export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  address: string;
  orderDetails: string;
  notes?: string;
  status: string;
  assignedDriverId?: number;
  assignedDriverName?: string;
  locationLat?: number;
  locationLng?: number;
  locationLink?: string;
  deliveryArea?: string;
  deliveryAreaPrice?: number;
  paymentMethod: string;
  paymentReceiptImage?: string;
  paymentVerified: boolean;
  createdAt: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export function useOrders() {
  return useQuery({
    queryKey: [ORDERS_KEY],
    queryFn: async () => {
      const res = await fetch(API_BASE + "/orders");
      return res.json();
    },
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: [ORDERS_KEY, 'stats'],
    queryFn: async () => {
      const res = await fetch(API_BASE + "/orders/stats");
      return res.json();
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(API_BASE + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await fetch(API_BASE + "/orders/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      qc.invalidateQueries({ queryKey: [ORDERS_KEY, 'stats'] });
    },
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image }) => {
      const res = await fetch(API_BASE + "/orders/" + id + "/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  });
}

export function useTrackOrder(id, phone) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'track', id, phone],
    queryFn: async () => {
      const res = await fetch(API_BASE + "/orders/track?id=" + id + "&phone=" + phone);
      return res.json();
    },
    enabled: !!id && !!phone,
  });
}`;

fs.writeFileSync(hookPath, content);
console.log('✅ تم إعادة بناء الـ Hooks بالكامل (العميل + الإدارة)');

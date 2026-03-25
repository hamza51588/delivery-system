import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export interface TrackResult {
  id: number;
  customerName: string;
  status: string;
  assignedDriverName?: string;
  deliveryArea?: string;
  paymentMethod: string;
  paymentVerified: boolean;
  createdAt: string;
}

export interface OrderStats {
  today: number;
  thisMonth: number;
  thisYear: number;
  total: number;
  byStatus: Record<string, number>;
}

const ORDERS_KEY = ["orders"];

async function fetchOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("فشل التحميل");
  return res.json();
}

async function fetchStats(): Promise<OrderStats> {
  const res = await fetch("/api/orders/stats");
  if (!res.ok) throw new Error("فشل التحميل");
  return res.json();
}

async function trackOrder(id: number, phone: string): Promise<TrackResult> {
  const res = await fetch(`/api/orders/track?id=${id}&phone=${encodeURIComponent(phone)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "لم يتم العثور على الطلب");
  }
  return res.json();
}

export function useOrders() {
  return useQuery({ queryKey: ORDERS_KEY, queryFn: fetchOrders, refetchInterval: 30000 });
}

export function useOrderStats() {
  return useQuery({ queryKey: ["order-stats"], queryFn: fetchStats, refetchInterval: 60000 });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشل الإرسال");
      }
      return res.json() as Promise<Order>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return {
    mutateAsync: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      const result = await res.json();
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
      return result as Order;
    },
  };
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image }: { id: number; image: string }) => {
      const res = await fetch(`/api/orders/${id}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) throw new Error("فشل رفع الصورة");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useTrackOrder(id: number | null, phone: string) {
  return useQuery({
    queryKey: ["track", id, phone],
    queryFn: () => trackOrder(id!, phone),
    enabled: !!id && !!phone,
    refetchInterval: 15000,
  });
}

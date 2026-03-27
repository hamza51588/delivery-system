import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface DeliveryArea {
  id: number;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

const KEY = ["delivery-areas"];

async function fetchAreas(): Promise<DeliveryArea[]> {
  const res = await fetch( "https://delivery-system-s41p.onrender.com/api/delivery-areas");
  if (!res.ok) return [];
  return res.json();
}

export function useDeliveryAreas() {
  return useQuery({ queryKey: KEY, queryFn: fetchAreas });
}

export function useAddDeliveryArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; price: number }) => {
      const res = await fetch( "https://delivery-system-s41p.onrender.com/api/delivery-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isActive: true }),
      });
      if (!res.ok) throw new Error("فشل الإضافة");
      return res.json() as Promise<DeliveryArea>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDeliveryArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; price?: number; isActive?: boolean }) => {
      const res = await fetch(`/api/delivery-areas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      return res.json() as Promise<DeliveryArea>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDeliveryArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/delivery-areas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

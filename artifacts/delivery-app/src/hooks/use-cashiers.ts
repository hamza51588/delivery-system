import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Cashier {
  id: number;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

const KEY = ["cashiers"];

async function fetchCashiers(): Promise<Cashier[]> {
  const res = await fetch( "https://delivery-system-s41p.onrender.com/api/cashiers");
  if (!res.ok) return [];
  return res.json();
}

export function useCashiers() {
  return useQuery({ queryKey: KEY, queryFn: fetchCashiers });
}

export function useAddCashier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; phone?: string; notes?: string }) => {
      const res = await fetch( "https://delivery-system-s41p.onrender.com/api/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل إضافة الصراف");
      return res.json() as Promise<Cashier>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCashier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`https://delivery-system-s41p.onrender.com/api/cashiers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

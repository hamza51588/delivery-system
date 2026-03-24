import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Driver {
  id: number;
  name: string;
  phone?: string;
  createdAt: string;
}

async function fetchDrivers(): Promise<Driver[]> {
  const res = await fetch("/api/drivers");
  if (!res.ok) return [];
  return res.json();
}

async function addDriver(data: { name: string; phone?: string }): Promise<Driver> {
  const res = await fetch("/api/drivers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("فشل إضافة السائق");
  return res.json();
}

async function deleteDriver(id: number): Promise<void> {
  const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("فشل الحذف");
}

export function useDrivers() {
  return useQuery({ queryKey: ["drivers"], queryFn: fetchDrivers });
}

export function useAddDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

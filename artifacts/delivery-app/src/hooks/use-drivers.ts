import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "https://delivery-system-s41p.onrender.com";

export interface Driver {
  id: number;
  name: string;
  phone?: string;
  loginCode?: string;
  isAvailable?: boolean;
  createdAt: string;
}

async function fetchDrivers(): Promise<Driver[]> {
  const res = await fetch(`${API_BASE}/api/drivers`);
  if (!res.ok) return [];
  return res.json();
}

async function addDriver(data: { name: string; phone?: string }): Promise<Driver> {
  const res = await fetch(`${API_BASE}/api/drivers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("فشل إضافة السائق");
  return res.json();
}

async function deleteDriver(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/drivers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("فشل الحذف");
}

async function toggleStatus(data: { id: number; isAvailable: boolean }): Promise<Driver> {
  const res = await fetch(`${API_BASE}/api/drivers/${data.id}/toggle-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isAvailable: data.isAvailable }),
  });
  if (!res.ok) throw new Error("فشل تحديث الحالة");
  return res.json();
}

export async function loginDriver(code: string): Promise<Driver> {
  const res = await fetch(`${API_BASE}/api/drivers/login/${code}`);
  if (!res.ok) throw new Error("رمز غير صحيح");
  return res.json();
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

export function useToggleDriverStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

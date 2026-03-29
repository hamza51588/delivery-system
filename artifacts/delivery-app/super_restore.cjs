const fs = require('fs');
const path = require('path');

// 1. إصلاح ملف الـ Hooks (إضافة كل الدوال المفقودة)
const hookPath = path.join(process.cwd(), 'src/hooks/use-orders.ts');
const hookContent = `import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE = "https://delivery-system-s41p.onrender.com/api";

export interface Order { id: number; customerName: string; customerPhone: string; address: string; orderDetails: string; status: string; paymentMethod: string; createdAt: string; paymentVerified: boolean; }
export interface OrderStats { total: number; pending: number; completed: number; cancelled: number; }

export function useOrders() { return useQuery({ queryKey: ["orders"], queryFn: () => fetch(API_BASE + "/orders").then(res => res.json()) }); }
export function useOrderStats() { return useQuery({ queryKey: ["orders", "stats"], queryFn: () => fetch(API_BASE + "/orders/stats").then(res => res.json()) }); }
export function useCreateOrder() { 
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: (p) => fetch(API_BASE + "/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }).then(res => res.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] })
  }); 
}
export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => fetch(API_BASE + "/orders/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => res.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); qc.invalidateQueries({ queryKey: ["orders", "stats"] }); }
  });
}
export function useUploadReceipt() {
  return useMutation({ mutationFn: ({ id, image }) => fetch(API_BASE + "/orders/" + id + "/receipt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) }).then(res => res.json()) });
}
export function useTrackOrder(id, phone) { return useQuery({ queryKey: ["orders", "track", id, phone], queryFn: () => fetch(API_BASE + "/orders/track?id=" + id + "&phone=" + phone).then(res => res.json()), enabled: !!id && !!phone }); }
`;
fs.writeFileSync(hookPath, hookContent);

// 2. إصلاح ملف الـ Home وإرجاع حساب العمقي
const homePath = path.join(process.cwd(), 'src/pages/home.tsx');
let homeCode = fs.readFileSync(homePath, 'utf8');
const omqiAccount = '{ id: "omqi", name: "شركة العمقي للصرافة", account: "123456789", owner: "حساب الشركة" },';
if (!homeCode.includes('omqi')) {
    homeCode = homeCode.replace('const banks = [', 'const banks = [\n  ' + omqiAccount);
    fs.writeFileSync(homePath, homeCode);
}

console.log('✅ تم استعادة الملفات بنجاح! الآن البناء (Build) سيعمل.');

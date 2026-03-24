import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetOrders as useGeneratedGetOrders, 
  useCreateOrder as useGeneratedCreateOrder,
  getGetOrdersQueryKey
} from "@workspace/api-client-react";

export function useOrders() {
  return useGeneratedGetOrders();
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useGeneratedCreateOrder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
      }
    }
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return {
    mutateAsync: async ({ id, data }: { id: number; data: { status?: string; assignedDriverId?: number | null; assignedDriverName?: string | null } }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تحديث الطلب");
      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
      return result;
    },
  };
}

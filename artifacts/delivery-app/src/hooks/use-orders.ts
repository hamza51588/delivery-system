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
        // Invalidate the orders list to instantly reflect the new order in the admin dashboard
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
      }
    }
  });
}

import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPhones as useGeneratedGetPhones,
  useAddPhone as useGeneratedAddPhone,
  useDeletePhone as useGeneratedDeletePhone,
  getGetPhonesQueryKey
} from "@workspace/api-client-react";

export function usePhones() {
  return useGeneratedGetPhones();
}

export function useAddPhone() {
  const queryClient = useQueryClient();
  
  return useGeneratedAddPhone({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPhonesQueryKey() });
      }
    }
  });
}

export function useDeletePhone() {
  const queryClient = useQueryClient();
  
  return useGeneratedDeletePhone({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPhonesQueryKey() });
      }
    }
  });
}

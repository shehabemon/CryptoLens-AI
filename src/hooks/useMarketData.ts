import { useQuery } from "@tanstack/react-query";
import { fetchTopCryptos } from "@/lib/api/coingecko";

export function useMarketData() {
  const query = useQuery({
    queryKey: ["market-data"],
    queryFn: fetchTopCryptos,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    lastUpdated: query.dataUpdatedAt
      ? new Date(query.dataUpdatedAt)
      : null,
  };
}

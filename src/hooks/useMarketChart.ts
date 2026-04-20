import { useQuery } from "@tanstack/react-query";
import { fetchMarketChart, type TimeRange } from "@/lib/api/coingecko";

export function useMarketChart(coinId: string | null, days: TimeRange) {
  return useQuery({
    queryKey: ["market-chart", coinId, days],
    queryFn: () => fetchMarketChart(coinId!, days),
    enabled: !!coinId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

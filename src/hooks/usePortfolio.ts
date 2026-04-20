import { useMemo, useEffect } from "react";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useMarketData } from "@/hooks/useMarketData";
import type { EnrichedHolding, PortfolioSummary } from "@/types/portfolio";

export function usePortfolio() {
  const { holdings, isLoaded, fetchHoldings } = usePortfolioStore();
  const { data: marketData, isLoading: isMarketLoading, isError } = useMarketData();

  // Fetch holdings from API on mount
  useEffect(() => {
    if (!isLoaded) {
      fetchHoldings();
    }
  }, [isLoaded, fetchHoldings]);

  const enrichedHoldings: EnrichedHolding[] = useMemo(() => {
    if (!marketData || holdings.length === 0) return [];

    const priceMap = new Map(marketData.map((a) => [a.id, a]));

    const raw = holdings.map((h) => {
      const asset = priceMap.get(h.assetId);
      const currentPrice = asset?.price ?? h.buyPrice;
      const value = h.amount * currentPrice;
      const invested = h.amount * h.buyPrice;
      const pnl = value - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

      return {
        ...h,
        image: asset?.image ?? h.image,
        currentPrice,
        value,
        invested,
        pnl,
        pnlPercent,
        allocation: 0, // computed below
      };
    });

    const totalValue = raw.reduce((sum, h) => sum + h.value, 0);

    return raw.map((h) => ({
      ...h,
      allocation: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
    }));
  }, [holdings, marketData]);

  const summary: PortfolioSummary = useMemo(() => {
    const totalValue = enrichedHoldings.reduce((s, h) => s + h.value, 0);
    const totalInvested = enrichedHoldings.reduce((s, h) => s + h.invested, 0);
    const totalPnl = totalValue - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return { totalValue, totalInvested, totalPnl, totalPnlPercent };
  }, [enrichedHoldings]);

  return {
    holdings: enrichedHoldings,
    summary,
    isEmpty: holdings.length === 0,
    isLoading: !isLoaded || isMarketLoading,
    isError,
  };
}

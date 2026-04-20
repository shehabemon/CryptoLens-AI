import { useMarketData } from "@/hooks/useMarketData";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { MarketOverviewStrip } from "@/components/dashboard/MarketOverviewStrip";
import { FeaturedChart } from "@/components/dashboard/FeaturedChart";
import { TopMovers } from "@/components/dashboard/TopMovers";
import { MarketTable } from "@/components/dashboard/MarketTable";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function Dashboard() {
  useDocumentTitle("Dashboard | CryptoLens-AI");
  const { data, isLoading, isError, refetch, lastUpdated } = useMarketData();
  const isEmpty = !isLoading && !isError && data !== null && data.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-[#0f172a]">Dashboard</h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
            Real-time cryptocurrency market overview
          </p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-[#94a3b8] font-mono hidden sm:block">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {isError && (
        <div className="flex items-center gap-3 border border-[#fecaca] bg-[#fef2f2] rounded-xl p-3 sm:p-4" role="alert">
          <AlertCircle className="h-4 w-4 text-[#dc2626] shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0f172a]">Failed to load market data</p>
            <p className="text-xs text-[#64748b] hidden sm:block">
              CoinGecko may be rate-limiting. Try again in a moment.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="shrink-0 text-xs"
            aria-label="Retry loading market data"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white border border-[#e2e5ea] rounded-xl text-center" role="status">
          <p className="text-sm font-medium text-[#64748b] mb-1">No market data available</p>
          <p className="text-xs text-[#94a3b8] max-w-[260px] mb-4">
            Market data could not be retrieved. This is usually temporary.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs"
            aria-label="Retry loading market data"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Market overview stats */}
          <ErrorBoundary context="market overview" compact>
            <MarketOverviewStrip assets={data} isLoading={isLoading} />
          </ErrorBoundary>

          {/* Featured chart + watchlist sidebar */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full">
            <div className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6 overflow-hidden">
              <ErrorBoundary context="featured chart">
                <FeaturedChart assets={data} isLoading={isLoading} />
              </ErrorBoundary>

              <ErrorBoundary context="top movers" compact>
                <TopMovers assets={data} isLoading={isLoading} />
              </ErrorBoundary>
            </div>

            {/* Watchlist sidebar — hidden on mobile, shown on lg+ */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-20">
                <WatchlistPanel assets={data} isLoading={isLoading} />
              </div>
            </div>
          </div>

          {/* Market data table */}
          <ErrorBoundary context="market table">
            <MarketTable assets={data} isLoading={isLoading} />
          </ErrorBoundary>
        </>
      )}

    </div>
  );
}


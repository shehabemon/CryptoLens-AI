import { useEffect } from "react";
import { useWatchlistStore } from "@/store/watchlistStore";
import { useMarketData } from "@/hooks/useMarketData";
import { useAssetDetailStore } from "@/store/assetDetailStore";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AssetDetailPanel } from "@/components/dashboard/AssetDetailPanel";
import { PriceFlash } from "@/components/PriceFlash";
import { formatCurrency, formatCompact } from "@/lib/utils/formatCurrency";
import { Star, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset } from "@/types/market";

function formatChange(val: number | null | undefined): { text: string; positive: boolean } {
  if (val == null) return { text: "—", positive: true };
  const positive = val >= 0;
  return {
    text: `${positive ? "+" : ""}${val.toFixed(2)}%`,
    positive,
  };
}

function formatPrice(val: number | undefined): string {
  if (val == null) return "—";
  if (val >= 1) return formatCurrency(val);
  return `$${val.toFixed(6)}`;
}

export default function Watchlist() {
  useDocumentTitle("Watchlist | CryptoLens-AI");
  const { watchedIds, isLoaded, fetchWatchlist, removeFromWatchlist } = useWatchlistStore();
  const { data: assets, isLoading, isError, refetch, lastUpdated } = useMarketData();
  const openAssetDetail = useAssetDetailStore((s) => s.openAssetDetail);

  useEffect(() => {
    if (!isLoaded) {
      fetchWatchlist();
    }
  }, [isLoaded, fetchWatchlist]);

  const watchedAssets = assets?.filter((a) => watchedIds.includes(a.id)) ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#0f172a]">Watchlist</h1>
        <p className="text-sm text-[#64748b] mt-0.5">
          {watchedAssets.length} assets monitored
        </p>
      </div>

      {isError && (
        <div className="flex items-center gap-3 border border-[#fecaca] bg-[#fef2f2] rounded-xl p-4" role="alert">
          <AlertCircle className="h-4 w-4 text-[#dc2626] shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0f172a]">Failed to load market data</p>
            <p className="text-xs text-[#64748b]">
              CoinGecko may be rate-limiting. Try again in a moment.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="shrink-0 text-xs rounded-lg"
            aria-label="Retry loading market data"
          >
            <RefreshCw className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        /* Skeleton table */
        <div className="bg-white rounded-xl border border-[#e2e5ea] shadow-card overflow-hidden" role="status" aria-label="Loading watchlist data">
          <div className="border-b border-[#e2e5ea] px-4 py-3 flex gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-[#f1f3f6] px-4 py-4 flex gap-6">
              <div className="flex items-center gap-2.5 flex-[2]">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="w-20 h-3.5" />
              </div>
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-3.5 flex-1" />
              ))}
            </div>
          ))}
          <span className="sr-only">Loading watchlist data…</span>
        </div>
      ) : watchedAssets.length === 0 ? (
        /* Empty state */
        <div className="bg-white border border-[#e2e5ea] rounded-xl shadow-card flex flex-col items-center justify-center py-16 text-center" role="status">
          <Star className="h-8 w-8 text-[#cbd1d8] mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-[#64748b] mb-1">No watched assets</p>
          <p className="text-xs text-[#94a3b8] max-w-[260px]">
            Star assets from the dashboard to add them to your watchlist
          </p>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-xl border border-[#e2e5ea] shadow-card overflow-x-auto">
          <table className="w-full min-w-[900px]" aria-label="Watchlist assets table">
            <thead>
              <tr className="border-b border-[#e2e5ea]">
                {["Asset", "Price", "24H", "7D", "MCap", "Volume", "52W High", "52W Low", "Actions"].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className={`text-xs font-medium text-[#94a3b8] py-3 px-4 ${
                      col === "Asset" ? "text-left" : "text-right"
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {watchedAssets.map((asset) => {
                const change24 = formatChange(asset.changePercent24h);
                const change7d = formatChange(asset.changePercent7d);

                return (
                  <tr
                    key={asset.id}
                    className="border-b border-[#f1f3f6] hover:bg-[#f8f9fb] transition-colors cursor-pointer"
                    style={{ height: "52px" }}
                    onClick={() => openAssetDetail(asset)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${asset.name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openAssetDetail(asset);
                      }
                    }}
                  >
                    {/* ASSET */}
                    <td className="py-0 px-4">
                      <div className="flex items-center gap-2.5">
                        {asset.image && (
                          <img
                            src={asset.image}
                            alt=""
                            aria-hidden="true"
                            className="w-7 h-7 rounded-full shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate leading-tight">
                            {asset.name}
                          </p>
                          <p className="text-xs font-mono text-[#94a3b8]">
                            {asset.symbol}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* PRICE */}
                    <td className="text-right py-0 px-4">
                      <PriceFlash value={asset.price} className="text-sm font-mono font-semibold text-[#0f172a]">
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatPrice(asset.price)}
                        </span>
                      </PriceFlash>
                    </td>

                    {/* 24H */}
                    <td className="text-right py-0 px-4">
                      <span
                        className={`text-xs font-mono font-medium ${
                          change24.positive ? "text-[#16a34a]" : "text-[#dc2626]"
                        }`}
                      >
                        {change24.text}
                      </span>
                    </td>

                    {/* 7D */}
                    <td className="text-right py-0 px-4">
                      <span
                        className={`text-xs font-mono font-medium ${
                          change7d.positive ? "text-[#16a34a]" : "text-[#dc2626]"
                        }`}
                      >
                        {change7d.text}
                      </span>
                    </td>

                    {/* MCAP */}
                    <td className="text-right py-0 px-4">
                      <span className="text-xs font-mono text-[#64748b]">
                        {asset.marketCap ? formatCompact(asset.marketCap) : "—"}
                      </span>
                    </td>

                    {/* VOLUME */}
                    <td className="text-right py-0 px-4">
                      <span className="text-xs font-mono text-[#64748b]">
                        {asset.volume24h ? formatCompact(asset.volume24h) : "—"}
                      </span>
                    </td>

                    {/* 52W HIGH */}
                    <td className="text-right py-0 px-4">
                      <span className="text-xs font-mono text-[#64748b]">
                        {asset.ath ? formatPrice(asset.ath) : "—"}
                      </span>
                    </td>

                    {/* 52W LOW */}
                    <td className="text-right py-0 px-4">
                      <span className="text-xs font-mono text-[#64748b]">
                        {asset.atl ? formatPrice(asset.atl) : "—"}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="text-right py-0 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchlist(asset.id);
                        }}
                        className="text-xs font-medium text-[#dc2626] hover:text-[#b91c1c] transition-colors"
                        aria-label={`Remove ${asset.name} from watchlist`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Last Updated timestamp */}
      {lastUpdated && !isLoading && watchedAssets.length > 0 && (
        <div className="text-right">
          <span className="text-xs text-[#94a3b8] font-mono">
            Updated {lastUpdated.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      )}

      <AssetDetailPanel />
    </div>
  );
}

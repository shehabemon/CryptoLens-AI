import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { useWatchlistStore } from "@/store/watchlistStore";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { PriceFlash } from "@/components/PriceFlash";
import type { Asset } from "@/types/market";

interface WatchlistPanelProps {
  assets: Asset[] | null;
  isLoading: boolean;
}

export function WatchlistPanel({ assets, isLoading }: WatchlistPanelProps) {
  const { watchedIds, isLoaded, fetchWatchlist, removeFromWatchlist } = useWatchlistStore();

  useEffect(() => {
    if (!isLoaded) {
      fetchWatchlist();
    }
  }, [isLoaded, fetchWatchlist]);

  const watchedAssets = assets?.filter((a) => watchedIds.includes(a.id)) ?? [];

  return (
    <Card className="bg-white border-[#e2e5ea] shadow-card rounded-xl">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
          <Star className="h-4 w-4 text-[#2563eb]" aria-hidden="true" />
          Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 px-2 pb-2">
        {isLoading ? (
          <div role="status" aria-label="Loading watchlist">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="w-14 h-3 mb-1" />
                  <Skeleton className="w-10 h-2.5" />
                </div>
                <Skeleton className="w-16 h-3" />
              </div>
            ))}
            <span className="sr-only">Loading watchlist…</span>
          </div>
        ) : watchedAssets.length === 0 ? (
          <p className="text-xs text-[#94a3b8] text-center py-6">
            Star assets to add them here
          </p>
        ) : (
          <div role="list" aria-label="Watched assets">
            {watchedAssets.map((asset) => {
              const positive = asset.changePercent24h >= 0;
              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#f1f3f6] transition-colors group"
                  role="listitem"
                >
                  {asset.image && (
                    <img
                      src={asset.image}
                      alt=""
                      aria-hidden="true"
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0f172a] truncate">{asset.symbol}</p>
                    <p className="text-[10px] text-[#94a3b8] truncate">
                      {asset.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <PriceFlash value={asset.price} className="text-xs font-mono font-semibold text-[#0f172a]">
                      {formatCurrency(asset.price)}
                    </PriceFlash>
                    <div
                      className={`flex items-center justify-end gap-0.5 text-[10px] font-mono font-medium ${
                        positive ? "text-[#16a34a]" : "text-[#dc2626]"
                      }`}
                    >
                      {positive ? (
                        <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />
                      )}
                      <span>{formatPercent(asset.changePercent24h)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(asset.id)}
                    className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-[#dc2626] transition-all"
                    aria-label={`Remove ${asset.name} from watchlist`}
                  >
                    <Star className="h-3 w-3 fill-[#2563eb] text-[#2563eb]" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

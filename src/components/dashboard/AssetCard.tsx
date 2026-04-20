import { memo, useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { useWatchlistStore } from "@/store/watchlistStore";
import { useAssetDetailStore } from "@/store/assetDetailStore";
import { PriceFlash } from "@/components/PriceFlash";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import type { Asset } from "@/types/market";

interface AssetCardProps {
  asset: Asset;
}

export const AssetCard = memo(function AssetCard({ asset }: AssetCardProps) {
  const { addToWatchlist, removeFromWatchlist, isWatched } = useWatchlistStore();
  const openAssetDetail = useAssetDetailStore((s) => s.openAssetDetail);
  const watched = isWatched(asset.id);
  const positive = asset.changePercent24h >= 0;
  const [starAnimate, setStarAnimate] = useState(false);
  const prevWatched = useRef(watched);

  const sparkData = (asset.sparkline ?? [])
    .slice(-24)
    .map((price, i) => ({ i, price }));

  // Star pop animation trigger
  useEffect(() => {
    if (prevWatched.current !== watched) {
      setStarAnimate(true);
      const t = setTimeout(() => setStarAnimate(false), 400);
      prevWatched.current = watched;
      return () => clearTimeout(t);
    }
  }, [watched]);

  const toggleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (watched) {
      removeFromWatchlist(asset.id);
    } else {
      addToWatchlist(asset.id);
    }
  };

  const sparklineLabel =
    sparkData.length > 1
      ? `Sparkline: price ${positive ? "up" : "down"} ${Math.abs(asset.changePercent24h).toFixed(1)}% over 24 hours`
      : undefined;

  return (
    <Card
      className="bg-white border-[#e2e5ea] shadow-card hover:shadow-elevated hover:border-[#cbd1d8] transition-all group cursor-pointer rounded-xl"
      onClick={() => openAssetDetail(asset)}
      role="button"
      tabIndex={0}
      aria-label={`${asset.name} (${asset.symbol}): ${formatCurrency(asset.price)}, ${positive ? "up" : "down"} ${Math.abs(asset.changePercent24h).toFixed(2)}%`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAssetDetail(asset);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            {asset.image && (
              <img
                src={asset.image}
                alt=""
                aria-hidden="true"
                className="w-8 h-8 rounded-full"
                loading="lazy"
              />
            )}
            <div>
              <p className="font-semibold text-sm text-[#0f172a] leading-tight">
                {asset.name}
              </p>
              <p className="text-xs text-[#94a3b8] font-mono">{asset.symbol}</p>
            </div>
          </div>
          <button
            onClick={toggleWatch}
            className="p-1 hover:bg-[#f1f3f6] rounded-md transition-colors"
            aria-label={watched ? `Remove ${asset.name} from watchlist` : `Add ${asset.name} to watchlist`}
            aria-pressed={watched}
          >
            <Star
              className={`h-4 w-4 transition-colors ${starAnimate ? "star-pop" : ""} ${
                watched
                  ? "fill-[#2563eb] text-[#2563eb]"
                  : "text-[#cbd1d8] group-hover:text-[#94a3b8]"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <PriceFlash value={asset.price} className="text-base font-bold font-mono text-[#0f172a]">
              {formatCurrency(asset.price)}
            </PriceFlash>
            <div
              className={`flex items-center gap-1 text-xs font-mono font-semibold mt-0.5 ${
                positive ? "text-[#16a34a]" : "text-[#dc2626]"
              }`}
            >
              {positive ? (
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{formatPercent(asset.changePercent24h)}</span>
            </div>
          </div>

          {sparkData.length > 1 && (
            <div className="w-20 h-10" role="img" aria-label={sparklineLabel}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={positive ? "#16a34a" : "#dc2626"}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export function AssetCardSkeleton() {
  return (
    <Card className="bg-white border-[#e2e5ea] shadow-card rounded-xl" aria-hidden="true">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div>
              <Skeleton className="w-16 h-3.5 mb-1" />
              <Skeleton className="w-10 h-3" />
            </div>
          </div>
          <Skeleton className="w-5 h-5" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <Skeleton className="w-20 h-4 mb-1" />
            <Skeleton className="w-14 h-3" />
          </div>
          <Skeleton className="w-20 h-10" />
        </div>
      </CardContent>
    </Card>
  );
}

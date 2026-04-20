import { memo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { useAssetDetailStore } from "@/store/assetDetailStore";
import type { Asset } from "@/types/market";

interface TopMoversProps {
  assets: Asset[] | null;
  isLoading: boolean;
}

const MoverCard = memo(function MoverCard({ asset }: { asset: Asset }) {
  const openAssetDetail = useAssetDetailStore((s) => s.openAssetDetail);
  const positive = asset.changePercent24h >= 0;
  const sparkData = (asset.sparkline ?? [])
    .slice(-24)
    .map((price, i) => ({ i, price }));

  return (
    <button
      onClick={() => openAssetDetail(asset)}
      className="min-w-[140px] sm:min-w-[160px] bg-white rounded-xl border border-[#e2e5ea] p-3 sm:p-4 shadow-card hover:shadow-elevated hover:border-[#cbd1d8] transition-all text-left cursor-pointer group"
      aria-label={`${asset.name}: ${formatCurrency(asset.price)}, ${positive ? "up" : "down"} ${Math.abs(asset.changePercent24h).toFixed(2)}%`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        {asset.image && (
          <img src={asset.image} alt="" className="w-7 h-7 rounded-full" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0f172a] truncate">{asset.name}</p>
          <p className="text-xs text-[#94a3b8] font-mono">{asset.symbol}</p>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-bold font-mono text-[#0f172a]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCurrency(asset.price)}
          </p>
          <div
            className={`flex items-center gap-1 text-xs font-mono font-semibold mt-0.5 ${positive ? "text-[#16a34a]" : "text-[#dc2626]"
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
          <div className="w-20 h-10 opacity-60 group-hover:opacity-100 transition-opacity hidden sm:block">
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
    </button>
  );
});

function MoverCardSkeleton() {
  return (
    <div className="min-w-[140px] sm:min-w-[160px] bg-white rounded-xl border border-[#e2e5ea] p-3 sm:p-4 shadow-card" aria-hidden="true">
      <div className="flex items-center gap-2.5 mb-3">
        <Skeleton className="w-7 h-7 rounded-full" />
        <div>
          <Skeleton className="w-16 h-3.5 mb-1" />
          <Skeleton className="w-10 h-3" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="w-20 h-4 mb-1" />
          <Skeleton className="w-14 h-3" />
        </div>
        <Skeleton className="w-20 h-10" />
      </div>
    </div>
  );
}

export function TopMovers({ assets, isLoading }: TopMoversProps) {
  if (isLoading || !assets) {
    return (
      <div className="overflow-hidden">
        <h2 className="text-sm font-semibold text-[#0f172a] mb-3">Top Movers</h2>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1" role="status" aria-label="Loading top movers">
          {Array.from({ length: 5 }).map((_, i) => (
            <MoverCardSkeleton key={i} />
          ))}
          <span className="sr-only">Loading top movers…</span>
        </div>
      </div>
    );
  }

  // Top 6 by absolute 24h % change
  const movers = [...assets]
    .sort((a, b) => Math.abs(b.changePercent24h ?? 0) - Math.abs(a.changePercent24h ?? 0))
    .slice(0, 10);

  return (
    <div className="overflow-hidden">
      <h2 className="text-sm font-semibold text-[#0f172a] mb-3">Top Movers</h2>
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {movers.map((asset) => (
          <MoverCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
}

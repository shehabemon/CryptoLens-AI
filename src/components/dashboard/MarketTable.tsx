import { memo, useState, useMemo } from "react";
import { Star, TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatCompact, formatPercent } from "@/lib/utils/formatCurrency";
import { useWatchlistStore } from "@/store/watchlistStore";
import { useAssetDetailStore } from "@/store/assetDetailStore";
import { PriceFlash } from "@/components/PriceFlash";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import type { Asset } from "@/types/market";

type SortKey = "rank" | "price" | "change1h" | "change24h" | "change7d" | "marketCap" | "volume";
type SortDir = "asc" | "desc";

interface MarketTableProps {
  assets: Asset[] | null;
  isLoading: boolean;
}

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "rank", label: "#", align: "left" },
  { key: "price", label: "Price", align: "right" },
  { key: "change1h", label: "1h %", align: "right" },
  { key: "change24h", label: "24h %", align: "right" },
  { key: "change7d", label: "7d %", align: "right" },
  { key: "marketCap", label: "Market Cap", align: "right" },
  { key: "volume", label: "Volume (24h)", align: "right" },
];

function ChangeCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-[#94a3b8]">—</span>;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium ${
        positive ? "text-[#16a34a]" : "text-[#dc2626]"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

const TableRow = memo(function TableRow({ asset, rank }: { asset: Asset; rank: number }) {
  const { addToWatchlist, removeFromWatchlist, isWatched } = useWatchlistStore();
  const openAssetDetail = useAssetDetailStore((s) => s.openAssetDetail);
  const watched = isWatched(asset.id);
  const positive = asset.changePercent24h >= 0;

  const sparkData = (asset.sparkline ?? [])
    .slice(-24)
    .map((price, i) => ({ i, price }));

  const toggleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (watched) removeFromWatchlist(asset.id);
    else addToWatchlist(asset.id);
  };

  return (
    <tr
      className="border-b border-[#f1f3f6] hover:bg-[#f8f9fb] transition-colors cursor-pointer group"
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
      {/* Rank */}
      <td className="py-3.5 px-4 text-sm text-[#94a3b8] font-mono w-10">
        {rank}
      </td>

      {/* Asset */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleWatch}
            className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={watched ? `Remove ${asset.name} from watchlist` : `Add ${asset.name} to watchlist`}
          >
            <Star
              className={`h-3.5 w-3.5 transition-colors ${
                watched
                  ? "fill-[#2563eb] text-[#2563eb] opacity-100"
                  : "text-[#cbd1d8] hover:text-[#2563eb]"
              }`}
              aria-hidden="true"
            />
          </button>
          {asset.image && (
            <img src={asset.image} alt="" className="w-7 h-7 rounded-full shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0f172a] truncate leading-tight">{asset.name}</p>
            <p className="text-xs text-[#94a3b8] font-mono">{asset.symbol}</p>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="py-3.5 px-4 text-right">
        <PriceFlash value={asset.price} className="text-sm font-semibold font-mono text-[#0f172a]">
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCurrency(asset.price)}
          </span>
        </PriceFlash>
      </td>

      {/* 1h */}
      <td className="py-3.5 px-4 text-right"><ChangeCell value={asset.changePercent1h} /></td>
      {/* 24h */}
      <td className="py-3.5 px-4 text-right"><ChangeCell value={asset.changePercent24h} /></td>
      {/* 7d */}
      <td className="py-3.5 px-4 text-right"><ChangeCell value={asset.changePercent7d} /></td>

      {/* MCap */}
      <td className="py-3.5 px-4 text-right">
        <span className="text-sm font-mono text-[#64748b]" style={{ fontVariantNumeric: "tabular-nums" }}>
          ${formatCompact(asset.marketCap ?? 0)}
        </span>
      </td>

      {/* Volume */}
      <td className="py-3.5 px-4 text-right">
        <span className="text-sm font-mono text-[#64748b]" style={{ fontVariantNumeric: "tabular-nums" }}>
          ${formatCompact(asset.volume24h ?? 0)}
        </span>
      </td>

      {/* Sparkline */}
      <td className="py-3.5 px-4">
        {sparkData.length > 1 ? (
          <div className="w-24 h-8 ml-auto">
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
        ) : (
          <span className="text-[#94a3b8] text-xs">—</span>
        )}
      </td>
    </tr>
  );
});

function TableSkeleton() {
  return (
    <>
      {/* Mobile skeleton */}
      <div className="md:hidden space-y-2" role="status" aria-label="Loading market data">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e2e5ea] p-3.5 shadow-card">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-4" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="w-24 h-3.5 mb-1.5" />
                <Skeleton className="w-32 h-3" />
              </div>
              <Skeleton className="w-16 h-8" />
            </div>
          </div>
        ))}
        <span className="sr-only">Loading market data…</span>
      </div>

      {/* Desktop skeleton */}
      <div className="hidden md:block bg-white rounded-xl border border-[#e2e5ea] shadow-card overflow-hidden" role="status" aria-label="Loading market data">
        <div className="px-4 py-3 border-b border-[#f1f3f6] flex gap-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-4 border-b border-[#f1f3f6] flex items-center gap-8">
            <Skeleton className="w-6 h-4" />
            <div className="flex items-center gap-2 flex-[2]">
              <Skeleton className="w-7 h-7 rounded-full" />
              <div>
                <Skeleton className="w-20 h-3.5 mb-1" />
                <Skeleton className="w-10 h-3" />
              </div>
            </div>
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
        <span className="sr-only">Loading market data…</span>
      </div>
    </>
  );
}

export function MarketTable({ assets, isLoading }: MarketTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    if (!assets) return [];
    const arr = [...assets];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "rank": return 0; // natural order
        case "price": return (a.price - b.price) * dir;
        case "change1h": return ((a.changePercent1h ?? 0) - (b.changePercent1h ?? 0)) * dir;
        case "change24h": return ((a.changePercent24h ?? 0) - (b.changePercent24h ?? 0)) * dir;
        case "change7d": return ((a.changePercent7d ?? 0) - (b.changePercent7d ?? 0)) * dir;
        case "marketCap": return ((a.marketCap ?? 0) - (b.marketCap ?? 0)) * dir;
        case "volume": return ((a.volume24h ?? 0) - (b.volume24h ?? 0)) * dir;
        default: return 0;
      }
    });
    if (sortKey === "rank" && sortDir === "desc") arr.reverse();
    return arr;
  }, [assets, sortKey, sortDir]);

  if (isLoading || !assets) return <TableSkeleton />;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 text-[#cbd1d8]" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-[#2563eb]" /> : <ArrowDown className="h-3 w-3 text-[#2563eb]" />;
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-[#0f172a] mb-3">Market</h2>

      {/* Mobile card view */}
      <MobileMarketCards assets={sorted} />

      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-xl border border-[#e2e5ea] shadow-card overflow-x-auto">
        <table className="w-full min-w-[900px]" aria-label="Cryptocurrency market data">
          <thead>
            <tr className="border-b border-[#e2e5ea]">
              {/* # */}
              <th
                scope="col"
                className="text-left text-xs font-medium text-[#94a3b8] py-3 px-4 w-10 cursor-pointer hover:text-[#0f172a] transition-colors"
                onClick={() => handleSort("rank")}
              >
                <div className="flex items-center gap-1"># <SortIcon column="rank" /></div>
              </th>
              {/* Asset - not sortable */}
              <th scope="col" className="text-left text-xs font-medium text-[#94a3b8] py-3 px-4">
                Asset
              </th>
              {COLUMNS.slice(1).map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`text-xs font-medium text-[#94a3b8] py-3 px-4 cursor-pointer hover:text-[#0f172a] transition-colors ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : ""}`}>
                    {col.label} <SortIcon column={col.key} />
                  </div>
                </th>
              ))}
              {/* Sparkline header */}
              <th scope="col" className="text-right text-xs font-medium text-[#94a3b8] py-3 px-4">
                7d Chart
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((asset, i) => (
              <TableRow key={asset.id} asset={asset} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Mobile Market Cards ─── */

const MobileMarketCard = memo(function MobileMarketCard({ asset, rank }: { asset: Asset; rank: number }) {
  const openAssetDetail = useAssetDetailStore((s) => s.openAssetDetail);
  const { addToWatchlist, removeFromWatchlist, isWatched } = useWatchlistStore();
  const watched = isWatched(asset.id);
  const positive = asset.changePercent24h >= 0;

  const sparkData = (asset.sparkline ?? [])
    .slice(-24)
    .map((price, i) => ({ i, price }));

  return (
    <button
      onClick={() => openAssetDetail(asset)}
      className="w-full bg-white rounded-xl border border-[#e2e5ea] p-3.5 shadow-card text-left transition-all active:scale-[0.99]"
      aria-label={`${asset.name}: ${formatCurrency(asset.price)}, ${positive ? "up" : "down"} ${Math.abs(asset.changePercent24h).toFixed(2)}%`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#94a3b8] font-mono w-5 text-right shrink-0">{rank}</span>
        {asset.image && (
          <img src={asset.image} alt="" className="w-8 h-8 rounded-full shrink-0" aria-hidden="true" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-[#0f172a] truncate">{asset.name}</p>
            <span className="text-xs text-[#94a3b8] font-mono shrink-0">{asset.symbol}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <PriceFlash value={asset.price} className="text-sm font-semibold font-mono text-[#0f172a]">
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(asset.price)}
              </span>
            </PriceFlash>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold ${
                positive ? "text-[#16a34a]" : "text-[#dc2626]"
              }`}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(asset.changePercent24h).toFixed(2)}%
            </span>
          </div>
        </div>

        {sparkData.length > 1 && (
          <div className="w-16 h-8 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="price" stroke={positive ? "#16a34a" : "#dc2626"} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </button>
  );
});

function MobileMarketCards({ assets }: { assets: Asset[] }) {
  return (
    <div className="md:hidden space-y-2">
      {assets.map((asset, i) => (
        <MobileMarketCard key={asset.id} asset={asset} rank={i + 1} />
      ))}
    </div>
  );
}

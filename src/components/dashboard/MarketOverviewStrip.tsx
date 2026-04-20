import { TrendingUp, TrendingDown, BarChart3, Globe, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact } from "@/lib/utils/formatCurrency";
import type { Asset } from "@/types/market";

interface MarketOverviewStripProps {
  assets: Asset[] | null;
  isLoading: boolean;
}

interface StatCardData {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
}

function StatCard({ label, value, sub, icon, trend }: StatCardData) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e5ea] p-3 sm:p-4 shadow-card hover:shadow-elevated transition-shadow overflow-hidden min-w-0">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span className="text-[10px] sm:text-xs font-medium text-[#64748b]">{label}</span>
        <span className="text-[#94a3b8] hidden sm:block" aria-hidden="true">{icon}</span>
      </div>
      <p className="text-sm sm:text-lg font-semibold font-mono text-[#0f172a]" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      {sub && (
        <p
          className={`text-[10px] sm:text-xs font-mono font-medium mt-0.5 ${
            trend === "up" ? "text-[#16a34a]" : trend === "down" ? "text-[#dc2626]" : "text-[#64748b]"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e5ea] p-3 sm:p-4 shadow-card" aria-hidden="true">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <Skeleton className="w-16 sm:w-20 h-3" />
        <Skeleton className="w-5 h-5 hidden sm:block" />
      </div>
      <Skeleton className="w-20 sm:w-28 h-5 mb-1" />
      <Skeleton className="w-14 sm:w-16 h-3" />
    </div>
  );
}

export function MarketOverviewStrip({ assets, isLoading }: MarketOverviewStripProps) {
  if (isLoading || !assets) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4" role="status" aria-label="Loading market overview">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
        <span className="sr-only">Loading market data…</span>
      </div>
    );
  }

  const totalMarketCap = assets.reduce((sum, a) => sum + (a.marketCap ?? 0), 0);
  const totalVolume = assets.reduce((sum, a) => sum + (a.volume24h ?? 0), 0);
  const btc = assets.find((a) => a.symbol === "BTC");
  const btcDominance = btc && totalMarketCap > 0
    ? ((btc.marketCap ?? 0) / totalMarketCap * 100)
    : 0;

  // Top gainer by 24h %
  const topGainer = [...assets].sort(
    (a, b) => (b.changePercent24h ?? 0) - (a.changePercent24h ?? 0)
  )[0];

  const stats: StatCardData[] = [
    {
      label: "Total Market Cap",
      value: `$${formatCompact(totalMarketCap)}`,
      icon: <Globe className="h-4 w-4" />,
    },
    {
      label: "24h Volume",
      value: `$${formatCompact(totalVolume)}`,
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: "BTC Dominance",
      value: `${btcDominance.toFixed(1)}%`,
      sub: btc ? `$${formatCompact(btc.marketCap ?? 0)}` : undefined,
      icon: <Activity className="h-4 w-4" />,
    },
    {
      label: "Top Gainer (24h)",
      value: topGainer?.symbol ?? "—",
      sub: topGainer ? `+${topGainer.changePercent24h?.toFixed(2)}%` : undefined,
      trend: "up",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

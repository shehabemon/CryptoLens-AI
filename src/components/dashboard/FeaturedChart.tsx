import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import { useMarketChart } from "@/hooks/useMarketChart";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { PriceFlash } from "@/components/PriceFlash";
import type { TimeRange, MarketChartPoint } from "@/lib/api/coingecko";
import type { Asset } from "@/types/market";

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "1D", value: "1" },
  { label: "7D", value: "7" },
  { label: "1M", value: "30" },
  { label: "3M", value: "90" },
  { label: "1Y", value: "365" },
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: MarketChartPoint; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white border border-[#e2e5ea] rounded-lg px-3 py-2 shadow-elevated">
      <p className="text-xs text-[#94a3b8]">{point.date}</p>
      <p className="text-sm font-semibold font-mono text-[#0f172a]">
        $
        {point.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: point.price < 1 ? 6 : 2,
        })}
      </p>
    </div>
  );
}

interface FeaturedChartProps {
  assets: Asset[] | null;
  isLoading: boolean;
}

export function FeaturedChart({ assets, isLoading: assetsLoading }: FeaturedChartProps) {
  const [range, setRange] = useState<TimeRange>("7");
  const [showPicker, setShowPicker] = useState(false);

  // Default to BTC, allow switching
  const defaultAsset = useMemo(
    () => assets?.find((a) => a.symbol === "BTC") ?? assets?.[0] ?? null,
    [assets]
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const activeAsset = useMemo(
    () => assets?.find((a) => a.id === selectedAssetId) ?? defaultAsset,
    [assets, selectedAssetId, defaultAsset]
  );

  const { data, isLoading: chartLoading, isFetching, isError, refetch } = useMarketChart(
    activeAsset?.id ?? "bitcoin",
    range
  );

  const isUp =
    data && data.length > 1 ? data[data.length - 1].price >= data[0].price : true;

  const positive = activeAsset ? activeAsset.changePercent24h >= 0 : true;

  if (assetsLoading || !activeAsset) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e5ea] p-4 md:p-6 shadow-card overflow-hidden" role="status" aria-label="Loading featured chart">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <Skeleton className="w-32 h-5 mb-2" />
            <Skeleton className="w-48 h-7 mb-1" />
            <Skeleton className="w-20 h-4" />
          </div>
          <Skeleton className="w-48 h-8" />
        </div>
        <Skeleton className="w-full h-[200px] sm:h-[280px]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e2e5ea] p-4 md:p-6 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
        <div>
          {/* Asset selector */}
          <div className="relative inline-block">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 hover:bg-[#f1f3f6] rounded-lg px-2 py-1 -ml-2 transition-colors"
              aria-label="Select asset to chart"
            >
              {activeAsset.image && (
                <img src={activeAsset.image} alt="" className="w-6 h-6 rounded-full" aria-hidden="true" />
              )}
              <span className="text-sm font-semibold text-[#0f172a]">{activeAsset.name}</span>
              <span className="text-xs text-[#94a3b8] font-mono">{activeAsset.symbol}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" aria-hidden="true" />
            </button>

            {showPicker && assets && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#e2e5ea] rounded-xl shadow-dropdown z-50 w-56 max-h-64 overflow-y-auto py-1">
                {assets.slice(0, 10).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAssetId(a.id); setShowPicker(false); }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-[#f1f3f6] transition-colors ${
                      a.id === activeAsset.id ? "bg-[#eff6ff]" : ""
                    }`}
                  >
                    {a.image && <img src={a.image} alt="" className="w-5 h-5 rounded-full" />}
                    <span className="text-sm font-medium text-[#0f172a] flex-1">{a.name}</span>
                    <span className="text-xs text-[#94a3b8] font-mono">{a.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-1 px-2">
            <PriceFlash value={activeAsset.price} className="text-xl sm:text-2xl font-bold font-mono text-[#0f172a]">
              {formatCurrency(activeAsset.price)}
            </PriceFlash>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 text-xs sm:text-sm font-mono font-semibold px-2 py-0.5 rounded-md ${
                  positive
                    ? "text-[#16a34a] bg-[#dcfce7]"
                    : "text-[#dc2626] bg-[#fee2e2]"
                }`}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {formatPercent(activeAsset.changePercent24h)}
              </span>
              <span className="text-xs text-[#94a3b8]">24h</span>
            </div>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-[#f1f3f6] rounded-lg p-1 self-start overflow-x-auto scrollbar-none" role="group" aria-label="Chart time range">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setRange(tr.value)}
              aria-pressed={range === tr.value}
              aria-label={`Show ${tr.label} chart`}
              className={`
                px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap
                ${
                  range === tr.value
                    ? "bg-white text-[#0f172a] shadow-sm font-semibold"
                    : "text-[#64748b] hover:text-[#0f172a]"
                }
              `}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[200px] sm:h-[280px] w-full mt-4">
        {chartLoading ? (
          <div aria-label="Loading chart data" role="status">
            <Skeleton className="h-full w-full rounded-lg" />
            <span className="sr-only">Loading chart data…</span>
          </div>
        ) : isError ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-2 bg-[#fef2f2] rounded-lg border border-[#fecaca]"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 text-[#dc2626]" aria-hidden="true" />
            <p className="text-sm text-[#0f172a]">Unable to load chart</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e5ea] rounded-lg text-xs font-medium text-[#0f172a] hover:border-[#2563eb] transition-colors"
              aria-label="Retry loading chart data"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : (
          <div
            className={`transition-opacity duration-300 ${
              isFetching ? "opacity-50" : "opacity-100"
            }`}
            style={{ height: "100%", width: "100%" }}
            role="img"
            aria-label={`${activeAsset.name} price chart for the selected time range`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data ?? []}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <defs>
                  <linearGradient id="featuredChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isUp ? "#16a34a" : "#dc2626"}
                      stopOpacity={0.12}
                    />
                    <stop
                      offset="100%"
                      stopColor={isUp ? "#16a34a" : "#dc2626"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "'Inter', sans-serif" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#e2e5ea",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isUp ? "#16a34a" : "#dc2626"}
                  strokeWidth={2}
                  fill="url(#featuredChartGradient)"
                  animationDuration={400}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

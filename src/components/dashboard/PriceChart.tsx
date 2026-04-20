import { memo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useMarketChart } from "@/hooks/useMarketChart";
import type { TimeRange } from "@/lib/api/coingecko";
import type { MarketChartPoint } from "@/lib/api/coingecko";

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

function buildChartDescription(data: MarketChartPoint[] | undefined, range: TimeRange): string {
  if (!data || data.length < 2) return "Price chart data unavailable";
  const first = data[0].price;
  const last = data[data.length - 1].price;
  const changePercent = ((last - first) / first) * 100;
  const direction = changePercent >= 0 ? "increased" : "decreased";
  const rangeLabels: Record<TimeRange, string> = {
    "1": "last 24 hours",
    "7": "last 7 days",
    "30": "last 30 days",
    "90": "last 90 days",
    "365": "last year",
  };
  return `Price ${direction} ${Math.abs(changePercent).toFixed(1)}% over the ${rangeLabels[range]}`;
}

interface PriceChartProps {
  coinId: string;
}

export const PriceChart = memo(function PriceChart({ coinId }: PriceChartProps) {
  const [range, setRange] = useState<TimeRange>("7");
  const { data, isLoading, isFetching, isError, refetch } = useMarketChart(coinId, range);

  const isUp =
    data && data.length > 1 ? data[data.length - 1].price >= data[0].price : true;

  const gradientColor = isUp ? "22, 163, 74" : "220, 38, 38";
  const strokeColor = isUp ? "#16a34a" : "#dc2626";

  const chartDescription = buildChartDescription(data, range);

  return (
    <div className="space-y-3">
      {/* Time range selector */}
      <div className="flex items-center gap-1 bg-[#f1f3f6] rounded-lg p-1 w-fit" role="group" aria-label="Chart time range">
        {TIME_RANGES.map((tr) => (
          <button
            key={tr.value}
            onClick={() => setRange(tr.value)}
            aria-pressed={range === tr.value}
            aria-label={`Show ${tr.label} chart`}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-all
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

      {/* Chart area */}
      <div className="relative h-[200px] w-full">
        {isLoading ? (
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
          <>
            {/* Screen-reader text alternative */}
            <p className="sr-only">{chartDescription}</p>
            <div
              className={`transition-opacity duration-300 ${
                isFetching ? "opacity-50" : "opacity-100"
              }`}
              style={{ height: "100%", width: "100%" }}
              role="img"
              aria-label={chartDescription}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data ?? []}
                  margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                >
                  <defs>
                    <linearGradient
                      id={`chartGradient-${coinId}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={`rgb(${gradientColor})`}
                        stopOpacity={0.12}
                      />
                      <stop
                        offset="100%"
                        stopColor={`rgb(${gradientColor})`}
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
                  <YAxis
                    domain={["auto", "auto"]}
                    hide
                  />
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
                    stroke={strokeColor}
                    strokeWidth={2}
                    fill={`url(#chartGradient-${coinId})`}
                    animationDuration={400}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Fetching overlay */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-1 bg-[#e2e5ea] animate-pulse rounded" />
              <div className="w-6 h-1 bg-[#e2e5ea] animate-pulse rounded" style={{ animationDelay: "150ms" }} />
              <div className="w-4 h-1 bg-[#e2e5ea] animate-pulse rounded" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

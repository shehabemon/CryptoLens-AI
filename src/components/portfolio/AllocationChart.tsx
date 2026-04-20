import { memo, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { EnrichedHolding } from "@/types/portfolio";

const COLORS = [
  "#2563eb",   // blue (primary)
  "#16a34a",   // green
  "#f59e0b",   // amber
  "#8b5cf6",   // violet
  "#ec4899",   // pink
  "#06b6d4",   // cyan
  "#f97316",   // orange
  "#14b8a6",   // teal
  "#6366f1",   // indigo
  "#64748b",   // slate
];

interface AllocationChartProps {
  holdings: EnrichedHolding[];
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { name: string; value: number; percent: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#e2e5ea] rounded-lg px-3 py-2 shadow-elevated">
      <p className="text-xs font-semibold text-[#0f172a]">{data.name}</p>
      <p className="text-xs text-[#64748b] font-mono">
        {formatCurrency(data.value)}
      </p>
      <p className="text-xs text-[#64748b] font-mono">
        {data.percent.toFixed(1)}%
      </p>
    </div>
  );
}

function buildAllocationDescription(chartData: { name: string; fullName: string; percent: number }[]): string {
  if (chartData.length === 0) return "No portfolio allocation data";
  const descriptions = chartData
    .slice(0, 5)
    .map((item) => `${item.fullName} (${item.percent.toFixed(1)}%)`);
  const suffix = chartData.length > 5 ? ` and ${chartData.length - 5} more` : "";
  return `Portfolio allocation: ${descriptions.join(", ")}${suffix}`;
}

export const AllocationChart = memo(function AllocationChart({ holdings }: AllocationChartProps) {
  const chartData = useMemo(() => {
    const grouped = new Map<string, { name: string; fullName: string; value: number; percent: number; image: string | undefined }>();

    holdings.forEach((h) => {
      if (h.value <= 0) return;
      
      if (grouped.has(h.symbol)) {
        const existing = grouped.get(h.symbol)!;
        existing.value += h.value;
        existing.percent += h.allocation;
      } else {
        grouped.set(h.symbol, {
          name: h.symbol,
          fullName: h.name,
          value: h.value,
          percent: h.allocation,
          image: h.image,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.value - a.value);
  }, [holdings]);

  const allocationDescription = useMemo(
    () => buildAllocationDescription(chartData),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#94a3b8] text-sm" role="status">
        No holdings to display
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Screen reader text alternative */}
      <p className="sr-only">{allocationDescription}</p>

      {/* Pie */}
      <div className="flex-shrink-0 h-[220px]" role="img" aria-label={allocationDescription}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="percent"
              nameKey="name"
              minAngle={5}
              strokeWidth={0}
              animationBegin={0}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 overflow-y-auto mt-2 space-y-0.5" role="list" aria-label="Allocation breakdown">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#f8f9fb] rounded-md transition-colors"
            role="listitem"
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
              aria-hidden="true"
            />
            {item.image && (
              <img
                src={item.image}
                alt=""
                aria-hidden="true"
                className="w-4 h-4 rounded-full flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#0f172a] truncate">{item.fullName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-mono font-semibold text-[#0f172a]">
                {item.percent.toFixed(1)}%
              </p>
              <p className="text-[10px] text-[#94a3b8] font-mono">
                {formatCurrency(item.value)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

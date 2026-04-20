import type { EnrichedHolding, PortfolioSummary } from "@/types/portfolio";

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPnl(pnl: number, pnlPercent: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${formatUSD(pnl)} / ${sign}${pnlPercent.toFixed(1)}%`;
}

export function buildPortfolioContext(
  holdings: EnrichedHolding[],
  summary: PortfolioSummary
): string {
  if (holdings.length === 0) return "";

  const holdingLines = holdings
    .map(
      (h) =>
        `${h.name} (${h.symbol}): ${h.amount} units, current price ${formatUSD(
          h.currentPrice
        )}, value ${formatUSD(h.value)}, buy price ${formatUSD(
          h.buyPrice
        )}, P&L: ${formatPnl(h.pnl, h.pnlPercent)}, allocation: ${h.allocation.toFixed(1)}%`
    )
    .join("\n");

  return `User portfolio:
${holdingLines}

Total portfolio value: ${formatUSD(summary.totalValue)}
Total invested: ${formatUSD(summary.totalInvested)}
Total P&L: ${formatPnl(summary.totalPnl, summary.totalPnlPercent)}
Number of holdings: ${holdings.length}`;
}

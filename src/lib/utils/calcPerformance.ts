export function calcPnl(currentPrice: number, avgBuyPrice: number, quantity: number) {
  const pnl = (currentPrice - avgBuyPrice) * quantity;
  const pnlPercent = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;
  return { pnl, pnlPercent };
}

export function calcAllocation(holdingValue: number, totalValue: number): number {
  return totalValue > 0 ? (holdingValue / totalValue) * 100 : 0;
}

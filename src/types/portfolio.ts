export interface Holding {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  image?: string;
  amount: number;
  buyPrice: number;
  buyDate: string; // ISO date string
}

export interface EnrichedHolding extends Holding {
  currentPrice: number;
  value: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercent: number;
}

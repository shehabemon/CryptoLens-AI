export interface Asset {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  changePercent1h?: number | null;
  changePercent7d?: number | null;
  marketCap?: number;
  volume24h?: number;
  sparkline?: number[];
  circulatingSupply?: number;
  ath?: number;
  athDate?: string;
  atl?: number;
  atlDate?: string;
  type: "crypto" | "stock";
}

export interface MarketOverviewData {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  fearGreedIndex: number;
}

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

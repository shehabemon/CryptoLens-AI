import { cache } from "../lib/cache.js";
import { logger } from "../lib/logger.js";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const MARKET_CACHE_TTL = 30_000; // 30 seconds
const CHART_CACHE_TTL = 60_000; // 60 seconds

export interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
  sparkline_in_7d: { price: number[] } | null;
  circulating_supply: number | null;
  ath: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_date: string | null;
}

export async function fetchTopCryptos(): Promise<CoinGeckoMarket[]> {
  const cacheKey = "market:top";
  const cached = cache.get<CoinGeckoMarket[]>(cacheKey);
  if (cached) {
    logger.debug("Market data served from cache");
    return cached;
  }

  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "30",
    page: "1",
    sparkline: "true",
    price_change_percentage: "1h,24h,7d",
  });

  const res = await fetch(`${COINGECKO_BASE}/coins/markets?${params}`);

  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data: CoinGeckoMarket[] = await res.json();
  cache.set(cacheKey, data, MARKET_CACHE_TTL);

  logger.debug({ count: data.length }, "Market data fetched and cached");
  return data;
}

export type TimeRange = "1" | "7" | "30" | "90" | "365";

export interface MarketChartResponse {
  prices: [number, number][];
}

export async function fetchMarketChart(
  coinId: string,
  days: TimeRange
): Promise<MarketChartResponse> {
  const cacheKey = `chart:${coinId}:${days}`;
  const cached = cache.get<MarketChartResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    vs_currency: "usd",
    days,
  });

  const res = await fetch(
    `${COINGECKO_BASE}/coins/${encodeURIComponent(coinId)}/market_chart?${params}`
  );

  if (!res.ok) {
    throw new Error(`CoinGecko chart API error: ${res.status}`);
  }

  const data: MarketChartResponse = await res.json();
  cache.set(cacheKey, data, CHART_CACHE_TTL);

  return data;
}

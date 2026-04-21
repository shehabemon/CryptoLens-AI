import { apiFetch } from "@/lib/api/client";
import type { Asset } from "@/types/market";

export async function fetchTopCryptos(): Promise<Asset[]> {
  const res = await apiFetch("/api/market/top");

  if (!res.ok) {
    throw new Error(`Market API error: ${res.status}`);
  }

  return res.json();
}

export type TimeRange = "1" | "7" | "30" | "90" | "365";

export interface MarketChartPoint {
  timestamp: number;
  price: number;
  date: string;
}

export async function fetchMarketChart(
  coinId: string,
  days: TimeRange
): Promise<MarketChartPoint[]> {
  const res = await apiFetch(`/api/market/chart/${coinId}?days=${days}`);

  if (!res.ok) {
    throw new Error(`Market chart API error: ${res.status}`);
  }

  return res.json();
}

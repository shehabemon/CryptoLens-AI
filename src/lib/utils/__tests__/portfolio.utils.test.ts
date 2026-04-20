import { describe, it, expect } from "vitest";
import type { Holding } from "@/types/portfolio";
import type { Asset } from "@/types/market";

interface EnrichedHolding {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  image?: string;
  amount: number;
  buyPrice: number;
  buyDate: string;
  currentPrice: number;
  value: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

function enrichHoldings(holdings: Holding[], assets: Asset[]): EnrichedHolding[] {
  if (assets.length === 0 || holdings.length === 0) return [];

  const priceMap = new Map(assets.map((a) => [a.id, a]));

  const raw = holdings.map((h) => {
    const asset = priceMap.get(h.assetId);
    const currentPrice = asset?.price ?? h.buyPrice;
    const value = h.amount * currentPrice;
    const invested = h.amount * h.buyPrice;
    const pnl = value - invested;
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

    return {
      ...h,
      image: asset?.image ?? h.image,
      currentPrice,
      value,
      invested,
      pnl,
      pnlPercent,
      allocation: 0,
    };
  });

  const totalValue = raw.reduce((sum, h) => sum + h.value, 0);

  return raw.map((h) => ({
    ...h,
    allocation: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
  }));
}

function computeSummary(enriched: EnrichedHolding[]) {
  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  const totalInvested = enriched.reduce((s, h) => s + h.invested, 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  return { totalValue, totalInvested, totalPnl, totalPnlPercent };
}

const btcHolding: Holding = {
  id: "h1",
  assetId: "bitcoin",
  symbol: "BTC",
  name: "Bitcoin",
  amount: 1,
  buyPrice: 40_000,
  buyDate: "2024-01-01",
};

const ethHolding: Holding = {
  id: "h2",
  assetId: "ethereum",
  symbol: "ETH",
  name: "Ethereum",
  amount: 2,
  buyPrice: 2_000,
  buyDate: "2024-01-01",
};

const btcAsset: Asset = {
  id: "bitcoin",
  symbol: "btc",
  name: "Bitcoin",
  price: 50_000,
  change24h: 1000,
  changePercent24h: 2.5,
  type: "crypto",
};

const ethAsset: Asset = {
  id: "ethereum",
  symbol: "eth",
  name: "Ethereum",
  price: 3_000,
  change24h: 100,
  changePercent24h: 3.4,
  type: "crypto",
};

describe("Portfolio financial calculations", () => {
  describe("enrichHoldings()", () => {
    it("calculates value as amount × currentPrice", () => {
      const [btc] = enrichHoldings([btcHolding], [btcAsset]);
      expect(btc.value).toBe(50_000);
    });

    it("calculates invested as amount × buyPrice", () => {
      const [btc] = enrichHoldings([btcHolding], [btcAsset]);
      expect(btc.invested).toBe(40_000);
    });

    it("calculates pnl as value - invested", () => {
      const [btc] = enrichHoldings([btcHolding], [btcAsset]);
      expect(btc.pnl).toBe(10_000);
    });

    it("calculates pnlPercent as (pnl / invested) * 100", () => {
      const [btc] = enrichHoldings([btcHolding], [btcAsset]);
      expect(btc.pnlPercent).toBe(25);
    });

    it("calculates correct negative pnl when price fell", () => {
      const asset: Asset = { ...btcAsset, price: 30_000 };
      const [btc] = enrichHoldings([btcHolding], [asset]);
      expect(btc.pnl).toBe(-10_000);
      expect(btc.pnlPercent).toBeCloseTo(-25, 5);
    });

    it("falls back to buyPrice when asset is not in market data", () => {
      const [btc] = enrichHoldings([btcHolding], [ethAsset]);
      expect(btc.currentPrice).toBe(btcHolding.buyPrice);
      expect(btc.pnl).toBe(0);
    });

    it("returns empty array when holdings is empty", () => {
      expect(enrichHoldings([], [btcAsset])).toHaveLength(0);
    });

    it("returns empty array when assets is empty", () => {
      expect(enrichHoldings([btcHolding], [])).toHaveLength(0);
    });
  });

  describe("allocation calculation", () => {
    it("allocations sum to 100 for multiple holdings", () => {
      const enriched = enrichHoldings([btcHolding, ethHolding], [btcAsset, ethAsset]);
      const total = enriched.reduce((sum, h) => sum + h.allocation, 0);
      expect(total).toBeCloseTo(100, 5);
    });

    it("assigns 100% to a single holding", () => {
      const [btc] = enrichHoldings([btcHolding], [btcAsset]);
      expect(btc.allocation).toBe(100);
    });

    it("weighs allocation by current value, not invested amount", () => {
      const enriched = enrichHoldings([btcHolding, ethHolding], [btcAsset, ethAsset]);
      const btc = enriched.find((h) => h.assetId === "bitcoin")!;
      const eth = enriched.find((h) => h.assetId === "ethereum")!;

      // BTC: $50k, ETH: $6k, total $56k
      expect(btc.allocation).toBeCloseTo((50_000 / 56_000) * 100, 4);
      expect(eth.allocation).toBeCloseTo((6_000 / 56_000) * 100, 4);
    });
  });

  describe("computeSummary()", () => {
    it("returns zeroed summary for empty holdings", () => {
      expect(computeSummary([])).toEqual({
        totalValue: 0,
        totalInvested: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
      });
    });

    it("correctly sums totalValue and totalInvested", () => {
      const enriched = enrichHoldings([btcHolding, ethHolding], [btcAsset, ethAsset]);
      const summary = computeSummary(enriched);
      // BTC: value=50k, invested=40k; ETH: value=6k, invested=4k
      expect(summary.totalValue).toBe(56_000);
      expect(summary.totalInvested).toBe(44_000);
    });

    it("correctly computes totalPnl and totalPnlPercent", () => {
      const enriched = enrichHoldings([btcHolding, ethHolding], [btcAsset, ethAsset]);
      const summary = computeSummary(enriched);
      expect(summary.totalPnl).toBe(12_000);
      expect(summary.totalPnlPercent).toBeCloseTo((12_000 / 44_000) * 100, 4);
    });

    it("guards against division by zero when totalInvested is 0", () => {
      const zeroHolding: Holding = { ...btcHolding, buyPrice: 0, amount: 0 };
      const enriched = enrichHoldings([zeroHolding], [btcAsset]);
      expect(computeSummary(enriched).totalPnlPercent).toBe(0);
    });
  });
});

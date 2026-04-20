import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { usePortfolioStore } from "@/store/portfolioStore";
import * as marketDataModule from "@/hooks/useMarketData";
import type { Holding } from "@/types/portfolio";
import type { Asset } from "@/types/market";

vi.mock("@/store/portfolioStore");
vi.mock("@/hooks/useMarketData");

const mockUsePortfolioStore = vi.mocked(usePortfolioStore);
const mockUseMarketData = vi.mocked(marketDataModule.useMarketData);

const mockHolding: Holding = {
  id: "h1",
  assetId: "bitcoin",
  symbol: "BTC",
  name: "Bitcoin",
  amount: 1,
  buyPrice: 40_000,
  buyDate: "2024-01-01",
};

const mockAsset: Asset = {
  id: "bitcoin",
  symbol: "btc",
  name: "Bitcoin",
  price: 50_000,
  change24h: 1000,
  changePercent24h: 2.5,
  type: "crypto",
};

const mockFetchHoldings = vi.fn();

function setupStoreMock(overrides: { holdings?: Holding[]; isLoaded?: boolean }) {
  mockUsePortfolioStore.mockReturnValue({
    holdings: overrides.holdings ?? [],
    isLoaded: overrides.isLoaded ?? true,
    fetchHoldings: mockFetchHoldings,
    addHolding: vi.fn(),
    removeHolding: vi.fn(),
    updateHolding: vi.fn(),
    clearHoldings: vi.fn(),
  });
}

function setupMarketMock(overrides: { data?: Asset[] | null; isLoading?: boolean; isError?: boolean }) {
  mockUseMarketData.mockReturnValue({
    data: overrides.data ?? [mockAsset],
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    error: null,
    refetch: vi.fn() as any,
    lastUpdated: null,
  });
}

describe("usePortfolio()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStoreMock({ holdings: [mockHolding], isLoaded: true });
    setupMarketMock({ data: [mockAsset] });
  });

  it("returns empty holdings and isEmpty when store is empty", () => {
    setupStoreMock({ holdings: [], isLoaded: true });

    const { result } = renderHook(() => usePortfolio());

    expect(result.current.holdings).toHaveLength(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it("enriches holdings with currentPrice from market data", () => {
    const { result } = renderHook(() => usePortfolio());
    expect(result.current.holdings[0].currentPrice).toBe(50_000);
  });

  it("computes value = amount × currentPrice", () => {
    const { result } = renderHook(() => usePortfolio());
    expect(result.current.holdings[0].value).toBe(50_000);
  });

  it("computes pnl = value - invested", () => {
    const { result } = renderHook(() => usePortfolio());
    expect(result.current.holdings[0].pnl).toBe(10_000);
  });

  it("computes pnlPercent correctly", () => {
    const { result } = renderHook(() => usePortfolio());
    expect(result.current.holdings[0].pnlPercent).toBe(25);
  });

  it("computes summary totals", () => {
    const { result } = renderHook(() => usePortfolio());
    expect(result.current.summary.totalValue).toBe(50_000);
    expect(result.current.summary.totalInvested).toBe(40_000);
    expect(result.current.summary.totalPnl).toBe(10_000);
  });

  it("returns isLoading when store is not loaded yet", () => {
    setupStoreMock({ holdings: [], isLoaded: false });

    const { result } = renderHook(() => usePortfolio());

    expect(result.current.isLoading).toBe(true);
  });

  it("returns isLoading when market data is fetching", () => {
    setupMarketMock({ data: null, isLoading: true });

    const { result } = renderHook(() => usePortfolio());

    expect(result.current.isLoading).toBe(true);
  });

  it("returns isError when market data fails", () => {
    setupMarketMock({ data: null, isError: true });

    const { result } = renderHook(() => usePortfolio());

    expect(result.current.isError).toBe(true);
  });

  it("calls fetchHoldings on mount when not yet loaded", () => {
    setupStoreMock({ holdings: [], isLoaded: false });

    renderHook(() => usePortfolio());

    expect(mockFetchHoldings).toHaveBeenCalledTimes(1);
  });

  it("does not call fetchHoldings when already loaded", () => {
    setupStoreMock({ holdings: [mockHolding], isLoaded: true });

    renderHook(() => usePortfolio());

    expect(mockFetchHoldings).not.toHaveBeenCalled();
  });

  it("falls back to buyPrice when the asset is not in market data", () => {
    const ethAsset: Asset = { ...mockAsset, id: "ethereum", symbol: "eth" };
    setupMarketMock({ data: [ethAsset] });

    const { result } = renderHook(() => usePortfolio());

    expect(result.current.holdings[0].currentPrice).toBe(40_000);
    expect(result.current.holdings[0].pnl).toBe(0);
  });
});

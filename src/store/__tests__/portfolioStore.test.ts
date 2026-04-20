import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePortfolioStore } from "@/store/portfolioStore";
import * as clientModule from "@/lib/api/client";
import type { Holding } from "@/types/portfolio";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return { ...actual, apiJson: vi.fn() };
});

const mockApiJson = vi.mocked(clientModule.apiJson);

const serverHolding = {
  id: "h1",
  assetId: "bitcoin",
  symbol: "BTC",
  name: "Bitcoin",
  image: null,
  amount: 1.5,
  buyPrice: 40_000,
  buyDate: "2024-01-01T00:00:00.000Z",
};

const mappedHolding: Holding = {
  id: "h1",
  assetId: "bitcoin",
  symbol: "BTC",
  name: "Bitcoin",
  image: undefined,
  amount: 1.5,
  buyPrice: 40_000,
  buyDate: "2024-01-01T00:00:00.000Z",
};

function resetStore() {
  usePortfolioStore.setState({ holdings: [], isLoaded: false });
}

describe("usePortfolioStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  describe("fetchHoldings()", () => {
    it("populates holdings and sets isLoaded on success", async () => {
      mockApiJson.mockResolvedValueOnce({ holdings: [serverHolding] });

      await usePortfolioStore.getState().fetchHoldings();

      const state = usePortfolioStore.getState();
      expect(state.holdings).toHaveLength(1);
      expect(state.holdings[0]).toEqual(mappedHolding);
      expect(state.isLoaded).toBe(true);
    });

    it("maps null image to undefined", async () => {
      mockApiJson.mockResolvedValueOnce({ holdings: [serverHolding] });

      await usePortfolioStore.getState().fetchHoldings();

      expect(usePortfolioStore.getState().holdings[0].image).toBeUndefined();
    });

    it("sets isLoaded and empties holdings when API throws", async () => {
      mockApiJson.mockRejectedValueOnce(new Error("Unauthorized"));

      await usePortfolioStore.getState().fetchHoldings();

      const state = usePortfolioStore.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.holdings).toHaveLength(0);
    });

    it("handles an empty response from the server", async () => {
      mockApiJson.mockResolvedValueOnce({ holdings: [] });

      await usePortfolioStore.getState().fetchHoldings();

      expect(usePortfolioStore.getState().holdings).toHaveLength(0);
      expect(usePortfolioStore.getState().isLoaded).toBe(true);
    });
  });

  describe("addHolding()", () => {
    it("prepends the new holding to the list", async () => {
      usePortfolioStore.setState({ holdings: [mappedHolding], isLoaded: true });

      const newServerHolding = { ...serverHolding, id: "h2", assetId: "ethereum", symbol: "ETH" };
      mockApiJson.mockResolvedValueOnce({ holding: newServerHolding });

      await usePortfolioStore.getState().addHolding({
        assetId: "ethereum",
        symbol: "ETH",
        name: "Ethereum",
        amount: 5,
        buyPrice: 2_000,
        buyDate: "2024-02-01T00:00:00.000Z",
      });

      const { holdings } = usePortfolioStore.getState();
      expect(holdings).toHaveLength(2);
      expect(holdings[0].id).toBe("h2");
      expect(holdings[1].id).toBe("h1");
    });
  });

  describe("removeHolding()", () => {
    it("removes the holding with the given id", async () => {
      const holdingB: Holding = { ...mappedHolding, id: "h2", assetId: "ethereum" };
      usePortfolioStore.setState({ holdings: [mappedHolding, holdingB], isLoaded: true });
      mockApiJson.mockResolvedValueOnce(undefined);

      await usePortfolioStore.getState().removeHolding("h1");

      const { holdings } = usePortfolioStore.getState();
      expect(holdings).toHaveLength(1);
      expect(holdings[0].id).toBe("h2");
    });

    it("does not remove other holdings", async () => {
      const holdingB: Holding = { ...mappedHolding, id: "h2" };
      usePortfolioStore.setState({ holdings: [mappedHolding, holdingB], isLoaded: true });
      mockApiJson.mockResolvedValueOnce(undefined);

      await usePortfolioStore.getState().removeHolding("h2");

      expect(usePortfolioStore.getState().holdings[0].id).toBe("h1");
    });
  });

  describe("updateHolding()", () => {
    it("replaces the updated holding in place, leaving others unchanged", async () => {
      const holdingB: Holding = { ...mappedHolding, id: "h2", symbol: "ETH" };
      usePortfolioStore.setState({ holdings: [mappedHolding, holdingB], isLoaded: true });

      const updatedServerHolding = { ...serverHolding, amount: 3 };
      mockApiJson.mockResolvedValueOnce({ holding: updatedServerHolding });

      await usePortfolioStore.getState().updateHolding("h1", { amount: 3 });

      const { holdings } = usePortfolioStore.getState();
      expect(holdings[0].amount).toBe(3);
      expect(holdings[1].symbol).toBe("ETH");
    });
  });

  describe("clearHoldings()", () => {
    it("resets holdings and isLoaded", () => {
      usePortfolioStore.setState({ holdings: [mappedHolding], isLoaded: true });

      usePortfolioStore.getState().clearHoldings();

      const state = usePortfolioStore.getState();
      expect(state.holdings).toHaveLength(0);
      expect(state.isLoaded).toBe(false);
    });
  });
});

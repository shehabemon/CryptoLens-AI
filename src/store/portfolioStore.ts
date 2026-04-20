import { create } from "zustand";
import { apiJson } from "@/lib/api/client";
import type { Holding } from "@/types/portfolio";

interface HoldingResponse {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  image: string | null;
  amount: number;
  buyPrice: number;
  buyDate: string;
}

function mapHolding(h: HoldingResponse): Holding {
  return {
    id: h.id,
    assetId: h.assetId,
    symbol: h.symbol,
    name: h.name,
    image: h.image ?? undefined,
    amount: h.amount,
    buyPrice: h.buyPrice,
    buyDate: h.buyDate,
  };
}

interface PortfolioState {
  holdings: Holding[];
  isLoaded: boolean;
  fetchHoldings: () => Promise<void>;
  addHolding: (holding: Omit<Holding, "id">) => Promise<void>;
  removeHolding: (id: string) => Promise<void>;
  updateHolding: (id: string, updates: Partial<Omit<Holding, "id">>) => Promise<void>;
  clearHoldings: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  holdings: [],
  isLoaded: false,

  fetchHoldings: async () => {
    try {
      const data = await apiJson<{ holdings: HoldingResponse[] }>("/api/portfolio");
      set({ holdings: data.holdings.map(mapHolding), isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  addHolding: async (holding) => {
    const data = await apiJson<{ holding: HoldingResponse }>("/api/portfolio", {
      method: "POST",
      body: JSON.stringify(holding),
    });
    set((s) => ({
      holdings: [mapHolding(data.holding), ...s.holdings],
    }));
  },

  removeHolding: async (id) => {
    await apiJson(`/api/portfolio/${id}`, { method: "DELETE" });
    set((s) => ({
      holdings: s.holdings.filter((h) => h.id !== id),
    }));
  },

  updateHolding: async (id, updates) => {
    const data = await apiJson<{ holding: HoldingResponse }>(
      `/api/portfolio/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      }
    );
    set((s) => ({
      holdings: s.holdings.map((h) =>
        h.id === id ? mapHolding(data.holding) : h
      ),
    }));
  },

  clearHoldings: () => set({ holdings: [], isLoaded: false }),
}));

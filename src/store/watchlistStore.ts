import { create } from "zustand";
import { apiJson } from "@/lib/api/client";

interface WatchlistState {
  watchedIds: string[];
  isLoaded: boolean;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (id: string) => Promise<void>;
  removeFromWatchlist: (id: string) => Promise<void>;
  isWatched: (id: string) => boolean;
  clearWatchlist: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchedIds: [],
  isLoaded: false,

  fetchWatchlist: async () => {
    try {
      const data = await apiJson<{ watchedIds: string[] }>("/api/watchlist");
      set({ watchedIds: data.watchedIds, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  addToWatchlist: async (id) => {
    // Optimistic update
    set((s) => ({
      watchedIds: s.watchedIds.includes(id) ? s.watchedIds : [...s.watchedIds, id],
    }));
    try {
      await apiJson("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ assetId: id }),
      });
    } catch {
      // Rollback on error
      set((s) => ({
        watchedIds: s.watchedIds.filter((w) => w !== id),
      }));
    }
  },

  removeFromWatchlist: async (id) => {
    const previous = get().watchedIds;
    // Optimistic update
    set((s) => ({
      watchedIds: s.watchedIds.filter((w) => w !== id),
    }));
    try {
      await apiJson(`/api/watchlist/${id}`, { method: "DELETE" });
    } catch {
      // Rollback on error
      set({ watchedIds: previous });
    }
  },

  isWatched: (id) => get().watchedIds.includes(id),

  clearWatchlist: () => set({ watchedIds: [], isLoaded: false }),
}));

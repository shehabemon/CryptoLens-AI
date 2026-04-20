import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWatchlistStore } from "@/store/watchlistStore";
import * as clientModule from "@/lib/api/client";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return { ...actual, apiJson: vi.fn() };
});

const mockApiJson = vi.mocked(clientModule.apiJson);

function resetStore() {
  useWatchlistStore.setState({ watchedIds: [], isLoaded: false });
}

describe("useWatchlistStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  describe("fetchWatchlist()", () => {
    it("populates watchedIds and sets isLoaded", async () => {
      mockApiJson.mockResolvedValueOnce({ watchedIds: ["bitcoin", "ethereum"] });

      await useWatchlistStore.getState().fetchWatchlist();

      const state = useWatchlistStore.getState();
      expect(state.watchedIds).toEqual(["bitcoin", "ethereum"]);
      expect(state.isLoaded).toBe(true);
    });

    it("sets isLoaded and clears ids on API error", async () => {
      mockApiJson.mockRejectedValueOnce(new Error("Unauthorized"));

      await useWatchlistStore.getState().fetchWatchlist();

      const state = useWatchlistStore.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.watchedIds).toHaveLength(0);
    });
  });

  describe("addToWatchlist()", () => {
    it("optimistically adds the id before the API resolves", async () => {
      let resolveApi!: () => void;
      const apiPromise = new Promise<void>((res) => { resolveApi = res; });
      mockApiJson.mockReturnValueOnce(apiPromise as unknown as Promise<unknown>);

      const addPromise = useWatchlistStore.getState().addToWatchlist("bitcoin");

      expect(useWatchlistStore.getState().watchedIds).toContain("bitcoin");

      resolveApi();
      await addPromise;
    });

    it("keeps the id in the list after the API succeeds", async () => {
      mockApiJson.mockResolvedValueOnce({});

      await useWatchlistStore.getState().addToWatchlist("bitcoin");

      expect(useWatchlistStore.getState().watchedIds).toContain("bitcoin");
    });

    it("rolls back the optimistic add when the API throws", async () => {
      mockApiJson.mockRejectedValueOnce(new Error("Server error"));

      await useWatchlistStore.getState().addToWatchlist("bitcoin");

      expect(useWatchlistStore.getState().watchedIds).not.toContain("bitcoin");
    });

    it("does not duplicate an id already in the list", async () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin"], isLoaded: true });
      mockApiJson.mockResolvedValueOnce({});

      await useWatchlistStore.getState().addToWatchlist("bitcoin");

      expect(useWatchlistStore.getState().watchedIds.filter((id) => id === "bitcoin")).toHaveLength(1);
    });
  });

  describe("removeFromWatchlist()", () => {
    it("optimistically removes the id before the API resolves", async () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin", "ethereum"], isLoaded: true });

      let resolveApi!: () => void;
      const apiPromise = new Promise<void>((res) => { resolveApi = res; });
      mockApiJson.mockReturnValueOnce(apiPromise as unknown as Promise<unknown>);

      const removePromise = useWatchlistStore.getState().removeFromWatchlist("bitcoin");

      expect(useWatchlistStore.getState().watchedIds).not.toContain("bitcoin");

      resolveApi();
      await removePromise;
    });

    it("keeps the id removed after the API succeeds", async () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin"], isLoaded: true });
      mockApiJson.mockResolvedValueOnce(undefined);

      await useWatchlistStore.getState().removeFromWatchlist("bitcoin");

      expect(useWatchlistStore.getState().watchedIds).not.toContain("bitcoin");
    });

    it("rolls back and restores the list when the API throws", async () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin", "ethereum"], isLoaded: true });
      mockApiJson.mockRejectedValueOnce(new Error("Server error"));

      await useWatchlistStore.getState().removeFromWatchlist("bitcoin");

      expect(useWatchlistStore.getState().watchedIds).toContain("bitcoin");
      expect(useWatchlistStore.getState().watchedIds).toContain("ethereum");
    });
  });

  describe("isWatched()", () => {
    it("returns true for a watched asset", () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin"], isLoaded: true });
      expect(useWatchlistStore.getState().isWatched("bitcoin")).toBe(true);
    });

    it("returns false for an unwatched asset", () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin"], isLoaded: true });
      expect(useWatchlistStore.getState().isWatched("ethereum")).toBe(false);
    });

    it("returns false when the list is empty", () => {
      expect(useWatchlistStore.getState().isWatched("bitcoin")).toBe(false);
    });
  });

  describe("clearWatchlist()", () => {
    it("empties watchedIds and resets isLoaded", () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin", "ethereum"], isLoaded: true });

      useWatchlistStore.getState().clearWatchlist();

      const state = useWatchlistStore.getState();
      expect(state.watchedIds).toHaveLength(0);
      expect(state.isLoaded).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useWatchlistStore } from "@/store/watchlistStore";
import * as clientModule from "@/lib/api/client";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    apiJson: vi.fn(),
    setAccessToken: vi.fn(),
  };
});

const mockApiJson = vi.mocked(clientModule.apiJson);
const mockSetAccessToken = vi.mocked(clientModule.setAccessToken);

const mockUser = { id: "user-1", email: "test@example.com", name: "Test User" };
const mockAccessToken = "eyJhbGciOiJIUzI1NiJ9.test";

function resetStores() {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  usePortfolioStore.setState({ holdings: [], isLoaded: false });
  useWatchlistStore.setState({ watchedIds: [], isLoaded: false });
}

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login()", () => {
    it("sets user and isAuthenticated on success", async () => {
      mockApiJson.mockResolvedValueOnce({ user: mockUser, accessToken: mockAccessToken });

      await useAuthStore.getState().login("test@example.com", "Password1");

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("calls setAccessToken with the received token", async () => {
      mockApiJson.mockResolvedValueOnce({ user: mockUser, accessToken: mockAccessToken });

      await useAuthStore.getState().login("test@example.com", "Password1");

      expect(mockSetAccessToken).toHaveBeenCalledWith(mockAccessToken);
    });

    it("clears portfolio holdings before setting new user", async () => {
      usePortfolioStore.setState({
        holdings: [{ id: "h1", assetId: "bitcoin", symbol: "BTC", name: "Bitcoin", amount: 1, buyPrice: 40000, buyDate: "2024-01-01" }],
        isLoaded: true,
      });

      mockApiJson.mockResolvedValueOnce({ user: mockUser, accessToken: mockAccessToken });
      await useAuthStore.getState().login("test@example.com", "Password1");

      expect(usePortfolioStore.getState().holdings).toHaveLength(0);
    });

    it("clears watchlist before setting new user", async () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin", "ethereum"], isLoaded: true });

      mockApiJson.mockResolvedValueOnce({ user: mockUser, accessToken: mockAccessToken });
      await useAuthStore.getState().login("test@example.com", "Password1");

      expect(useWatchlistStore.getState().watchedIds).toHaveLength(0);
    });

    it("propagates errors and stays unauthenticated", async () => {
      mockApiJson.mockRejectedValueOnce(new Error("Invalid email or password"));

      await expect(
        useAuthStore.getState().login("test@example.com", "wrong")
      ).rejects.toThrow("Invalid email or password");

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("register()", () => {
    it("sets user and isAuthenticated on success", async () => {
      mockApiJson.mockResolvedValueOnce({ user: mockUser, accessToken: mockAccessToken });

      await useAuthStore.getState().register("test@example.com", "Password1", "Test");

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("calls setAccessToken", async () => {
      mockApiJson.mockResolvedValueOnce({ user: mockUser, accessToken: mockAccessToken });

      await useAuthStore.getState().register("test@example.com", "Password1");

      expect(mockSetAccessToken).toHaveBeenCalledWith(mockAccessToken);
    });

    it("clears watchlist before setting user", async () => {
      useWatchlistStore.setState({ watchedIds: ["bitcoin"], isLoaded: true });

      mockApiJson.mockResolvedValueOnce({ user: mockUser, accessToken: mockAccessToken });
      await useAuthStore.getState().register("new@example.com", "Password1");

      expect(useWatchlistStore.getState().watchedIds).toHaveLength(0);
    });
  });

  describe("logout()", () => {
    beforeEach(() => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false });
    });

    it("clears user and sets isAuthenticated to false", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("calls setAccessToken(null)", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await useAuthStore.getState().logout();

      expect(mockSetAccessToken).toHaveBeenCalledWith(null);
    });

    it("clears portfolio and watchlist", async () => {
      usePortfolioStore.setState({
        holdings: [{ id: "h1", assetId: "bitcoin", symbol: "BTC", name: "Bitcoin", amount: 1, buyPrice: 40000, buyDate: "2024-01-01" }],
        isLoaded: true,
      });
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await useAuthStore.getState().logout();

      expect(usePortfolioStore.getState().holdings).toHaveLength(0);
    });

    it("completes even if the server request fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(useAuthStore.getState().logout()).resolves.toBeUndefined();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("initialize()", () => {
    it("restores auth state on a valid session", async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken: mockAccessToken }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        } as unknown as Response);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
    });

    it("stays unauthenticated when refresh returns non-ok", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false } as Response);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("stays unauthenticated when fetch throws", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});

import { create } from "zustand";
import { apiJson, apiFetch, setAccessToken } from "@/lib/api/client";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useWatchlistStore } from "@/store/watchlistStore";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // True until we check for existing session

  login: async (email, password) => {
    const data = await apiJson<{ user: AuthUser; accessToken: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
        public: true,
      }
    );

    setAccessToken(data.accessToken);
    // Clear stale data from any previous user session
    usePortfolioStore.getState().clearHoldings();
    useWatchlistStore.getState().clearWatchlist();
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (email, password, name?) => {
    const data = await apiJson<{ user: AuthUser; accessToken: string }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
        public: true,
      }
    );

    setAccessToken(data.accessToken);
    // Clear stale data from any previous user session
    usePortfolioStore.getState().clearHoldings();
    useWatchlistStore.getState().clearWatchlist();
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors — logout is best-effort
    }

    setAccessToken(null);
    // Clear user-specific data to prevent stale data on next login
    usePortfolioStore.getState().clearHoldings();
    useWatchlistStore.getState().clearWatchlist();
    set({ user: null, isAuthenticated: false });
  },

  /**
   * Called on app startup. Attempts to silently refresh the access token
   * using the httpOnly cookie. If successful, the user is logged in
   * without seeing a login screen.
   */
  initialize: async () => {
    // Already authenticated (e.g. just logged in before this resolved) — do nothing.
    if (useAuthStore.getState().isAuthenticated) {
      set({ isLoading: false });
      return;
    }
    try {
      // Try to refresh the token
      const res = await apiFetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const { accessToken } = await res.json();
        setAccessToken(accessToken);

        // Fetch user profile
        const profileRes = await apiFetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        });

        if (profileRes.ok) {
          const { user } = await profileRes.json();
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
    } catch {
      // No valid session — that's fine
    }

    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));

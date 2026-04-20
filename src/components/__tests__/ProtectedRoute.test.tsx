import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";

vi.mock("@/store/authStore");

const mockUseAuthStore = vi.mocked(useAuthStore);

function setup(authState: { isAuthenticated: boolean; isLoading: boolean }) {
  mockUseAuthStore.mockReturnValue({
    ...authState,
    user: authState.isAuthenticated ? { id: "1", email: "user@test.com", name: "User" } : null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    initialize: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading spinner while auth is initialising", () => {
    setup({ isAuthenticated: false, isLoading: true });

    expect(screen.getByRole("status", { name: /checking authentication/i })).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", () => {
    setup({ isAuthenticated: false, isLoading: false });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders the outlet when authenticated", () => {
    setup({ isAuthenticated: true, isLoading: false });

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});

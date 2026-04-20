import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

/* ── Lazy-loaded pages ── */
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const AIAnalyst = lazy(() => import("./pages/AIAnalyst"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

/* ── Page loading skeleton ── */
function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Loading page">
      <div className="h-5 w-32 skeleton-shimmer rounded-md" />
      <div className="h-3 w-48 skeleton-shimmer rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 skeleton-shimmer rounded-xl" />
        ))}
      </div>
      <div className="h-48 skeleton-shimmer rounded-xl mt-4" />
      <span className="sr-only">Loading page content…</span>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 25_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

/**
 * Layout wrapper that provides AppLayout + ErrorBoundary + PageTransition + Suspense
 * around the child routes via <Outlet />.
 */
function AppLayoutWrapper() {
  return (
    <AppLayout>
      <ErrorBoundary context="application">
        <PageTransition>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </ErrorBoundary>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public routes — no layout, no auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes — layout route pattern with Outlet */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayoutWrapper />}>
                  <Route index element={<Dashboard />} />
                  <Route path="portfolio" element={<Portfolio />} />
                  <Route path="watchlist" element={<Watchlist />} />
                  <Route path="ai" element={<AIAnalyst />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

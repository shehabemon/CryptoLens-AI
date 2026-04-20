import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  AlertCircle,
} from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { AllocationChart } from "@/components/portfolio/AllocationChart";
import { PortfolioEmptyState } from "@/components/portfolio/PortfolioEmptyState";
import { AddHoldingModal } from "@/components/portfolio/AddHoldingModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
}

function PortfolioStatCard({ icon, label, value, subValue, trend }: StatCardProps) {
  return (
    <Card className="bg-white border-[#e2e5ea] shadow-card rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#94a3b8]" aria-hidden="true">{icon}</span>
          <span className="text-xs font-medium text-[#64748b]">{label}</span>
        </div>
        <p className="text-lg font-bold font-mono text-[#0f172a]">
          {value}
        </p>
        {subValue && (
          <p
            className={`text-xs font-mono font-semibold mt-0.5 ${
              trend === "up"
                ? "text-[#16a34a]"
                : trend === "down"
                ? "text-[#dc2626]"
                : "text-[#64748b]"
            }`}
          >
            {subValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="bg-white border-[#e2e5ea] shadow-card rounded-xl" aria-hidden="true">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-7 h-7" />
          <Skeleton className="w-16 h-3" />
        </div>
        <Skeleton className="w-24 h-5 mb-1" />
        <Skeleton className="w-14 h-3" />
      </CardContent>
    </Card>
  );
}

export default function Portfolio() {
  useDocumentTitle("Portfolio | CryptoLens-AI");
  const { holdings, summary, isEmpty, isLoading, isError } = usePortfolio();
  const [showAddModal, setShowAddModal] = useState(false);

  const pnlTrend =
    summary.totalPnl > 0 ? "up" : summary.totalPnl < 0 ? "down" : "neutral";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">Portfolio</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            Track your holdings and performance
          </p>
        </div>
        {!isEmpty && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold text-sm gap-1.5 rounded-lg"
            aria-label="Add a new holding"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Add Holding</span>
          </Button>
        )}
      </div>

      {/* Error state */}
      {isError && !isEmpty && (
        <div className="flex items-center gap-3 border border-[#fecaca] bg-[#fef2f2] rounded-xl p-4" role="alert">
          <AlertCircle className="h-4 w-4 text-[#dc2626] shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0f172a]">Unable to update live prices</p>
            <p className="text-xs text-[#64748b]">
              Your holdings are shown but prices may be outdated.
            </p>
          </div>
        </div>
      )}

      {isEmpty && !isLoading ? (
        <PortfolioEmptyState onAddHolding={() => setShowAddModal(true)} />
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            ) : (
              <>
                <PortfolioStatCard
                  icon={<Wallet className="h-4 w-4 text-[#2563eb]" />}
                  label="Total Value"
                  value={formatCurrency(summary.totalValue)}
                />
                <PortfolioStatCard
                  icon={<PiggyBank className="h-4 w-4 text-[#64748b]" />}
                  label="Total Invested"
                  value={formatCurrency(summary.totalInvested)}
                />
                <PortfolioStatCard
                  icon={
                    pnlTrend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-[#16a34a]" />
                    ) : pnlTrend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-[#dc2626]" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-[#64748b]" />
                    )
                  }
                  label="Total P&L"
                  value={
                    (summary.totalPnl >= 0 ? "+" : "-") +
                    formatCurrency(Math.abs(summary.totalPnl))
                  }
                  trend={pnlTrend}
                />
                <PortfolioStatCard
                  icon={
                    pnlTrend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-[#16a34a]" />
                    ) : pnlTrend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-[#dc2626]" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-[#64748b]" />
                    )
                  }
                  label="Total P&L %"
                  value={formatPercent(summary.totalPnlPercent)}
                  trend={pnlTrend}
                />
              </>
            )}
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Holdings table */}
            <Card className="lg:col-span-2 bg-white border-[#e2e5ea] shadow-card rounded-xl">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm font-semibold text-[#0f172a]">Holdings</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <HoldingsTable holdings={holdings} />
              </CardContent>
            </Card>

            {/* Allocation pie chart */}
            <Card className="bg-white border-[#e2e5ea] shadow-card rounded-xl">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm font-semibold text-[#0f172a]">Allocation</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 h-[400px]">
                <ErrorBoundary context="allocation chart">
                  <AllocationChart holdings={holdings} />
                </ErrorBoundary>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <AddHoldingModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CircleDollarSign,
  Coins,
  Trophy,
  CalendarDays,
  Activity,
} from "lucide-react";
import { useAssetDetailStore } from "@/store/assetDetailStore";
import { useWatchlistStore } from "@/store/watchlistStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { formatCurrency, formatCompact, formatPercent } from "@/lib/utils/formatCurrency";
import { PriceChart } from "./PriceChart";
import { PriceFlash } from "@/components/PriceFlash";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AddHoldingModal } from "@/components/portfolio/AddHoldingModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useRef, useEffect } from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-[#f8f9fb] border border-[#e2e5ea] rounded-lg p-3 transition-colors hover:border-[#cbd1d8]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[#94a3b8]" aria-hidden="true">{icon}</span>
        <span className="text-[10px] font-medium uppercase text-[#94a3b8]" style={{ letterSpacing: "0.04em" }}>{label}</span>
      </div>
      <p className="text-sm font-semibold font-mono text-[#0f172a] truncate">{value}</p>
    </div>
  );
}

export function AssetDetailPanel() {
  const { selectedAsset: asset, isOpen, closeAssetDetail } = useAssetDetailStore();
  const { addToWatchlist, removeFromWatchlist, isWatched } = useWatchlistStore();
  const { holdings, removeHolding } = usePortfolioStore();
  const isMobile = useIsMobile();
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [starAnimate, setStarAnimate] = useState(false);
  const prevWatched = useRef<boolean | null>(null);

  if (!asset) return null;

  const positive = asset.changePercent24h >= 0;
  const watched = isWatched(asset.id);
  const portfolioHoldings = holdings.filter((h) => h.assetId === asset.id);
  const inPortfolio = portfolioHoldings.length > 0;

  const stats = [
    {
      icon: <CircleDollarSign className="h-3.5 w-3.5" />,
      label: "Market Cap",
      value: asset.marketCap ? formatCompact(asset.marketCap) : "—",
    },
    {
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      label: "Volume 24h",
      value: asset.volume24h ? formatCompact(asset.volume24h) : "—",
    },
    {
      icon: <Coins className="h-3.5 w-3.5" />,
      label: "Circ. Supply",
      value: asset.circulatingSupply
        ? formatCompact(asset.circulatingSupply) + " " + asset.symbol
        : "—",
    },
    {
      icon: <Trophy className="h-3.5 w-3.5" />,
      label: "ATH",
      value: asset.ath ? formatCurrency(asset.ath) : "—",
    },
    {
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      label: "ATH Date",
      value: asset.athDate
        ? new Date(asset.athDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—",
    },
    {
      icon: <Activity className="h-3.5 w-3.5" />,
      label: "24h Change",
      value: asset.change24h
        ? formatCurrency(Math.abs(asset.change24h))
        : "—",
    },
  ];

  const handleWatchlistToggle = () => {
    if (watched) {
      removeFromWatchlist(asset.id);
    } else {
      addToWatchlist(asset.id);
    }
    setStarAnimate(true);
    setTimeout(() => setStarAnimate(false), 400);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeAssetDetail()}>
        <SheetContent
          side="right"
          className={`
            ${isMobile ? "w-full max-w-full" : "w-[440px] max-w-[440px]"}
            p-0 bg-white border-l border-[#e2e5ea] flex flex-col
          `}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{asset.name} Details</SheetTitle>
            <SheetDescription>
              Detailed view for {asset.name} ({asset.symbol})
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 h-full">
            <div className="p-5 space-y-5">
              {/* Asset Header */}
              <div className="flex items-start gap-3">
                {asset.image && (
                  <img
                    src={asset.image}
                    alt=""
                    aria-hidden="true"
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#0f172a] truncate">{asset.name}</h2>
                    <span className="text-xs text-[#64748b] font-mono px-1.5 py-0.5 bg-[#f1f3f6] rounded-md border border-[#e2e5ea]">
                      {asset.symbol}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <PriceFlash value={asset.price} className="text-2xl font-bold font-mono text-[#0f172a]">
                      {formatCurrency(asset.price)}
                    </PriceFlash>
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-mono font-semibold px-2 py-0.5 rounded-md ${
                        positive
                          ? "text-[#16a34a] bg-[#dcfce7]"
                          : "text-[#dc2626] bg-[#fee2e2]"
                      }`}
                    >
                      {positive ? (
                        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {formatPercent(asset.changePercent24h)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#e2e5ea]" />

              <ErrorBoundary context="price chart" compact>
                <div>
                  <PriceChart coinId={asset.id} />
                </div>
              </ErrorBoundary>

              <div className="h-px bg-[#e2e5ea]" />

              <div>
                <h3 className="text-xs font-semibold uppercase text-[#94a3b8] mb-2" style={{ letterSpacing: "0.04em" }}>
                  Market Statistics
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {stats.map((stat) => (
                    <StatCard
                      key={stat.label}
                      icon={stat.icon}
                      label={stat.label}
                      value={stat.value}
                    />
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#e2e5ea]" />

              <div className="flex flex-col gap-2 pb-2">
                <Button
                  className={`
                    w-full transition-colors rounded-lg
                    ${
                      watched
                        ? "bg-[#f1f3f6] border border-[#e2e5ea] text-[#0f172a] hover:border-[#dc2626] hover:text-[#dc2626]"
                        : "bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
                    }
                  `}
                  onClick={handleWatchlistToggle}
                  aria-label={watched ? `Remove ${asset.name} from watchlist` : `Add ${asset.name} to watchlist`}
                >
                  <Star
                    className={`h-4 w-4 mr-2 ${starAnimate ? "star-pop" : ""} ${
                      watched ? "fill-current" : ""
                    }`}
                    aria-hidden="true"
                  />
                  {watched ? "Remove from Watchlist" : "Add to Watchlist"}
                </Button>

                {inPortfolio ? (
                  <Button
                    variant="outline"
                    className="w-full border-[#e2e5ea] text-[#0f172a] hover:border-[#dc2626] hover:text-[#dc2626] transition-colors rounded-lg"
                    onClick={() => {
                      portfolioHoldings.forEach((h) => removeHolding(h.id));
                    }}
                    aria-label={`Remove ${asset.name} from portfolio`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Remove from Portfolio
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-[#e2e5ea] text-[#0f172a] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors rounded-lg"
                    onClick={() => setShowPortfolioModal(true)}
                    aria-label={`Add ${asset.name} to portfolio`}
                  >
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Add to Portfolio
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AddHoldingModal
        open={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        prefillAsset={asset}
      />
    </>
  );
}

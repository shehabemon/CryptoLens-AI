import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Check, CalendarDays } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { usePortfolioStore } from "@/store/portfolioStore";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Asset } from "@/types/market";

interface AddHoldingModalProps {
  open: boolean;
  onClose: () => void;
  prefillAsset?: Asset | null;
}

export function AddHoldingModal({
  open,
  onClose,
  prefillAsset,
}: AddHoldingModalProps) {
  const { data: assets } = useMarketData();
  const addHolding = usePortfolioStore((s) => s.addHolding);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(
    prefillAsset ?? null
  );
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDate, setBuyDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [step, setStep] = useState<"select" | "form">(
    prefillAsset ? "form" : "select"
  );

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    const q = search.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.symbol.toLowerCase().includes(q)
    );
  }, [assets, search]);

  function handleSelectAsset(asset: Asset) {
    setSelectedAsset(asset);
    setBuyPrice(asset.price.toString());
    setStep("form");
    setSearch("");
  }

  async function handleSave() {
    if (!selectedAsset || !amount || !buyPrice) return;

    try {
      await addHolding({
        assetId: selectedAsset.id,
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        image: selectedAsset.image,
        amount: parseFloat(amount),
        buyPrice: parseFloat(buyPrice),
        buyDate,
      });

      handleReset();
      onClose();
    } catch {
      // Error handling could be improved with toast notification
    }
  }

  function handleReset() {
    setSelectedAsset(prefillAsset ?? null);
    setSearch("");
    setAmount("");
    setBuyPrice("");
    setBuyDate(new Date().toISOString().split("T")[0]);
    setStep(prefillAsset ? "form" : "select");
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      handleReset();
      onClose();
    }
  }

  const isValid =
    selectedAsset &&
    amount &&
    parseFloat(amount) > 0 &&
    buyPrice &&
    parseFloat(buyPrice) > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#e2e5ea] rounded-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-base font-semibold text-[#0f172a]">
            {step === "select" ? "Select Asset" : "Add Holding"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#94a3b8]">
            {step === "select"
              ? "Search and select a cryptocurrency"
              : selectedAsset?.symbol}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <div className="p-5 pt-3 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                placeholder="Search assets..."
                className="w-full pl-10 pr-3 py-2.5 bg-[#f1f3f6] border border-[#e2e5ea] rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
              />
            </div>

            {/* Asset List */}
            <div className="max-h-[280px] overflow-y-auto space-y-0">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-[#f1f3f6] rounded-lg transition-colors text-left"
                >
                  {asset.image && (
                    <img
                      src={asset.image}
                      alt={asset.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">
                      {asset.name}
                    </p>
                    <p className="text-xs text-[#94a3b8] font-mono">
                      {asset.symbol}
                    </p>
                  </div>
                  <p className="text-sm font-mono font-medium text-[#64748b]">
                    {formatCurrency(asset.price)}
                  </p>
                </button>
              ))}
              {filteredAssets.length === 0 && (
                <p className="text-xs text-[#94a3b8] text-center py-6">
                  No assets found
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 pt-3 space-y-3">
            {/* Selected asset header */}
            {selectedAsset && (
              <button
                onClick={() => {
                  if (!prefillAsset) setStep("select");
                }}
                className={`flex items-center gap-2.5 w-full p-3 bg-[#f8f9fb] border border-[#e2e5ea] rounded-lg transition-colors ${
                  !prefillAsset
                    ? "hover:border-[#2563eb] cursor-pointer"
                    : "cursor-default"
                }`}
              >
                {selectedAsset.image && (
                  <img
                    src={selectedAsset.image}
                    alt={selectedAsset.name}
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-[#0f172a]">{selectedAsset.name}</p>
                  <p className="text-xs text-[#94a3b8] font-mono">
                    {selectedAsset.symbol}
                  </p>
                </div>
                {!prefillAsset && (
                  <span className="text-xs text-[#2563eb] font-medium">
                    Change
                  </span>
                )}
                <Check className="h-4 w-4 text-[#16a34a]" />
              </button>
            )}

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                autoFocus
                className="w-full px-3 py-2.5 bg-[#f1f3f6] border border-[#e2e5ea] rounded-lg text-sm font-mono text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
              />
            </div>

            {/* Buy Price */}
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Buy Price (USD)</label>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder={selectedAsset?.price.toFixed(2) ?? "0.00"}
                min="0"
                step="any"
                className="w-full px-3 py-2.5 bg-[#f1f3f6] border border-[#e2e5ea] rounded-lg text-sm font-mono text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
              />
              <p className="text-xs text-[#94a3b8] mt-1">
                Current: {selectedAsset ? formatCurrency(selectedAsset.price) : "—"}
              </p>
            </div>

            {/* Buy Date */}
            <div>
              <label className="text-xs font-medium text-[#64748b] mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Buy Date
              </label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 bg-[#f1f3f6] border border-[#e2e5ea] rounded-lg text-sm font-mono text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
              />
            </div>

            {/* Preview */}
            {amount && buyPrice && parseFloat(amount) > 0 && parseFloat(buyPrice) > 0 && (
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3">
                <p className="text-xs font-medium text-[#64748b] mb-0.5">Total Invested</p>
                <p className="text-base font-bold font-mono text-[#2563eb]">
                  {formatCurrency(parseFloat(amount) * parseFloat(buyPrice))}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 text-sm rounded-lg"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 text-sm bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold rounded-lg disabled:opacity-40"
                onClick={handleSave}
                disabled={!isValid}
              >
                Add Holding
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

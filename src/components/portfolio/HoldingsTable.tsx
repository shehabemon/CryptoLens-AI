import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  CalendarDays,
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils/formatCurrency";
import { usePortfolioStore } from "@/store/portfolioStore";
import type { EnrichedHolding } from "@/types/portfolio";

interface HoldingsTableProps {
  holdings: EnrichedHolding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const { removeHolding, updateHolding } = usePortfolioStore();
  const [editingHolding, setEditingHolding] = useState<EnrichedHolding | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" aria-label="Holdings table">
          <thead>
            <tr className="border-b border-[#e2e5ea]">
              <th scope="col" className="text-left text-xs font-medium text-[#94a3b8] py-2.5 px-3">Asset</th>
              <th scope="col" className="text-right text-xs font-medium text-[#94a3b8] py-2.5 px-3">Holdings</th>
              <th scope="col" className="text-right text-xs font-medium text-[#94a3b8] py-2.5 px-3">Avg Buy</th>
              <th scope="col" className="text-right text-xs font-medium text-[#94a3b8] py-2.5 px-3">Current</th>
              <th scope="col" className="text-right text-xs font-medium text-[#94a3b8] py-2.5 px-3">Value</th>
              <th scope="col" className="text-right text-xs font-medium text-[#94a3b8] py-2.5 px-3">P&L</th>
              <th scope="col" className="text-right text-xs font-medium text-[#94a3b8] py-2.5 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const positive = h.pnl >= 0;
              return (
                <tr
                  key={h.id}
                  className="border-b border-[#f1f3f6] hover:bg-[#f8f9fb] transition-colors group"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      {h.image && (
                        <img
                          src={h.image}
                          alt={h.name}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#0f172a] leading-tight">
                          {h.name}
                        </p>
                        <p className="text-xs text-[#94a3b8] font-mono">
                          {h.symbol}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right text-sm font-mono text-[#0f172a] py-3 px-3">
                    {h.amount.toLocaleString("en-US", {
                      maximumFractionDigits: 8,
                    })}
                  </td>
                  <td className="text-right text-sm font-mono text-[#64748b] py-3 px-3">
                    {formatCurrency(h.buyPrice)}
                  </td>
                  <td className="text-right text-sm font-mono text-[#0f172a] py-3 px-3">
                    {formatCurrency(h.currentPrice)}
                  </td>
                  <td className="text-right text-sm font-mono font-semibold text-[#0f172a] py-3 px-3">
                    {formatCurrency(h.value)}
                  </td>
                  <td className="text-right py-3 px-3">
                    <div
                      className={`text-sm font-mono font-semibold ${
                        positive ? "text-[#16a34a]" : "text-[#dc2626]"
                      }`}
                    >
                      <div className="flex items-center justify-end gap-0.5">
                        {positive ? (
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <TrendingDown className="h-3 w-3" aria-hidden="true" />
                        )}
                        {formatCurrency(Math.abs(h.pnl))}
                      </div>
                      <p className="text-xs mt-0.5">
                        {formatPercent(h.pnlPercent)}
                      </p>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingHolding(h)}
                        className="p-1.5 hover:bg-[#f1f3f6] rounded-md transition-colors"
                        aria-label={`Edit ${h.name} holding`}
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#94a3b8]" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(h.id)}
                        className="p-1.5 hover:bg-[#fee2e2] rounded-md hover:text-[#dc2626] transition-colors"
                        aria-label={`Delete ${h.name} holding`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[#94a3b8]" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {holdings.map((h) => {
          const positive = h.pnl >= 0;
          return (
            <div
              key={h.id}
              className="p-3 bg-white rounded-lg border border-[#e2e5ea]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {h.image && (
                    <img
                      src={h.image}
                      alt={h.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">{h.name}</p>
                    <p className="text-xs text-[#94a3b8] font-mono">{h.symbol}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => setEditingHolding(h)}
                    className="p-1.5 hover:bg-[#f1f3f6] rounded-md transition-colors"
                    aria-label={`Edit ${h.name} holding`}
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#94a3b8]" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(h.id)}
                    className="p-1.5 hover:bg-[#fee2e2] rounded-md hover:text-[#dc2626] transition-colors"
                    aria-label={`Delete ${h.name} holding`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#94a3b8]" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#94a3b8]">Holdings</span>
                  <p className="font-mono text-[#0f172a]">{h.amount.toLocaleString("en-US", { maximumFractionDigits: 8 })}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Value</span>
                  <p className="font-mono font-semibold text-[#0f172a]">{formatCurrency(h.value)}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Buy Price</span>
                  <p className="font-mono text-[#64748b]">{formatCurrency(h.buyPrice)}</p>
                </div>
                <div>
                  <span className="text-[#94a3b8]">P&L</span>
                  <p className={`font-mono font-semibold ${positive ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                    {formatCurrency(Math.abs(h.pnl))} ({formatPercent(h.pnlPercent)})
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingHolding && (
        <EditHoldingDialog
          holding={editingHolding}
          onSave={(updates) => {
            updateHolding(editingHolding.id, updates);
            setEditingHolding(null);
          }}
          onClose={() => setEditingHolding(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog
          open
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
        >
          <DialogContent className="sm:max-w-sm bg-white border-[#e2e5ea] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-[#0f172a]">Remove Holding</DialogTitle>
              <DialogDescription className="text-xs text-[#64748b]">
                Are you sure? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-sm rounded-lg"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 text-sm bg-[#dc2626] text-white hover:bg-[#b91c1c] border-0 rounded-lg"
                onClick={() => {
                  removeHolding(deleteConfirm);
                  setDeleteConfirm(null);
                }}
              >
                Remove
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/* -------- Edit Dialog -------- */

function EditHoldingDialog({
  holding,
  onSave,
  onClose,
}: {
  holding: EnrichedHolding;
  onSave: (updates: { amount: number; buyPrice: number; buyDate: string }) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(holding.amount.toString());
  const [buyPrice, setBuyPrice] = useState(holding.buyPrice.toString());
  const [buyDate, setBuyDate] = useState(holding.buyDate);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm bg-white border-[#e2e5ea] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            {holding.image && (
              <img src={holding.image} alt={holding.name} className="w-5 h-5 rounded-full" />
            )}
            Edit {holding.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#94a3b8] font-mono">
            {holding.symbol}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
              className="w-full px-3 py-2.5 bg-[#f1f3f6] border border-[#e2e5ea] rounded-lg text-sm font-mono text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#64748b] mb-1.5 block">Buy Price (USD)</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              min="0"
              step="any"
              className="w-full px-3 py-2.5 bg-[#f1f3f6] border border-[#e2e5ea] rounded-lg text-sm font-mono text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
            />
          </div>
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
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 text-sm rounded-lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 text-sm bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold rounded-lg disabled:opacity-40"
            disabled={
              !amount || parseFloat(amount) <= 0 || !buyPrice || parseFloat(buyPrice) <= 0
            }
            onClick={() =>
              onSave({
                amount: parseFloat(amount),
                buyPrice: parseFloat(buyPrice),
                buyDate,
              })
            }
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

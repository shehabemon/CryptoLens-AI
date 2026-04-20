import { Button } from "@/components/ui/button";
import { PlusCircle, Wallet } from "lucide-react";

interface PortfolioEmptyStateProps {
  onAddHolding: () => void;
}

export function PortfolioEmptyState({ onAddHolding }: PortfolioEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white border border-[#e2e5ea] rounded-xl shadow-card" role="status">
      <div className="w-16 h-16 bg-[#eff6ff] rounded-2xl flex items-center justify-center mb-4">
        <Wallet className="h-7 w-7 text-[#2563eb]" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold text-[#0f172a] mb-1">No holdings yet</h3>
      <p className="text-sm text-[#64748b] max-w-[300px] mb-6">
        Start tracking your crypto portfolio by adding your first holding. All
        values update in real time.
      </p>

      <Button
        onClick={onAddHolding}
        className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold text-sm gap-1.5 rounded-lg"
        aria-label="Add your first holding"
      >
        <PlusCircle className="h-4 w-4" aria-hidden="true" />
        Add Your First Holding
      </Button>
    </div>
  );
}

import { create } from "zustand";
import type { Asset } from "@/types/market";

interface AssetDetailState {
  selectedAsset: Asset | null;
  isOpen: boolean;
  openAssetDetail: (asset: Asset) => void;
  closeAssetDetail: () => void;
}

export const useAssetDetailStore = create<AssetDetailState>((set) => ({
  selectedAsset: null,
  isOpen: false,
  openAssetDetail: (asset) => set({ selectedAsset: asset, isOpen: true }),
  closeAssetDetail: () => set({ isOpen: false }),
}));

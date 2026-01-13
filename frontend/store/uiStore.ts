import { create } from "zustand";

interface UiState {
    isUpsellModalOpen: boolean;
    openUpsellModal: () => void;
    closeUpsellModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    isUpsellModalOpen: false,
    openUpsellModal: () => set({ isUpsellModalOpen: true }),
    closeUpsellModal: () => set({ isUpsellModalOpen: false }),
}));

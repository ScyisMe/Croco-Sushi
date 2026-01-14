import { create } from "zustand";

interface UiState {
    isUpsellModalOpen: boolean;
    upsellRedirectPath: string | null;
    openUpsellModal: (redirectPath?: string) => void;
    closeUpsellModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    isUpsellModalOpen: false,
    upsellRedirectPath: null,
    openUpsellModal: (redirectPath) => set({
        isUpsellModalOpen: true,
        upsellRedirectPath: redirectPath || null
    }),
    closeUpsellModal: () => set({
        isUpsellModalOpen: false,
        upsellRedirectPath: null
    }),
}));

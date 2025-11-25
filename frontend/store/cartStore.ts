import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Спрощений тип для елемента кошика
export interface CartItem {
  id: number; // product id
  name: string;
  slug?: string;
  price: number;
  image_url?: string;
  size?: string;
  sizeId?: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  
  // Actions
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: number, sizeId?: number) => void;
  updateQuantity: (id: number, quantity: number, sizeId?: number) => void;
  clearCart: () => void;
  
  // Helpers
  getItemCount: (id: number, sizeId?: number) => number;
}

const MAX_ITEMS = 20; // Максимум 20 товарів у кошику

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,

      addItem: (newItem) => {
        set((state) => {
          // Перевірка на максимум товарів
          if (state.items.length >= MAX_ITEMS) {
            console.warn("Досягнуто максимальну кількість товарів у кошику");
            return state;
          }

          const itemKey = `${newItem.id}-${newItem.sizeId || "default"}`;
          const existingIndex = state.items.findIndex(
            (item) => `${item.id}-${item.sizeId || "default"}` === itemKey
          );

          let updatedItems: CartItem[];
          
          if (existingIndex > -1) {
            // Оновлюємо кількість існуючого товару
            updatedItems = state.items.map((item, index) =>
              index === existingIndex
                ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                : item
            );
          } else {
            // Додаємо новий товар
            updatedItems = [
              ...state.items,
              {
                id: newItem.id,
                name: newItem.name,
                slug: newItem.slug,
                price: newItem.price,
                image_url: newItem.image_url,
                size: newItem.size,
                sizeId: newItem.sizeId,
                quantity: newItem.quantity || 1,
              },
            ];
          }

          // Перераховуємо totals
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          return { items: updatedItems, totalItems, totalAmount };
        });
      },

      removeItem: (id, sizeId) => {
        set((state) => {
          const itemKey = `${id}-${sizeId || "default"}`;
          const updatedItems = state.items.filter(
            (item) => `${item.id}-${item.sizeId || "default"}` !== itemKey
          );

          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          return { items: updatedItems, totalItems, totalAmount };
        });
      },

      updateQuantity: (id, quantity, sizeId) => {
        set((state) => {
          if (quantity <= 0) {
            // Видаляємо товар якщо кількість 0 або менше
            const itemKey = `${id}-${sizeId || "default"}`;
            const updatedItems = state.items.filter(
              (item) => `${item.id}-${item.sizeId || "default"}` !== itemKey
            );

            const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = updatedItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );

            return { items: updatedItems, totalItems, totalAmount };
          }

          const itemKey = `${id}-${sizeId || "default"}`;
          const updatedItems = state.items.map((item) =>
            `${item.id}-${item.sizeId || "default"}` === itemKey
              ? { ...item, quantity }
              : item
          );

          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          return { items: updatedItems, totalItems, totalAmount };
        });
      },

      clearCart: () => set({ items: [], totalItems: 0, totalAmount: 0 }),

      getItemCount: (id, sizeId) => {
        const itemKey = `${id}-${sizeId || "default"}`;
        const item = get().items.find(
          (item) => `${item.id}-${item.sizeId || "default"}` === itemKey
        );
        return item?.quantity || 0;
      },
    }),
    {
      name: "croco-sushi-cart",
      storage: createJSONStorage(() => localStorage),
      version: 2, // Версія для міграції
      migrate: (persistedState, version) => {
        // Міграція старих даних
        if (version === 1) {
          return {
            items: [],
            totalItems: 0,
            totalAmount: 0,
          };
        }
        return persistedState as CartState;
      },
    }
  )
);

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
  isGift?: boolean;
}

// Інформація про доставку
export interface DeliveryInfo {
  zone_id?: number;
  zone_name?: string;
  delivery_cost: number;
  free_delivery_from: number;
  min_order_amount: number;
  estimated_time?: string;
}

// Значення за замовчуванням для доставки
const DEFAULT_DELIVERY: DeliveryInfo = {
  delivery_cost: 50,
  free_delivery_from: 1000,
  min_order_amount: 200,
};

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  delivery: DeliveryInfo;
  lastValidated: number | null; // Час останньої перевірки

  promoCode: string | null;
  discountType: "percent" | "fixed" | "free_product" | null;
  discountValue: number | null;

  // Actions
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: number, sizeId?: number) => void;
  updateQuantity: (id: number, quantity: number, sizeId?: number) => void;
  clearCart: () => void;
  setDelivery: (delivery: DeliveryInfo) => void;
  removeUnavailableItems: (unavailableIds: number[]) => string[]; // Повертає імена видалених товарів
  setLastValidated: (timestamp: number) => void;

  applyPromoCode: (
    code: string,
    type: "percent" | "fixed" | "free_product",
    value: number,
    freeProduct?: { id: number; name: string; slug?: string; image_url?: string; size?: string; sizeId?: number }
  ) => void;
  removePromoCode: () => void;

  // Helpers
  getItemCount: (id: number, sizeId?: number) => number;
  getFinalAmount: () => number;
  getDeliveryCost: () => number;
  getDiscountAmount: () => number;
}

export const MAX_CART_ITEMS = 20; // Максимум 20 товарів у кошику

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,
      delivery: DEFAULT_DELIVERY,
      lastValidated: null,
      promoCode: null,
      discountType: null,
      discountValue: null,

      addItem: (newItem) => {
        set((state) => {
          // Перевірка на максимум товарів
          if (state.items.length >= MAX_CART_ITEMS) {
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

      clearCart: () => set({
        items: [],
        totalItems: 0,
        totalAmount: 0,
        promoCode: null,
        discountType: null,
        discountValue: null
      }),

      setDelivery: (delivery) => set({ delivery }),

      setLastValidated: (timestamp) => set({ lastValidated: timestamp }),

      removeUnavailableItems: (unavailableIds) => {
        const state = get();
        const removedNames: string[] = [];

        // Знаходимо товари для видалення
        state.items.forEach((item) => {
          if (unavailableIds.includes(item.id)) {
            removedNames.push(item.name);
          }
        });

        if (removedNames.length === 0) {
          return [];
        }

        // Фільтруємо недоступні товари
        const updatedItems = state.items.filter(
          (item) => !unavailableIds.includes(item.id)
        );

        // Перераховуємо totals
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        set({ items: updatedItems, totalItems, totalAmount });

        return removedNames;
      },

      getItemCount: (id, sizeId) => {
        const itemKey = `${id}-${sizeId || "default"}`;
        const item = get().items.find(
          (item) => `${item.id}-${item.sizeId || "default"}` === itemKey
        );
        return item?.quantity || 0;
      },

      getDeliveryCost: () => {
        const state = get();
        // Якщо сума після знижки >= free_delivery_from, то доставка безкоштовна
        if (state.totalAmount >= state.delivery.free_delivery_from) {
          return 0;
        }
        return state.delivery.delivery_cost;
      },

      getDiscountAmount: () => {
        const state = get();
        if (!state.promoCode) return 0;

        if (state.discountType === "fixed") {
          return state.discountValue || 0;
        } else {
          // Percent
          return (state.totalAmount * (state.discountValue || 0)) / 100;
        }
      },

      getFinalAmount: () => {
        const state = get();
        const discount = state.getDiscountAmount();
        const finalAmount = Math.max(0, state.totalAmount - discount) + state.getDeliveryCost();
        return finalAmount;
      },

      applyPromoCode: (code, type, value, freeProduct) => {
        set({
          promoCode: code,
          discountType: type,
          discountValue: value
        });

        if (type === 'free_product' && freeProduct) {
          const { items } = get();
          const itemKey = `${freeProduct.id}-${freeProduct.sizeId || "default"}`;
          const existing = items.find(i => `${i.id}-${i.sizeId || "default"}` === itemKey);

          if (!existing) {
            // Add free product to cart if it's not already there
            const newItem = {
              id: freeProduct.id,
              name: freeProduct.name,
              slug: freeProduct.slug,
              price: 0, // FREE
              image_url: freeProduct.image_url,
              size: freeProduct.size,
              sizeId: freeProduct.sizeId,
              quantity: 1,
              isGift: true // Optional: flag for UI/logic
            };
            // Use the existing addItem logic to ensure totals are updated
            get().addItem(newItem);
          } else {
            // If it exists, ensure its price is 0 and quantity is 1 if it's a gift
            // This part might need more specific logic based on exact requirements
            // For now, if it exists, we assume it's handled or user added it manually
            // and we don't modify its price/quantity unless explicitly required.
            // If the existing item is not a gift and has a price, we might want to update it.
            // For simplicity, if it's already there, we don't add another or change it unless it's not a gift.
            if (!existing.isGift || existing.price !== 0 || existing.quantity !== 1) {
              set((state) => {
                const updatedItems = state.items.map(item =>
                  `${item.id}-${item.sizeId || "default"}` === itemKey
                    ? { ...item, price: 0, quantity: 1, isGift: true }
                    : item
                );
                const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
                const totalAmount = updatedItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );
                return { items: updatedItems, totalItems, totalAmount };
              });
            }
          }
        }
      },

      removePromoCode: () => {
        const state = get();
        // If a free product was added, remove it or revert its state
        if (state.discountType === 'free_product' && state.promoCode) {
          // This assumes we can identify the free product by some means,
          // e.g., if it has an 'isGift' flag or if we stored its ID.
          // For now, let's just remove any item marked as 'isGift' with price 0.
          const updatedItems = state.items.filter(item => !(item.isGift && item.price === 0));
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          set({
            items: updatedItems,
            totalItems,
            totalAmount,
            promoCode: null,
            discountType: null,
            discountValue: 0
          });
        } else {
          set({
            promoCode: null,
            discountType: null,
            discountValue: 0
          });
        }
      },
    }),
    {
      name: "croco-sushi-cart",
      storage: createJSONStorage(() => localStorage),
      version: 5, // Версія для міграції (додано промокоди)
      migrate: (persistedState, version) => {
        // Міграція старих даних
        if (version < 5) {
          const state = persistedState as Partial<CartState>;
          return {
            items: state.items || [],
            totalItems: state.totalItems || 0,
            totalAmount: state.totalAmount || 0,
            delivery: state.delivery || DEFAULT_DELIVERY,
            lastValidated: null,
            promoCode: null,
            discountType: null,
            discountValue: null,
          };
        }
        return persistedState as CartState;
      },
    }
  )
);

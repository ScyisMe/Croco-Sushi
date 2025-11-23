import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product, ProductSize } from "@/lib/types";
import { Decimal } from "decimal.js";

interface CartItem {
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl?: string;
  sizeId: number;
  sizeName: string;
  price: string; // Use string for Decimal compatibility
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: string; // Use string for Decimal compatibility
  addItem: (product: Product, size: ProductSize, quantity: number) => void;
  removeItem: (productId: number, sizeId: number) => void;
  updateQuantity: (productId: number, sizeId: number, quantity: number) => void;
  clearCart: () => void;
  calculateTotals: () => { totalItems: number; totalAmount: string };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: "0.00",

      addItem: (product, size, quantity) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.productId === product.id && item.sizeId === size.id
          );

          let updatedItems;
          if (existingItemIndex > -1) {
            // Update quantity if item already exists
            updatedItems = state.items.map((item, index) =>
              index === existingItemIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            // Add new item
            updatedItems = [
              ...state.items,
              {
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                imageUrl: product.image_url,
                sizeId: size.id,
                sizeName: size.name,
                price: size.price,
                quantity,
              },
            ];
          }
          const { totalItems, totalAmount } = get().calculateTotals();
          return { items: updatedItems, totalItems, totalAmount };
        });
      },

      removeItem: (productId, sizeId) => {
        set((state) => {
          const updatedItems = state.items.filter(
            (item) => !(item.productId === productId && item.sizeId === sizeId)
          );
          const { totalItems, totalAmount } = get().calculateTotals();
          return { items: updatedItems, totalItems, totalAmount };
        });
      },

      updateQuantity: (productId, sizeId, quantity) => {
        set((state) => {
          const updatedItems = state.items
            .map((item) =>
              item.productId === productId && item.sizeId === sizeId
                ? { ...item, quantity: quantity }
                : item
            )
            .filter((item) => item.quantity > 0); // Remove if quantity is 0
          const { totalItems, totalAmount } = get().calculateTotals();
          return { items: updatedItems, totalItems, totalAmount };
        });
      },

      clearCart: () => set({ items: [], totalItems: 0, totalAmount: "0.00" }),

      calculateTotals: () => {
        const items = get().items;
        let totalItems = 0;
        let totalAmount = new Decimal("0.00");

        for (const item of items) {
          totalItems += item.quantity;
          totalAmount = totalAmount.plus(new Decimal(item.price).times(item.quantity));
        }
        return { totalItems, totalAmount: totalAmount.toFixed(2) };
      },
    }),
    {
      name: "croco-sushi-cart", // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);


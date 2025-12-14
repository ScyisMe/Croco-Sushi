"use client";

import { useTranslation } from "@/store/localeStore";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { Product, ProductSize } from "@/lib/types";
import { useCartStore, MAX_CART_ITEMS } from "@/store/cartStore";
import toast from "react-hot-toast";

interface ProductActionsProps {
    product: Product;
    selectedSize: ProductSize | null;
    currentPrice: number;
}

export const ProductActions = ({ product, selectedSize, currentPrice }: ProductActionsProps) => {
    const { t } = useTranslation();
    const addItem = useCartStore((state) => state.addItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const itemsCount = useCartStore((state) => state.items.length);
    // Subscribe specifically to this item's quantity to ensure meaningful re-renders
    const sizeId = selectedSize?.id;
    const quantity = useCartStore((state) =>
        state.items.find((item) => item.id === product.id && item.sizeId === sizeId)?.quantity || 0
    );

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (quantity === 0 && itemsCount >= MAX_CART_ITEMS) {
            toast.error(`Максимум ${MAX_CART_ITEMS} різних товарів у кошику`);
            return;
        }

        addItem({
            id: product.id,
            name: product.name,
            price: currentPrice,
            image_url: product.image_url,
            size: selectedSize?.name,
            sizeId: sizeId,
            quantity: 1,
        });

        if (quantity === 0) {
            toast.success(`${product.name} додано в кошик`);
        }
    };

    const handleUpdateQuantity = (e: React.MouseEvent, delta: number) => {
        e.preventDefault();
        e.stopPropagation();

        const newQuantity = quantity + delta;
        updateQuantity(product.id, newQuantity, sizeId);
    };

    // 1. Якщо товар ВЖЕ є в кошику (quantity > 0) -> ЗАВЖДИ показуємо лічильник
    if (quantity > 0) {
        return (
            <div
                className="relative z-20 flex items-center justify-between bg-surface-card/80 backdrop-blur-md rounded-full h-9 w-24 border border-white/10 shadow-lg"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                {/* Кнопка мінус */}
                <button
                    type="button"
                    onClick={(e) => handleUpdateQuantity(e, -1)}
                    className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90"
                >
                    <MinusIcon className="w-3.5 h-3.5 pointer-events-none" />
                </button>

                {/* Цифра */}
                <span className="font-display font-medium text-white text-sm min-w-[20px] text-center pointer-events-none select-none">
                    {quantity}
                </span>

                {/* Кнопка плюс */}
                <button
                    type="button"
                    onClick={(e) => handleUpdateQuantity(e, 1)}
                    className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90"
                >
                    <PlusIcon className="w-3.5 h-3.5 pointer-events-none" />
                </button>
            </div>
        );
    }

    // 2. Якщо товару НЕМАЄ (quantity === 0) -> Показуємо кнопку додавання
    return (
        <button
            type="button"
            onClick={handleAddToCart}
            className="group flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-primary-500 rounded-full text-white border border-transparent hover:bg-primary-600 hover:scale-105 transition-all duration-300 shadow-lg shadow-primary-500/30 md:shadow-primary-500/20 relative z-20 active:scale-95"
            aria-label={t("product.addToCart")}
        >
            <PlusIcon className="w-5 h-5 transition-transform group-hover:rotate-90 pointer-events-none" />
        </button>
    );
};

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
                className="relative z-20 flex items-center justify-between bg-surface-card/90 backdrop-blur-xl rounded-full h-11 min-w-[100px] border border-white/20 shadow-lg"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                {/* Кнопка мінус */}
                <button
                    type="button"
                    onClick={(e) => handleUpdateQuantity(e, -1)}
                    className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90"
                    aria-label="Зменшити кількість"
                >
                    <MinusIcon className="w-5 h-5 pointer-events-none" />
                </button>

                {/* Цифра */}
                <span className="font-display font-bold text-white text-base min-w-[20px] text-center pointer-events-none select-none">
                    {quantity}
                </span>

                {/* Кнопка плюс */}
                <button
                    type="button"
                    onClick={(e) => handleUpdateQuantity(e, 1)}
                    className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90"
                    aria-label="Збільшити кількість"
                >
                    <PlusIcon className="w-5 h-5 pointer-events-none" />
                </button>
            </div>
        );
    }

    // 2. Якщо товару НЕМАЄ (quantity === 0) -> Показуємо кнопку додавання
    return (
        <button
            type="button"
            onClick={handleAddToCart}
            className="group relative z-20 flex items-center justify-center bg-primary-500 rounded-full text-white border border-transparent 
            h-11 w-11 hover:w-auto hover:px-5
            transition-all duration-300 ease-in-out shadow-lg shadow-primary-500/30 overflow-hidden active:scale-95"
            aria-label={t("product.addToCart")}
        >
            <PlusIcon className="w-6 h-6 shrink-0 transition-transform group-hover:rotate-90" />
            <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ml-0 group-hover:ml-2 whitespace-nowrap font-bold text-sm">
                В кошик
            </span>
        </button>
    );
};

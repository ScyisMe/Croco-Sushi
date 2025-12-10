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
    const getItemCount = useCartStore((state) => state.getItemCount);

    // Check unique key for cart item
    const sizeId = selectedSize?.id;
    const quantity = getItemCount(product.id, sizeId);

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
                className="relative z-20 flex items-center justify-between bg-primary rounded-full h-10 w-28"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                {/* Кнопка мінус */}
                <button
                    type="button"
                    onClick={(e) => handleUpdateQuantity(e, -1)}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-primary-600 rounded-full transition-colors"
                >
                    <MinusIcon className="w-5 h-5 pointer-events-none" />
                </button>

                {/* Цифра */}
                <span className="font-bold text-white text-lg min-w-[20px] text-center pointer-events-none">
                    {quantity}
                </span>

                {/* Кнопка плюс */}
                <button
                    type="button"
                    onClick={(e) => handleUpdateQuantity(e, 1)}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-primary-600 rounded-full transition-colors"
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
            className="group flex items-center justify-center w-10 h-10 bg-surface-card rounded-full text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-lg relative z-20"
            aria-label={t("product.addToCart")}
        >
            <PlusIcon className="w-6 h-6 transition-transform group-hover:rotate-90 pointer-events-none" />
        </button>
    );
};

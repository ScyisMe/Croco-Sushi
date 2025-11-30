"use client";

import { useState, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlusIcon, HeartIcon, EyeIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useCartStore, MAX_CART_ITEMS } from "@/store/cartStore";
import { useTranslation } from "@/store/localeStore";
import { Product, ProductSize } from "@/lib/types";
import toast from "react-hot-toast";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";

interface ProductCardProps {
  product: Product;
  onFavoriteToggle?: (productId: number) => void;
  isFavorite?: boolean;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onFavoriteToggle, isFavorite = false, onQuickView }: ProductCardProps) {
  const { t } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);
  const itemsCount = useCartStore((state) => state.items.length);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [isHovered, setIsHovered] = useState(false);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  // Визначаємо ціну
  const currentPrice = Number(selectedSize?.price || product.price || 0);
  const originalPrice = selectedSize?.original_price || product.original_price;
  const hasDiscount = originalPrice && Number(originalPrice) > currentPrice;

  // Визначаємо бейджі
  const badges = [];
  if (product.is_new) badges.push({ label: "Новинка", className: "bg-gradient-to-r from-emerald-400 to-emerald-600 text-white" });
  if (product.is_hit) badges.push({ label: "Хіт", className: "bg-gradient-to-r from-amber-400 to-amber-600 text-white" });
  if (product.is_promotion || hasDiscount) badges.push({ label: "Акція", className: "bg-gradient-to-r from-rose-400 to-rose-600 text-white" });

  // INP optimization - використовуємо startTransition для некритичних оновлень
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Перевірка на максимум товарів
    if (itemsCount >= MAX_CART_ITEMS) {
      toast.error(`Максимум ${MAX_CART_ITEMS} різних товарів у кошику`);
      return;
    }

    // Використовуємо startTransition для некритичного оновлення стану
    startTransition(() => {
      addItem({
        id: product.id,
        name: product.name,
        price: currentPrice,
        image_url: product.image_url,
        size: selectedSize?.name,
        sizeId: selectedSize?.id,
        quantity: 1,
      });
    });

    toast.success(`${product.name} додано в кошик`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(product.id);
    }
  };

  const handleSizeSelect = (e: React.MouseEvent, size: ProductSize) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  };

  return (
    <GlassCard
      className="group relative overflow-hidden h-full flex flex-col border-white/5 bg-surface-card/50 hover:bg-surface-card/80"
      hoverEffect
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Зображення - посилання */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden rounded-xl mb-4">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-surface-card flex items-center justify-center">
            <span className="text-6xl">🍣</span>
          </div>
        )}

        {/* Бейджі */}
        {badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {badges.map((badge, index) => (
              <span key={index} className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${badge.className}`}>
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Кнопки дій */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${isFavorite
              ? "bg-accent-red text-white shadow-lg shadow-accent-red/30"
              : "bg-black/20 text-white hover:bg-white hover:text-accent-red"
              }`}
            aria-label={isFavorite ? "Видалити з обраного" : "Додати в обране"}
          >
            {isFavorite ? (
              <HeartSolidIcon className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </button>
        )}
        {onQuickView && (
          <button
            onClick={handleQuickView}
            className={`p-2.5 rounded-full backdrop-blur-md bg-black/20 text-white hover:bg-white hover:text-primary transition-all duration-300 ${isHovered ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
              }`}
            title="Швидкий перегляд"
            aria-label="Швидкий перегляд"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 flex flex-col">
        {/* Назва - посилання */}
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-display font-bold text-xl text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Опис/склад */}
        {product.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        {/* Вибір розміру */}
        {product.sizes && product.sizes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {product.sizes.map((size) => (
              <button
                key={size.id}
                onClick={(e) => handleSizeSelect(e, size)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${selectedSize?.id === size.id
                  ? "bg-primary-500/20 text-primary-400 border-primary-500"
                  : "bg-transparent text-gray-400 border-white/10 hover:border-primary-500/50 hover:text-white"
                  }`}
              >
                {size.name}
              </button>
            ))}
          </div>
        )}

        {/* Ціна та кнопка */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-display">
                {currentPrice} <span className="text-sm font-normal text-gray-400">₴</span>
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through decoration-rose-500/50">
                  {originalPrice} ₴
                </span>
              )}
            </div>
            {selectedSize?.weight && (
              <span className="text-xs text-gray-500">
                {selectedSize.weight} г
              </span>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            size="sm"
            className="rounded-full w-12 h-12 p-0 !px-0 flex items-center justify-center shadow-lg shadow-primary-500/20"
            aria-label={t("product.addToCart")}
          >
            <PlusIcon className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

// Skeleton для завантаження
export function ProductCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden p-6 h-full">
      <div className="aspect-square bg-white/5 rounded-xl animate-pulse mb-4" />
      <div className="space-y-3">
        <div className="h-6 bg-white/5 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
        <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse" />
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
          <div className="h-8 bg-white/5 rounded w-24 animate-pulse" />
          <div className="w-12 h-12 bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlusIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useCartStore } from "@/store/cartStore";
import { Product, ProductSize } from "@/lib/types";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
  onFavoriteToggle?: (productId: number) => void;
  isFavorite?: boolean;
}

export default function ProductCard({ product, onFavoriteToggle, isFavorite = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [isHovered, setIsHovered] = useState(false);

  // Визначаємо ціну
  const currentPrice = selectedSize?.price || product.price;
  const originalPrice = selectedSize?.original_price || product.original_price;
  const hasDiscount = originalPrice && originalPrice > currentPrice;

  // Визначаємо бейджі
  const badges = [];
  if (product.is_new) badges.push({ label: "Новинка", className: "badge-new" });
  if (product.is_hit) badges.push({ label: "Хіт", className: "badge-hit" });
  if (product.is_promotion || hasDiscount) badges.push({ label: "Акція", className: "badge-sale" });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image_url: product.image_url,
      size: selectedSize?.name,
      quantity: 1,
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
    <Link href={`/products/${product.slug}`}>
      <article
        className="card group relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Зображення */}
        <div className="relative aspect-square overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-6xl">🍣</span>
            </div>
          )}

          {/* Бейджі */}
          {badges.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {badges.map((badge, index) => (
                <span key={index} className={`badge ${badge.className}`}>
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          {/* Кнопка обране */}
          {onFavoriteToggle && (
            <button
              onClick={handleFavoriteClick}
              className={`absolute top-3 right-3 p-2 rounded-full transition ${
                isFavorite
                  ? "bg-accent-red text-white"
                  : "bg-white/80 text-gray-600 hover:bg-white hover:text-accent-red"
              }`}
            >
              {isFavorite ? (
                <HeartSolidIcon className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Контент */}
        <div className="p-4">
          {/* Назва */}
          <h3 className="font-bold text-lg text-secondary mb-2 line-clamp-2 group-hover:text-primary transition">
            {product.name}
          </h3>

          {/* Опис/склад */}
          {product.description && (
            <p className="text-sm text-secondary-light mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Вибір розміру */}
          {product.sizes && product.sizes.length > 1 && (
            <div className="flex gap-2 mb-3">
              {product.sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={(e) => handleSizeSelect(e, size)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition ${
                    selectedSize?.id === size.id
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-secondary border-border hover:border-primary"
                  }`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          )}

          {/* Ціна та кнопка */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">
                {currentPrice} ₴
              </span>
              {hasDiscount && (
                <span className="text-sm text-secondary-light line-through">
                  {originalPrice} ₴
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-primary-600 text-white rounded-full transition transform hover:scale-110"
              aria-label="Додати в кошик"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Вага/порція (якщо є) */}
          {selectedSize?.weight && (
            <p className="text-xs text-secondary-light mt-2">
              {selectedSize.weight} г
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

// Skeleton для завантаження
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton w-3/4" />
        <div className="h-4 skeleton w-full" />
        <div className="h-4 skeleton w-2/3" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-6 skeleton w-20" />
          <div className="w-10 h-10 skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}


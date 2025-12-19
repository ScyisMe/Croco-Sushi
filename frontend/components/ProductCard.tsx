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
import { ProductActions } from "./ProductActions";
import { FireIcon } from "@heroicons/react/24/solid";
// Use Leaf icon or similar for Vegan if no specific Vegan icon available in Outline/Solid standard set, or import from another lib if available. 
// Assuming SparklesIcon or similar as placeholder if specific one missing, but Heroicons has rudimentary support.
// Let's use Sparkles for "Hit"/Popular if not already defined.
// Actually let's just use what we have or generic ones.
import { SparklesIcon } from "@heroicons/react/24/solid"; // For 'New' maybe?
import { HandThumbUpIcon } from "@heroicons/react/24/solid"; // For 'Hit'

interface ProductCardProps {
  product: Product;
  onFavoriteToggle?: (productId: number) => void;
  isFavorite?: boolean;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
  isSet?: boolean;
}

export default function ProductCard({ product, onFavoriteToggle, isFavorite = false, onQuickView, priority = false, isSet = false }: ProductCardProps) {
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
  // Logic to determine badges
  const isSpicy = (product as any).is_spicy || product.name.toLowerCase().includes('спайсі') || product.description?.toLowerCase().includes('гострий') || product.description?.toLowerCase().includes('spicy');
  const isVegan = (product as any).is_vegan || product.name.toLowerCase().includes('веган') || product.description?.toLowerCase().includes('веган') || product.description?.toLowerCase().includes('vegan') || product.description?.toLowerCase().includes('овоч');

  const marketingBadges = [];
  const infoBadges = [];

  // Marketing Badges (Max 2)
  if (product.is_new) {
    marketingBadges.push({
      label: "NEW",
      className: "bg-indigo-500/20 text-indigo-200 border-indigo-500/50",
      icon: null
    });
  }

  if (product.is_top_seller || product.is_popular || product.is_hit) {
    // Only one "Hit" badge
    marketingBadges.push({
      label: "HIT",
      className: "bg-yellow-500/20 text-yellow-200 border-yellow-500/50",
      icon: null
    });
  }

  if ((product.is_promotion || hasDiscount) && marketingBadges.length < 2) {
    marketingBadges.push({
      label: "SALE",
      className: "bg-rose-500/20 text-rose-200 border-rose-500/50",
      icon: null
    });
  }

  // Info Badges (Icons)
  if (isSpicy) {
    infoBadges.push({
      id: "spicy",
      icon: "🌶️",
      label: "Гостре",
      className: "bg-red-500/10 text-red-400 border-red-500/20"
    });
  }
  if (isVegan) {
    infoBadges.push({
      id: "vegan",
      icon: "🌱",
      label: "Веган",
      className: "bg-green-500/10 text-green-400 border-green-500/20"
    });
  }

  // Helper to highlight ingredients
  const highlightIngredients = (text?: string) => {
    if (!text) return null;
    const keywords = ['лосось', 'вугор', 'креветка', 'тунець', 'краб', 'авокадо', 'сир', 'salmon', 'eel', 'shrimp', 'tuna', 'crab', 'avocado', 'cheese', 'філадельфія'];

    // Simple split by comma or just return text with highlighted words replacements not reliable with react elements in string replacement simply.
    // Using simple string replacement logic for display.
    // We will render HTML safely or use parts.

    const parts = text.split(/([,.]\s+)/); // Split by punctuation

    return parts.map((part, index) => {
      const lower = part.toLowerCase();
      const keyword = keywords.find(k => lower.includes(k));
      if (keyword) {
        // If part contains a keyword, we might want to highlight just the keyword or the whole phrase?
        // User asked "Highlight key ingredients (salmon, eel...) bold".
        // Let's wrap the found keyword in bold.
        const regex = new RegExp(`(${keyword})`, 'gi');
        const subParts = part.split(regex);
        return (
          <span key={index}>
            {subParts.map((sub, i) =>
              sub.toLowerCase() === keyword.toLowerCase() ? <strong key={i} className="text-white font-semibold">{sub}</strong> : sub
            )}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const ingredientsText = product.ingredients || product.description;



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
      className={`group relative overflow-hidden h-full flex flex-col bg-surface-card/40 border-white/5 hover:bg-surface-card/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${isSet ? 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : ''
        }`}
      hoverEffect
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Зображення - Edge to Edge */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden mb-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-hover:rotate-1"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-surface-lighter flex items-center justify-center p-8">
            <div className="relative w-full h-full">
              <Image
                src="/logo.png"
                alt={product.name}
                fill
                className="object-contain opacity-20 grayscale"
              />
            </div>
          </div>
        )}

        {/* Gradient Overlay for Text Readability if needed, or just slight darkening */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-20 md:opacity-60" />

        {/* Бейджі - Minimalist */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          {marketingBadges.slice(0, 2).map((badge, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm backdrop-blur-md border ${badge.className}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </Link>

      {/* Кнопки дій (Favorite/QuickView) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${isFavorite
              ? "bg-accent-terracotta text-white shadow-lg shadow-accent-terracotta/20"
              : "bg-black/30 text-white hover:bg-white hover:text-accent-terracotta border border-white/10"
              }`}
            aria-label={isFavorite ? "Видалити з обраного" : "Додати в обране"}
          >
            {isFavorite ? (
              <HeartSolidIcon className="w-4 h-4" />
            ) : (
              <HeartIcon className="w-4 h-4" />
            )}
          </button>
        )}
        {onQuickView && (
          <button
            onClick={handleQuickView}
            className={`p-2.5 rounded-full backdrop-blur-md bg-black/30 text-white hover:bg-white hover:text-primary transition-all duration-300 border border-white/10 ${isHovered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
              }`}
            title="Швидкий перегляд"
            aria-label="Швидкий перегляд"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Контент - Padded with extra bottom space for air */}
      <div className="p-2.5 pb-3 md:p-5 flex flex-col flex-1 relative">
        {/* Назва - посилання */}
        <Link href={`/products/${product.slug}`} className="block mb-1 md:mb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-medium text-sm md:text-lg leading-tight text-white group-hover:text-primary-400 transition-colors line-clamp-2">
              {product.name}
            </h3>
            {/* Info Badges (Mini Icons) */}
            {infoBadges.length > 0 && (
              <div className="flex gap-1 shrink-0 mt-0.5">
                {infoBadges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.label}
                    className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-[10px] md:text-xs backdrop-blur-sm border ${badge.className}`}
                  >
                    {badge.icon}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Опис/склад */}
        {ingredientsText && (
          <p className="text-xs md:text-sm text-gray-300 mb-2 md:mb-4 leading-normal font-normal tracking-wide line-clamp-2 md:line-clamp-none">
            {highlightIngredients(ingredientsText)}
          </p>
        )}

        {/* Вибір розміру */}
        {product.sizes && product.sizes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4 mt-auto">
            {product.sizes.map((size) => (
              <button
                key={size.id}
                onClick={(e) => handleSizeSelect(e, size)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded border transition-all ${selectedSize?.id === size.id
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300"
                  }`}
              >
                {size.name}
              </button>
            ))}
          </div>
        )}

        {/* Ціна та кнопка */}
        <div className={`flex items-center justify-between pt-4 border-t border-white/5 ${(!product.sizes || product.sizes.length <= 1) ? 'mt-auto' : ''}`}>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1 md:gap-2 flex-wrap">
              <span className="text-lg md:text-xl font-display font-bold md:font-extrabold text-white tracking-tight">
                {currentPrice} <span className="text-xs md:text-sm font-normal text-gray-500">₴</span>
              </span>
              {(selectedSize?.weight || product.weight) && (
                <span className="text-xs text-gray-500 font-medium">
                  / {selectedSize?.weight || product.weight} г
                </span>
              )}
              {hasDiscount && (
                <span className="text-sm text-gray-600 line-through decoration-rose-500/50 ml-1">
                  {originalPrice} ₴
                </span>
              )}
            </div>
          </div>

          <ProductActions
            product={product}
            selectedSize={selectedSize}
            currentPrice={currentPrice}
          />
        </div>
      </div>
    </GlassCard>
  );
}

// Skeleton with Shimmer
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden h-full relative bg-surface-card/40 border border-white/5">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />

      {/* Edge to Edge Image Placeholder */}
      <div className="aspect-square bg-white/5 mb-0" />

      <div className="p-5 space-y-4">
        <div className="h-6 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
          <div className="h-8 bg-white/5 rounded w-20" />
          <div className="w-10 h-10 bg-white/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}


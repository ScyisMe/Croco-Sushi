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
  const isSpicy = (product as any).is_spicy || product.name.toLowerCase().includes('спайсі') || product.description?.toLowerCase().includes('гострий') || product.description?.toLowerCase().includes('spicy');
  const isVegan = (product as any).is_vegan || product.name.toLowerCase().includes('веган') || product.description?.toLowerCase().includes('веган') || product.description?.toLowerCase().includes('vegan') || product.description?.toLowerCase().includes('овоч');

  const marketingBadges = [];
  const infoBadges = [];

  // Marketing Badges (Max 2)
  // Marketing Badges (Max 2)
  if (product.is_new) {
    marketingBadges.push({
      label: "Новинка",
      className: "bg-[#00CC99] text-white border-none shadow-[0_4px_10px_rgba(0,204,153,0.3)] rounded-full px-2.5",
      icon: null
    });
  }

  if (product.is_top_seller || product.is_popular || product.is_hit) {
    marketingBadges.push({
      label: "Хіт",
      className: "bg-[#FFA500] text-white border-none shadow-[0_4px_10px_rgba(255,165,0,0.3)] rounded-full px-2.5",
      icon: null
    });
  }

  if ((product.is_promotion || hasDiscount) && marketingBadges.length < 2) {
    marketingBadges.push({
      label: "Акція",
      className: "bg-rose-600 text-white border-none shadow-[0_4px_10px_rgba(225,29,72,0.4)] rounded-full px-2.5",
      icon: null
    });
  }

  // Info Badges (Icons)
  if (isSpicy) {
    infoBadges.push({
      id: "spicy",
      icon: <FireIcon className="w-4 h-4" />,
      label: "Гостре",
      className: "bg-red-500/20 text-red-500 border-red-500/30 rounded-full"
    });
  }
  if (isVegan) {
    infoBadges.push({
      id: "vegan",
      icon: <SparklesIcon className="w-4 h-4" />, // Fallback to Sparkles if Leaf not available
      label: "Веган",
      className: "bg-green-500/20 text-green-500 border-green-500/30 rounded-full"
    });
  }

  // Helper to highlight ingredients
  const highlightIngredients = (text?: string) => {
    if (!text) return null;
    const keywords = ['лосось', 'вугор', 'креветка', 'тунець', 'краб', 'авокадо', 'сир', 'гребінець', 'ікра', 'salmon', 'eel', 'shrimp', 'tuna', 'crab', 'avocado', 'cheese', 'scallop', 'caviar', 'філадельфія'];

    const parts = text.split(/([,.]\s+)/); // Split by punctuation

    return parts.map((part, index) => {
      const lower = part.toLowerCase();
      const keyword = keywords.find(k => lower.includes(k));
      if (keyword) {
        // Highlight found keyword
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
      className={`group relative overflow-hidden flex flex-col 
      bg-[#1E1E1E]/80 backdrop-blur-xl 
      border border-white/10 hover:border-primary/60 
      transition-all duration-300 ease-out 
      hover:-translate-y-1 
      shadow-md hover:shadow-[0_20px_40px_-15px_rgba(34,197,94,0.3)] 
      ${isSet ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : ''}`}
      hoverEffect={false} // Custom hover effect above
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
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
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

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />

        {/* Бейджі */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start z-10">
          {marketingBadges.slice(0, 2).map((badge, index) => (
            <span
              key={index}
              className={`px-3 py-1 text-[10px] font-bold tracking-wide ${badge.className}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
        {/* Вага - переміщено на фото */}
        {(selectedSize?.weight || product.weight) && (
          <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-lg border border-white/10 shadow-sm">
            {selectedSize?.weight || product.weight} г
          </div>
        )}
      </Link>

      {/* Кнопки дій (Favorite/QuickView) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${isFavorite
              ? "bg-accent-terracotta text-white shadow-lg shadow-accent-terracotta/30 scale-110"
              : "bg-black/50 text-white hover:bg-white hover:text-accent-terracotta border border-white/10"
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
            className={`p-2.5 rounded-full backdrop-blur-md bg-black/50 text-white hover:bg-white hover:text-primary transition-all duration-300 border border-white/10 ${isHovered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
              }`}
            title="Швидкий перегляд"
            aria-label="Швидкий перегляд"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        )}
      </div>



      {/* Контент */}
      <div className="p-4 flex flex-col relative bg-[#1E1E1E]/40">
        {/* Назва - посилання */}
        <Link href={`/products/${product.slug}`} className="block mb-2 relative z-30">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-medium text-lg leading-snug text-white group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>

            {/* Info Badges (Mini Icons) */}
            {infoBadges.length > 0 && (
              <div className="flex gap-1 shrink-0 mt-0.5">
                {infoBadges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.label}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm backdrop-blur-sm border ${badge.className}`}
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
          <div className="relative mb-4">
            {/* 1. Placeholder: Keeps the layout height fixed. Invisible on hover. */}
            <p className="text-sm text-gray-400 leading-normal font-normal line-clamp-2 group-hover:opacity-0 transition-opacity duration-300">
              {highlightIngredients(ingredientsText)}
            </p>

            {/* 2. Overlay: Expands on hover. Absolute. */}
            <div className="absolute top-0 left-0 right-0 z-20 
               opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300
               -mx-3 -mt-2 p-3 rounded-xl bg-[#1E1E1E] shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/5
               min-h-full h-auto w-[calc(100%+1.5rem)]
               flex flex-col
             ">
              <p className="text-sm text-gray-300 leading-normal font-normal">
                {highlightIngredients(ingredientsText)}
              </p>
            </div>
          </div>
        )}

        {/* Вибір розміру */}
        {product.sizes && product.sizes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {product.sizes.map((size) => (
              <button
                key={size.id}
                onClick={(e) => handleSizeSelect(e, size)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all ${selectedSize?.id === size.id
                  ? "bg-white text-black border-white shadow-lg"
                  : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                  }`}
              >
                {size.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold text-white tracking-tight whitespace-nowrap">
                {currentPrice} <span className="text-sm text-gray-500 font-normal">₴</span>
              </span>

              {hasDiscount && (
                <span className="text-sm text-gray-600 line-through decoration-rose-500/50">
                  {originalPrice} ₴
                </span>
              )}
            </div>
            {/* Weight moved to image */}
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


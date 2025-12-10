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
  const badges = [];

  // Logic to determine badges (infer from text if not present in validation)
  const isSpicy = product.is_spicy || product.name.toLowerCase().includes('спайсі') || product.description?.toLowerCase().includes('гострий') || product.description?.toLowerCase().includes('spicy');
  const isVegan = product.is_vegan || product.name.toLowerCase().includes('веган') || product.description?.toLowerCase().includes('веган') || product.description?.toLowerCase().includes('vegan') || product.description?.toLowerCase().includes('овоч');

  if (product.is_top_seller) badges.push({ label: "Top", className: "", icon: "/badges/top.png", isImage: true });
  if (product.is_new) badges.push({ label: "Новинка", className: "", icon: "/badges/new.png", isImage: true });
  if (product.is_popular || product.is_hit) badges.push({ label: "Хіт", className: "", icon: "/badges/hit.png", isImage: true });
  if (product.is_promotion || hasDiscount) badges.push({ label: "Акція", className: "bg-rose-500/90 text-white backdrop-blur-sm", icon: "🏷️" });
  if (isSpicy) badges.push({ label: "Гостре", className: "", icon: "/badges/spicy.png", isImage: true });
  if (isVegan) badges.push({ label: "Веган", className: "", icon: "/badges/vegan.png", isImage: true });

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
      className={`group relative overflow-hidden h-full flex flex-col border-white/5 bg-surface-card/50 transition-all duration-300 hover:bg-surface-card/80 hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(34,197,94,0.15)] ${isSet ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''}`}
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-surface-card flex items-center justify-center p-8">
            <div className="relative w-full h-full">
              <Image
                src="/logo.png"
                alt={product.name}
                fill
                className="object-contain opacity-50 grayscale"
              />
            </div>
          </div>
        )}

        {/* Бейджі */}
        {badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {badges.map((badge, index) => (
              badge.isImage ? (
                <div key={index} className="relative w-8 h-8 md:w-10 md:h-10 drop-shadow-lg transition-transform hover:scale-110" title={badge.label}>
                  <Image
                    src={badge.icon as string}
                    alt={badge.label}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <span key={index} className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1.5 ${badge.className}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              )
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
        {ingredientsText && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-1 leading-relaxed">
            {highlightIngredients(ingredientsText)}
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
    <div className="glass-card rounded-2xl overflow-hidden p-6 h-full relative">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />

      <div className="aspect-square bg-white/5 rounded-xl mb-4" />
      <div className="space-y-3">
        <div className="h-6 bg-white/5 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-2/3" />
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
          <div className="h-8 bg-white/5 rounded w-24" />
          <div className="w-12 h-12 bg-white/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}


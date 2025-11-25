"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/lib/api/client";
import { Product, ProductSize } from "@/lib/types";
import {
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const addItem = useCartStore((state) => state.addItem);

  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Завантаження товару
  const productQuery = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${slug}`);
      return response.data;
    },
  });

  // Завантаження схожих товарів
  const relatedQuery = useQuery<Product[]>({
    queryKey: ["products", "related", productQuery.data?.category_id],
    queryFn: async () => {
      if (!productQuery.data?.category_id) return [];
      const response = await apiClient.get("/products", {
        params: {
          category_id: productQuery.data.category_id,
          limit: 4,
          is_available: true,
        },
      });
      const products = response.data.items || response.data;
      // Виключаємо поточний товар
      return products.filter((p: Product) => p.id !== productQuery.data?.id);
    },
    enabled: !!productQuery.data?.category_id,
  });

  const product = productQuery.data;

  // Встановлюємо перший розмір за замовчуванням
  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      const defaultSize = product.sizes.find((s) => s.is_default) || product.sizes[0];
      setSelectedSize(defaultSize);
    }
  }, [product, selectedSize]);

  // Скидаємо стан при зміні товару
  useEffect(() => {
    setQuantity(1);
    setSelectedSize(null);
    setSelectedImageIndex(0);
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: selectedSize?.price || product.price,
      image_url: product.image_url,
      size: selectedSize?.name,
      sizeId: selectedSize?.id,
      quantity,
    });
    toast.success(`${product.name} додано в кошик`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch {
        // Користувач скасував
      }
    } else {
      // Копіюємо посилання
      navigator.clipboard.writeText(window.location.href);
      toast.success("Посилання скопійовано");
    }
  };

  // Розрахунок ціни
  const currentPrice = selectedSize?.price || product?.price || 0;
  const originalPrice = selectedSize?.original_price || product?.original_price;
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const totalPrice = currentPrice * quantity;

  // Зображення товару
  const images = product?.images?.length ? product.images : product?.image_url ? [product.image_url] : [];

  // Loading state
  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square skeleton rounded-xl" />
            <div className="space-y-4">
              <div className="h-10 skeleton w-3/4 rounded" />
              <div className="h-6 skeleton w-full rounded" />
              <div className="h-6 skeleton w-2/3 rounded" />
              <div className="h-12 skeleton w-1/3 rounded" />
              <div className="h-14 skeleton w-full rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (productQuery.isError || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-secondary mb-4">Товар не знайдено</h1>
          <p className="text-secondary-light mb-6">
            Можливо, цей товар більше не доступний
          </p>
          <Link href="/menu" className="btn-primary">
            Перейти до меню
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow">
        {/* Хлібні крихти */}
        <div className="bg-white border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm">
              <Link href="/" className="text-secondary-light hover:text-primary transition">
                Головна
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <Link href="/menu" className="text-secondary-light hover:text-primary transition">
                Меню
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <span className="text-secondary font-medium truncate max-w-[200px]">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Зображення */}
              <div className="p-6 lg:p-8">
                {/* Головне зображення */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
                  {images.length > 0 ? (
                    <Image
                      src={images[selectedImageIndex]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl">
                      🍣
                    </div>
                  )}

                  {/* Бейджі */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.is_new && (
                      <span className="badge badge-new">Новинка</span>
                    )}
                    {product.is_hit && (
                      <span className="badge badge-hit">Хіт</span>
                    )}
                    {hasDiscount && (
                      <span className="badge badge-sale">
                        -{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Кнопки дій */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`p-2 rounded-full transition ${
                        isFavorite
                          ? "bg-accent-red text-white"
                          : "bg-white/90 text-secondary hover:text-accent-red"
                      }`}
                    >
                      {isFavorite ? (
                        <HeartSolidIcon className="w-6 h-6" />
                      ) : (
                        <HeartIcon className="w-6 h-6" />
                      )}
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-full bg-white/90 text-secondary hover:text-primary transition"
                    >
                      <ShareIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Мініатюри (якщо є кілька зображень) */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                          selectedImageIndex === index
                            ? "border-primary"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Інформація */}
              <div className="p-6 lg:p-8 lg:border-l border-border">
                <h1 className="text-2xl lg:text-3xl font-bold text-secondary mb-4">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="text-secondary-light mb-6">{product.description}</p>
                )}

                {/* Вага/калорії */}
                {(selectedSize?.weight || product.weight || product.calories) && (
                  <div className="flex gap-4 mb-6 text-sm text-secondary-light">
                    {(selectedSize?.weight || product.weight) && (
                      <span>Вага: {selectedSize?.weight || product.weight} г</span>
                    )}
                    {product.calories && <span>Калорії: {product.calories} ккал</span>}
                  </div>
                )}

                {/* Вибір розміру */}
                {product.sizes && product.sizes.length > 1 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-secondary mb-3">Оберіть розмір:</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.sizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          className={`px-5 py-3 rounded-lg border-2 transition ${
                            selectedSize?.id === size.id
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          <div className="font-semibold">{size.name}</div>
                          <div className="text-sm text-secondary-light">
                            {size.price} ₴
                            {size.weight && <span className="ml-1">• {size.weight} г</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Кількість */}
                <div className="mb-6">
                  <h3 className="font-semibold text-secondary mb-3">Кількість:</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 text-secondary-light hover:text-secondary transition"
                        disabled={quantity <= 1}
                      >
                        <MinusIcon className="w-5 h-5" />
                      </button>
                      <span className="w-12 text-center font-semibold text-lg">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-3 text-secondary-light hover:text-secondary transition"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ціна */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary">
                      {totalPrice} ₴
                    </span>
                    {hasDiscount && (
                      <span className="text-lg text-secondary-light line-through">
                        {(originalPrice * quantity)} ₴
                      </span>
                    )}
                  </div>
                  {quantity > 1 && (
                    <p className="text-sm text-secondary-light mt-1">
                      {currentPrice} ₴ × {quantity} шт.
                    </p>
                  )}
                </div>

                {/* Кнопка додати в кошик */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.is_available}
                  className="w-full bg-primary hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl text-lg transition flex items-center justify-center gap-3"
                >
                  <ShoppingCartIcon className="w-6 h-6" />
                  {product.is_available ? "Додати в кошик" : "Немає в наявності"}
                </button>

                {/* Додаткова інформація */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-secondary-light">
                      <span>🚚</span>
                      <span>Доставка від 30 хв</span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-light">
                      <span>💳</span>
                      <span>Оплата карткою або готівкою</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Схожі товари */}
          {relatedQuery.data && relatedQuery.data.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-secondary mb-6">
                Схожі страви
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedQuery.isLoading
                  ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
                  : relatedQuery.data.slice(0, 4).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

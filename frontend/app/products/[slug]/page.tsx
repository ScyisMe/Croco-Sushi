"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/lib/api/client";
import { Product, ProductSize, Review, Favorite } from "@/lib/types";
import {
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { JsonLd, getProductSchema, getBreadcrumbSchema, BUSINESS_INFO } from "@/lib/schema";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;
  const addItem = useCartStore((state) => state.addItem);

  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Перевірка авторизації
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  // Завантаження товару
  const productQuery = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${slug}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 хвилин - товари рідко змінюються
  });

  // Завантаження обраного
  const favoritesQuery = useQuery<Favorite[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/favorites");
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Перевіряємо чи товар в обраному
  const isFavorite = favoritesQuery.data?.some((f) => f.product_id === productQuery.data?.id) || false;

  // Мутація для обраного
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (isFavorite) {
        await apiClient.delete(`/users/me/favorites/${productId}`);
        return "removed";
      } else {
        await apiClient.post(`/users/me/favorites/${productId}`);
        return "added";
      }
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(action === "added" ? "Додано в обране" : "Видалено з обраного");
    },
    onError: () => {
      toast.error("Помилка. Спробуйте ще раз");
    },
  });

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      toast.error("Увійдіть, щоб додати в обране");
      router.push("/login");
      return;
    }
    if (productQuery.data?.id) {
      toggleFavoriteMutation.mutate(productQuery.data.id);
    }
  };

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
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });

  // Завантаження відгуків про товар
  const reviewsQuery = useQuery<Review[]>({
    queryKey: ["reviews", "product", productQuery.data?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/reviews/product/${productQuery.data?.id}`);
      return response.data;
    },
    enabled: !!productQuery.data?.id,
    staleTime: 2 * 60 * 1000, // 2 хвилини - відгуки можуть оновлюватися частіше
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

  // Розрахунок середнього рейтингу для схеми
  const averageRating = reviewsQuery.data?.length
    ? reviewsQuery.data.reduce((sum, r) => sum + r.rating, 0) / reviewsQuery.data.length
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Schema.org markup для SEO */}
      <JsonLd
        schema={getProductSchema({
          name: product.name,
          description: product.description || "",
          image: product.image_url || `${BUSINESS_INFO.url}/logo.jpg`,
          price: currentPrice,
          url: `${BUSINESS_INFO.url}/products/${product.slug}`,
          sku: product.slug,
          category: product.category?.name,
          rating: reviewsQuery.data?.length
            ? { value: averageRating, count: reviewsQuery.data.length }
            : undefined,
          inStock: product.is_available,
        })}
      />
      <JsonLd
        schema={getBreadcrumbSchema([
          { name: "Головна", url: BUSINESS_INFO.url },
          { name: "Меню", url: `${BUSINESS_INFO.url}/menu` },
          { name: product.name, url: `${BUSINESS_INFO.url}/products/${product.slug}` },
        ])}
      />
      
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
                      onClick={handleFavoriteToggle}
                      disabled={toggleFavoriteMutation.isPending}
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

          {/* Відгуки */}
          <section className="mt-12">
            <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary">
                  Відгуки {reviewsQuery.data && reviewsQuery.data.length > 0 && (
                    <span className="text-secondary-light font-normal">
                      ({reviewsQuery.data.length})
                    </span>
                  )}
                </h2>
              </div>

              {reviewsQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                          <div className="h-3 w-32 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="h-4 w-full bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {reviewsQuery.data.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 border border-border rounded-xl hover:border-primary/30 transition"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {review.user_name?.charAt(0).toUpperCase() || "К"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-secondary">
                              {review.user_name || "Клієнт"}
                            </p>
                            <span className="text-sm text-secondary-light">
                              {new Date(review.created_at).toLocaleDateString("uk-UA", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          {/* Рейтинг */}
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              star <= review.rating ? (
                                <StarSolidIcon key={star} className="w-4 h-4 text-yellow-400" />
                              ) : (
                                <StarIcon key={star} className="w-4 h-4 text-gray-300" />
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-secondary-light">{review.comment}</p>
                      
                      {/* Відповідь адміністрації */}
                      {review.reply_text && (
                        <div className="mt-3 ml-4 p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
                          <p className="text-sm font-semibold text-secondary mb-1">
                            Відповідь Croco Sushi
                          </p>
                          <p className="text-sm text-secondary-light">{review.reply_text}</p>
                        </div>
                      )}

                      {/* Фото відгуку */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {review.images.map((img, index) => (
                            <div key={index} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <Image
                                src={img}
                                alt={`Фото відгуку ${index + 1}`}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-secondary-light mb-2">Поки немає відгуків</p>
                  <p className="text-sm text-secondary-light">
                    Будьте першим, хто залишить відгук про цю страву!
                  </p>
                </div>
              )}
            </div>
          </section>

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

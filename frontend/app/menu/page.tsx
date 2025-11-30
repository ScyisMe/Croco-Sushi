"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { Category, Product, Favorite } from "@/lib/types";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import QuickViewModal from "@/components/QuickViewModal";
import toast from "react-hot-toast";
import { JsonLd, getBreadcrumbSchema, BUSINESS_INFO } from "@/lib/schema";

// Кількість товарів на сторінку
const PRODUCTS_PER_PAGE = 12;

// Опції сортування
const SORT_OPTIONS = [
  { value: "position", label: "За замовчуванням" },
  { value: "popular", label: "Популярні" },
  { value: "name", label: "За назвою" },
  { value: "price_asc", label: "Спочатку дешевші" },
  { value: "price_desc", label: "Спочатку дорожчі" },
];

function MenuContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const sortParam = searchParams.get("sort");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categorySlug);
  const [sortBy, setSortBy] = useState<string>(sortParam || "position");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Ref для Intersection Observer (infinite scroll)
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Перевірка авторизації
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  // Debounce для пошуку
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Синхронізація з URL
  useEffect(() => {
    setSelectedCategory(categorySlug);
  }, [categorySlug]);

  // Завантаження категорій
  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiClient.get("/categories");
      return response.data;
    },
  });

  // Завантаження товарів з infinite scroll
  const productsQuery = useInfiniteQuery({
    queryKey: ["products", selectedCategory, debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const params: Record<string, unknown> = {
        skip: pageParam,
        limit: PRODUCTS_PER_PAGE,
        is_available: true,
      };
      if (selectedCategory) {
        params.category_slug = selectedCategory;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      const response = await apiClient.get("/products", { params });
      // API може повертати { items: [...], total: ... } або просто [...]
      const items = response.data.items || response.data;
      const total = response.data.total ?? items.length;
      return {
        items: items as Product[],
        nextOffset: pageParam + PRODUCTS_PER_PAGE,
        hasMore: pageParam + PRODUCTS_PER_PAGE < total,
        total,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
  });

  // Всі завантажені товари
  const allProducts = useMemo(() => {
    return productsQuery.data?.pages.flatMap((page) => page.items) || [];
  }, [productsQuery.data]);

  // Intersection Observer для infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
        productsQuery.fetchNextPage();
      }
    },
    [productsQuery]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Завантаження обраного (якщо авторизований)
  const favoritesQuery = useQuery<Favorite[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/favorites");
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Множина ID обраних товарів для швидкого пошуку
  const favoriteIds = useMemo(() => {
    return new Set(favoritesQuery.data?.map((f) => f.product_id) || []);
  }, [favoritesQuery.data]);

  // Мутація для додавання/видалення з обраного
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (favoriteIds.has(productId)) {
        await apiClient.delete(`/users/me/favorites/${productId}`);
        return { action: "removed", productId };
      } else {
        await apiClient.post(`/users/me/favorites/${productId}`);
        return { action: "added", productId };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(data.action === "added" ? "Додано в обране" : "Видалено з обраного");
    },
    onError: () => {
      toast.error("Помилка. Спробуйте ще раз");
    },
  });

  // Обробник перемикання обраного
  const handleFavoriteToggle = (productId: number) => {
    if (!isAuthenticated) {
      toast.error("Увійдіть, щоб додати в обране");
      router.push("/login");
      return;
    }
    toggleFavoriteMutation.mutate(productId);
  };

  // Обробник швидкого перегляду
  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const categories = categoriesQuery.data?.filter((cat) => cat.is_active) || [];

  // Загальна кількість товарів
  const totalProducts = productsQuery.data?.pages[0]?.total ?? 0;

  // Сортування товарів
  const sortedProducts = useMemo(() => {
    const products = allProducts;
    const sorted = [...products];

    switch (sortBy) {
      case "price_asc":
        return sorted.sort((a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0"));
      case "price_desc":
        return sorted.sort((a, b) => parseFloat(b.price || "0") - parseFloat(a.price || "0"));
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, "uk"));
      case "popular":
        return sorted.sort((a, b) => {
          if (a.is_popular && !b.is_popular) return -1;
          if (!a.is_popular && b.is_popular) return 1;
          if (a.is_popular && !b.is_popular) return -1;
          if (!a.is_popular && b.is_popular) return 1;
          return 0;
        });
      default:
        return sorted.sort((a, b) => a.position - b.position);
    }
  }, [allProducts, sortBy]);

  // Зміна категорії
  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);
    if (slug) {
      router.push(`/menu?category=${slug}`, { scroll: false });
    } else {
      router.push("/menu", { scroll: false });
    }
    setIsMobileFilterOpen(false);
  };

  // Отримати назву поточної категорії
  const currentCategoryName = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.name || "Меню"
    : "Все меню";

  // Схема хлібних крихт для SEO
  const breadcrumbItems = [
    { name: "Головна", url: BUSINESS_INFO.url },
    { name: "Меню", url: `${BUSINESS_INFO.url}/menu` },
  ];
  if (selectedCategory && currentCategoryName !== "Меню") {
    breadcrumbItems.push({
      name: currentCategoryName,
      url: `${BUSINESS_INFO.url}/menu?category=${selectedCategory}`,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
      {/* Schema.org markup для SEO */}
      <JsonLd schema={getBreadcrumbSchema(breadcrumbItems)} />

      <Header />

      <main className="flex-grow">
        {/* Хлібні крихти */}
        <div className="bg-theme-surface border-b border-theme">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm">
              <Link href="/" className="text-secondary-light hover:text-primary transition">
                Головна
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <Link href="/menu" className="text-secondary-light hover:text-primary transition">
                Меню
              </Link>
              {selectedCategory && (
                <>
                  <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
                  <span className="text-secondary font-medium">{currentCategoryName}</span>
                </>
              )}
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Заголовок та пошук */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-6">
              {currentCategoryName}
            </h1>

            {/* Пошук та фільтри */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Пошук */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-light" />
                <input
                  type="text"
                  placeholder="Пошук страв..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-light hover:text-secondary"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Сортування (desktop) */}
              <div className="hidden md:block">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input w-auto min-w-[200px]"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Кнопка фільтрів (mobile) */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg text-secondary hover:border-primary transition"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                Фільтри
              </button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Сайдбар з категоріями (desktop) */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-theme-surface rounded-xl shadow-card p-4 sticky top-24">
                <h3 className="font-bold text-lg text-secondary mb-4">Категорії</h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => handleCategoryChange(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${!selectedCategory
                        ? "bg-primary text-white"
                        : "text-secondary hover:bg-theme-secondary"
                        }`}
                    >
                      Все меню
                    </button>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <button
                        onClick={() => handleCategoryChange(category.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === category.slug
                          ? "bg-primary text-white"
                          : "text-secondary hover:bg-theme-secondary"
                          }`}
                      >
                        {category.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Основний контент */}
            <div className="flex-1">
              {/* Горизонтальні категорії (tablet/mobile) */}
              <div className="lg:hidden mb-6 -mx-4 px-4">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${!selectedCategory
                      ? "bg-primary text-white"
                      : "bg-theme-surface text-secondary border border-theme hover:border-primary"
                      }`}
                  >
                    Все
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.slug)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === category.slug
                        ? "bg-primary text-white"
                        : "bg-theme-surface text-secondary border border-theme hover:border-primary"
                        }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Результати пошуку та кількість */}
              {debouncedSearch ? (
                <p className="text-secondary-light mb-4">
                  Результати пошуку для &quot;{debouncedSearch}&quot;: {totalProducts} страв
                </p>
              ) : totalProducts > 0 && (
                <p className="text-secondary-light mb-4">
                  Показано {sortedProducts.length} з {totalProducts} страв
                </p>
              )}

              {/* Skeleton loader для початкового завантаження */}
              {productsQuery.isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Порожній стан */}
              {!productsQuery.isLoading && sortedProducts.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍣</div>
                  <h3 className="text-xl font-semibold text-secondary mb-2">
                    Страви не знайдено
                  </h3>
                  <p className="text-secondary-light mb-6">
                    {debouncedSearch
                      ? "Спробуйте змінити пошуковий запит"
                      : "В цій категорії поки немає страв"}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      handleCategoryChange(null);
                    }}
                    className="btn-fancy group"
                  >
                    <span>Показати все меню</span>
                    <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {/* Список товарів */}
              {!productsQuery.isLoading && sortedProducts.length > 0 && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {sortedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onFavoriteToggle={handleFavoriteToggle}
                        isFavorite={favoriteIds.has(product.id)}
                        onQuickView={handleQuickView}
                      />
                    ))}
                  </div>

                  {/* Елемент для спостереження (infinite scroll) */}
                  <div ref={loadMoreRef} className="py-8">
                    {productsQuery.isFetchingNextPage && (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                        <p className="text-secondary-light text-sm">Завантаження...</p>
                      </div>
                    )}
                    {!productsQuery.hasNextPage && sortedProducts.length > PRODUCTS_PER_PAGE && (
                      <p className="text-center text-secondary-light text-sm">
                        Ви переглянули всі страви 🎉
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div >
      </main >

      <Footer />

      {/* Мобільний фільтр */}
      {
        isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-theme-surface rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-in-up">
              <div className="sticky top-0 bg-theme-surface border-b border-theme p-4 flex items-center justify-between">
                <h3 className="font-bold text-lg">Фільтри</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 text-secondary-light hover:text-secondary"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Сортування */}
                <div>
                  <h4 className="font-semibold text-secondary mb-3">Сортування</h4>
                  <div className="space-y-2">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition ${sortBy === option.value
                          ? "bg-primary text-white"
                          : "bg-theme-secondary text-secondary hover:bg-theme-tertiary"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Категорії */}
                <div>
                  <h4 className="font-semibold text-secondary mb-3">Категорії</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCategoryChange(null)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition ${!selectedCategory
                        ? "bg-primary text-white"
                        : "bg-theme-secondary text-secondary hover:bg-theme-tertiary"
                        }`}
                    >
                      Все меню
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.slug)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition ${selectedCategory === category.slug
                          ? "bg-primary text-white"
                          : "bg-theme-secondary text-secondary hover:bg-theme-tertiary"
                          }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Кнопка застосувати */}
              <div className="sticky bottom-0 bg-theme-surface border-t border-theme p-4">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full btn-primary"
                >
                  Застосувати
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
        onFavoriteToggle={handleFavoriteToggle}
        isFavorite={quickViewProduct ? favoriteIds.has(quickViewProduct.id) : false}
      />
    </div >
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <MenuContent />
    </Suspense>
  );
}

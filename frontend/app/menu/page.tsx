"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { Category, Product } from "@/lib/types";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";

// Опції сортування
const SORT_OPTIONS = [
  { value: "position", label: "За замовчуванням" },
  { value: "popular", label: "Популярні" },
  { value: "name", label: "За назвою" },
  { value: "price_asc", label: "Спочатку дешевші" },
  { value: "price_desc", label: "Спочатку дорожчі" },
];

export default function MenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const sortParam = searchParams.get("sort");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categorySlug);
  const [sortBy, setSortBy] = useState<string>(sortParam || "position");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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

  // Завантаження товарів
  const productsQuery = useQuery<Product[]>({
    queryKey: ["products", selectedCategory, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        skip: 0,
        limit: 100,
        is_available: true,
      };
      if (selectedCategory) {
        params.category_slug = selectedCategory;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      const response = await apiClient.get("/products", { params });
      // API може повертати { items: [...] } або просто [...]
      return response.data.items || response.data;
    },
  });

  const categories = categoriesQuery.data?.filter((cat) => cat.is_active) || [];
  
  // Сортування товарів
  const sortedProducts = useMemo(() => {
    const products = productsQuery.data || [];
    const sorted = [...products];
    
    switch (sortBy) {
      case "price_asc":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price_desc":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, "uk"));
      case "popular":
        return sorted.sort((a, b) => {
          if (a.is_hit && !b.is_hit) return -1;
          if (!a.is_hit && b.is_hit) return 1;
          if (a.is_popular && !b.is_popular) return -1;
          if (!a.is_popular && b.is_popular) return 1;
          return 0;
        });
      default:
        return sorted.sort((a, b) => a.position - b.position);
    }
  }, [productsQuery.data, sortBy]);

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
              <div className="bg-white rounded-xl shadow-card p-4 sticky top-24">
                <h3 className="font-bold text-lg text-secondary mb-4">Категорії</h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => handleCategoryChange(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        !selectedCategory
                          ? "bg-primary text-white"
                          : "text-secondary hover:bg-gray-100"
                      }`}
                    >
                      Все меню
                    </button>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <button
                        onClick={() => handleCategoryChange(category.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition ${
                          selectedCategory === category.slug
                            ? "bg-primary text-white"
                            : "text-secondary hover:bg-gray-100"
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
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                      !selectedCategory
                        ? "bg-primary text-white"
                        : "bg-white text-secondary border border-border hover:border-primary"
                    }`}
                  >
                    Все
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.slug)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                        selectedCategory === category.slug
                          ? "bg-primary text-white"
                          : "bg-white text-secondary border border-border hover:border-primary"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Результати пошуку */}
              {debouncedSearch && (
                <p className="text-secondary-light mb-4">
                  Результати пошуку для "{debouncedSearch}": {sortedProducts.length} страв
                </p>
              )}

              {/* Skeleton loader */}
              {productsQuery.isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
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
                    className="btn-primary"
                  >
                    Показати все меню
                  </button>
                </div>
              )}

              {/* Список товарів */}
              {!productsQuery.isLoading && sortedProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Мобільний фільтр */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-in-up">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
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
                      className={`w-full text-left px-4 py-3 rounded-lg transition ${
                        sortBy === option.value
                          ? "bg-primary text-white"
                          : "bg-gray-50 text-secondary hover:bg-gray-100"
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
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      !selectedCategory
                        ? "bg-primary text-white"
                        : "bg-gray-50 text-secondary hover:bg-gray-100"
                    }`}
                  >
                    Все меню
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.slug)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition ${
                        selectedCategory === category.slug
                          ? "bg-primary text-white"
                          : "bg-gray-50 text-secondary hover:bg-gray-100"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Кнопка застосувати */}
            <div className="sticky bottom-0 bg-white border-t border-border p-4">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full btn-primary"
              >
                Застосувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

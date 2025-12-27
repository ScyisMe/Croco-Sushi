"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/apiClient";
import { Category, Product, Favorite } from "@/lib/types";
import { motion } from "framer-motion";
import {
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import QuickViewModal from "@/components/QuickViewModal";
import toast from "react-hot-toast";
import { JsonLd, getBreadcrumbSchema, BUSINESS_INFO } from "@/lib/schema";
import { Button } from "@/components/ui/Button";
import ScrollToTop from "@/components/ui/ScrollToTop";

// Кількість товарів на сторінку
const PRODUCTS_PER_PAGE = 24;

// Опції сортування
const SORT_OPTIONS = [
    { value: "position", label: "За замовчуванням" },
    { value: "popular", label: "Популярні" },
    { value: "name", label: "За назвою" },
    { value: "price_asc", label: "Спочатку дешевші" },
    { value: "price_desc", label: "Спочатку дорожчі" },
];

export default function MenuClient() {
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

    // Filters State
    const filterParam = searchParams.get("filter");
    const [selectedProperties, setSelectedProperties] = useState<string[]>(
        filterParam ? filterParam.split(",") : []
    );

    // Sync with URL when params change (e.g. navigation from Home)
    useEffect(() => {
        const filterParam = searchParams.get("filter");
        if (filterParam) {
            setSelectedProperties(filterParam.split(","));
        } else {
            setSelectedProperties([]);
        }
    }, [searchParams]);

    // Filter Options
    const PROPERTY_FILTERS = [
        { id: "is_spicy", label: "Гострі", type: "boolean", prop: "is_spicy", icon: "/images/filters/filter-spicy.png" },
        { id: "no_cheese", label: "Без сиру", type: "exclude", keyword: "сир", icon: "/images/filters/filter-no-cheese.png" },
        { id: "is_popular", label: "Топ продажів", type: "boolean", prop: "is_popular", icon: "/images/filters/filter-popular.png" },
        { id: "is_new", label: "Новинки", type: "boolean", prop: "is_new", icon: "/images/filters/filter-new.png" },
        { id: "salmon", label: "З лососем", type: "include", keyword: "лосось", icon: "/images/filters/filter-salmon.png" },
        { id: "eel", label: "З вугром", type: "include", keyword: "вугор", icon: "/images/filters/filter-eel.png" },
        { id: "shrimp", label: "З креветкою", type: "include", keyword: "креветк", icon: "/images/filters/filter-shrimp.png" },
        { id: "is_vegan", label: "Вегетаріанські", type: "boolean", prop: "is_vegan", icon: "/images/filters/filter-vegan.png" },
    ];

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

    const categories = categoriesQuery.data?.filter((cat) => cat.is_active) || [];

    // Знаходимо ID вибраної категорії
    const selectedCategoryId = useMemo(() => {
        if (!selectedCategory) return null;
        const category = categories.find((c) => c.slug === selectedCategory);
        return category ? category.id : null;
    }, [selectedCategory, categories]);

    // Завантаження товарів з infinite scroll
    const productsQuery = useInfiniteQuery({
        queryKey: ["products", selectedCategory, debouncedSearch, selectedCategoryId],
        queryFn: async ({ pageParam = 0 }) => {
            const params: Record<string, unknown> = {
                skip: pageParam,
                limit: PRODUCTS_PER_PAGE,
                is_available: true,
            };

            if (selectedCategoryId) {
                params.category_id = selectedCategoryId;
            }

            if (debouncedSearch) {
                params.search = debouncedSearch;
            }
            const response = await apiClient.get("/products", { params });
            const items = response.data.items || response.data;

            const hasMore = items.length === PRODUCTS_PER_PAGE;
            const total = response.data.total ?? (hasMore ? pageParam + items.length + 1 : pageParam + items.length);

            return {
                items: items as Product[],
                nextOffset: pageParam + PRODUCTS_PER_PAGE,
                hasMore,
                total,
            };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.nextOffset : undefined;
        },
        enabled: (!selectedCategory || !!selectedCategoryId) || categoriesQuery.isLoading,
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

    const favoriteIds = useMemo(() => {
        return new Set(favoritesQuery.data?.map((f) => f.product_id) || []);
    }, [favoritesQuery.data]);

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
        onMutate: async (productId) => {
            await queryClient.cancelQueries({ queryKey: ["favorites"] });
            const previousFavorites = queryClient.getQueryData<Favorite[]>(["favorites"]);

            queryClient.setQueryData<Favorite[]>(["favorites"], (old = []) => {
                const exists = old.find((f) => f.product_id === productId);
                if (exists) {
                    return old.filter((f) => f.product_id !== productId);
                } else {
                    const newFavorite: Favorite = {
                        id: Date.now(),
                        user_id: 0,
                        product_id: productId,
                        created_at: new Date().toISOString(),
                    };
                    return [...old, newFavorite];
                }
            });

            return { previousFavorites };
        },
        onError: (err, productId, context) => {
            if (context?.previousFavorites) {
                queryClient.setQueryData(["favorites"], context.previousFavorites);
            }
            toast.error("Помилка. Спробуйте ще раз");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
        },
        onSuccess: (data) => {
            toast.success(data.action === "added" ? "Додано в обране" : "Видалено з обраного", { id: 'fav-toast' });
        }
    });

    const handleFavoriteToggle = (productId: number) => {
        if (!isAuthenticated) {
            toast.error("Увійдіть, щоб додати в обране");
            router.push("/login");
            return;
        }
        toggleFavoriteMutation.mutate(productId);
    };

    const handleQuickView = (product: Product) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    const filteredAndSortedProducts = useMemo(() => {
        let result = [...allProducts];

        if (selectedProperties.length > 0) {
            selectedProperties.forEach(filterId => {
                const filter = PROPERTY_FILTERS.find(f => f.id === filterId);
                if (!filter) return;

                if (filter.type === "exclude") {
                    result = result.filter(p => {
                        const text = (p.name + (p.description || "") + (p.ingredients || "")).toLowerCase();
                        // @ts-ignore
                        return !text.includes(filter.keyword!);
                    });
                } else if (filter.type === "include") {
                    result = result.filter(p => {
                        const text = (p.name + (p.description || "") + (p.ingredients || "")).toLowerCase();
                        // @ts-ignore
                        return text.includes(filter.keyword!);
                    });
                } else if (filter.type === "boolean") {
                    // @ts-ignore
                    result = result.filter(p => !!p[filter.prop]);
                }
            });
        }

        switch (sortBy) {
            case "price_asc":
                return result.sort((a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0"));
            case "price_desc":
                return result.sort((a, b) => parseFloat(b.price || "0") - parseFloat(a.price || "0"));
            case "name":
                return result.sort((a, b) => a.name.localeCompare(b.name, "uk"));
            case "popular":
                return result.sort((a, b) => {
                    if (a.is_popular && !b.is_popular) return -1;
                    if (!a.is_popular && b.is_popular) return 1;
                    return a.position - b.position;
                });
            default:
                return result.sort((a, b) => a.position - b.position);
        }
    }, [allProducts, sortBy, selectedProperties]);

    const toggleProperty = (id: string) => {
        setSelectedProperties(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCategoryChange = (slug: string | null) => {
        setSelectedCategory(slug);
        if (slug) {
            router.push(`/menu?category=${slug}`, { scroll: false });
        } else {
            router.push("/menu", { scroll: false });
        }
        setIsMobileFilterOpen(false);
    };

    const currentCategoryName = selectedCategory
        ? categories.find((c) => c.slug === selectedCategory)?.name || "Меню"
        : "Все меню";

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
        <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-theme-secondary transition-colors">
            <JsonLd schema={getBreadcrumbSchema(breadcrumbItems)} />

            <Header />

            <main className="flex-grow">
                <div className="bg-theme-surface hidden md:block">
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

                <div className="container mx-auto px-4 py-4 md:py-8">
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-4xl font-bold text-secondary mb-4">
                            {currentCategoryName}
                        </h1>

                        <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center justify-between">
                        </div>

                        <div className="mb-4">
                            <div className="relative w-full md:max-w-xl">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Пошук страв..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#2A2A2A] border border-transparent focus:border-primary/50 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-gray-500 focus:outline-none transition-all duration-200"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-row gap-3 md:gap-4 items-center justify-between">
                            <div className="hidden md:flex gap-3 flex-wrap items-center flex-1">
                                {PROPERTY_FILTERS.map(filter => (
                                    <motion.button
                                        key={filter.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleProperty(filter.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-md flex items-center gap-2 ${selectedProperties.includes(filter.id)
                                            ? "bg-secondary text-white border-secondary shadow-[0_0_20px_rgba(255,107,0,0.4)]"
                                            : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-secondary/50 hover:text-white"
                                            }`}
                                    >
                                        {filter.icon && (
                                            <div className="relative w-5 h-5">
                                                <Image src={filter.icon} alt={filter.label} fill className="object-contain" />
                                            </div>
                                        )}
                                        {filter.label}
                                    </motion.button>
                                ))}

                            </div>

                            <div className="hidden md:block">
                                <div className="relative group">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-[#2A2A2A] border border-white/10 text-white rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-white/5 transition-colors"
                                    >
                                        {SORT_OPTIONS.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                                className="bg-[#2A2A2A] text-white"
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary transition-colors" />
                                </div>
                            </div>

                            <button
                                onClick={() => setIsMobileFilterOpen(true)}
                                className="md:hidden flex items-center justify-center w-12 flex-shrink-0 bg-[#2A2A2A] rounded-xl text-white hover:bg-[#333] transition-colors ml-auto"
                            >
                                <AdjustmentsHorizontalIcon className="w-6 h-6 text-primary-500" />
                            </button>
                        </div>

                    </div>

                    <div className="block lg:flex lg:gap-8">
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="sticky top-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto hide-scrollbar">
                                <h3 className="font-bold text-lg text-white mb-4 pl-2 flex items-center gap-2">
                                    <Squares2X2Icon className="w-5 h-5 text-primary" />
                                    Категорії
                                </h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button
                                            onClick={() => handleCategoryChange(null)}
                                            className={`group relative w-full text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium overflow-hidden ${!selectedCategory
                                                ? "text-white bg-white/5 border-l-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            <span className={`absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${!selectedCategory ? "opacity-100" : ""}`} />
                                            <div className="relative flex items-center justify-between">
                                                <span className={`transition-transform duration-300 ${!selectedCategory ? "translate-x-2 font-bold" : "group-hover:translate-x-1"}`}>
                                                    Все меню
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                    {categories.map((category) => (
                                        <li key={category.id}>
                                            <button
                                                onClick={() => handleCategoryChange(category.slug)}
                                                className={`group relative w-full text-left px-5 py-4 rounded-xl transition-all duration-300 font-medium overflow-hidden ${selectedCategory === category.slug
                                                    ? "text-white bg-white/5 border-l-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                                                    }`}
                                            >
                                                <span className={`absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedCategory === category.slug ? "opacity-100" : ""}`} />
                                                <div className="relative flex items-center justify-between">
                                                    <span className={`transition-transform duration-300 ${selectedCategory === category.slug ? "translate-x-2 font-bold" : "group-hover:translate-x-1"}`}>
                                                        {category.name}
                                                    </span>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>

                        <div className="flex-1">
                            <div className="lg:hidden sticky top-16 z-30 bg-[#121212]/85 backdrop-blur-xl border-b border-white/5 py-3 mb-6 -mx-4 px-4 shadow-xl transition-all">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                                    <button
                                        onClick={() => handleCategoryChange(null)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${!selectedCategory
                                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                                            : "bg-white/5 text-gray-300 border border-white/10 hover:border-primary hover:text-white"
                                            }`}
                                    >
                                        Все
                                    </button>
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategoryChange(category.slug)}
                                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedCategory === category.slug
                                                ? "bg-primary text-white shadow-lg shadow-primary/25"
                                                : "bg-white/5 text-gray-300 border border-white/10 hover:border-primary hover:text-white"
                                                }`}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar">
                                <div className="flex gap-2">
                                    {PROPERTY_FILTERS.map((filter) => (
                                        <button
                                            key={filter.id}
                                            onClick={() => toggleProperty(filter.id)}
                                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border flex items-center gap-2 ${selectedProperties.includes(filter.id)
                                                ? "bg-secondary text-white border-secondary shadow-[0_0_20px_rgba(255,107,0,0.4)]"
                                                : "bg-white/5 text-gray-300 border-white/10 hover:border-white/20 active:bg-white/10"
                                                }`}
                                        >
                                            {filter.icon && (
                                                <div className="relative w-5 h-5">
                                                    <Image src={filter.icon} alt={filter.label} fill className="object-contain" />
                                                </div>
                                            )}
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {debouncedSearch ? (
                                <p className="text-secondary-light text-xs mb-4">
                                    Результати пошуку для &quot;{debouncedSearch}&quot;: {filteredAndSortedProducts.length} страв
                                </p>
                            ) : (
                                <p className="text-secondary-light text-xs mb-4">
                                    Показано {filteredAndSortedProducts.length} страв
                                    {productsQuery.hasNextPage ? " (завантаження...)" : ""}
                                </p>
                            )}

                            {productsQuery.isError && (
                                <div className="text-center py-16 text-red-500">
                                    <h3 className="text-xl font-bold mb-2">Помилка завантаження</h3>
                                    <p>{(productsQuery.error as Error).message}</p>
                                    <Button
                                        onClick={() => productsQuery.refetch()}
                                        className="mt-4"
                                        variant="primary"
                                    >
                                        Спробувати ще раз
                                    </Button>
                                </div>
                            )}

                            {productsQuery.isLoading && (
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                    {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                                        <ProductCardSkeleton key={i} />
                                    ))}
                                </div>
                            )}

                            {!productsQuery.isLoading && filteredAndSortedProducts.length === 0 && (
                                <div className="text-center py-16">
                                    <div className="relative w-24 h-24 mb-4 mx-auto">
                                        <Image
                                            src="/logo.png"
                                            alt="Croco Sushi"
                                            fill
                                            className="object-contain opacity-50 grayscale"
                                        />
                                    </div>
                                    <h3 className="text-xl font-semibold text-secondary mb-2">
                                        Страви не знайдено
                                    </h3>
                                    <p className="text-secondary-light mb-6">
                                        {debouncedSearch
                                            ? "Спробуйте змінити пошуковий запит"
                                            : "В цій категорії поки немає страв"}
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setSearchQuery("");
                                            handleCategoryChange(null);
                                        }}
                                        variant="primary"
                                        className="group"
                                    >
                                        <span>Показати все меню</span>
                                        <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            )}

                            {!productsQuery.isLoading && filteredAndSortedProducts.length > 0 && (
                                <>
                                    <motion.div
                                        key={selectedCategory || "all"}
                                        variants={{
                                            hidden: { opacity: 0 },
                                            show: {
                                                opacity: 1,
                                                transition: {
                                                    staggerChildren: 0.05
                                                }
                                            }
                                        }}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
                                    >
                                        {filteredAndSortedProducts.map((product) => (
                                            <motion.div
                                                key={product.id}
                                                className="w-full min-w-0 h-full"
                                                variants={{
                                                    hidden: { opacity: 0, y: 20 },
                                                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                                                }}
                                            >
                                                <ProductCard
                                                    product={product}
                                                    onFavoriteToggle={handleFavoriteToggle}
                                                    isFavorite={favoriteIds.has(product.id)}
                                                    onQuickView={handleQuickView}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    <div ref={loadMoreRef} className="py-8">
                                        {productsQuery.isFetchingNextPage && (
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                                                <p className="text-secondary-light text-sm">Завантаження...</p>
                                            </div>
                                        )}
                                        {!productsQuery.hasNextPage && filteredAndSortedProducts.length > PRODUCTS_PER_PAGE && (
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
            <ScrollToTop />

            {
                isMobileFilterOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setIsMobileFilterOpen(false)}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-[#121212] rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-in-up">
                            <div className="sticky top-0 bg-[#121212] border-b border-theme p-4 flex items-center justify-between">
                                <h3 className="font-bold text-lg">Фільтри</h3>
                                <button
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="p-2 text-secondary-light hover:text-secondary"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-4 space-y-6">
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
                        </div>
                    </div>
                )
            }

            <QuickViewModal
                product={quickViewProduct}
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                onFavoriteToggle={handleFavoriteToggle}
                isFavorite={quickViewProduct ? favoriteIds.has(quickViewProduct.id) : false}
            />
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { Category, Product } from "@/lib/types";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function MenuPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const { addItem } = useCartStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categorySlug
  );
  const [sortBy, setSortBy] = useState<string>("position");

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
    queryKey: ["products", selectedCategory, searchQuery, sortBy],
    queryFn: async () => {
      const params: any = {
        skip: 0,
        limit: 100,
        is_available: true,
      };
      if (selectedCategory) {
        params.category_slug = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await apiClient.get("/products", { params });
      return response.data;
    },
  });

  const categories = categoriesQuery.data?.filter((cat) => cat.is_active) || [];
  let products = productsQuery.data || [];

  // Сортування
  if (sortBy === "price_asc") {
    products = [...products].sort((a, b) => parseFloat(a.price || "0") - parseFloat(b.price || "0"));
  } else if (sortBy === "price_desc") {
    products = [...products].sort((a, b) => parseFloat(b.price || "0") - parseFloat(a.price || "0"));
  } else if (sortBy === "name") {
    products = [...products].sort((a, b) => a.name.localeCompare(b.name));
  }

  const handleAddToCart = (product: Product) => {
    if (!product.sizes || product.sizes.length === 0) {
      toast.error("Товар не має доступних розмірів");
      return;
    }

    // Беремо перший доступний розмір
    const defaultSize = product.sizes[0];
    addItem(product, defaultSize, 1);
    toast.success(`${product.name} додано в кошик`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-green-600">
            Головна
          </Link>
          <span className="mx-2">/</span>
          <span>Меню</span>
        </nav>

        <h1 className="text-4xl font-bold mb-8">Меню</h1>

        {/* Пошук та фільтри */}
        <div className="mb-8 space-y-4">
          {/* Пошук */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук товарів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Фільтр по категоріях */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-600" />
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Всі категорії</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Сортування */}
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="position">За порядком</option>
                <option value="name">За назвою</option>
                <option value="price_asc">Ціна: від низької до високої</option>
                <option value="price_desc">Ціна: від високої до низької</option>
              </select>
            </div>
          </div>
        </div>

        {/* Список товарів */}
        {productsQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Товари не знайдено</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
              >
                <Link href={`/products/${product.slug}`}>
                  {product.image_url && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                  )}
                </Link>
                <div className="p-4 flex flex-col flex-grow">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-green-600 transition">
                      {product.name}
                    </h3>
                  </Link>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-green-600">
                        {product.price ? `${parseFloat(product.price).toFixed(2)} грн` : "Ціна не вказана"}
                      </span>
                      {product.is_new && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Новинка
                        </span>
                      )}
                      {product.is_popular && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          Хіт
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.is_available || !product.sizes || product.sizes.length === 0}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <ShoppingCartIcon className="w-5 h-5 mr-2" /> Додати в кошик
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


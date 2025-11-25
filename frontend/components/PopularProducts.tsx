"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import apiClient from "@/lib/api/client";
import { Product } from "@/lib/types";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

export default function PopularProducts() {
  const productsQuery = useQuery<Product[]>({
    queryKey: ["products", "popular"],
    queryFn: async () => {
      const response = await apiClient.get("/products", {
        params: {
          is_popular: true,
          limit: 8,
        },
      });
      // API може повертати { items: [...] } або просто [...]
      return response.data.items || response.data;
    },
  });

  const products = productsQuery.data || [];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary">
            🔥 Популярні страви
          </h2>
          <Link
            href="/menu?sort=popular"
            className="hidden md:inline-flex items-center gap-2 text-primary hover:text-primary-600 font-semibold transition"
          >
            Всі страви
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>

        {/* Skeleton loader */}
        {productsQuery.isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Товари */}
        {!productsQuery.isLoading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Порожній стан */}
        {!productsQuery.isLoading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-secondary-light">
              Поки що немає популярних страв
            </p>
          </div>
        )}

        {/* Кнопка "Всі страви" для мобільних */}
        <div className="text-center mt-8 md:hidden">
          <Link
            href="/menu"
            className="btn-primary inline-flex items-center gap-2"
          >
            Всі страви
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}


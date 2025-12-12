"use client";

import { useTranslation } from "@/store/localeStore";
import ProductCard from "./ProductCard";
import { Product } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/apiClient";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function PopularProducts() {
  const { t } = useTranslation();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["popular-products"],
    queryFn: async () => {
      const response = await apiClient.get("/products/popular", {
        params: { limit: 4 }
      });
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-20 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              {t("home.popular")}
            </h2>
            <div className="h-6 w-64 bg-white/10 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            {t("home.popular")}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Найулюбленіші страви наших гостей
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {products.map((product, index) => (
            <motion.div key={product.id} variants={item} className="h-full">
              <ProductCard product={product} priority={index < 2} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <Link
            href="/menu?sort=popular"
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-semibold transition-colors"
          >
            {t("menu.viewAll")}
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}


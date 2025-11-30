"use client";

import { useTranslation } from "@/store/localeStore";
import ProductCard from "./ProductCard";
import { Product } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

// Mock data - replace with API call
const POPULAR_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Філадельфія з лососем",
    slug: "philadelphia-salmon",
    description: "Класичний рол з ніжним вершковим сиром, свіжим огірком та лососем",
    price: "345",
    image_url: "/images/products/phila-salmon.png",
    is_hit: true,
    is_new: false,
    is_popular: true,
    category_id: 1,
    is_available: true,
    position: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Каліфорнія з креветкою",
    slug: "california-shrimp",
    description: "Рол в ікрі тобіко з тигровою креветкою, авокадо та огірком",
    price: "295",
    image_url: "/images/products/california-shrimp.png",
    is_new: true,
    is_popular: true,
    is_hit: false,
    category_id: 1,
    is_available: true,
    position: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Золотий Дракон",
    slug: "golden-dragon",
    description: "Елітний рол з вугром, авокадо, унагі соусом та кунжутом",
    price: "425",
    image_url: "/images/products/golden-dragon.png",
    is_promotion: true,
    original_price: "485",
    is_new: false,
    is_popular: true,
    is_hit: false,
    category_id: 1,
    is_available: true,
    position: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: "Сет Філадельфія",
    slug: "set-philadelphia",
    description: "Набір з 4-х видів ролів Філадельфія: з лососем, вугром, тунцем та креветкою",
    price: "1250",
    image_url: "/images/products/set-phila.png",
    is_hit: true,
    is_new: false,
    is_popular: true,
    category_id: 2,
    is_available: true,
    position: 0,
    created_at: new Date().toISOString()
  }
];

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
          {POPULAR_PRODUCTS.map((product) => (
            <motion.div key={product.id} variants={item} className="h-full">
              <ProductCard product={product} />
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

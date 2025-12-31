"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/apiClient";
import { Promotion, Product } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { ChevronRightIcon, TagIcon, ClockIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import { CountdownTimerCompact } from "@/components/CountdownTimer";
import { JsonLd, getBreadcrumbSchema, BUSINESS_INFO } from "@/lib/schema";
import { useTranslation } from "@/store/localeStore";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

export default function PromotionsPage() {
  const { t } = useTranslation();

  // Fetch promotions
  const promotionsQuery = useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: async () => {
      const response = await apiClient.get("/promotions");
      return response.data;
    },
  });

  // Fetch popular products for Empty State
  const popularProductsQuery = useQuery<Product[]>({
    queryKey: ["popular-products"],
    queryFn: async () => {
      const response = await apiClient.get("/products", {
        params: {
          limit: 4,
          is_popular: true,
          is_available: true
        }
      });
      const items = response.data.items || response.data;
      return items.slice(0, 4);
    },
    enabled: !!promotionsQuery.data && promotionsQuery.data.filter(p => p.is_active).length === 0,
  });

  const promotions = promotionsQuery.data?.filter((p) => p.is_active === true) || [];
  const popularProducts = popularProductsQuery.data || [];

  return (
    <div className="min-h-screen flex flex-col text-white relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent-gold/5 rounded-full blur-[100px]" />
      </div>

      <JsonLd
        schema={getBreadcrumbSchema([
          { name: t("common.home"), url: BUSINESS_INFO.url },
          { name: t("promotions.title"), url: `${BUSINESS_INFO.url}/promotions` },
        ])}
      />

      <Header />

      <main className="flex-grow relative z-10">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              {t("common.home")}
            </Link>
            <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-600" />
            <span className="text-emerald-400 font-medium">{t("promotions.title")}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative py-12 md:py-16 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight drop-shadow-2xl">
                {t("promotions.pageTitle")}
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {t("promotions.subtitle")}
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-24">
          <AnimatePresence mode="wait">
            {promotionsQuery.isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden h-96 animate-pulse" />
                ))}
              </motion.div>
            ) : promotionsQuery.isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 max-w-2xl mx-auto"
              >
                <div className="text-6xl mb-6">🌩️</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {t("promotions.loadError")}
                </h3>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  {t("promotions.refresh")}
                </button>
              </motion.div>
            ) : promotions.length > 0 ? (
              <motion.div
                key="grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {promotions.map((promo) => (
                  <motion.div
                    key={promo.id}
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    className="group"
                  >
                    <Link
                      href={`/promotions/${promo.slug}`}
                      className="block h-full bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden border border-white/5 hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col"
                    >
                      {/* Image Container */}
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                        {promo.image_url ? (
                          <div className="relative w-full aspect-[16/10]">
                            <Image
                              src={promo.image_url}
                              alt={promo.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              quality={85}
                            />
                          </div>
                        ) : (
                          <div className="w-full aspect-[16/10] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <TagIcon className="w-20 h-20 text-white/10" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                          {promo.discount_percent && (
                            <div className="bg-red-500/90 backdrop-blur-md text-white font-bold px-3 py-1.5 rounded-xl text-sm shadow-lg border border-white/10 flex items-center gap-1">
                              <ArrowTrendingUpIcon className="w-4 h-4" />
                              -{promo.discount_percent}%
                            </div>
                          )}
                        </div>

                        {/* Timer */}
                        {promo.end_date && new Date(promo.end_date) > new Date() && (
                          <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2 text-sm font-medium text-white">
                              <ClockIcon className="w-4 h-4 text-emerald-400" />
                              <CountdownTimerCompact endDate={promo.end_date} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 md:p-8 flex flex-col flex-grow">
                        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-300">
                          {promo.name}
                        </h2>

                        {promo.description && (
                          <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-grow">
                            {promo.description}
                          </p>
                        )}

                        {/* Footer Info */}
                        <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                          {promo.min_order_amount ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 uppercase tracking-wider">Мін. замовлення</span>
                              <span className="text-white font-semibold">{promo.min_order_amount} ₴</span>
                            </div>
                          ) : (
                            <div />
                          )}

                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${promo.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                            {promo.is_active ? "Активна" : "Неактивна"}
                          </span>
                        </div>

                        {/* Usage Bar */}
                        {promo.max_uses && promo.current_uses !== undefined && (
                          <div className="mt-6">
                            <div className="flex justify-between text-xs font-medium mb-2">
                              <span className="text-gray-500">Використано</span>
                              <span className="text-white">{promo.current_uses} <span className="text-gray-600">/</span> {promo.max_uses}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((promo.current_uses / promo.max_uses) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${promo.current_uses / promo.max_uses > 0.8 ? "bg-red-500" : "bg-emerald-500"
                                  }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              // Empty State
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="relative w-48 h-48 mb-8 animate-bounce-slow">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                  <div className="relative w-full h-full drop-shadow-2xl">
                    <Image
                      src="/images/promo-calendar.png"
                      alt="Promo Calendar"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                <h3 className="text-3xl font-bold text-white mb-4">
                  Наші сушисти з&apos;їли всі акції... 🍣
                </h3>
                <p className="text-gray-400 mb-12 text-lg max-w-xl mx-auto">
                  Але не хвилюйтесь! Меню все ще повне неймовірної смакоти.
                  <span className="block mt-2 text-emerald-400 font-medium">Скуштуйте наші хіти продажів:</span>
                </p>

                {/* Popular Products Grid */}
                {!popularProductsQuery.isLoading && popularProducts.length > 0 && (
                  <div className="w-full max-w-6xl mx-auto mb-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {popularProducts.map(product => (
                        <motion.div key={product.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href="/menu"
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 text-white rounded-xl font-bold text-lg transition-all flex items-center gap-3 group"
                >
                  <span>Перейти до меню</span>
                  <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform text-emerald-400" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subscribe Section */}
        <section className="border-t border-white/5 bg-white/5 backdrop-blur-md py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                {t("promotions.dontMiss")}
              </h2>
              <p className="text-gray-400 mb-10 text-lg">
                {t("promotions.subscribeDesc")}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                <a
                  href="https://www.instagram.com/crocosushi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-[#1e1e1e] border border-white/10 rounded-2xl hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[1px]">
                    <div className="w-full h-full bg-[#1e1e1e] rounded-full flex items-center justify-center group-hover:bg-transparent transition-colors">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </div>
                  </div>
                  <span className="font-bold text-gray-300 group-hover:text-pink-400 transition-colors">Instagram</span>
                </a>

                <a
                  href="https://t.me/CrocoSushi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-[#1e1e1e] border border-white/10 rounded-2xl hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                  </div>
                  <span className="font-bold text-gray-300 group-hover:text-blue-400 transition-colors">Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

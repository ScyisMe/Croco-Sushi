"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { Promotion } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { ChevronRightIcon, TagIcon, ClockIcon } from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CountdownTimerCompact } from "@/components/CountdownTimer";
import { JsonLd, getBreadcrumbSchema, BUSINESS_INFO } from "@/lib/schema";
import { useTranslation } from "@/store/localeStore";

export default function PromotionsPage() {
  const { t } = useTranslation();
  const promotionsQuery = useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: async () => {
      const response = await apiClient.get("/promotions");
      return response.data;
    },
  });

  const promotions = promotionsQuery.data?.filter((p) => p.is_active === true) || [];

  return (
    <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
      {/* Schema.org markup для SEO */}
      <JsonLd
        schema={getBreadcrumbSchema([
          { name: t("common.home"), url: BUSINESS_INFO.url },
          { name: t("promotions.title"), url: `${BUSINESS_INFO.url}/promotions` },
        ])}
      />

      <Header />

      <main className="flex-grow">
        {/* Хлібні крихти */}
        <div className="bg-theme-surface">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm">
              <Link href="/" className="text-secondary-light hover:text-primary transition">
                {t("common.home")}
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <span className="text-secondary font-medium">{t("promotions.title")}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-r from-primary to-primary-600 text-white py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              🔥 {t("promotions.pageTitle")}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {t("promotions.subtitle")}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {promotionsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-theme-surface rounded-xl shadow-card overflow-hidden">
                  <div className="aspect-video skeleton" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 skeleton w-3/4" />
                    <div className="h-4 skeleton w-full" />
                    <div className="h-4 skeleton w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : promotionsQuery.isError ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😢</div>
              <h3 className="text-xl font-semibold text-secondary mb-2">
                {t("promotions.loadError")}
              </h3>
              <p className="text-secondary-light mb-6">
                {t("promotions.tryRefresh")}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                {t("promotions.refresh")}
              </button>
            </div>
          ) : promotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <Link
                  href={`/promotions/${promo.slug}`}
                  key={promo.id}
                  className="group bg-theme-surface rounded-xl shadow-card hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Зображення */}
                  <div className="relative aspect-video overflow-hidden">
                    {promo.image_url ? (
                      <Image
                        src={promo.image_url}
                        alt={promo.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <TagIcon className="w-16 h-16 text-primary/30" />
                      </div>
                    )}

                    {/* Бейдж знижки */}
                    {promo.discount_percent && (
                      <div className="absolute top-3 left-3 bg-accent-red text-white font-bold px-3 py-1 rounded-full text-sm">
                        -{promo.discount_percent}%
                      </div>
                    )}

                    {/* Таймер */}
                    {promo.end_date && new Date(promo.end_date) > new Date() && (
                      <div className="absolute top-3 right-3 bg-theme-surface/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-4 h-4 text-accent-red" />
                          <CountdownTimerCompact endDate={promo.end_date} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Контент */}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-secondary mb-2 group-hover:text-primary transition">
                      {promo.name}
                    </h2>

                    {promo.description && (
                      <p className="text-secondary-light text-sm mb-4 line-clamp-2">
                        {promo.description}
                      </p>
                    )}

                    {/* Умови */}
                    <div className="flex items-center justify-between text-sm">
                      {promo.min_order_amount && (
                        <span className="text-secondary-light">
                          {t("promotions.fromAmount", { amount: promo.min_order_amount })}
                        </span>
                      )}

                      <span className={`font-medium ${promo.is_active
                        ? "text-primary"
                        : "text-accent-red"
                        }`}>
                        {promo.is_active ? "Активна" : "Неактивна"}
                      </span>
                    </div>

                    {/* Прогрес-бар використання (якщо є обмеження) */}
                    {promo.max_uses && promo.current_uses !== undefined && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-secondary-light mb-1">
                          <span>{t("promotions.used")}</span>
                          <span>{promo.current_uses} / {promo.max_uses}</span>
                        </div>
                        <div className="w-full bg-theme-tertiary rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${promo.current_uses / promo.max_uses > 0.8
                              ? "bg-accent-red"
                              : "bg-primary"
                              }`}
                            style={{
                              width: `${Math.min((promo.current_uses / promo.max_uses) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        {promo.current_uses / promo.max_uses > 0.8 && (
                          <p className="text-xs text-accent-red mt-1">
                            ⚡ {t("promotions.fewLeft")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold text-secondary mb-2">
                {t("promotions.noPromotions")}
              </h3>
              <p className="text-secondary-light mb-6">
                {t("promotions.noPromotionsDesc")}
              </p>
              <Link
                href="/menu"
                className="btn-primary group flex items-center justify-center gap-2 inline-flex"
              >
                <span>{t("promotions.goToMenu")}</span>
                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>

        {/* Підписка на новини */}
        <section className="bg-theme-surface py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-secondary mb-4">
                {t("promotions.dontMiss")}
              </h2>
              <p className="text-secondary-light mb-6">
                {t("promotions.subscribeDesc")}
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href="https://www.instagram.com/crocosushi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  Instagram
                </a>
                <a
                  href="https://t.me/CrocoSushi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-[#0088cc] text-white rounded-lg hover:opacity-90 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram
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

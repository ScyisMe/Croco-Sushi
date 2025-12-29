"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import apiClient from "@/lib/api/apiClient";
import { Promotion } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon, TagIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import CountdownTimer from "@/components/CountdownTimer";

export default function PromotionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [sanitizedConditions, setSanitizedConditions] = useState<string>("");

  const promotionQuery = useQuery<Promotion>({
    queryKey: ["promotion", slug],
    queryFn: async () => {
      const response = await apiClient.get(`/promotions/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });

  const promotion = promotionQuery.data;
  const isActive = promotion?.is_active === true;
  const hasEndDate = promotion?.end_date && new Date(promotion.end_date) > new Date();

  // Санітизація HTML на клієнті (DOMPurify потребує window)
  useEffect(() => {
    if (promotion?.conditions && typeof window !== "undefined") {
      import("dompurify").then((DOMPurify) => {
        const sanitized = DOMPurify.default.sanitize(promotion.conditions!, {
          ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "h3", "h4"],
          ALLOWED_ATTR: [],
        });
        setSanitizedConditions(sanitized);
      });
    }
  }, [promotion?.conditions]);

  return (
    <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
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
              <Link href="/promotions" className="text-secondary-light hover:text-primary transition">
                Акції
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <span className="text-secondary font-medium truncate max-w-[200px]">
                {promotion?.name || "..."}
              </span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {promotionQuery.isLoading ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-theme-surface rounded-xl shadow-card overflow-hidden">
                <div className="aspect-video skeleton" />
                <div className="p-8 space-y-4">
                  <div className="h-8 skeleton w-3/4" />
                  <div className="h-4 skeleton w-full" />
                  <div className="h-4 skeleton w-2/3" />
                </div>
              </div>
            </div>
          ) : promotionQuery.isError || !promotion ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😢</div>
              <h1 className="text-2xl font-bold text-secondary mb-4">Акцію не знайдено</h1>
              <p className="text-secondary-light mb-6">
                Можливо, ця акція більше не доступна
              </p>
              <Link href="/promotions" className="btn-primary">
                Всі акції
              </Link>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-theme-surface rounded-xl shadow-card overflow-hidden">
                {/* Зображення */}
                <div className="relative bg-theme-tertiary">
                  {promotion.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={promotion.image_url}
                      alt={promotion.name}
                      className="w-full h-auto object-contain max-h-[600px] mx-auto"
                    />
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center">
                      <TagIcon className="w-24 h-24 text-gray-300" />
                    </div>
                  )}

                  {/* Бейдж знижки */}
                  {promotion.discount_percent && (
                    <div className="absolute top-4 left-4 bg-accent-red text-white font-bold px-4 py-2 rounded-lg text-lg">
                      -{promotion.discount_percent}%
                    </div>
                  )}

                  {/* Статус */}
                  <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg font-semibold ${isActive
                    ? "bg-primary text-white"
                    : "bg-gray-600 text-white"
                    }`}>
                    {isActive ? "✓ Активна" : "Завершена"}
                  </div>
                </div>

                {/* Контент */}
                <div className="p-6 md:p-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-4">
                    {promotion.name}
                  </h1>

                  {/* Таймер */}
                  {isActive && hasEndDate && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-accent-red/10 to-accent-orange/10 border border-accent-red/20 rounded-xl">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-2 text-accent-red">
                          <ClockIcon className="w-5 h-5" />
                          <span className="font-semibold">До закінчення акції:</span>
                        </div>
                        <CountdownTimer endDate={promotion.end_date!} />
                      </div>
                    </div>
                  )}

                  {/* Опис */}
                  {promotion.description && (
                    <p className="text-secondary-light text-lg mb-6">
                      {promotion.description}
                    </p>
                  )}

                  {/* Інформація */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Знижка */}
                    <div className="p-4 bg-theme-tertiary rounded-xl">
                      <div className="flex items-center gap-2 text-secondary-light mb-1">
                        <TagIcon className="w-5 h-5" />
                        <span>Знижка</span>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {promotion.discount_type === "percent"
                          ? `${promotion.discount_value}%`
                          : `${promotion.discount_value} ₴`}
                      </p>
                    </div>

                    {/* Мінімальна сума */}
                    {promotion.min_order_amount && (
                      <div className="p-4 bg-theme-tertiary rounded-xl">
                        <div className="flex items-center gap-2 text-secondary-light mb-1">
                          <span>💰</span>
                          <span>Мінімальна сума</span>
                        </div>
                        <p className="text-xl font-bold text-secondary">
                          від {promotion.min_order_amount} ₴
                        </p>
                      </div>
                    )}

                    {/* Дати */}
                    {promotion.start_date && (
                      <div className="p-4 bg-theme-tertiary rounded-xl">
                        <div className="flex items-center gap-2 text-secondary-light mb-1">
                          <CalendarIcon className="w-5 h-5" />
                          <span>Початок</span>
                        </div>
                        <p className="text-xl font-bold text-secondary">
                          {new Date(promotion.start_date).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                    )}

                    {promotion.end_date && (
                      <div className="p-4 bg-theme-tertiary rounded-xl">
                        <div className="flex items-center gap-2 text-secondary-light mb-1">
                          <CalendarIcon className="w-5 h-5" />
                          <span>Закінчення</span>
                        </div>
                        <p className="text-xl font-bold text-secondary">
                          {new Date(promotion.end_date).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Прогрес-бар використання */}
                  {promotion.max_uses && promotion.current_uses !== undefined && (
                    <div className="mb-6 p-4 bg-theme-tertiary rounded-xl">
                      <div className="flex justify-between text-sm text-secondary-light mb-2">
                        <span>Використано пропозицій</span>
                        <span className="font-semibold">
                          {promotion.current_uses} / {promotion.max_uses}
                        </span>
                      </div>
                      <div className="w-full bg-theme-secondary rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${promotion.current_uses / promotion.max_uses > 0.8
                            ? "bg-accent-red"
                            : "bg-primary"
                            }`}
                          style={{
                            width: `${Math.min((promotion.current_uses / promotion.max_uses) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      {promotion.current_uses / promotion.max_uses > 0.8 && (
                        <p className="text-sm text-accent-red mt-2 font-medium">
                          ⚡ Встигніть скористатись — залишилось мало пропозицій!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Умови */}
                  {promotion.conditions && (
                    <div className="mb-6">
                      <h2 className="font-bold text-secondary text-lg mb-3">Умови акції:</h2>
                      {sanitizedConditions ? (
                        <div
                          className="prose prose-sm max-w-none text-secondary-light"
                          dangerouslySetInnerHTML={{ __html: sanitizedConditions }}
                        />
                      ) : (
                        <p className="text-secondary-light">{promotion.conditions}</p>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                    <Link
                      href="/menu"
                      className="flex-1 btn-primary text-center"
                    >
                      Перейти до меню
                    </Link>
                    <Link
                      href="/promotions"
                      className="flex-1 px-6 py-3 border border-border rounded-lg text-secondary hover:border-primary hover:text-primary transition text-center font-medium"
                    >
                      Інші акції
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}


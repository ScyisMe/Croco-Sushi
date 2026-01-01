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
        <div className="bg-theme-surface">
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

        <div className="container mx-auto px-4 py-4 md:py-8">
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
                    <div className="relative w-full aspect-[4/3] md:aspect-video max-h-[600px]">
                      <Image
                        src={promotion.image_url}
                        alt={promotion.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 1200px"
                        quality={90}
                        priority
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center">
                      <TagIcon className="w-24 h-24 text-gray-300" />
                    </div>
                  )}

                  {/* Бейдж знижки */}
                  {promotion.discount_percent && (
                    <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-accent-red text-white font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-base md:text-lg shadow-md">
                      -{promotion.discount_percent}%
                    </div>
                  )}

                  {/* Статус */}
                  <div className={`absolute top-3 right-3 md:top-4 md:right-4 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-sm md:text-base shadow-md ${isActive
                    ? "bg-primary text-white"
                    : "bg-gray-600 text-white"
                    }`}>
                    {isActive ? "✓ Активна" : "Завершена"}
                  </div>
                </div>

                {/* Контент */}
                <div className="p-5 md:p-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4 md:mb-6 leading-tight">
                    {promotion.name}
                  </h1>

                  {/* Таймер */}
                  {isActive && hasEndDate && (
                    <div className="mb-6 md:mb-8 p-5 bg-gradient-to-r from-accent-red/10 to-accent-orange/10 border border-accent-red/20 rounded-2xl relative overflow-hidden">
                      {/* Декоративний фон */}
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent-red/5 rounded-full blur-2xl"></div>
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3 text-accent-red">
                          <ClockIcon className="w-6 h-6 md:w-5 md:h-5" />
                          <span className="font-bold text-lg md:text-base">До закінчення:</span>
                        </div>
                        <CountdownTimer endDate={promotion.end_date!} className="justify-center md:justify-end" />
                      </div>
                    </div>
                  )}

                  {/* Опис */}
                  {promotion.description && (
                    <p className="text-secondary-light text-lg md:text-xl mb-8 leading-relaxed">
                      {promotion.description}
                    </p>
                  )}

                  {/* Інформація */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Знижка */}
                    {promotion.discount_value && Number(promotion.discount_value) > 0 && (
                      <div className="p-5 bg-theme-tertiary rounded-2xl flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full text-primary">
                          <TagIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm text-secondary-light mb-0.5">Знижка</div>
                          <p className="text-2xl font-bold text-primary">
                            {promotion.discount_type === "percent"
                              ? `${promotion.discount_value}%`
                              : `${promotion.discount_value} ₴`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Мінімальна сума */}
                    {promotion.min_order_amount && (
                      <div className="p-5 bg-theme-tertiary rounded-2xl flex items-center gap-4">
                        <div className="bg-secondary/10 p-3 rounded-full text-secondary">
                          <span className="text-xl">💰</span>
                        </div>
                        <div>
                          <div className="text-sm text-secondary-light mb-0.5">Мінімальна сума</div>
                          <p className="text-2xl font-bold text-secondary">
                            від {promotion.min_order_amount} ₴
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Дати */}
                    {promotion.start_date && (
                      <div className="p-5 bg-theme-tertiary rounded-2xl flex items-center gap-4">
                        <div className="bg-secondary/10 p-3 rounded-full text-secondary">
                          <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm text-secondary-light mb-0.5">Початок</div>
                          <p className="text-lg font-bold text-secondary">
                            {new Date(promotion.start_date).toLocaleDateString("uk-UA", {
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {promotion.end_date && (
                      <div className="p-5 bg-theme-tertiary rounded-2xl flex items-center gap-4">
                        <div className="bg-secondary/10 p-3 rounded-full text-secondary">
                          <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm text-secondary-light mb-0.5">Закінчення</div>
                          <p className="text-lg font-bold text-secondary">
                            {new Date(promotion.end_date).toLocaleDateString("uk-UA", {
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Прогрес-бар використання */}
                  {promotion.max_uses && promotion.current_uses !== undefined && (
                    <div className="mb-8 p-5 bg-theme-tertiary rounded-2xl">
                      <div className="flex justify-between text-base text-secondary-light mb-3">
                        <span>Використано пропозицій</span>
                        <span className="font-bold text-secondary">
                          {promotion.current_uses} / {promotion.max_uses}
                        </span>
                      </div>
                      <div className="w-full bg-theme-secondary rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all ${promotion.current_uses / promotion.max_uses > 0.8
                            ? "bg-accent-red"
                            : "bg-primary"
                            }`}
                          style={{
                            width: `${Math.min((promotion.current_uses / promotion.max_uses) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      {promotion.current_uses / promotion.max_uses > 0.8 && (
                        <p className="text-sm text-accent-red mt-3 font-semibold">
                          ⚡ Встигніть скористатись — залишилось мало пропозицій!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Умови */}
                  {promotion.conditions && (
                    <div className="mb-8 p-5 border border-border rounded-2xl">
                      <h2 className="font-bold text-secondary text-xl mb-4">Умови акції:</h2>
                      {sanitizedConditions ? (
                        <div
                          className="prose prose-base md:prose-lg max-w-none text-secondary-light"
                          dangerouslySetInnerHTML={{ __html: sanitizedConditions }}
                        />
                      ) : (
                        <p className="text-secondary-light text-lg">{promotion.conditions}</p>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                    <Link
                      href="/menu"
                      className="flex-1 btn-primary text-center py-4 text-lg"
                    >
                      Перейти до меню
                    </Link>
                    <Link
                      href="/promotions"
                      className="flex-1 px-6 py-4 border border-border rounded-xl text-secondary hover:border-primary hover:text-primary transition text-center font-bold text-lg"
                    >
                      Всі акції
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


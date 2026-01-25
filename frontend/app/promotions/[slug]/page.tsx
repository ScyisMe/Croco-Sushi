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
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] transition-colors font-sans selection:bg-primary/30">
      <Header />

      <main className="flex-grow relative">
        {/* Background Hero Image */}
        <div className="fixed inset-0 z-0 select-none pointer-events-none">
          {promotion?.image_url ? (
            <div className="relative w-full h-full">
              <Image
                src={promotion.image_url}
                alt={promotion.name || "Background"}
                fill
                className="object-cover opacity-40 blur-sm scale-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-black/60" />
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
          )}
        </div>

        <div className="relative z-10 container mx-auto px-4 py-6 md:py-12">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm mb-8 text-gray-400">
            <Link href="/" className="hover:text-primary transition-colors">Головна</Link>
            <ChevronRightIcon className="w-3 h-3 mx-2 text-gray-600" />
            <Link href="/promotions" className="hover:text-primary transition-colors">Акції</Link>
            <ChevronRightIcon className="w-3 h-3 mx-2 text-gray-600" />
            <span className="text-gray-200 font-medium truncate max-w-[200px]">{promotion?.name}</span>
          </nav>

          {promotionQuery.isLoading ? (
            <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
              <div className="h-64 md:h-96 bg-white/5 rounded-3xl w-full" />
              <div className="space-y-4">
                <div className="h-8 md:h-10 bg-white/5 rounded-lg w-2/3" />
                <div className="h-4 bg-white/5 rounded-lg w-full" />
                <div className="h-4 bg-white/5 rounded-lg w-1/2" />
              </div>
            </div>
          ) : !promotion ? (
            <div className="text-center py-24">
              <h1 className="text-3xl font-bold text-white mb-4">Акцію не знайдено</h1>
              <Link href="/promotions" className="text-primary hover:underline">Повернутися до акцій</Link>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-start">
              {/* Left Column: Image & Timer */}
              <div className="space-y-4 md:space-y-6 lg:sticky lg:top-32">
                <div className="relative aspect-[4/3] md:aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                  {promotion.image_url ? (
                    <Image
                      src={promotion.image_url}
                      alt={promotion.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 600px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <TagIcon className="w-20 h-20 text-white/20" />
                    </div>
                  )}

                  {/* Badges - Refined */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {promotion.discount_percent && (
                      <span className="bg-red-600/90 backdrop-blur-xl text-white font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-sm md:text-lg shadow-lg shadow-red-500/20 border border-white/10">
                        -{promotion.discount_percent}%
                      </span>
                    )}
                    {isActive ? (
                      <span className="bg-black/60 backdrop-blur-xl border border-white/10 text-white font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs md:text-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Активна
                      </span>
                    ) : (
                      <span className="bg-gray-800/90 backdrop-blur-xl text-white font-medium px-3 py-1.5 rounded-xl text-xs md:text-sm border border-white/10">
                        Завершена
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Timer Block */}
                {isActive && hasEndDate && (
                  <div className="bg-[#121212]/80 backdrop-blur-md border border-white/10 p-5 md:p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <p className="text-gray-400 text-xs md:text-sm font-medium uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2 relative z-10">
                      <ClockIcon className="w-4 h-4 text-primary" />
                      До кінця акції
                    </p>
                    <CountdownTimer endDate={promotion.end_date!} className="scale-90 md:scale-110 relative z-10" />
                  </div>
                )}
              </div>

              {/* Right Column: Info & Details */}
              <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col h-full bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

                <div className="flex-grow">
                  {/* Dates Label */}
                  {(promotion.start_date || promotion.end_date) && (
                    <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500 mb-4 font-mono tracking-wide uppercase">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span>
                        {promotion.start_date ? new Date(promotion.start_date).toLocaleDateString("uk-UA") : ''}
                        {promotion.start_date && promotion.end_date ? ' — ' : ''}
                        {promotion.end_date ? new Date(promotion.end_date).toLocaleDateString("uk-UA") : ''}
                      </span>
                    </div>
                  )}

                  <h1 className="text-2xl md:text-4xl font-black text-white mb-6 leading-tight tracking-tight">
                    {promotion.name}
                  </h1>

                  {/* Stats Row (Concise) */}
                  {(Number(promotion.discount_value) > 0 || promotion.min_order_amount) && (
                    <div className="flex flex-wrap gap-4 mb-8">
                      {Number(promotion.discount_value) > 0 && (
                        <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-3 rounded-xl">
                          <TagIcon className="w-5 h-5 text-primary" />
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Вигода</div>
                            <div className="text-lg font-bold text-primary leading-none mt-0.5">
                              {promotion.discount_type === "percent" ? `${promotion.discount_value}%` : `${Math.floor(Number(promotion.discount_value))} ₴`}
                            </div>
                          </div>
                        </div>
                      )}
                      {promotion.min_order_amount && (
                        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-xl">
                          <div className="w-5 h-5 flex items-center justify-center text-gray-400">₴</div>
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Мін. сума</div>
                            <div className="text-lg font-bold text-white leading-none mt-0.5">
                              {promotion.min_order_amount}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rich Description / Conditions */}
                  <div className="space-y-6 text-gray-400 text-sm md:text-base leading-relaxed">
                    {promotion.description && (
                      <p>{promotion.description}</p>
                    )}

                    {(sanitizedConditions || promotion.conditions) && (
                      <div className="bg-white/5 rounded-2xl p-5 border-l-4 border-primary">
                        <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Умови отримання
                        </h3>
                        <div
                          className="prose prose-invert prose-sm max-w-none text-gray-300 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4"
                          dangerouslySetInnerHTML={{ __html: sanitizedConditions || promotion.conditions }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Usage Progress - Compact */}
                  {promotion.max_uses && promotion.current_uses !== undefined && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <div className="flex justify-between items-end mb-2 text-xs text-gray-500 uppercase font-medium tracking-wider">
                        <span>Доступно купонів</span>
                        <span className={promotion.max_uses - promotion.current_uses < 10 ? "text-red-500" : "text-white"}>
                          {promotion.max_uses - promotion.current_uses} шт
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-emerald-400"
                          style={{ width: `${Math.min((promotion.current_uses / promotion.max_uses) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions - Fixed Bottom */}
                <div className="pt-8 mt-auto flex flex-col gap-3">
                  <Link
                    href="/menu"
                    className="w-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-500 hover:to-primary-700 text-black font-extrabold uppercase tracking-wide text-center py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Замовити доставку
                  </Link>

                  <Link
                    href="/promotions"
                    className="w-full text-gray-500 hover:text-white text-sm font-medium text-center py-2 transition-colors flex items-center justify-center gap-2 hover:gap-3"
                  >
                    ← Інші акції
                  </Link>
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


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
              <div className="h-96 bg-white/5 rounded-3xl w-full" />
              <div className="space-y-4">
                <div className="h-10 bg-white/5 rounded-lg w-2/3" />
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
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

              {/* Left Column: Image & Timer */}
              <div className="space-y-6 lg:sticky lg:top-32">
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

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {promotion.discount_percent && (
                      <span className="bg-red-500/90 backdrop-blur-md text-white font-bold px-4 py-2 rounded-xl text-lg shadow-lg shadow-red-500/20">
                        -{promotion.discount_percent}%
                      </span>
                    )}
                    {isActive ? (
                      <span className="bg-green-500/90 backdrop-blur-md text-black font-bold px-4 py-2 rounded-xl shadow-lg shadow-green-500/20 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                        Активна
                      </span>
                    ) : (
                      <span className="bg-gray-500/90 backdrop-blur-md text-white font-bold px-4 py-2 rounded-xl">
                        Завершена
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Timer Block */}
                {isActive && hasEndDate && (
                  <div className="bg-gradient-to-r from-gray-900 to-black border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />

                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-primary" />
                      До кінця акції
                    </p>
                    <CountdownTimer endDate={promotion.end_date!} className="scale-110" />
                  </div>
                )}
              </div>

              {/* Right Column: Info & Details */}
              <div className="bg-[#121212]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
                  {promotion.name}
                </h1>

                {promotion.description && (
                  <div className="text-gray-300 text-lg leading-relaxed mb-8 font-light">
                    {promotion.description}
                  </div>
                )}

                {/* Primary Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {promotion.discount_value && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Вигода</p>
                      <p className="text-2xl font-bold text-primary">
                        {promotion.discount_type === "percent" ? `${promotion.discount_value}%` : `${promotion.discount_value} ₴`}
                      </p>
                    </div>
                  )}
                  {promotion.min_order_amount && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Мін. замовлення</p>
                      <p className="text-2xl font-bold text-white">
                        {promotion.min_order_amount} ₴
                      </p>
                    </div>
                  )}
                </div>

                {/* Usage Progress */}
                {promotion.max_uses && promotion.current_uses !== undefined && (
                  <div className="mb-8 p-6 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/5">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-gray-300 font-medium">Залишилось пропозицій</span>
                      <span className="text-2xl font-bold text-white">
                        {promotion.max_uses - promotion.current_uses} <span className="text-sm text-gray-500 font-normal">/ {promotion.max_uses}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min((promotion.current_uses / promotion.max_uses) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex flex-col gap-4 mb-10 text-sm text-gray-400 border-t border-white/10 pt-6">
                  {(promotion.start_date || promotion.end_date) && (
                    <div className="flex items-center justify-between">
                      {promotion.start_date && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>З {new Date(promotion.start_date).toLocaleDateString("uk-UA")}</span>
                        </div>
                      )}
                      {promotion.end_date && (
                        <div className="flex items-center gap-2">
                          <span>По {new Date(promotion.end_date).toLocaleDateString("uk-UA")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Conditions */}
                {promotion.conditions && (
                  <div className="mb-10">
                    <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      Умови акції
                    </h3>
                    <div
                      className="prose prose-invert prose-p:text-gray-300 prose-li:text-gray-300 max-w-none text-sm leading-relaxed opacity-90"
                      dangerouslySetInnerHTML={{ __html: sanitizedConditions || promotion.conditions }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-4">
                  <Link
                    href="/menu"
                    className="w-full bg-primary hover:bg-primary-600 text-black font-bold text-center py-4 rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                  >
                    Замовити зараз
                  </Link>

                  <Link
                    href="/promotions"
                    className="w-full bg-transparent hover:bg-white/5 border border-white/10 text-white font-semibold text-center py-4 rounded-xl transition-all"
                  >
                    Інші акції
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


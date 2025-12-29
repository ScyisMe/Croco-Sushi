"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/lib/api/apiClient";
import { Promotion } from "@/lib/types";
import { ArrowRightIcon, ClockIcon, TagIcon } from "@heroicons/react/24/outline";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { uk } from "date-fns/locale";

// Функція для форматування залишку часу
function getTimeRemaining(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();

  const days = differenceInDays(end, now);
  const hours = differenceInHours(end, now) % 24;

  if (days > 0) {
    return `${days} дн. ${hours} год.`;
  }
  if (hours > 0) {
    return `${hours} год.`;
  }
  return "Закінчується";
}

export default function Promotions() {
  const promotionsQuery = useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: async () => {
      const response = await apiClient.get("/promotions");
      return response.data;
    },
  });

  const promotions = promotionsQuery.data?.filter((p) => p.is_active) || [];

  // Skeleton loader
  if (promotionsQuery.isLoading) {
    return (
      <section className="py-16 bg-theme-secondary">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="h-8 w-64 skeleton rounded" />
            <div className="h-10 w-32 skeleton rounded-lg hidden md:block" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="h-48 skeleton" />
                <div className="p-6 space-y-3">
                  <div className="h-6 skeleton w-3/4 rounded" />
                  <div className="h-4 skeleton w-full rounded" />
                  <div className="h-4 skeleton w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-theme-secondary">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary">
            🔥 Акційні пропозиції
          </h2>
          <Link
            href="/promotions"
            className="hidden md:inline-flex items-center gap-2 text-primary hover:text-primary-600 font-semibold transition"
          >
            Всі акції
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>

        {/* Картки акцій */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.slice(0, 3).map((promo) => (
            <Link
              href={`/promotions/${promo.slug}`}
              key={promo.id}
              className="card group overflow-hidden"
            >
              {/* Зображення */}
              <div className="relative overflow-hidden">
                {promo.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={promo.image_url}
                    alt={promo.name}
                    className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full aspect-[16/10] bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
                    <TagIcon className="w-16 h-16 text-white/50" />
                  </div>
                )}

                {/* Бейдж знижки */}
                {promo.show_discount_badge && promo.discount_value && Number(promo.discount_value) > 0 && (
                  <div className="absolute top-4 left-4 bg-accent-red text-white font-bold px-3 py-1 rounded-lg">
                    {promo.discount_type === 'percent'
                      ? `-${promo.discount_value}%`
                      : `-${promo.discount_value} ₴`}
                  </div>
                )}
              </div>

              {/* Контент */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-secondary mb-2 group-hover:text-primary transition">
                  {promo.name}
                </h3>
                <p className="text-secondary-light text-sm line-clamp-2 mb-4">
                  {promo.description}
                </p>

                {/* Таймер до кінця акції */}
                {promo.end_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="w-4 h-4 text-accent-orange" />
                    <span className="text-secondary-light">
                      Залишилось:{" "}
                      <span className="font-semibold text-accent-orange">
                        {getTimeRemaining(promo.end_date)}
                      </span>
                    </span>
                  </div>
                )}

                {/* Умови */}
                {promo.min_order_amount && (
                  <p className="text-xs text-secondary-light mt-2">
                    При замовленні від {promo.min_order_amount} ₴
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Кнопка "Всі акції" для мобільних */}
        <div className="text-center mt-8 md:hidden">
          <Link
            href="/promotions"
            className="btn-primary inline-flex items-center gap-2"
          >
            Всі акції
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}


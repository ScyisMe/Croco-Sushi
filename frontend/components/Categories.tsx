"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import apiClient from "@/lib/api/client";
import { Category } from "@/lib/types";

// Fallback іконки для категорій (якщо немає зображення)
const CATEGORY_ICONS: Record<string, string> = {
  "firmovi": "🌟",
  "klasychni": "🍣",
  "sety": "🍱",
  "zapecheni": "🔥",
  "black": "⬛",
  "wok": "🥡",
  "supy": "🍜",
  "salaty": "🥗",
  "sushi": "🍙",
  "napoi": "🥤",
  "default": "🍽️",
};

export default function Categories() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiClient.get("/categories");
      return response.data;
    },
  });

  const categories = categoriesQuery.data?.filter((cat) => cat.is_active) || [];

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Skeleton loader
  if (categoriesQuery.isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-secondary mb-8">Категорії меню</h2>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32">
                <div className="w-24 h-24 mx-auto rounded-full skeleton mb-3" />
                <div className="h-4 skeleton w-20 mx-auto rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary">
            Категорії меню
          </h2>
          
          {/* Кнопки прокрутки (для desktop) */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition"
              aria-label="Прокрутити вліво"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition"
              aria-label="Прокрутити вправо"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Горизонтальна прокрутка категорій */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4"
          >
            {/* Кнопка "Всі товари" */}
            <Link
              href="/menu"
              className="flex-shrink-0 group"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3 transition group-hover:bg-primary group-hover:scale-105">
                <span className="text-3xl md:text-4xl group-hover:scale-110 transition">
                  🍽️
                </span>
              </div>
              <p className="text-center text-sm md:text-base font-medium text-secondary group-hover:text-primary transition">
                Все меню
              </p>
            </Link>

            {/* Категорії */}
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/menu?category=${category.slug}`}
                className="flex-shrink-0 group"
              >
                <div className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-3 transition group-hover:ring-4 group-hover:ring-primary/30 group-hover:scale-105">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl md:text-4xl">
                      {CATEGORY_ICONS[category.slug] || CATEGORY_ICONS.default}
                    </span>
                  )}
                </div>
                <p className="text-center text-sm md:text-base font-medium text-secondary group-hover:text-primary transition max-w-[100px] md:max-w-[120px] mx-auto truncate">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>

          {/* Градієнти для індикації прокрутки */}
          <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-white to-transparent pointer-events-none md:hidden" />
          <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
        </div>
      </div>
    </section>
  );
}

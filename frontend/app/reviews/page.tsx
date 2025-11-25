"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import { Review } from "@/lib/types";
import { StarIcon as StarSolidIcon } from "@heroicons/react/20/solid";
import { StarIcon as StarOutlineIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Фільтри рейтингу
const RATING_FILTERS = [
  { value: 0, label: "Всі відгуки" },
  { value: 5, label: "5 зірок" },
  { value: 4, label: "4 зірки" },
  { value: 3, label: "3 зірки" },
  { value: 2, label: "2 зірки" },
  { value: 1, label: "1 зірка" },
];

// Компонент зірок
function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarSolidIcon
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? "text-yellow-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// Компонент картки відгуку
function ReviewCard({ review }: { review: Review }) {
  const initials = review.user_name
    ? review.user_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "АК";

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      {/* Заголовок */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-secondary truncate">
            {review.user_name || "Анонімний користувач"}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={review.rating} />
            <span className="text-sm text-secondary-light">
              {review.rating} з 5
            </span>
          </div>
        </div>
        <time className="text-sm text-secondary-light flex-shrink-0">
          {format(new Date(review.created_at), "dd MMM yyyy", { locale: uk })}
        </time>
      </div>

      {/* Коментар */}
      <p className="text-secondary mb-4">{review.comment}</p>

      {/* Відповідь адміністрації */}
      {review.reply_text && (
        <div className="mt-4 p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
          <p className="font-semibold text-primary text-sm mb-1">
            Відповідь Croco Sushi:
          </p>
          <p className="text-secondary-light text-sm">{review.reply_text}</p>
          {review.reply_date && (
            <time className="text-xs text-secondary-light mt-2 block">
              {format(new Date(review.reply_date), "dd MMM yyyy", { locale: uk })}
            </time>
          )}
        </div>
      )}
    </div>
  );
}

// Skeleton для відгуку
function ReviewSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full skeleton" />
        <div className="flex-1">
          <div className="h-5 skeleton w-32 mb-2 rounded" />
          <div className="h-4 skeleton w-24 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 skeleton w-full rounded" />
        <div className="h-4 skeleton w-3/4 rounded" />
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState(0);

  const reviewsQuery = useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      const response = await apiClient.get("/reviews");
      return response.data.items || response.data;
    },
  });

  const reviews = reviewsQuery.data || [];

  // Фільтрація відгуків
  const filteredReviews = useMemo(() => {
    if (ratingFilter === 0) return reviews;
    return reviews.filter((r) => r.rating === ratingFilter);
  }, [reviews, ratingFilter]);

  // Статистика
  const stats = useMemo(() => {
    if (reviews.length === 0) return null;

    const total = reviews.length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
      percentage: (reviews.filter((r) => r.rating === rating).length / total) * 100,
    }));

    return { total, avgRating, distribution };
  }, [reviews]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow">
        {/* Хлібні крихти */}
        <div className="bg-white border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm">
              <Link href="/" className="text-secondary-light hover:text-primary transition">
                Головна
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <span className="text-secondary font-medium">Відгуки</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-8 text-center">
            Відгуки наших клієнтів
          </h1>

          {/* Статистика */}
          {stats && (
            <div className="bg-white rounded-xl shadow-card p-6 md:p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Середній рейтинг */}
                <div className="text-center md:border-r md:border-border">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {stats.avgRating.toFixed(1)}
                  </div>
                  <RatingStars rating={Math.round(stats.avgRating)} size="lg" />
                  <p className="text-secondary-light mt-2">
                    На основі {stats.total} відгуків
                  </p>
                </div>

                {/* Розподіл оцінок */}
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    {stats.distribution.map((item) => (
                      <button
                        key={item.rating}
                        onClick={() => setRatingFilter(ratingFilter === item.rating ? 0 : item.rating)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition ${
                          ratingFilter === item.rating
                            ? "bg-primary/10"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-sm font-medium text-secondary w-16 text-left">
                          {item.rating} {item.rating === 1 ? "зірка" : item.rating < 5 ? "зірки" : "зірок"}
                        </span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-secondary-light w-12 text-right">
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Фільтри */}
          <div className="flex flex-wrap gap-2 mb-6">
            {RATING_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setRatingFilter(filter.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  ratingFilter === filter.value
                    ? "bg-primary text-white"
                    : "bg-white text-secondary border border-border hover:border-primary"
                }`}
              >
                {filter.label}
                {filter.value > 0 && (
                  <StarSolidIcon className="w-4 h-4 inline-block ml-1 text-yellow-400" />
                )}
              </button>
            ))}
          </div>

          {/* Список відгуків */}
          {reviewsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ReviewSkeleton key={i} />
              ))}
            </div>
          ) : reviewsQuery.isError ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Не вдалося завантажити відгуки
              </h3>
              <p className="text-secondary-light">
                Спробуйте оновити сторінку
              </p>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-secondary mb-2">
                {ratingFilter > 0
                  ? `Немає відгуків з оцінкою ${ratingFilter}`
                  : "Поки немає відгуків"}
              </h3>
              <p className="text-secondary-light mb-6">
                {ratingFilter > 0
                  ? "Спробуйте інший фільтр"
                  : "Будьте першим, хто залишить відгук!"}
              </p>
              {ratingFilter > 0 && (
                <button
                  onClick={() => setRatingFilter(0)}
                  className="btn-outline"
                >
                  Показати всі відгуки
                </button>
              )}
            </div>
          )}

          {/* CTA для залишення відгуку */}
          <div className="mt-12 bg-white rounded-xl shadow-card p-8 text-center">
            <div className="max-w-xl mx-auto">
              <div className="flex justify-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarOutlineIcon key={star} className="w-10 h-10 text-yellow-400" />
                ))}
              </div>
              <h2 className="text-2xl font-bold text-secondary mb-4">
                Поділіться враженнями
              </h2>
              <p className="text-secondary-light mb-6">
                Ваша думка важлива для нас! Залиште відгук після замовлення, 
                щоб допомогти іншим клієнтам зробити вибір.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/menu" className="btn-primary">
                  Зробити замовлення
                </Link>
                <Link href="/login" className="btn-outline">
                  Увійти в акаунт
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

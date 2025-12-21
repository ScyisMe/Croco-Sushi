"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/apiClient";
import { Review } from "@/lib/types";
import Image from "next/image";
import { StarIcon as StarSolidIcon, FaceFrownIcon, FaceSmileIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon, ChevronRightIcon, PencilSquareIcon, FaceSmileIcon as FaceNeutralIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import ReviewForm, { ReviewFormData } from "@/components/ReviewForm";
import toast from "react-hot-toast";
import { JsonLd, getBreadcrumbSchema, getAggregateReviewSchema, BUSINESS_INFO } from "@/lib/schema";
import { useTranslation, useLocaleStore } from "@/store/localeStore";

// Компонент зірок
function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarSolidIcon
          key={star}
          className={`${sizeClasses[size]} ${star <= rating ? "text-yellow-400" : "text-foreground-muted/30"
            }`}
        />
      ))}
    </div>
  );
}



// Компонент модального вікна для перегляду фото
function ImageModal({ src, isOpen, onClose }: { src: string; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Review full size" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  );
}

// Компонент картки відгуку
function ReviewCard({ review, onImageClick }: { review: Review; onImageClick: (src: string) => void }) {
  const { t } = useTranslation();
  const locale = useLocaleStore((state) => state.locale);
  const dateLocale = uk;

  const initials = review.user_name
    ? review.user_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "АК";

  return (
    <div className="bg-surface rounded-xl shadow-card p-6 border border-border hover:border-primary/30 transition-colors h-full flex flex-col">
      {/* Заголовок */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {review.user_name || t("reviews.anonymousUser")}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={review.rating} />
            <span className="text-sm text-foreground-muted">
              {review.rating} {t("reviews.outOf")} 5
            </span>
          </div>
        </div>
        <time className="text-sm text-foreground-muted flex-shrink-0">
          {format(new Date(review.created_at), "dd MMM yyyy", { locale: dateLocale })}
        </time>
      </div>

      {/* Коментар: flex-grow pushing footer down */}
      <div className="flex-grow">
        <p className="text-foreground-secondary mb-4">{review.comment}</p>

        {/* Фотографії відгуку */}
        {review.images && review.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {review.images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 active:scale-95 transition-all border border-border"
                onClick={() => onImageClick(img)}
              >
                <img
                  src={img}
                  alt={`Review attachment ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Відповідь адміністрації */}
      {review.reply_text && (
        <div className="mt-auto pt-4">
          <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
            <p className="font-semibold text-primary text-sm mb-1">
              {t("reviews.replyFromRestaurant")}
            </p>
            <p className="text-foreground-secondary text-sm">{review.reply_text}</p>
            {review.reply_date && (
              <time className="text-xs text-foreground-muted mt-2 block">
                {format(new Date(review.reply_date), "dd MMM yyyy", { locale: dateLocale })}
              </time>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton для відгуку
function ReviewSkeleton() {
  return (
    <div className="bg-theme-surface rounded-xl shadow-card p-6 h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full skeleton" />
        <div className="flex-1">
          <div className="h-5 skeleton w-32 mb-2 rounded" />
          <div className="h-4 skeleton w-24 rounded" />
        </div>
      </div>
      <div className="space-y-2 flex-grow">
        <div className="h-4 skeleton w-full rounded" />
        <div className="h-4 skeleton w-3/4 rounded" />
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState(0);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  // Image modal state
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Локалізовані фільтри рейтингу
  const RATING_FILTERS = useMemo(() => [
    { value: 0, label: t("reviews.allReviews") },
    { value: 5, label: `5 ${t("reviews.stars")}` },
    { value: 4, label: `4 ${t("reviews.stars2_4")}` },
    { value: 3, label: `3 ${t("reviews.stars2_4")}` },
    { value: 2, label: `2 ${t("reviews.stars2_4")}` },
    { value: 1, label: `1 ${t("reviews.star")}` },
  ], [t]);

  // Перевірка авторизації
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  const reviewsQuery = useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      const response = await apiClient.get("/reviews");
      return response.data.items || response.data;
    },
  });

  // Мутація для створення відгуку
  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const formData = new FormData();
      formData.append("rating", data.rating.toString());
      formData.append("comment", data.comment);
      if (data.images) {
        data.images.forEach((file) => {
          formData.append("images", file);
        });
      }
      const response = await apiClient.post("/users/me/reviews", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const handleOpenReviewForm = () => {
    if (!isAuthenticated) {
      toast.error(t("reviews.loginToReview"));
      router.push("/login");
      return;
    }
    setIsReviewFormOpen(true);
  };

  const handleSubmitReview = async (data: ReviewFormData) => {
    await createReviewMutation.mutateAsync(data);
  };

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
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0f291e] via-[#05140e] to-[#000000] transition-colors">
      {/* Schema.org markup для SEO */}
      <JsonLd
        schema={getBreadcrumbSchema([
          { name: t("common.home"), url: BUSINESS_INFO.url },
          { name: t("reviews.title"), url: `${BUSINESS_INFO.url}/reviews` },
        ])}
      />
      {stats && (
        <JsonLd
          schema={getAggregateReviewSchema({
            itemName: BUSINESS_INFO.name,
            itemType: "Restaurant",
            ratingValue: stats.avgRating,
            reviewCount: stats.total,
          })}
        />
      )}

      <Header />

      <main className="flex-grow">
        {/* Хлібні крихти */}
        <div className="bg-surface">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm">
              <Link href="/" className="text-foreground-muted hover:text-primary transition">
                {t("common.home")}
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-foreground-muted" />
              <span className="text-foreground font-medium">{t("reviews.title")}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
            {t("reviews.pageTitle")}
          </h1>

          {/* Статистика */}
          {stats && (
            <div className="bg-surface rounded-2xl shadow-card p-6 md:p-8 mb-8 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Середній рейтинг */}
                <div className="text-center md:border-r md:border-border">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {stats.avgRating.toFixed(1)}
                  </div>
                  <RatingStars rating={Math.round(stats.avgRating)} size="lg" />
                  <p className="text-foreground-muted mt-2">
                    {t("reviews.basedOn", { count: stats.total })}
                  </p>
                </div>

                {/* Розподіл оцінок */}
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    {stats.distribution.map((item) => (
                      <button
                        key={item.rating}
                        onClick={() => setRatingFilter(ratingFilter === item.rating ? 0 : item.rating)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition ${ratingFilter === item.rating
                          ? "bg-primary/15 border border-primary/30"
                          : "hover:bg-background-secondary border border-transparent"
                          }`}
                      >
                        <span className="text-sm font-medium text-foreground w-16 text-left">
                          {item.rating} {item.rating === 1 ? t("reviews.star") : item.rating < 5 ? t("reviews.stars2_4") : t("reviews.stars")}
                        </span>
                        <div className="flex-1 h-3 bg-background-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-foreground-muted w-12 text-right">
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
          <div className="flex flex-wrap gap-2 mb-8">
            {RATING_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setRatingFilter(filter.value)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${ratingFilter === filter.value
                  ? "bg-primary text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105"
                  : "bg-transparent text-foreground-muted hover:text-white hover:bg-white/5"
                  }`}
              >
                {filter.label}
                {filter.value > 0 && (
                  <StarSolidIcon className={`w-4 h-4 inline-block ml-1.5 ${ratingFilter === filter.value ? "text-yellow-300" : "text-yellow-400"
                    }`} />
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FaceFrownIcon className="w-16 h-16 text-theme-muted mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t("reviews.loadError")}
              </h3>
              <p className="text-foreground-secondary">
                {t("reviews.tryRefresh")}
              </p>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onImageClick={(src) => setModalImage(src)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative w-24 h-24 mx-auto mb-4 opacity-50">
                <Image
                  src="/logo.png"
                  alt="No reviews"
                  fill
                  className="object-contain grayscale"
                />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {ratingFilter > 0
                  ? t("reviews.noReviewsWithFilter", { rating: ratingFilter })
                  : t("reviews.noReviews")}
              </h3>
              <p className="text-foreground-secondary mb-6">
                {ratingFilter > 0
                  ? t("reviews.tryOtherFilter")
                  : t("reviews.beFirst")}
              </p>
              {ratingFilter > 0 && (
                <button
                  onClick={() => setRatingFilter(0)}
                  className="inline-flex items-center justify-center px-6 py-3 bg-surface hover:bg-surface-hover text-foreground font-semibold rounded-xl border-2 border-border hover:border-primary/50 transition-all"
                >
                  {t("reviews.showAll")}
                </button>
              )}
            </div>
          )}

          {/* CTA для залишення відгуку */}
          <div className="mt-12 bg-gradient-to-br from-surface via-surface to-primary/5 rounded-2xl shadow-xl px-8 pb-8 pt-14 md:px-12 md:pb-12 md:pt-20 text-center border border-border">
            <div className="max-w-xl mx-auto">
              {/* Інтерактивні зірки */}
              <div className="flex justify-center mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => {
                      setSelectedRating(star);
                      handleOpenReviewForm();
                    }}
                    className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    aria-label={`${t("reviews.rating")} ${star} ${t("reviews.outOf")} 5`}
                  >
                    {star <= (hoverRating || selectedRating) ? (
                      <StarSolidIcon className="w-12 h-12 md:w-14 md:h-14 text-yellow-400 drop-shadow-lg transition-all" />
                    ) : (
                      <StarOutlineIcon className="w-12 h-12 md:w-14 md:h-14 text-yellow-400/60 hover:text-yellow-400 transition-all" />
                    )}
                  </button>
                ))}
              </div>

              {/* Підказка при наведенні */}
              <p className="text-sm text-primary font-medium mb-4 h-5">
                {hoverRating > 0 && (
                  <span className="animate-fadeIn">
                    {hoverRating === 5 && <><SparklesIcon className="w-4 h-4 inline-block mr-1 text-yellow-400" /> {t("reviews.ratingExcellent")}</>}
                    {hoverRating === 4 && <><FaceSmileIcon className="w-4 h-4 inline-block mr-1 text-yellow-400" /> {t("reviews.ratingGood")}</>}
                    {hoverRating === 3 && <><FaceNeutralIcon className="w-4 h-4 inline-block mr-1 text-yellow-400" /> {t("reviews.ratingNormal")}</>}
                    {hoverRating === 2 && <><FaceFrownIcon className="w-4 h-4 inline-block mr-1 text-yellow-400" /> {t("reviews.ratingBad")}</>}
                    {hoverRating === 1 && <><FaceFrownIcon className="w-4 h-4 inline-block mr-1 text-yellow-400" /> {t("reviews.ratingTerrible")}</>}
                  </span>
                )}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {t("reviews.shareExperience")}
              </h2>
              <p className="text-foreground-secondary mb-8 leading-relaxed">
                {t("reviews.yourOpinionMatters")} {t("reviews.helpOthers")}
              </p>

              {/* Покращені кнопки */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleOpenReviewForm}
                  className="btn-primary group flex items-center justify-center gap-2"
                >
                  <PencilSquareIcon className="w-6 h-6 group-hover:rotate-3 transition-transform" />
                  {t("reviews.leaveReview")}
                </button>
                <Link
                  href="/menu"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-surface hover:bg-surface-hover text-foreground font-bold text-lg rounded-2xl border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:-translate-y-1"
                >

                  <span>{t("reviews.goToMenu")}</span>
                  <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ReviewForm
        isOpen={isReviewFormOpen}
        onClose={() => setIsReviewFormOpen(false)}
        onSubmit={handleSubmitReview}
      />

      <ImageModal
        isOpen={!!modalImage}
        src={modalImage || ""}
        onClose={() => setModalImage(null)}
      />
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/apiClient";
import { Review, GoogleReviewResponse } from "@/lib/types";
import Image from "next/image";
import { StarIcon as StarSolidIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import ReviewForm, { ReviewFormData } from "@/components/ReviewForm";
import toast from "react-hot-toast";
import { JsonLd, getBreadcrumbSchema, BUSINESS_INFO } from "@/lib/schema";
import { useTranslation, useLocaleStore } from "@/store/localeStore";
import { motion, AnimatePresence } from "framer-motion";

// --- Components ---

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarSolidIcon
          key={star}
          className={`${sizeClasses[size]} ${star <= rating ? "text-[#FCD34D]" : "text-gray-700"
            }`}
        />
      ))}
    </div>
  );
}

function ImageModal({ src, isOpen, onClose }: { src: string; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/50 hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <Image
          src={src}
          alt="Review full size"
          className="object-contain rounded-lg shadow-2xl"
          fill
          sizes="100vw"
        />
      </div>
    </div>
  );
}

function GoogleReviewCard({ review }: { review: GoogleReviewResponse }) {
  // Google avatar often comes as a small image, we can try to get a better quality one if possible, but usually it's limited
  return (
    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 flex flex-col h-full hover:border-[#FCD34D]/20 transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
          <Image
            src={review.profile_photo_url}
            alt={review.author_name}
            fill
            className="object-cover"
            unoptimized // Google images might need this if domains not configured
          />
        </div>
        <div>
          <h3 className="text-white font-medium text-sm">{review.author_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={review.rating} size="sm" />
            <span className="text-xs text-gray-500">{review.relative_time_description}</span>
          </div>
        </div>
        <div className="ml-auto">
          <Image src="/google-icon.svg" width={20} height={20} alt="Google" className="opacity-50" unoptimized />
          {/* Fallback to text if icon missing, or use a simple G icon */}
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{review.text}</p>
    </div>
  );
}

function SiteReviewCard({ review, onImageClick }: { review: Review; onImageClick: (src: string) => void }) {
  const { t } = useTranslation();
  const dateLocale = uk;

  const initials = review.user_name
    ? review.user_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "A";

  return (
    <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 flex flex-col h-full hover:border-[#10B981]/20 transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div>
          <h3 className="text-white font-medium text-sm">
            {review.user_name || t("reviews.anonymousUser")}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={review.rating} size="sm" />
            <time className="text-xs text-gray-500">
              {format(new Date(review.created_at), "d MMM yyyy", { locale: dateLocale })}
            </time>
          </div>
        </div>
      </div>

      <div className="flex-grow">
        <p className="text-gray-300 text-sm leading-relaxed mb-4">{review.comment}</p>

        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {review.images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-16 h-16 rounded-lg overflow-hidden cursor-zoom-in hover:opacity-80 transition flex-shrink-0 border border-white/10"
                onClick={() => onImageClick(img)}
              >
                <Image
                  src={img}
                  alt={`Review attachment ${idx + 1}`}
                  className="object-cover"
                  fill
                  sizes="64px"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {review.reply_text && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex gap-3">
            <div className="w-1 bg-[#10B981] rounded-full opacity-50 shrink-0"></div>
            <div>
              <p className="text-[#10B981] text-xs font-semibold mb-1">
                {t("reviews.replyFromRestaurant")}
              </p>
              <p className="text-gray-400 text-sm italic">&quot;{review.reply_text}&quot;</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function ReviewsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  const reviewsQuery = useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      const response = await apiClient.get("/reviews");
      return response.data;
    },
  });

  const googleReviewsQuery = useQuery<GoogleReviewResponse[]>({
    queryKey: ["google-reviews"],
    queryFn: async () => {
      const response = await apiClient.get("/reviews/google");
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });


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
      // General review endpoint (updated backend)
      const response = await apiClient.post("/reviews/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      // Optionally show different success message or close modal
      setIsReviewFormOpen(false);
    },
    onError: (error: any) => {
      // ReviewForm handles generic errors, but we can catch auth errors here if needed
    }

  });

  const handleOpenReviewForm = () => {
    if (!isAuthenticated) {
      toast.error(t("reviews.loginToReview"));
      router.push("/login?redirect=/reviews");
      return;
    }
    setIsReviewFormOpen(true);
  };

  const handleSubmitReview = async (data: ReviewFormData) => {
    await createReviewMutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#10B981]/30">
      <JsonLd
        schema={getBreadcrumbSchema([
          { name: t("common.home"), url: BUSINESS_INFO.url },
          { name: t("reviews.title"), url: `${BUSINESS_INFO.url}/reviews` },
        ])}
      />

      <Header />

      <main className="pb-20">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 px-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#10B981]/20 via-[#050505]/0 to-[#050505]/0 pointer-events-none" />

          <div className="container mx-auto max-w-6xl relative z-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight"
            >
              {t("reviews.pageTitle")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-400 max-w-2xl mx-auto mb-10"
            >
              {t("reviews.yourOpinionMatters")}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={handleOpenReviewForm}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1"
            >
              <PencilSquareIcon className="w-6 h-6" />
              {t("reviews.leaveReview")}
            </motion.button>
          </div>
        </section>

        {/* Content Section */}
        <div className="container mx-auto max-w-7xl px-4">

          {/* Google Reviews Section */}
          {googleReviewsQuery.data && googleReviewsQuery.data.length > 0 && (
            <section className="mb-20">
              <div className="flex items-center gap-3 mb-8 px-2">
                <Image src="/google-icon.svg" width={24} height={24} alt="Google" className="grayscale opacity-70" unoptimized />
                <h2 className="text-xl font-bold text-gray-200">Google Reviews</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {googleReviewsQuery.data.map((review, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <GoogleReviewCard review={review} />
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 text-center text-sm text-gray-500">
                <a href={`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLACE_ID || ''}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#10B981] transition underline underline-offset-4">
                  View all reviews on Google Maps
                </a>
              </div>
            </section>
          )}


          {/* Site Reviews Section */}
          <section>
            <div className="flex items-center gap-3 mb-8 px-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#10B981]" />
              <h2 className="text-xl font-bold text-gray-200">{t("reviews.usersReviews")}</h2>
            </div>

            {reviewsQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#1A1A1A] h-48 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviewsQuery.data.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <SiteReviewCard review={review} onImageClick={setModalImage} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-[#1A1A1A] rounded-3xl border border-white/5">
                <div className="mb-4">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-700 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t("reviews.noReviews")}</h3>
                <p className="text-gray-400 mb-6">{t("reviews.beFirst")}</p>
                <button
                  onClick={handleOpenReviewForm}
                  className="text-[#10B981] font-semibold hover:text-white transition"
                >
                  {t("reviews.leaveReview")}
                </button>
              </div>
            )}
          </section>
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

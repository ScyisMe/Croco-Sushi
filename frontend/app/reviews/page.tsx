"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { ReviewWithUser } from "@/lib/types";
import { StarIcon } from "@heroicons/react/20/solid";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Link from "next/link";
import clsx from "clsx";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ReviewsPage() {
  const reviewsQuery = useQuery<ReviewWithUser[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      const response = await apiClient.get("/reviews");
      return response.data;
    },
  });

  const reviews = reviewsQuery.data;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Відгуки наших клієнтів</h1>

        {reviewsQuery.isLoading ? (
          <div className="text-center">Завантаження відгуків...</div>
        ) : reviewsQuery.isError ? (
          <div className="text-center text-red-600">Не вдалося завантажити відгуки.</div>
        ) : reviews && reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                      {review.user_name ? review.user_name[0] : "А"}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-semibold">{review.user_name || "Анонімний користувач"}</p>
                    <div className="flex items-center">
                      {[0, 1, 2, 3, 4].map((rating) => (
                        <StarIcon
                          key={rating}
                          className={clsx(
                            review.rating > rating ? "text-yellow-400" : "text-gray-300",
                            "h-5 w-5 flex-shrink-0"
                          )}
                          aria-hidden="true"
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-500">{review.rating} з 5</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 flex-grow">{review.comment}</p>
                <div className="text-sm text-gray-500 mt-auto">
                  <p>Опубліковано: {format(new Date(review.created_at), "dd MMMM yyyy", { locale: uk })}</p>
                  {review.reply_text && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
                      <p className="font-semibold text-blue-700">Відповідь адміністрації:</p>
                      <p className="text-gray-700">{review.reply_text}</p>
                      {review.reply_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(review.reply_date), "dd MMMM yyyy", { locale: uk })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">Наразі немає відгуків. Будьте першим!</p>
        )}

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Залишити відгук</h2>
          <p className="text-gray-600 mb-6">
            Щоб залишити відгук, будь ласка,{" "}
            <Link href="/login" className="text-green-600 hover:underline">
              увійдіть
            </Link>{" "}
            або оформіть замовлення.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}


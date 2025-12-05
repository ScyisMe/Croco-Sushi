'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import { StarIcon } from '@heroicons/react/24/solid';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Review {
    id: number;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function ReviewsCarousel() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/v1/reviews/?limit=5&is_published=true');
                if (response.ok) {
                    const data = await response.json();
                    // Handle both array and paginated response
                    const items = Array.isArray(data) ? data : data.items || [];
                    setReviews(items);
                }
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8 mx-auto"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (reviews.length === 0) return null;

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">
                    Що кажуть наші клієнти
                </h2>

                <Swiper
                    modules={[Navigation, Autoplay, Pagination]}
                    spaceBetween={24}
                    slidesPerView={1}
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 6000, disableOnInteraction: false }}
                    breakpoints={{
                        640: { slidesPerView: 1 },
                        768: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 },
                    }}
                    className="reviews-slider !pb-12"
                >
                    {reviews.map((review) => (
                        <SwiperSlide key={review.id}>
                            <div className="bg-white p-6 rounded-xl shadow-sm h-full flex flex-col">
                                <div className="flex items-center gap-1 mb-4 text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-6 flex-grow italic">
                                    &quot;{review.comment}&quot;
                                </p>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="font-semibold text-gray-900">{review.user_name}</span>
                                    <span suppressHydrationWarning className="text-sm text-gray-400">
                                        {new Date(review.created_at).toLocaleDateString('uk-UA')}
                                    </span>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}

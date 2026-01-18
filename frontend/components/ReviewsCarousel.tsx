'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { StarIcon } from '@heroicons/react/24/solid';
import 'swiper/css';
import 'swiper/css/navigation';
// import 'swiper/css/pagination';

interface Review {
    id: number;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

import apiClient from '@/lib/api/apiClient';

// ... (imports remain)

import Link from 'next/link';

// ... (imports remain)

export default function ReviewsCarousel() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await apiClient.get('/reviews/', {
                    params: {
                        limit: 5,
                        is_published: true
                    }
                });
                const data = response.data;
                // Handle both array and paginated response
                const items = Array.isArray(data) ? data : data.items || [];
                setReviews(items);
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
                <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-8 mx-auto"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-white/10 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (reviews.length === 0) return null;

    return (
        <section className="py-16 bg-theme-secondary">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
                    Що кажуть наші клієнти
                </h2>

                <Swiper
                    modules={[Autoplay]}
                    spaceBetween={24}
                    slidesPerView={1}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    breakpoints={{
                        640: { slidesPerView: 1 },
                        768: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 },
                    }}
                    className="reviews-slider !pb-12"
                >
                    {reviews.map((review) => (
                        <SwiperSlide key={review.id} className="h-auto">
                            <Link href="/reviews" className="block h-full group">
                                <div className="bg-surface p-6 rounded-xl shadow-sm h-full flex flex-col border border-border group-hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon
                                                key={i}
                                                className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-foreground-muted/30'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-foreground-secondary mb-6 flex-grow italic line-clamp-5">
                                        &quot;{review.comment}&quot;
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="font-semibold text-foreground">{review.user_name}</span>
                                        <span suppressHydrationWarning className="text-sm text-foreground-muted">
                                            {new Date(review.created_at).toLocaleDateString('uk-UA')}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}


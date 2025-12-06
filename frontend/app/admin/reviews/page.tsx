"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import {
    StarIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface Review {
    id: number;
    user_name: string;
    rating: number;
    comment: string;
    is_published: boolean;
    created_at: string;
    product_name?: string;
    product_id?: number;
    admin_reply?: string;
    reply_date?: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyModalId, setReplyModalId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await apiClient.get("/admin/reviews");
            setReviews(response.data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Помилка завантаження відгуків");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePublish = async (review: Review) => {
        try {
            if (review.is_published) {
                await apiClient.put(`/admin/reviews/${review.id}/hide`);
                toast.success("Відгук приховано");
            } else {
                await apiClient.put(`/admin/reviews/${review.id}/publish`);
                toast.success("Відгук опубліковано");
            }

            setReviews(reviews.map(r =>
                r.id === review.id ? { ...r, is_published: !r.is_published } : r
            ));
        } catch (error) {
            toast.error("Помилка оновлення статусу");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Ви впевнені, що хочете видалити цей відгук?")) return;

        try {
            await apiClient.delete(`/admin/reviews/${id}`);
            setReviews(reviews.filter(r => r.id !== id));
            toast.success("Відгук видалено");
        } catch (error) {
            toast.error("Помилка видалення");
        }
    };

    const handleReply = async () => {
        if (!replyModalId || !replyText.trim()) return;

        try {
            await apiClient.post(`/admin/reviews/${replyModalId}/reply`, {
                reply: replyText
            });

            setReviews(reviews.map(r =>
                r.id === replyModalId ? { ...r, admin_reply: replyText } : r
            ));

            toast.success("Відповідь надіслано");
            setReplyModalId(null);
            setReplyText("");
        } catch (error) {
            toast.error("Помилка надсилання відповіді");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Відгуки</h1>
                <p className="text-gray-400">Керування відгуками клієнтів ({reviews.length})</p>
            </div>

            <div className="bg-surface-card rounded-xl shadow-sm border border-white/5 overflow-hidden">
                {reviews.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Відгуків поки немає</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {reviews.map((review) => (
                            <div key={review.id} className="p-6 hover:bg-white/5 transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-semibold text-white">{review.user_name}</span>
                                            <span className="text-sm text-gray-400">• {formatDate(review.created_at)}</span>
                                        </div>
                                        {review.product_name && (
                                            <p className="text-sm text-gray-400 mb-2">
                                                Товар: <span className="font-medium text-gray-300">{review.product_name}</span>
                                            </p>
                                        )}
                                        <div className="flex text-yellow-500 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i}>
                                                    {i < review.rating ? <StarIconSolid className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => togglePublish(review)}
                                            className={`p-2 rounded-full transition ${review.is_published
                                                ? "text-green-400 bg-green-500/10 hover:bg-green-500/20"
                                                : "text-gray-400 bg-white/5 hover:bg-white/10"
                                                }`}
                                            title={review.is_published ? "Опубліковано" : "Приховано"}
                                        >
                                            {review.is_published ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setReplyModalId(review.id);
                                                setReplyText(review.admin_reply || "");
                                            }}
                                            className="p-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-full transition"
                                            title="Відповісти"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-full transition"
                                            title="Видалити"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-gray-300 whitespace-pre-line">{review.comment}</p>

                                {review.admin_reply && (
                                    <div className="mt-4 ml-4 pl-4 border-l-4 border-green-500 bg-surface p-4 rounded-r-lg">
                                        <p className="text-sm font-semibold text-green-400 mb-1">Відповідь адміністратора:</p>
                                        <p className="text-gray-400">{review.admin_reply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Модальне вікно відповіді */}
            {replyModalId && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-surface-card border border-white/10 rounded-xl shadow-lg max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Відповідь на відгук</h3>
                        <textarea
                            className="w-full h-32 p-3 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder-gray-500"
                            placeholder="Введіть вашу відповідь..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                onClick={() => setReplyModalId(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={handleReply}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
                            >
                                Надіслати
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

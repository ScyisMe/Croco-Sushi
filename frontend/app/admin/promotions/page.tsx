"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CalendarIcon,
    PhotoIcon,
} from "@heroicons/react/24/outline";

interface Promotion {
    id: number;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    is_active: boolean;
    start_date?: string;
    end_date?: string;
    position: number;
}

export default function AdminPromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await apiClient.get("/admin/promotions");
            setPromotions(response.data);
        } catch (error) {
            console.error("Error fetching promotions:", error);
            toast.error("Помилка завантаження акцій");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Ви впевнені, що хочете видалити цю акцію?")) return;

        try {
            await apiClient.delete(`/admin/promotions/${id}`);
            setPromotions(promotions.filter((p) => p.id !== id));
            toast.success("Акцію видалено");
        } catch (error) {
            toast.error("Помилка видалення");
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("uk-UA");
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Акції</h1>
                    <p className="text-gray-400">
                        Управління акціями та спецпропозиціями ({promotions.length})
                    </p>
                </div>
                <Link
                    href="/admin/promotions/new"
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Створити акцію
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => (
                    <div
                        key={promo.id}
                        className="bg-surface-card rounded-xl shadow-sm border border-white/5 overflow-hidden flex flex-col"
                    >
                        <div className="relative h-48 bg-white/5">
                            {promo.image_url ? (
                                <img
                                    src={promo.image_url}
                                    alt={promo.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <PhotoIcon className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex space-x-1">
                                <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${promo.is_active
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-surface text-gray-400"
                                        }`}
                                >
                                    {promo.is_active ? "Активна" : "Неактивна"}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-2">
                                {promo.name}
                            </h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                                {promo.description}
                            </p>

                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                <span>
                                    {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                                </span>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
                                <Link
                                    href={`/admin/promotions/${promo.id}/edit`}
                                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(promo.id)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {promotions.length === 0 && (
                <div className="text-center py-12 bg-surface-card rounded-xl border border-white/5">
                    <p className="text-gray-500">Акцій поки немає</p>
                </div>
            )}
        </div>
    );
}

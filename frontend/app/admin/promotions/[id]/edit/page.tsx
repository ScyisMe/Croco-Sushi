"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function EditPromotionPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        image_url: "",
        is_active: true,
        start_date: "",
        end_date: "",
        position: 0
    });

    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                const response = await apiClient.get(`/admin/promotions/${params.id}`);
                const data = response.data;
                // Format dates for input type="datetime-local" (YYYY-MM-DDThh:mm)
                const formatDateForInput = (dateStr?: string) => {
                    if (!dateStr) return "";
                    return new Date(dateStr).toISOString().slice(0, 16);
                };

                setFormData({
                    name: data.name,
                    slug: data.slug,
                    description: data.description || "",
                    image_url: data.image_url || "",
                    is_active: data.is_active,
                    start_date: formatDateForInput(data.start_date),
                    end_date: formatDateForInput(data.end_date),
                    position: data.position || 0
                });
            } catch (error) {
                console.error("Error fetching promotion:", error);
                toast.error("Акцію не знайдено");
                router.push("/admin/promotions");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromotion();
    }, [params.id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Convert empty strings to null for backend if needed, or keep as is
            const payload = {
                ...formData,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null
            };

            await apiClient.put(`/admin/promotions/${params.id}`, payload);
            toast.success("Акцію оновлено успішно");
            router.push("/admin/promotions");
        } catch (error: any) {
            console.error("Error updating promotion:", error);
            toast.error(error.response?.data?.detail || "Помилка оновлення акції");
        } finally {
            setIsSaving(false);
        }
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
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/promotions"
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Редагування акції</h1>
                    <p className="text-gray-400">Зміна параметрів акції "{formData.name}"</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface-card rounded-xl shadow-sm border border-white/5 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Назва акції *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Slug (URL) *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full px-4 py-2 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Опис
                        </label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Дата початку
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-4 py-2 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent [color-scheme:dark]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Дата закінчення
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full px-4 py-2 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent [color-scheme:dark]"
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            URL зображення
                        </label>
                        <input
                            type="text"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            className="w-full px-4 py-2 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 bg-surface border-white/10"
                        />
                        <span className="text-gray-300">Активна акція</span>
                    </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
                    <Link
                        href="/admin/promotions"
                        className="px-6 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                    >
                        Скасувати
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? "Збереження..." : "Зберегти зміни"}
                    </button>
                </div>
            </form>
        </div>
    );
}

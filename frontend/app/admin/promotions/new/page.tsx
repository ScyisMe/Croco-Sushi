"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import { ArrowLeftIcon, PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

export default function NewPromotionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        image_url: "",
        discount_type: "percent",
        discount_value: "",
        is_active: true,
        start_date: "",
        end_date: "",
        position: 0
    });

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Будь ласка, виберіть зображення");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Розмір файлу не повинен перевищувати 5MB");
            return;
        }

        setIsUploading(true);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            formDataUpload.append("subdirectory", "promotions");

            const response = await apiClient.post("/upload/image/admin", formDataUpload, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setFormData(prev => ({ ...prev, image_url: response.data.url }));
            toast.success("Зображення завантажено");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.response?.data?.detail || "Помилка завантаження зображення");
            setImagePreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image_url: "" }));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                discount_value: formData.discount_value === "" ? null : Number(formData.discount_value)
            };
            await apiClient.post("/admin/promotions", payload);
            toast.success("Акцію створено успішно");
            router.push("/admin/promotions");
        } catch (error: any) {
            console.error("Error creating promotion:", error);
            toast.error(error.response?.data?.detail || "Помилка створення акції");
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-white">Нова акція</h1>
                    <p className="text-gray-400">Створення нової акційної пропозиції</p>
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
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                            placeholder="Знижка -20% на роли"
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
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                            placeholder="znyzhka-20-na-roly"
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
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                            placeholder="Опишіть умови та деталі акції..."
                        />
                    </div>

                    {/* Discount fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Тип знижки
                        </label>
                        <select
                            value={formData.discount_type}
                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="percent">Відсоток (%)</option>
                            <option value="fixed">Фіксована сума (₴)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Розмір знижки
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                            placeholder={formData.discount_type === 'percent' ? '20' : '100'}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Дата початку *
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Дата закінчення *
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Зображення акції
                        </label>

                        {imagePreview || formData.image_url ? (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/10">
                                <Image
                                    src={imagePreview || formData.image_url}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    w-full h-48 rounded-lg border-2 border-dashed cursor-pointer
                                    flex flex-col items-center justify-center gap-3 transition-all
                                    ${isDragOver
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-white/20 hover:border-white/40 bg-[#1a1a1a]"
                                    }
                                `}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm text-gray-400">Завантаження...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-3 bg-white/5 rounded-full">
                                            <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-gray-300">
                                                Перетягніть зображення сюди
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                або натисніть для вибору (PNG, JPG до 5MB)
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 text-green-600 rounded border-white/20 focus:ring-green-500 bg-[#1a1a1a] checked:bg-green-600"
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
                        disabled={isLoading || isUploading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Збереження..." : "Створити акцію"}
                    </button>
                </div>
            </form>
        </div>
    );
}


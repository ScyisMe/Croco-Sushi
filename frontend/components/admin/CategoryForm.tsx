"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import { ArrowLeftIcon, CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface CategoryFormData {
    name: string;
    slug: string;
    description: string;
    image_url: string;
    position: number;
    is_active: boolean;
}

interface CategoryFormProps {
    initialData?: CategoryFormData;
    onSubmit: (data: CategoryFormData) => Promise<void>;
    isLoading: boolean;
    title: string;
    subtitle: string;
}

export default function CategoryForm({
    initialData,
    onSubmit,
    isLoading,
    title,
    subtitle
}: CategoryFormProps) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState<CategoryFormData>({
        name: "",
        slug: "",
        description: "",
        image_url: "",
        position: 0,
        is_active: true,
    });

    // Load initial data if provided
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9а-яіїєґ\s-]/g, "") // Remove special chars
            .replace(/\s+/g, "-") // Replace spaces with dashes
            .replace(/-+/g, "-") // Prevent multiple dashes
            .trim();
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        // Only auto-generate slug if it's new or user hasn't manually edited slug essentially
        // But specific requirement mostly implies auto-gen on name change for convenience
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Файл занадто великий. Максимум 5MB");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Дозволені лише зображення");
            return;
        }

        setIsUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const response = await apiClient.post("/upload/image/admin?subdirectory=categories", formDataUpload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setFormData(prev => ({ ...prev, image_url: response.data.url }));
            toast.success("Зображення завантажено!");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Помилка завантаження");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClassName = "w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-600 transition-all outline-none";
    const labelClassName = "block text-sm font-medium text-gray-400 mb-2";

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link
                    href="/admin/categories"
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{title}</h1>
                    <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
                </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-surface-card rounded-2xl shadow-xl border border-white/5 p-8 space-y-8">

                {/* Name */}
                <div>
                    <label className={labelClassName}>
                        Назва категорії <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={handleNameChange}
                        required
                        className={inputClassName}
                        placeholder="Наприклад: Каліфорнія"
                    />
                </div>

                {/* Slug */}
                <div>
                    <label className={labelClassName}>
                        Slug (URL) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                        className={inputClassName}
                        placeholder="california"
                    />
                    <p className="text-xs text-gray-500 mt-2 ml-1">
                        Буде використовуватись в URL: <code className="bg-white/5 px-1 py-0.5 rounded text-gray-400">/menu?category={formData.slug || "slug"}</code>
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label className={labelClassName}>
                        Опис
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className={`${inputClassName} resize-none`}
                        placeholder="Короткий опис категорії для SEO та користувачів..."
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className={labelClassName}>
                        Зображення категорії
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-start">
                        <div className="flex-1">
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-[#1a1a1a] hover:bg-white/5 hover:border-primary-500/50 transition-all group">
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    {isUploading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <CloudArrowUpIcon className="w-10 h-10 mb-3 text-gray-500 group-hover:text-primary-500 transition-colors" />
                                            <p className="text-sm text-gray-400 px-4">
                                                <span className="font-semibold text-primary-500">Натисніть</span> або перетягніть фото
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">PNG, JPG до 5MB</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>

                        {/* Preview */}
                        <div className="relative shrink-0 w-40 h-40 bg-[#1a1a1a] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                            {formData.image_url ? (
                                <>
                                    <Image
                                        src={formData.image_url}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-full transition-colors shadow-lg backdrop-blur-sm z-10"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <span className="text-xs text-gray-600 text-center px-2">Немає фото</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sort Order & Active */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div>
                        <label className={labelClassName}>
                            Порядок сортування
                        </label>
                        <input
                            type="number"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                            className={inputClassName}
                        />
                    </div>

                    <div className="flex items-center justify-start sm:justify-end">
                        {/* Custom Toggle Switch */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Активна</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-12 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-500 transition-colors"></div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/5">
                    <Link
                        href="/admin/categories"
                        className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Скасувати
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-8 py-3 bg-primary-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none`}
                    >
                        {isLoading ? "Збереження..." : "Зберегти зміни"}
                    </button>
                </div>
            </form>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function NewCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    position: 0,
    is_active: true,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9а-яіїєґ\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
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

      setFormData({ ...formData, image_url: response.data.url });
      toast.success("Зображення завантажено!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка завантаження");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.post("/admin/categories", formData);
      toast.success("Категорію створено!");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка створення категорії");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/categories"
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Нова категорія</h1>
          <p className="text-gray-400">Створення нової категорії товарів</p>
        </div>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="bg-surface-card rounded-xl shadow-sm p-6 border border-white/10 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Назва категорії *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            required
            className={inputClassName}
            placeholder="Наприклад: Роли"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Slug (URL) *
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            className={inputClassName}
            placeholder="roly"
          />
          <p className="text-sm text-gray-500 mt-1">
            Буде використовуватися в URL: /menu?category={formData.slug || "slug"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Опис
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={inputClassName}
            placeholder="Опис категорії..."
          />
        </div>

        {/* Зображення */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Зображення категорії
          </label>
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 hover:border-primary-500 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-400">
                        <span className="font-medium text-primary-500">Натисніть для завантаження</span>
                      </p>
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
            {formData.image_url && (
              <div className="relative">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 rounded-lg object-cover border border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Порядок сортування
            </label>
            <input
              type="number"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
              className={inputClassName}
            />
          </div>

          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer mt-6">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">
                Активна
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <Link
            href="/admin/categories"
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            Скасувати
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
          >
            {isLoading ? "Створення..." : "Створити категорію"}
          </button>
        </div>
      </form>
    </div>
  );
}

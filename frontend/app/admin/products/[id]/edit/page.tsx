"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  old_price?: number;
  image_url?: string;
  category_id: number;
  is_available: boolean;
  is_popular: boolean;
  is_new?: boolean;
  is_spicy?: boolean;
  is_vegan?: boolean;
  is_top_seller?: boolean;
  weight?: string;
  ingredients?: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    old_price: 0,
    image_url: "",
    category_id: 0,
    is_available: true,
    is_popular: false,
    is_new: false,
    is_spicy: false,
    is_vegan: false,
    is_top_seller: false,
    weight: "",
    ingredients: "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл занадто великий. Максимум 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Дозволені лише зображення");
      return;
    }

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await apiClient.post("/upload/image/admin?subdirectory=products", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData({ ...formData, image_url: response.data.url });
      toast.success("Зображення завантажено!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.detail || "Помилка завантаження зображення");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [productRes, categoriesRes] = await Promise.all([
        apiClient.get(`/admin/products/${productId}`),
        apiClient.get("/categories"),
      ]);

      const product = productRes.data;
      setCategories(categoriesRes.data || []);

      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price || 0,
        old_price: product.old_price || 0,
        image_url: product.image_url || "",
        category_id: product.category_id || 0,
        is_available: product.is_available ?? true,
        is_popular: product.is_popular ?? false,
        is_new: product.is_new ?? false,
        is_spicy: product.is_spicy ?? false,
        is_vegan: product.is_vegan ?? false,
        is_top_seller: product.is_top_seller ?? false,
        weight: product.weight || "",
        ingredients: product.ingredients || "",
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Помилка завантаження товару");
      router.push("/admin/products");
    } finally {
      setIsFetching(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSend = {
        ...formData,
        old_price: formData.old_price || null,
      };
      await apiClient.put(`/admin/products/${productId}`, dataToSend);
      toast.success("Товар оновлено!");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка оновлення товару");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/products"
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Редагування товару</h1>
          <p className="text-gray-400">Зміна даних товару &quot;{formData.name}&quot;</p>
        </div>
      </div>

      {/* Форма */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-card rounded-xl shadow-sm p-6 border border-white/10 space-y-6"
      >
        {/* Основна інформація */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Назва товару *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
              placeholder="Наприклад: Філадельфія Класік"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slug (URL) *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
              placeholder="filadelfiya-klasik"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Категорія *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) =>
                setFormData({ ...formData, category_id: Number(e.target.value) })
              }
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent [&>option]:bg-surface-card [&>option]:text-white"
            >
              <option value={0} disabled>
                Виберіть категорію
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Опис */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Опис
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
            placeholder="Опис товару..."
          />
        </div>

        {/* Склад */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Інгредієнти
          </label>
          <textarea
            value={formData.ingredients}
            onChange={(e) =>
              setFormData({ ...formData, ingredients: e.target.value })
            }
            rows={2}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
            placeholder="Рис, лосось, сир філадельфія, огірок..."
          />
        </div>

        {/* Ціна та вага */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ціна (грн) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              required
              min={0}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Стара ціна (грн)
            </label>
            <input
              type="number"
              value={formData.old_price || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  old_price: e.target.value ? Number(e.target.value) : 0,
                })
              }
              min={0}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
              placeholder="Для знижки"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Вага
            </label>
            <input
              type="text"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
              placeholder="250 г / 8 шт"
            />
          </div>
        </div>

        {/* Зображення */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Зображення товару
          </label>
          <div className="flex items-start space-x-4">
            {/* Upload area */}
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
                        <span className="font-medium text-primary-500">Натисніть для завантаження</span> або перетягніть файл
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (макс. 5MB)</p>
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
            {formData.image_url && (
              <div className="relative">
                <img
                  src={formData.image_url.startsWith('/') ? formData.image_url : formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 rounded-lg object-cover border border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png';
                  }}
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

        {/* Налаштування */}
        <div className="flex flex-wrap gap-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_available}
              onChange={(e) =>
                setFormData({ ...formData, is_available: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              В наявності
            </span>
          </label>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_popular}
              onChange={(e) =>
                setFormData({ ...formData, is_popular: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-gold"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              ⭐ Популярний товар
            </span>
          </label>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_top_seller}
              onChange={(e) =>
                setFormData({ ...formData, is_top_seller: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-gold"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              🏆 Хіт продажу
            </span>
          </label>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_new}
              onChange={(e) =>
                setFormData({ ...formData, is_new: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              🆕 Новинка
            </span>
          </label>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_spicy}
              onChange={(e) =>
                setFormData({ ...formData, is_spicy: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              🌶️ Гостре
            </span>
          </label>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_vegan}
              onChange={(e) =>
                setFormData({ ...formData, is_vegan: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              🌱 Веганське
            </span>
          </label>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <Link
            href="/admin/products"
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            Скасувати
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
          >
            {isLoading ? "Збереження..." : "Зберегти зміни"}
          </button>
        </div>
      </form>
    </div>
  );
}



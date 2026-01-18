"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { transliterate } from "@/lib/utils";

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
    return transliterate(name)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
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
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 border border-transparent hover:border-white/10"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Редагування товару</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              <span className={`inline-block w-2 h-2 rounded-full ${formData.is_available ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
              {formData.name || "Новий товар"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
          >
            Скасувати
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-8 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Збереження...</span>
              </>
            ) : (
              "Зберегти зміни"
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-primary-500">01.</span> Основна інформація
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                  Назва товару <span className="text-primary-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-5 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 placeholder-gray-600 transition-all font-medium text-lg"
                  placeholder="Наприклад: Філадельфія Класік"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                    Slug (URL) <span className="text-primary-500">*</span>
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-3.5 text-gray-600 font-mono">/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      className="w-full pl-8 pr-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 font-mono text-sm transition-all group-hover:border-white/20"
                      placeholder="filadelfiya-klasik"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                    Категорія <span className="text-primary-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                      required
                      className="w-full px-5 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 appearance-none cursor-pointer hover:border-white/20 transition-all"
                    >
                      <option value={0} disabled>Виберіть категорію</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Опис</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-5 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 placeholder-gray-600 resize-none transition-all"
                  placeholder="Детальний опис товару..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Інгредієнти</label>
                <div className="relative">
                  <div className="absolute top-3 left-4 text-gray-500">🥣</div>
                  <textarea
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    rows={2}
                    className="w-full pl-12 pr-5 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 placeholder-gray-600 resize-none transition-all"
                    placeholder="Рис, лосось, сир філадельфія, огірок..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-primary-500">02.</span> Ціна та розмір
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                  Ціна (грн) <span className="text-primary-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 text-primary-500 font-bold">₴</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    min={0}
                    className="w-full pl-10 pr-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 simple-number-input transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Стара ціна</label>
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-500 font-bold">₴</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.old_price || ""}
                    onChange={(e) => setFormData({ ...formData, old_price: e.target.value ? Number(e.target.value) : 0 })}
                    min={0}
                    className="w-full pl-10 pr-4 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-gray-400 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 simple-number-input transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Вага / Кількість</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-5 py-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  placeholder="250 г / 8 шт"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Статус товару</h3>
            <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5">
              <label className="flex items-center justify-between cursor-pointer w-full group">
                <span className="flex flex-col">
                  <span className="text-white font-medium group-hover:text-primary-400 transition-colors">В наявності</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {formData.is_available ? 'Товар доступний для замовлення' : 'Товар прихований від клієнтів'}
                  </span>
                </span>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-black/50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-500/20 peer-checked:after:bg-primary-500 peer-checked:after:border-primary-500"></div>
                </div>
              </label>
            </div>
            {!formData.is_available && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2 items-start animate-fade-in">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>Увага: Цей товар зараз не відображається в каталозі.</span>
              </div>
            )}
          </div>

          {/* Image Card */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Зображення</h3>
            <div className="space-y-4">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/50 border-2 border-dashed border-white/10 hover:border-primary-500/50 transition-all group">
                {formData.image_url ? (
                  <>
                    <img
                      src={formData.image_url.startsWith('/') ? formData.image_url : formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-contain p-4"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
                      >
                        Видалити
                      </button>
                      <p className="text-xs text-gray-300">Натисніть щоб змінити</p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-6 text-center pointer-events-none">
                    <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm">Завантажте фото</p>
                    <p className="text-xs opacity-60 mt-1">PNG, JPG, WebP до 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attributes Card */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Властивості</h3>
            <div className="space-y-3">
              {[
                { key: 'is_popular', label: '⭐ Популярний', color: 'bg-accent-gold' },
                { key: 'is_top_seller', label: '🏆 Хіт продажу', color: 'bg-accent-gold' },
                { key: 'is_new', label: '🆕 Новинка', color: 'bg-primary-500' },
                { key: 'is_spicy', label: '🌶️ Гостре', color: 'bg-red-500' },
                { key: 'is_vegan', label: '🌱 Веганське', color: 'bg-green-500' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-[#1e1e1e] border border-white/5 hover:border-white/10 cursor-pointer transition-all group">
                  <span className="text-gray-300 group-hover:text-white transition-colors text-sm font-medium">{item.label}</span>
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={(formData as any)[item.key]}
                      onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${item.color}/20 peer-checked:after:${item.color} peer-checked:after:border-white`}></div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}



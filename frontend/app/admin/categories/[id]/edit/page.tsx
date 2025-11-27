"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await apiClient.get(`/categories/${categoryId}`);
      const category = response.data;
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        image_url: category.image_url || "",
        sort_order: category.sort_order || 0,
        is_active: category.is_active ?? true,
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      toast.error("Помилка завантаження категорії");
      router.push("/admin/categories");
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
      await apiClient.put(`/categories/${categoryId}`, formData);
      toast.success("Категорію оновлено!");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка оновлення категорії");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/categories"
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Редагування категорії</h1>
          <p className="text-gray-600">Зміна даних категорії &quot;{formData.name}&quot;</p>
        </div>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Назва категорії *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Наприклад: Роли"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug (URL) *
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="roly"
          />
          <p className="text-sm text-gray-500 mt-1">
            Буде використовуватися в URL: /menu?category={formData.slug || "slug"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Опис
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Опис категорії..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL зображення
          </label>
          <div className="flex space-x-4">
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Preview"
                className="w-16 h-16 rounded-lg object-cover border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Порядок сортування
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) =>
                setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer mt-6">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Активна
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Link
            href="/admin/categories"
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Скасувати
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {isLoading ? "Збереження..." : "Зберегти зміни"}
          </button>
        </div>
      </form>
    </div>
  );
}


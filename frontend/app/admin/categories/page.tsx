"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  position: number;
  is_active: boolean;
  products_count?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        apiClient.get("/admin/categories"),
        apiClient.get("/admin/products?limit=1000"),
      ]);

      const categoriesData = categoriesResponse.data || [];
      const productsData = productsResponse.data || [];

      // Calculate product counts
      const counts: Record<number, number> = {};
      productsData.forEach((product: any) => {
        if (product.category_id) {
          counts[product.category_id] = (counts[product.category_id] || 0) + 1;
        }
      });

      // Merge counts into categories
      const enrichedCategories = categoriesData.map((cat: Category) => ({
        ...cat,
        products_count: counts[cat.id] || 0,
      }));

      setCategories(enrichedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Помилка завантаження категорій");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      toast.success("Категорію видалено");
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Помилка видалення категорії"
      );
    } finally {
      setDeleteModalId(null);
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      await apiClient.put(`/admin/categories/${category.id}`, {
        is_active: !category.is_active,
      });
      setCategories(
        categories.map((c) =>
          c.id === category.id ? { ...c, is_active: !c.is_active } : c
        )
      );
      toast.success(
        category.is_active ? "Категорію деактивовано" : "Категорію активовано"
      );
    } catch (error) {
      toast.error("Помилка оновлення статусу");
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Категорії</h1>
          <p className="text-gray-400">
            Управління категоріями товарів ({categories.length})
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Додати категорію
        </Link>
      </div>

      {/* Пошук */}
      <div className="bg-surface-card rounded-xl shadow-sm p-4 border border-white/10">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук категорій..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
          />
        </div>
      </div>

      {/* Таблиця категорій */}
      <div className="bg-surface-card rounded-xl shadow-sm border border-white/10 overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Категорій не знайдено</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface/5 border-b border-white/10">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Назва</th>
                  <th className="px-6 py-4 font-medium">Slug</th>
                  <th className="px-6 py-4 font-medium">Порядок</th>
                  <th className="px-6 py-4 font-medium">Товарів</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {category.image_url && (
                          <Image
                            src={category.image_url}
                            alt={category.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <span className="font-medium text-white">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{category.slug}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {category.position || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {category.products_count || 0}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(category)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${category.is_active
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                      >
                        {category.is_active ? "Активна" : "Неактивна"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteModalId(category.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальне вікно підтвердження видалення */}
      {deleteModalId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-surface-card border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Видалити категорію?
            </h3>
            <p className="text-gray-400 mb-6">
              Ця дія незворотна. Всі товари цієї категорії залишаться без
              категорії.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalId(null)}
                className="px-4 py-2 text-gray-400 hover:bg-white/5 rounded-lg transition"
              >
                Скасувати
              </button>
              <button
                onClick={() => handleDelete(deleteModalId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



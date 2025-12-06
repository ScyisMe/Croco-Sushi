"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  old_price?: number;
  image_url?: string;
  category_id: number;
  category_name?: string;
  is_available: boolean;
  is_popular: boolean;
  weight?: string;
}

interface Category {
  id: number;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get("/admin/products?limit=1000"),
        apiClient.get("/categories"),
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Помилка завантаження даних");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/products/${id}`);
      toast.success("Товар видалено");
      setProducts(products.filter((p) => p.id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка видалення товару");
    } finally {
      setDeleteModalId(null);
    }
  };

  const toggleAvailable = async (product: Product) => {
    try {
      await apiClient.patch(`/products/${product.id}`, {
        is_available: !product.is_available,
      });
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, is_available: !p.is_available } : p
        )
      );
      toast.success(
        product.is_available ? "Товар приховано" : "Товар активовано"
      );
    } catch (error) {
      toast.error("Помилка оновлення статусу");
    }
  };

  const togglePopular = async (product: Product) => {
    try {
      await apiClient.patch(`/products/${product.id}`, {
        is_popular: !product.is_popular,
      });
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, is_popular: !p.is_popular } : p
        )
      );
      toast.success(
        product.is_popular ? "Знято з популярних" : "Додано до популярних"
      );
    } catch (error) {
      toast.error("Помилка оновлення");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Товари</h1>
          <p className="text-gray-400">
            Управління товарами ({products.length})
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Додати товар
        </Link>
      </div>

      {/* Фільтри */}
      <div className="bg-surface-card rounded-xl shadow-sm p-4 border border-white/5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук товарів..."
              className="w-full pl-10 pr-4 py-2 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory || ""}
              onChange={(e) =>
                setSelectedCategory(e.target.value ? Number(e.target.value) : null)
              }
              className="px-4 py-2 bg-surface border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Всі категорії</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Таблиця товарів */}
      <div className="bg-surface-card rounded-xl shadow-sm border border-white/5 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Товарів не знайдено</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-white/5">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Товар</th>
                  <th className="px-6 py-4 font-medium">Категорія</th>
                  <th className="px-6 py-4 font-medium">Ціна</th>
                  <th className="px-6 py-4 font-medium">Популярний</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Фото</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-white block">
                            {product.name}
                          </span>
                          {product.weight && (
                            <span className="text-sm text-gray-500">
                              {product.weight}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {product.category_name ||
                        categories.find((c) => c.id === product.category_id)?.name ||
                        "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-white">
                          {formatPrice(product.price)}
                        </span>
                        {product.old_price && (
                          <span className="text-sm text-gray-600 line-through ml-2">
                            {formatPrice(product.old_price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePopular(product)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${product.is_popular
                          ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                      >
                        {product.is_popular ? "⭐ Так" : "Ні"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAvailable(product)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${product.is_available
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                      >
                        {product.is_available ? "В наявності" : "Немає"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteModalId(product.id)}
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
          <div className="bg-surface-card rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">
              Видалити товар?
            </h3>
            <p className="text-gray-400 mb-6">
              Ця дія незворотна. Товар буде видалено з каталогу.
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


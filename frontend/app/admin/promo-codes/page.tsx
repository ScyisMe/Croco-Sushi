"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api/apiClient";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TicketIcon,
  CalendarIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Product } from "@/lib/types";

interface PromoCode {
  id: number;
  code: string;
  description?: string;
  discount_type: "percent" | "fixed" | "free_product";
  discount_value: number;
  product_id?: number | null;
  start_date: string;
  end_date: string;
  min_order_amount?: number;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
}

interface PromoCodeStats {
  id: number;
  code: string;
  total_uses: number;
  total_discount: number;
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoCodeStats[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "stats">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percent" as "percent" | "fixed" | "free_product",
    discount_value: 0,
    product_id: 0,
    start_date: "",
    end_date: "",
    min_order_amount: 0,
    max_uses: 0,
    is_active: true
  });

  const fetchPromoCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<PromoCode[]>("/admin/promo-codes");
      setPromoCodes(response.data);
    } catch (error) {
      console.error("Failed to fetch promo codes", error);
      toast.error("Не вдалося завантажити промокоди");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiClient.get<Product[]>("/products", {
        params: { limit: 1000 }
      });
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<PromoCodeStats[]>("/admin/promo-codes/stats/all");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      toast.error("Не вдалося завантажити статистику");
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
    fetchProducts();
  }, [fetchPromoCodes, fetchProducts]);

  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    }
  }, [activeTab, fetchStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error("Код промокоду обов'язковий");
      return;
    }

    if (formData.discount_type !== 'free_product' && formData.discount_value <= 0) {
      toast.error("Знижка має бути більше 0");
      return;
    }

    if (formData.discount_type === 'free_product' && !formData.product_id) {
      toast.error("Оберіть товар для подарунку");
      return;
    }

    if (formData.discount_type === "percent" && formData.discount_value > 100) {
      toast.error("Відсоток знижки не може перевищувати 100%");
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error("Вкажіть дати дії промокоду");
      return;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error("Дата початку має бути раніше дати закінчення");
      return;
    }
    if (formData.min_order_amount < 0) {
      toast.error("Мінімальне замовлення не може бути від'ємним");
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        min_order_amount: formData.min_order_amount > 0 ? formData.min_order_amount : null,
        max_uses: formData.max_uses > 0 ? formData.max_uses : null,
        product_id: formData.discount_type === 'free_product' && formData.product_id ? formData.product_id : null,
        discount_value: formData.discount_type === 'free_product' ? 0 : formData.discount_value
      };

      if (editingPromo) {
        await apiClient.put(`/admin/promo-codes/${editingPromo.id}`, dataToSend);
        toast.success("Промокод оновлено");
      } else {
        await apiClient.post("/admin/promo-codes", dataToSend);
        toast.success("Промокод створено");
      }
      setIsModalOpen(false);
      fetchPromoCodes();
    } catch (error: any) {
      console.error("Failed to save promo code", error);
      toast.error(error.response?.data?.detail || "Помилка при збереженні");
    }
  };

  const openModal = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        description: promo.description || "",
        discount_type: promo.discount_type as any,
        discount_value: promo.discount_value,
        product_id: promo.product_id || 0,
        start_date: promo.start_date.slice(0, 16),
        end_date: promo.end_date.slice(0, 16),
        min_order_amount: promo.min_order_amount || 0,
        max_uses: promo.max_uses || 0,
        is_active: promo.is_active
      });
    } else {
      setEditingPromo(null);
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      setFormData({
        code: "",
        description: "",
        discount_type: "percent",
        discount_value: 10,
        product_id: 0,
        start_date: now.toISOString().slice(0, 16),
        end_date: nextMonth.toISOString().slice(0, 16),
        min_order_amount: 0,
        max_uses: 0,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const generateOneTimeCode = () => {
    const prefix = "REVIEW-";
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({
      ...prev,
      code: prefix + random,
      max_uses: 1,
      discount_type: "free_product",
      discount_value: 0,
      product_id: 0,
      description: "Одноразовий код за відгук"
    }));
    toast.success("Код згенеровано! Оберіть подарунковий товар.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Промокоди</h1>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Створити промокод</span>
        </button>
      </div>

      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "list"
            ? "bg-primary text-white shadow-lg"
            : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          <div className="flex items-center gap-2">
            <TicketIcon className="w-4 h-4" />
            Список
          </div>
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "stats"
            ? "bg-primary text-white shadow-lg"
            : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Статистика
          </div>
        </button>
      </div>

      {activeTab === "list" && (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Код</th>
                  <th className="px-6 py-4">Знижка</th>
                  <th className="px-6 py-4">Використання</th>
                  <th className="px-6 py-4">Період</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Немає створених промокодів
                    </td>
                  </tr>
                ) : (
                  promoCodes.map(promo => (
                    <tr key={promo.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium text-white">
                        {promo.code}
                        {promo.description && (
                          <div className="text-xs text-gray-500 font-normal truncate max-w-[200px]">
                            {promo.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${promo.discount_type === 'free_product'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                          {promo.discount_type === 'free_product'
                            ? 'Подарунок'
                            : `${promo.discount_value} ${promo.discount_type === 'percent' ? '%' : '₴'}`
                          }
                        </span>
                        {promo.min_order_amount && (
                          <div className="text-xs text-gray-500 mt-1">
                            від {promo.min_order_amount} ₴
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-white">{promo.current_uses}</span>
                          <span className="text-gray-600">/</span>
                          <span className={promo.max_uses ? "text-gray-400" : "text-xl leading-3 text-gray-600"}>
                            {promo.max_uses || "∞"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-gray-300">
                            {new Date(promo.start_date).toLocaleDateString()}
                          </span>
                          <span className="text-gray-600">
                            {new Date(promo.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${promo.is_active
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}>
                          {promo.is_active ? "Активний" : "Неактивний"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openModal(promo)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden p-6">
          <h2 className="text-lg font-bold text-white mb-4">Статистика використання</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Код</th>
                  <th className="px-6 py-4">Всього використань</th>
                  <th className="px-6 py-4">Загальна знижка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      Немає даних статистики
                    </td>
                  </tr>
                ) : (
                  stats.map(stat => (
                    <tr key={stat.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium text-white">{stat.code}</td>
                      <td className="px-6 py-4 text-white">{stat.total_uses}</td>
                      <td className="px-6 py-4 text-green-400 font-medium">
                        {stat.total_discount.toFixed(2)} ₴
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl max-w-lg w-full p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingPromo ? "Редагувати промокод" : "Новий промокод"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">Код</label>
                  <button
                    type="button"
                    onClick={generateOneTimeCode}
                    className="text-xs text-primary hover:text-primary-400 hover:underline"
                  >
                    Згенерувати одноразовий
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500 uppercase font-bold tracking-wider"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="CROCOSUSHI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Опис</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Активуйте промокод..."
                />
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Тип знижки</label>
                  <select
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white appearance-none"
                    value={formData.discount_type}
                    onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                  >
                    <option value="percent">Відсоток (%)</option>
                    <option value="fixed">Фіксована сума (₴)</option>
                    <option value="free_product">Безкоштовний товар</option>
                  </select>
                </div>

                {formData.discount_type === 'free_product' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Оберіть товар</label>
                    <select
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white appearance-none"
                      value={formData.product_id || 0}
                      onChange={e => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
                      required
                    >
                      <option value={0} disabled>Оберіть зі списку...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Значення</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white"
                      value={formData.discount_value}
                      onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Початок дії</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white [color-scheme:dark]"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Кінець дії</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white [color-scheme:dark]"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Мін. замовлення (₴)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white"
                    value={formData.min_order_amount}
                    onChange={e => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ліміт використань</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                    value={formData.max_uses}
                    onChange={e => setFormData({ ...formData, max_uses: parseInt(e.target.value) || 0 })}
                    placeholder="∞"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-[#1a1a1a] p-4 rounded-lg border border-white/5">
                <input
                  type="checkbox"
                  id="is_active_promo"
                  className="w-5 h-5 rounded border-white/20 text-primary focus:ring-primary bg-black/40 checked:bg-primary"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active_promo" className="text-base font-medium text-white cursor-pointer select-none">
                  Активний промокод
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-6 mt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition font-medium"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-medium shadow-lg shadow-primary/20"
                >
                  Зберегти
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

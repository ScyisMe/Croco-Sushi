"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TicketIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface PromoCode {
  id: number;
  code: string;
  description?: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
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
  const [activeTab, setActiveTab] = useState<"list" | "stats">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percent",
    discount_value: 0,
    start_date: "",
    end_date: "",
    min_order_amount: 0,
    max_uses: 0,
    is_active: true
  });

  const fetchPromoCodes = async () => {
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
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<PromoCodeStats[]>("/admin/promo-codes/stats/all");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      toast.error("Не вдалося завантажити статистику");
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Format dates to ISO if needed, or ensure input type="datetime-local" matches backend expectation
      const dataToSend = {
        ...formData,
        min_order_amount: formData.min_order_amount || null,
        max_uses: formData.max_uses || null
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

  const handleDelete = async (id: number) => {
    if (!confirm("Ви впевнені, що хочете видалити цей промокод?")) return;
    try {
      await apiClient.delete(`/admin/promo-codes/${id}`);
      toast.success("Промокод видалено");
      setPromoCodes(promoCodes.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete promo code", error);
      toast.error("Помилка при видаленні");
    }
  };

  const openModal = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        description: promo.description || "",
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        start_date: promo.start_date.slice(0, 16), // Format for datetime-local
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
        start_date: now.toISOString().slice(0, 16),
        end_date: nextMonth.toISOString().slice(0, 16),
        min_order_amount: 0,
        max_uses: 0,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Промокоди</h1>
          <p className="text-gray-400">Управління знижками та акціями</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Створити промокод
        </button>
      </div>

      <div className="flex border-b border-white/10 mb-6">
        <button
          className={`py-4 px-6 font-medium text-sm border-b-2 transition ${activeTab === "list"
            ? "border-primary text-primary"
            : "border-transparent text-gray-400 hover:text-white"
            }`}
          onClick={() => setActiveTab("list")}
        >
          Управління
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm border-b-2 transition ${activeTab === "stats"
            ? "border-primary text-primary"
            : "border-transparent text-gray-400 hover:text-white"
            }`}
          onClick={() => setActiveTab("stats")}
        >
          Статистика
        </button>
      </div>

      <div className="bg-theme-surface rounded-xl shadow-sm border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "list" ? (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Код</th>
                  <th className="px-6 py-4 font-medium">Знижка</th>
                  <th className="px-6 py-4 font-medium">Період дії</th>
                  <th className="px-6 py-4 font-medium">Використання</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Завантаження...</td>
                  </tr>
                ) : promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Промокодів не знайдено</td>
                  </tr>
                ) : (
                  promoCodes.map((promo) => (
                    <tr key={promo.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <TicketIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">{promo.code}</span>
                            <span className="text-xs text-gray-500">{promo.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {promo.discount_value} {promo.discount_type === 'percent' ? '%' : '₴'}
                        </span>
                        {promo.min_order_amount && (
                          <div className="text-xs text-gray-500 mt-1">
                            від {promo.min_order_amount} ₴
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4 text-gray-500" />
                          <span>{formatDate(promo.end_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {promo.current_uses} / {promo.max_uses || "∞"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${promo.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                          {promo.is_active ? 'Активний' : 'Неактивний'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openModal(promo)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Код</th>
                  <th className="px-6 py-4 font-medium">Всього використань</th>
                  <th className="px-6 py-4 font-medium">Загальна сума знижок</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Статистики поки немає</td>
                  </tr>
                ) : (
                  stats.map((stat) => (
                    <tr key={stat.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium text-white">{stat.code}</td>
                      <td className="px-6 py-4 text-gray-300">{stat.total_uses}</td>
                      <td className="px-6 py-4 font-medium text-primary">{stat.total_discount} ₴</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface border border-white/10 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-white">{editingPromo ? "Редагувати промокод" : "Новий промокод"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Код</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500 uppercase"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Опис</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Тип знижки</label>
                  <select
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white"
                    value={formData.discount_type}
                    onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                  >
                    <option value="percent" className="bg-theme-surface">Відсоток (%)</option>
                    <option value="fixed" className="bg-theme-surface">Сума (₴)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Значення</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white"
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Початок дії</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white [color-scheme:dark]"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Кінець дії</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white [color-scheme:dark]"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Мін. замовлення (₴)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white"
                    value={formData.min_order_amount}
                    onChange={e => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ліміт використань</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                    value={formData.max_uses}
                    onChange={e => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                    placeholder="∞"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active_promo"
                  className="rounded bg-white/5 border-white/10 text-primary focus:ring-primary"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active_promo" className="text-sm font-medium text-gray-300">Активний промокод</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
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

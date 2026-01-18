"use client";

import { useState, useEffect } from "react";
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
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 0,
    start_date: "",
    end_date: "",
    min_order_amount: 0,
    max_uses: 0, // 0 means infinite in UI logic for empty input, but backend might treat null. We will handle this.
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

    // STRICT VALIDATION
    if (!formData.code.trim()) {
      toast.error("Код промокоду обов'язковий");
      return;
    }
    if (formData.discount_value <= 0) {
      toast.error("Знижка має бути більше 0");
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
        max_uses: formData.max_uses > 0 ? formData.max_uses : null
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
    } catch (error: any) {
      console.error("Failed to delete promo code", error);
      toast.error(error.response?.data?.detail || "Помилка при видаленні");
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

      <div className="bg-surface-card rounded-xl shadow-sm border border-white/5 overflow-hidden">
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
                            onClick={() => promo.current_uses === 0 && handleDelete(promo.id)}
                            disabled={promo.current_uses > 0}
                            title={promo.current_uses > 0 ? "Неможливо видалити використаний промокод" : "Видалити"}
                            className={`p-2 rounded-lg transition ${promo.current_uses > 0
                              ? "text-gray-600 cursor-not-allowed"
                              : "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                              }`}
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

      {/* Modal - Improved Design & Validation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl max-w-lg w-full p-8 relative shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-white font-display">
              {editingPromo ? "Редагувати промокод" : "Новий промокод"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Код</label>
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
                  placeholder="Активуйте промокод та сміливо замовляйте..."
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Тип знижки</label>
                  <select
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg focus:ring-2 focus:ring-primary text-white appearance-none"
                    value={formData.discount_type}
                    onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                  >
                    <option value="percent">Відсоток (%)</option>
                    <option value="fixed">Фіксована сума (₴)</option>
                  </select>
                </div>
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


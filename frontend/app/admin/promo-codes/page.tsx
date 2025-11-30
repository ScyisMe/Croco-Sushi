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

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
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

  useEffect(() => {
    fetchPromoCodes();
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-900">Промокоди</h1>
          <p className="text-gray-500">Управління знижками та акціями</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Створити промокод
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-6 py-4 font-medium">Код</th>
                <th className="px-6 py-4 font-medium">Знижка</th>
                <th className="px-6 py-4 font-medium">Період дії</th>
                <th className="px-6 py-4 font-medium">Використання</th>
                <th className="px-6 py-4 font-medium">Статус</th>
                <th className="px-6 py-4 font-medium text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Завантаження...</td>
                </tr>
              ) : promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Промокодів не знайдено</td>
                </tr>
              ) : (
                promoCodes.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                          <TicketIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">{promo.code}</span>
                          <span className="text-xs text-gray-500">{promo.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {promo.discount_value} {promo.discount_type === 'percent' ? '%' : '₴'}
                      </span>
                      {promo.min_order_amount && (
                        <div className="text-xs text-gray-500 mt-1">
                          від {promo.min_order_amount} ₴
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(promo.end_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {promo.current_uses} / {promo.max_uses || "∞"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px - 2 py - 1 rounded - full text - xs font - medium \${ promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }`}>
                        {promo.is_active ? 'Активний' : 'Неактивний'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openModal(promo)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingPromo ? "Редагувати промокод" : "Новий промокод"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Код</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 uppercase"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип знижки</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.discount_type}
                    onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                  >
                    <option value="percent">Відсоток (%)</option>
                    <option value="fixed">Сума (₴)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Значення</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Початок дії</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Кінець дії</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Мін. замовлення (₴)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.min_order_amount}
                    onChange={e => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ліміт використань</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
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
                  className="rounded text-green-600 focus:ring-green-500"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active_promo" className="text-sm font-medium text-gray-700">Активний промокод</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
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

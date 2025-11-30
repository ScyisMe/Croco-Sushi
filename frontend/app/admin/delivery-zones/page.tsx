"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface DeliveryZone {
  id: number;
  name: string;
  description?: string;
  delivery_cost: number;
  min_order_amount: number;
  free_delivery_threshold?: number;
  delivery_time_minutes?: number;
  is_active: boolean;
}

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    delivery_cost: 0,
    min_order_amount: 0,
    free_delivery_threshold: 0,
    delivery_time_minutes: 60,
    is_active: true
  });

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<DeliveryZone[]>("/admin/delivery-zones");
      setZones(response.data);
    } catch (error) {
      console.error("Failed to fetch zones", error);
      toast.error("Не вдалося завантажити зони доставки");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingZone) {
        await apiClient.put(`/admin/delivery-zones/${editingZone.id}`, formData);
        toast.success("Зону оновлено");
      } else {
        await apiClient.post("/admin/delivery-zones", formData);
        toast.success("Зону створено");
      }
      setIsModalOpen(false);
      fetchZones();
    } catch (error) {
      console.error("Failed to save zone", error);
      toast.error("Помилка при збереженні");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ви впевнені, що хочете видалити цю зону?")) return;
    try {
      await apiClient.delete(`/admin/delivery-zones/${id}`);
      toast.success("Зону видалено");
      setZones(zones.filter(z => z.id !== id));
    } catch (error) {
      console.error("Failed to delete zone", error);
      toast.error("Помилка при видаленні");
    }
  };

  const openModal = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        description: zone.description || "",
        delivery_cost: zone.delivery_cost,
        min_order_amount: zone.min_order_amount,
        free_delivery_threshold: zone.free_delivery_threshold || 0,
        delivery_time_minutes: zone.delivery_time_minutes || 60,
        is_active: zone.is_active
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: "",
        description: "",
        delivery_cost: 0,
        min_order_amount: 0,
        free_delivery_threshold: 0,
        delivery_time_minutes: 60,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Зони доставки</h1>
          <p className="text-gray-500">Управління зонами та вартістю доставки</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Додати зону
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <div key={zone.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <MapIcon className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
              </div>
              <div className={`px - 2 py - 1 rounded - full text - xs font - medium \${ zone.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }`}>
                {zone.is_active ? 'Активна' : 'Неактивна'}
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 h-10 line-clamp-2">{zone.description || "Без опису"}</p>

            <div className="space-y-2 text-sm text-gray-700 mb-6">
              <div className="flex justify-between">
                <span>Вартість доставки:</span>
                <span className="font-medium">{zone.delivery_cost} ₴</span>
              </div>
              <div className="flex justify-between">
                <span>Мін. замовлення:</span>
                <span className="font-medium">{zone.min_order_amount} ₴</span>
              </div>
              <div className="flex justify-between">
                <span>Безкоштовно від:</span>
                <span className="font-medium">{zone.free_delivery_threshold || "-"} ₴</span>
              </div>
              <div className="flex justify-between">
                <span>Час доставки:</span>
                <span className="font-medium">~{zone.delivery_time_minutes} хв</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => openModal(zone)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(zone.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingZone ? "Редагувати зону" : "Нова зона доставки"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Назва</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Вартість (₴)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.delivery_cost}
                    onChange={e => setFormData({ ...formData, delivery_cost: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Мін. замовлення (₴)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.min_order_amount}
                    onChange={e => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Безкоштовно від (₴)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.free_delivery_threshold}
                    onChange={e => setFormData({ ...formData, free_delivery_threshold: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Час (хв)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={formData.delivery_time_minutes}
                    onChange={e => setFormData({ ...formData, delivery_time_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="rounded text-green-600 focus:ring-green-500"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Активна зона</label>
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

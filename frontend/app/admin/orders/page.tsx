"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address?: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  items?: OrderItem[];
  comment?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Очікує", color: "bg-yellow-900/30 text-yellow-500 border border-yellow-700/50" },
  confirmed: { label: "Підтверджено", color: "bg-blue-900/30 text-blue-500 border border-blue-700/50" },
  preparing: { label: "Готується", color: "bg-orange-900/30 text-orange-500 border border-orange-700/50" },
  ready: { label: "Готово", color: "bg-green-900/30 text-green-500 border border-green-700/50" },
  delivering: { label: "Доставляється", color: "bg-purple-900/30 text-purple-500 border border-purple-700/50" },
  completed: { label: "Виконано", color: "bg-gray-800 text-gray-400 border border-gray-700" },
  cancelled: { label: "Скасовано", color: "bg-red-900/30 text-red-500 border border-red-700/50" },
};

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || ""
  );
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let url = "/admin/orders?limit=50";
      if (selectedStatus) {
        url += `&status_filter=${selectedStatus}`;
      }
      const response = await apiClient.get(url);
      setOrders(response.data.orders || response.data || []);
      setTotal(response.data.total || response.data?.length || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Помилка завантаження замовлень");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      // Використовуємо новий ендпоінт PATCH
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
      toast.success(`Статус змінено на "${STATUS_CONFIG[newStatus]?.label}"`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка зміни статусу");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(searchQuery)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-white">Замовлення</h1>
        <p className="text-gray-400">
          Управління замовленнями ({total})
        </p>
      </div>

      {/* Фільтри */}
      <div className="bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Пошук */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за номером, ім'ям, телефоном..."
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-600"
            />
          </div>

          {/* Фільтр за статусом */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Всі статуси</option>
              {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Статуси-таби */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedStatus === ""
            ? "bg-green-600 text-white"
            : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
            }`}
        >
          Всі ({total})
        </button>
        {Object.entries(STATUS_CONFIG).map(([status, { label, color }]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${selectedStatus === status
              ? "bg-green-600 text-white border-green-600"
              : `${color} hover:opacity-80`
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Список замовлень */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Замовлень не знайдено</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">№ Замовлення</th>
                  <th className="px-6 py-4 font-medium">Клієнт</th>
                  <th className="px-6 py-4 font-medium">Сума</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium">Оплата</th>
                  <th className="px-6 py-4 font-medium">Дата</th>
                  <th className="px-6 py-4 font-medium text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-green-500 hover:text-green-400 font-medium font-mono"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-200">
                          {order.customer_name || "—"}
                        </p>
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="text-sm text-gray-500 hover:text-green-500 flex items-center transition-colors"
                        >
                          <PhoneIcon className="w-3 h-3 mr-1" />
                          {order.customer_phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-200">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer bg-transparent focus:ring-0 focus:outline-none ${STATUS_CONFIG[order.status]?.color ||
                          "text-gray-400"
                          }`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                          <option key={value} value={value} className="bg-gray-800 text-white">
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {order.payment_method === "cash"
                        ? "💵 Готівка"
                        : order.payment_method === "card"
                          ? "💳 Карткою"
                          : order.payment_method}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition"
                          title="Переглянути"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

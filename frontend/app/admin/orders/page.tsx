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
  pending: { label: "Очікує", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Підтверджено", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Готується", color: "bg-orange-100 text-orange-800" },
  ready: { label: "Готово", color: "bg-green-100 text-green-800" },
  delivering: { label: "Доставляється", color: "bg-purple-100 text-purple-800" },
  completed: { label: "Виконано", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Скасовано", color: "bg-red-100 text-red-800" },
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Замовлення</h1>
        <p className="text-gray-600">
          Управління замовленнями ({total})
        </p>
      </div>

      {/* Фільтри */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Пошук */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за номером, ім'ям, телефоном..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Фільтр за статусом */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            : "bg-white text-gray-600 hover:bg-gray-50 border"
            }`}
        >
          Всі ({total})
        </button>
        {Object.entries(STATUS_CONFIG).map(([status, { label, color }]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedStatus === status
              ? "bg-green-600 text-white"
              : `${color} hover:opacity-80`
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Список замовлень */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Замовлень не знайдено</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-4 font-medium">№ Замовлення</th>
                  <th className="px-6 py-4 font-medium">Клієнт</th>
                  <th className="px-6 py-4 font-medium">Сума</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium">Оплата</th>
                  <th className="px-6 py-4 font-medium">Дата</th>
                  <th className="px-6 py-4 font-medium text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {order.customer_name || "—"}
                        </p>
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="text-sm text-gray-500 hover:text-green-600 flex items-center"
                        >
                          <PhoneIcon className="w-3 h-3 mr-1" />
                          {order.customer_phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_CONFIG[order.status]?.color ||
                          "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
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
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
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


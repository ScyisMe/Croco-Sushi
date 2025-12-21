"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PhoneIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

import { useOrderStatus } from "@/hooks/useOrderStatus";
import { StatusChangeModal } from "@/components/admin/orders/StatusChangeModal";
import { OrderDetailsModal } from "@/components/admin/orders/OrderDetailsModal";

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
  delivery_type: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  items?: OrderItem[];
  comment?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Очікує", color: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" },
  confirmed: { label: "Підтверджено", color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
  preparing: { label: "Готується", color: "bg-orange-500/10 text-orange-500 border border-orange-500/20" },
  ready: { label: "Готово", color: "bg-green-500/10 text-green-500 border border-green-500/20" },
  delivering: { label: "Доставляється", color: "bg-purple-500/10 text-purple-500 border border-purple-500/20" },
  completed: { label: "Виконано", color: "bg-white/5 text-gray-400 border border-white/10" },
  cancelled: { label: "Скасовано", color: "bg-red-500/10 text-red-500 border border-red-500/20" },
};

const PAYMENT_CONFIG: Record<string, { label: string; icon: string }> = {
  cash: { label: "Готівка", icon: "💵" },
  card: { label: "Карткою", icon: "💳" },
  card_courier: { label: "Карткою кур'єру", icon: "💳" },
  card_online: { label: "Онлайн", icon: "🌐" },
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

  // Quick View Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Status Logic Hook
  const {
    changeStatus,
    confirmCancel,
    cancelModalOpen,
    closeCancelModal,
    isLoading: isStatusLoading
  } = useOrderStatus({
    onStatusChanged: (orderId, newStatus) => {
      // Optimistic Update in List
      setOrders(current =>
        current.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      // Also update detailed order if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      toast.success(`Статус змінено на "${STATUS_CONFIG[newStatus]?.label}"`);
    }
  });


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

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
      <div className="bg-surface-card rounded-xl shadow-sm p-4 border border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Пошук */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за номером, ім'ям, телефоном..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
            />
          </div>

          {/* Фільтр за статусом */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent [&>option]:bg-surface-card"
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
            ? "bg-primary-500 text-white"
            : "bg-surface-card text-gray-400 hover:bg-white/5 border border-white/10"
            }`}
        >
          Всі ({total})
        </button>
        {Object.entries(STATUS_CONFIG).map(([status, { label, color }]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${selectedStatus === status
              ? "bg-primary-500 text-white border-primary-500"
              : `${color} hover:opacity-80`
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Список замовлень */}
      <div className="bg-surface-card rounded-xl shadow-sm border border-white/10 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Замовлень не знайдено</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
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
              <tbody className="divide-y divide-white/10">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(order)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-primary-500 font-medium font-mono">
                        #{order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-200">
                          {order.customer_name || "—"}
                        </p>
                        <a
                          href={`tel:${order.customer_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-gray-500 hover:text-primary-500 flex items-center transition-colors w-fit"
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
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => changeStatus(order, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer bg-transparent focus:ring-0 focus:outline-none ${STATUS_CONFIG[order.status]?.color ||
                            "text-gray-400"
                            }`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                            <option key={value} value={value} className="bg-surface-card text-white">
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      <span className="flex items-center gap-2">
                        <span>{PAYMENT_CONFIG[order.payment_method]?.icon || "❓"}</span>
                        <span>{PAYMENT_CONFIG[order.payment_method]?.label || order.payment_method}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/admin/orders/${order.id}/receipt`, '_blank');
                          }}
                          className="p-2 text-gray-400 hover:text-primary-500 hover:bg-white/5 rounded-lg transition"
                          title="Друк"
                        >
                          <PrinterIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(order);
                          }}
                          className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition"
                          title="Швидкий перегляд"
                        >
                          <EyeIcon className="w-5 h-5" />
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

      {/* Modals */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={selectedOrder}
        statusConfig={STATUS_CONFIG}
        onStatusChange={changeStatus}
      />

      <StatusChangeModal
        isOpen={cancelModalOpen}
        onClose={closeCancelModal}
        onConfirm={confirmCancel}
        status="cancelled"
        isLoading={isStatusLoading}
      />

    </div>
  );
}


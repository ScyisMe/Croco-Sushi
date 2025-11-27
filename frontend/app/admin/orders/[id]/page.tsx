"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
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
  updated_at?: string;
  items: OrderItem[];
  comment?: string;
  cutlery_count?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Очікує підтвердження", color: "text-yellow-600", bg: "bg-yellow-50" },
  confirmed: { label: "Підтверджено", color: "text-blue-600", bg: "bg-blue-50" },
  preparing: { label: "Готується", color: "text-orange-600", bg: "bg-orange-50" },
  ready: { label: "Готово до видачі", color: "text-green-600", bg: "bg-green-50" },
  delivering: { label: "Доставляється", color: "text-purple-600", bg: "bg-purple-50" },
  completed: { label: "Виконано", color: "text-gray-600", bg: "bg-gray-50" },
  cancelled: { label: "Скасовано", color: "text-red-600", bg: "bg-red-50" },
};

const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "delivering", "completed"];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Помилка завантаження замовлення");
      router.push("/admin/orders");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      await apiClient.patch(`/orders/${order.id}/status`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      toast.success(`Статус змінено на "${STATUS_CONFIG[newStatus]?.label}"`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка зміни статусу");
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    try {
      await apiClient.patch(`/orders/${order.id}/status`, { status: "cancelled" });
      setOrder({ ...order, status: "cancelled" });
      setShowCancelModal(false);
      toast.success("Замовлення скасовано");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка скасування");
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Замовлення не знайдено</p>
        <Link href="/admin/orders" className="text-green-600 hover:text-green-700 mt-4 inline-block">
          ← Повернутися до списку
        </Link>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.status);
  const statusConfig = STATUS_CONFIG[order.status];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/orders"
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Замовлення #{order.order_number}
            </h1>
            <p className="text-gray-500 flex items-center mt-1">
              <ClockIcon className="w-4 h-4 mr-1" />
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
            title="Друк"
          >
            <PrinterIcon className="w-5 h-5" />
          </button>
          {order.status !== "cancelled" && order.status !== "completed" && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center"
            >
              <XCircleIcon className="w-5 h-5 mr-1" />
              Скасувати
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => updateStatus(nextStatus)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
            >
              <CheckCircleIcon className="w-5 h-5 mr-1" />
              {STATUS_CONFIG[nextStatus]?.label}
            </button>
          )}
        </div>
      </div>

      {/* Статус */}
      <div className={`p-4 rounded-xl ${statusConfig?.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Поточний статус</p>
            <p className={`text-lg font-semibold ${statusConfig?.color}`}>
              {statusConfig?.label}
            </p>
          </div>
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Прогрес статусу */}
        <div className="mt-4 flex items-center space-x-2">
          {STATUS_FLOW.map((status, index) => {
            const isActive = STATUS_FLOW.indexOf(order.status) >= index;
            const isCurrent = order.status === status;
            return (
              <div key={status} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  } ${isCurrent ? "ring-2 ring-green-400 ring-offset-2" : ""}`}
                >
                  {index + 1}
                </div>
                {index < STATUS_FLOW.length - 1 && (
                  <div
                    className={`w-8 h-1 ${
                      STATUS_FLOW.indexOf(order.status) > index
                        ? "bg-green-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Інформація про клієнта */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Інформація про клієнта
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Ім&apos;я</p>
              <p className="font-medium text-gray-800">{order.customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Телефон</p>
              <a
                href={`tel:${order.customer_phone}`}
                className="font-medium text-green-600 hover:text-green-700 flex items-center"
              >
                <PhoneIcon className="w-4 h-4 mr-1" />
                {order.customer_phone}
              </a>
            </div>
            {order.customer_email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a
                  href={`mailto:${order.customer_email}`}
                  className="font-medium text-gray-800 flex items-center hover:text-green-600"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-1" />
                  {order.customer_email}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Доставка */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Доставка
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Тип доставки</p>
              <p className="font-medium text-gray-800">
                {order.delivery_type === "delivery" ? "🚗 Доставка" : "🏪 Самовивіз"}
              </p>
            </div>
            {order.delivery_address && (
              <div>
                <p className="text-sm text-gray-500">Адреса</p>
                <p className="font-medium text-gray-800 flex items-start">
                  <MapPinIcon className="w-4 h-4 mr-1 mt-1 flex-shrink-0" />
                  {order.delivery_address}
                </p>
              </div>
            )}
            {order.comment && (
              <div>
                <p className="text-sm text-gray-500">Коментар</p>
                <p className="font-medium text-gray-800">{order.comment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Оплата */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Оплата
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Спосіб оплати</p>
              <p className="font-medium text-gray-800">
                {order.payment_method === "cash"
                  ? "💵 Готівка при отриманні"
                  : order.payment_method === "card"
                  ? "💳 Карткою при отриманні"
                  : order.payment_method}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Сума замовлення</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(order.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Товари */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Товари замовлення
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Товар</th>
                <th className="pb-3 font-medium text-center">Кількість</th>
                <th className="pb-3 font-medium text-right">Ціна</th>
                <th className="pb-3 font-medium text-right">Сума</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <span className="font-medium text-gray-800">
                        {item.product_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center text-gray-600">
                    {item.quantity} шт.
                  </td>
                  <td className="py-4 text-right text-gray-600">
                    {formatPrice(item.price)}
                  </td>
                  <td className="py-4 text-right font-medium text-gray-800">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200">
              <tr>
                <td colSpan={3} className="pt-4 text-right font-semibold text-gray-800">
                  Всього:
                </td>
                <td className="pt-4 text-right text-xl font-bold text-green-600">
                  {formatPrice(order.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Модальне вікно підтвердження скасування */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Скасувати замовлення?
            </h3>
            <p className="text-gray-600 mb-6">
              Ви впевнені, що хочете скасувати замовлення #{order.order_number}? 
              Ця дія повідомить клієнта про скасування.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Ні, залишити
              </button>
              <button
                onClick={cancelOrder}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Так, скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


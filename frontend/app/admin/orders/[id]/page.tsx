"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import { uk } from "date-fns/locale";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  TruckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import { StatusChangeModal } from "@/components/admin/orders/StatusChangeModal";
import { OrderHistoryTimeline } from "@/components/admin/orders/OrderHistoryTimeline";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  size_name?: string;
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
  delivery_cost?: number;
  discount?: number;
  promo_code_name?: string;
  status: string;
  payment_method: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
  comment?: string;
  internal_comment?: string;
  cutlery_count?: number;
  history?: {
    manager_name: string;
    previous_status: string;
    new_status: string;
    changed_at: string;
    comment?: string;
    reason?: string;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Очікує підтвердження", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  confirmed: { label: "Підтверджено", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  preparing: { label: "Готується", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  ready: { label: "Готово до видачі", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  delivering: { label: "Доставляється", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  completed: { label: "Виконано", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" },
  cancelled: { label: "Скасовано", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
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
      const response = await apiClient.get(`/admin/orders/${orderId}`);
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
      await apiClient.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      toast.success(`Статус змінено на "${STATUS_CONFIG[newStatus]?.label}"`);
      fetchOrder(); // Refresh for history
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка зміни статусу");
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!order) return;

    try {
      await apiClient.patch(`/admin/orders/${order.id}/status`, {
        status: "cancelled",
        reason: reason
      });
      setOrder({ ...order, status: "cancelled" });
      setShowCancelModal(false);
      toast.success("Замовлення скасовано");
      fetchOrder(); // Refresh to show in history
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка скасування");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price) + " ₴";
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

  const calculateSubtotal = () => {
    if (!order?.items) return 0;
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Замовлення не знайдено</p>
        <Link href="/admin/orders" className="text-primary-500 hover:text-primary-400 mt-4 inline-block">
          ← Повернутися до списку
        </Link>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.status);
  const statusConfig = STATUS_CONFIG[order.status];
  const subtotal = calculateSubtotal();
  const deliveryCost = order.delivery_cost || 0;
  const discount = order.discount || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/orders"
            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-white/5 rounded-lg transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Замовлення #{order.order_number}
            </h1>
            <p className="text-gray-400 flex items-center mt-1">
              <ClockIcon className="w-4 h-4 mr-1" />
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.open(`/admin/orders/${order.id}/receipt`, '_blank')}
            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-white/5 rounded-lg transition"
            title="Друк"
          >
            <PrinterIcon className="w-5 h-5" />
          </button>
          {order.status !== "cancelled" && order.status !== "completed" && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center border border-red-500/20"
            >
              <XCircleIcon className="w-5 h-5 mr-1" />
              Скасувати
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => updateStatus(nextStatus)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition flex items-center"
            >
              <CheckCircleIcon className="w-5 h-5 mr-1" />
              {STATUS_CONFIG[nextStatus]?.label}
            </button>
          )}
        </div>
      </div>

      {/* Статус */}
      <div className={`p-4 rounded-xl border ${statusConfig?.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Поточний статус</p>
            <p className={`text-lg font-semibold ${statusConfig?.color}`}>
              {statusConfig?.label}
            </p>
          </div>
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-800 text-white"
          >
            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Прогрес статусу */}
        <div className="mt-4 flex items-center space-x-2 overflow-x-auto pb-2">
          {STATUS_FLOW.map((status, index) => {
            const isActive = STATUS_FLOW.indexOf(order.status) >= index;
            const isCurrent = order.status === status;
            return (
              <div key={status} className="flex items-center min-w-max">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive
                    ? "bg-primary-500 text-white"
                    : "bg-gray-700 text-gray-500"
                    } ${isCurrent ? "ring-2 ring-primary-500/50 ring-offset-2 ring-offset-gray-900" : ""}`}
                >
                  {index + 1}
                </div>
                {index < STATUS_FLOW.length - 1 && (
                  <div
                    className={`w-8 h-1 mx-1 ${STATUS_FLOW.indexOf(order.status) > index
                      ? "bg-primary-500"
                      : "bg-gray-700"
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
        <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary-500" />
            Інформація про клієнта
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Ім&apos;я</p>
              <p className="font-medium text-white">{order.customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Телефон</p>
              <a
                href={`tel:${order.customer_phone}`}
                className="font-medium text-primary-500 hover:text-primary-400 flex items-center"
              >
                <PhoneIcon className="w-4 h-4 mr-1" />
                {order.customer_phone}
              </a>
            </div>
            {order.customer_email && (
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <a
                  href={`mailto:${order.customer_email}`}
                  className="font-medium text-gray-300 flex items-center hover:text-primary-500"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-1" />
                  {order.customer_email}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Доставка */}
        <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-primary-500" />
            Доставка
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Тип доставки</p>
              <p className="font-medium text-white">
                {order.delivery_type === "delivery" ? "🚗 Доставка" : "🏪 Самовивіз"}
              </p>
            </div>
            {order.delivery_address && (
              <div>
                <p className="text-sm text-gray-400">Адреса</p>
                <p className="font-medium text-gray-300 flex items-start">
                  <MapPinIcon className="w-4 h-4 mr-1 mt-1 flex-shrink-0" />
                  {order.delivery_address}
                </p>
              </div>
            )}
            {order.comment && (
              <div>
                <p className="text-sm text-gray-400">Коментар клієнта</p>
                <p className="font-medium text-gray-300">{order.comment}</p>
              </div>
            )}
            {order.internal_comment && (
              <div>
                <p className="text-sm text-gray-400">Внутрішній коментар</p>
                <p className="font-medium text-yellow-400">{order.internal_comment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Оплата */}
        <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-primary-500" />
            Оплата
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Спосіб оплати</p>
              <p className="font-medium text-white">
                {order.payment_method === "cash"
                  ? "💵 Готівка при отриманні"
                  : order.payment_method === "card"
                    ? "💳 Карткою при отриманні"
                    : order.payment_method === "online"
                      ? "🌐 Онлайн оплата"
                      : order.payment_method}
              </p>
            </div>
            {order.promo_code_name && (
              <div>
                <p className="text-sm text-gray-400">Промокод</p>
                <p className="font-medium text-primary-500">{order.promo_code_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400">Сума замовлення</p>
              <p className="text-2xl font-bold text-primary-500">
                {formatPrice(order.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Позиції замовлення - Чек */}
      <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ShoppingBagIcon className="w-5 h-5 text-primary-500" />
          Позиції замовлення
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700">
              <tr className="text-left text-sm text-gray-400">
                <th className="pb-3 font-medium">Товар</th>
                <th className="pb-3 font-medium text-center">Кількість</th>
                <th className="pb-3 font-medium text-right">Ціна</th>
                <th className="pb-3 font-medium text-right">Сума</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {order.items?.length > 0 ? (
                order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-700/50 transition">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <span className="font-medium text-white">
                            {item.product_name}
                          </span>
                          {item.size_name && (
                            <span className="text-gray-400 text-sm block">
                              Розмір: {item.size_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center text-gray-300">
                      {item.quantity} шт.
                    </td>
                    <td className="py-4 text-right text-gray-300">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-4 text-right font-medium text-white">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Позиції замовлення не знайдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Підсумок чеку */}
        <div className="mt-6 pt-6 border-t-2 border-gray-700">
          <div className="max-w-sm ml-auto space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Підсумок:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {deliveryCost > 0 && (
              <div className="flex justify-between text-gray-300">
                <span>Доставка:</span>
                <span>{formatPrice(deliveryCost)}</span>
              </div>
            )}
            {deliveryCost === 0 && order.delivery_type === "delivery" && (
              <div className="flex justify-between text-gray-300">
                <span>Доставка:</span>
                <span className="text-green-400">Безкоштовно</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Знижка{order.promo_code_name && ` (${order.promo_code_name})`}:</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700">
              <span>До сплати:</span>
              <span className="text-primary-500">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Історія статусів - NEW TIMELINE */}
      <div className="bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-primary-500" />
          Історія змін
        </h2>
        {order.history && order.history.length > 0 ? (
          <OrderHistoryTimeline history={order.history} />
        ) : (
          <p className="text-gray-500 text-center py-4">Історія змін порожня</p>
        )}
      </div>

      {/* Модальне вікно скасування */}
      <StatusChangeModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
        status="cancelled"
      />

      {/* Стилі для друку */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .space-y-6, .space-y-6 * {
            visibility: visible;
          }
          .space-y-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .bg-gray-800 {
            background: white !important;
            border: 1px solid #ccc !important;
          }
          .text-white, .text-gray-300, .text-gray-400 {
            color: black !important;
          }
          .text-primary-500 {
            color: #059669 !important;
          }
          button, select, a[href^="tel"], a[href^="mailto"] {
            display: none !important;
          }
          .border-gray-700 {
            border-color: #ccc !important;
          }
        }
      `}</style>
    </div>
  );
}


"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { OrderTrackResponse } from "@/lib/types";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  HomeIcon,
  XCircleIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

// Статуси замовлення
const ORDER_STATUSES = {
  pending: {
    label: "Очікує підтвердження",
    icon: ClockIcon,
    color: "text-yellow-500",
    bg: "bg-yellow-500",
    step: 1,
  },
  confirmed: {
    label: "Підтверджено",
    icon: ClipboardDocumentCheckIcon,
    color: "text-blue-500",
    bg: "bg-blue-500",
    step: 2,
  },
  kitchen: {
    label: "Готується",
    icon: HomeIcon, // Можна замінити на іконку кухні/плити якщо є
    color: "text-orange-500",
    bg: "bg-orange-500",
    step: 3,
  },
  courier: {
    label: "Доставляється",
    icon: TruckIcon,
    color: "text-purple-500",
    bg: "bg-purple-500",
    step: 4,
  },
  completed: {
    label: "Доставлено",
    icon: CheckCircleIcon,
    color: "text-green-500",
    bg: "bg-green-500",
    step: 5,
  },
  cancelled: {
    label: "Скасовано",
    icon: XCircleIcon,
    color: "text-red-500",
    bg: "bg-red-500",
    step: 0,
  },
};

export default function OrderTrackPage() {
  const params = useParams();
  const orderNumber = params.order_number as string;

  const orderQuery = useQuery<any>({
    queryKey: ["orderTrack", orderNumber],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderNumber}/track`);
      return response.data;
    },
    enabled: !!orderNumber,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });

  const order = orderQuery.data;

  // Визначення текучого кроку
  const currentStatusKey = order?.status as keyof typeof ORDER_STATUSES;
  const currentStatus = ORDER_STATUSES[currentStatusKey] || ORDER_STATUSES.pending;
  const isCancelled = currentStatusKey === "cancelled";

  // Кроки для прогрес бару (без скасованого)
  const steps = [
    ORDER_STATUSES.pending,
    ORDER_STATUSES.confirmed,
    ORDER_STATUSES.kitchen,
    ORDER_STATUSES.courier,
    ORDER_STATUSES.completed,
  ];

  return (
    <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12">
        {orderQuery.isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : orderQuery.isError || !order ? (
          <div className="text-center py-16 glass-card rounded-2xl max-w-2xl mx-auto">
            <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-secondary mb-2">
              Замовлення не знайдено
            </h1>
            <p className="text-secondary-light mb-6">
              Перевірте номер замовлення або спробуйте пізніше.
            </p>
            <Link href="/" className="btn-primary">
              На головну
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Заголовок */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-2">
                Замовлення #{order.order_number}
              </h1>
              <p className="text-secondary-light">
                {order.created_at
                  ? format(new Date(order.created_at), "d MMMM yyyy, HH:mm", {
                    locale: uk,
                  })
                  : ""}
              </p>
            </div>

            {/* Прогрес бар (тільки якщо не скасовано) */}
            {!isCancelled && (
              <div className="glass-card p-6 sm:p-8 rounded-2xl overflow-hidden">
                <div className="relative">
                  {/* Лінія прогресу */}
                  <div className="hidden sm:block absolute top-1/2 left-0 w-full h-1 bg-theme-tertiary -translate-y-1/2 z-0 rounded-full" />
                  <div
                    className="hidden sm:block absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 rounded-full transition-all duration-1000"
                    style={{
                      width: `${((currentStatus.step - 1) / (steps.length - 1)) * 100}%`,
                    }}
                  />

                  {/* Кроки */}
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
                    {steps.map((step, index) => {
                      const isActive = currentStatus.step >= step.step;
                      const isCurrent = currentStatus.step === step.step;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={index}
                          className={`flex sm:flex-col items-center gap-4 sm:gap-2 ${isActive ? "text-primary" : "text-gray-400"
                            }`}
                        >
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${isActive
                              ? "bg-theme-surface border-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                              : "bg-theme-surface border-theme-tertiary"
                              } ${isCurrent ? "scale-110" : ""}`}
                          >
                            <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <span
                            className={`text-sm font-medium ${isActive ? "text-secondary" : "text-secondary-light"
                              } ${isCurrent ? "font-bold" : ""}`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Статус картка (для мобільних акцент або для скасованого) */}
            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center bg-opacity-10 ${currentStatus.bg.replace("bg-", "bg-opacity-10 bg-")
                  }`}
              >
                <currentStatus.icon className={`w-8 h-8 ${currentStatus.color}`} />
              </div>
              <div>
                <p className="text-secondary-light text-sm">Поточний статус</p>
                <h2 className={`text-2xl font-bold ${currentStatus.color}`}>
                  {currentStatus.label}
                </h2>
                {order.estimated_delivery_time && !isCancelled && (
                  <p className="text-secondary-light mt-1">
                    Орієнтовний час доставки:{" "}
                    <span className="text-secondary font-medium">
                      {format(new Date(order.estimated_delivery_time), "HH:mm", {
                        locale: uk,
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Деталі та Історія */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Історія статусів */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-secondary mb-6">
                  Історія замовлення
                  Історія замовлення
                </h3>
                {order.status_history && order.status_history.length > 0 ? (
                  <div className="relative border-l-2 border-theme-tertiary ml-3 space-y-8 pl-8 py-2">
                    {order.status_history.map((historyItem: any, index: number) => {
                      const statusConfig =
                        ORDER_STATUSES[
                        historyItem.status as keyof typeof ORDER_STATUSES
                        ] || ORDER_STATUSES.pending;
                      return (
                        <div key={index} className="relative">
                          <span
                            className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-theme-surface ${statusConfig.bg}`}
                          ></span>
                          <div>
                            <p className="font-bold text-secondary">
                              {statusConfig.label}
                            </p>
                            <p className="text-xs text-secondary-light mb-1">
                              {historyItem.changed_at
                                ? format(
                                  new Date(historyItem.changed_at),
                                  "d MMMM, HH:mm",
                                  { locale: uk }
                                )
                                : "—"}
                            </p>
                            {historyItem.comment && (
                              <p className="text-sm text-secondary-light bg-theme-tertiary/20 p-2 rounded-lg mt-2 inline-block">
                                {historyItem.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-secondary-light text-center py-4">
                    Історія відсутня
                  </p>
                )}
              </div>

              {/* Деталі замовлення */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-secondary mb-6">
                  Деталі доставки
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <UserIcon className="w-5 h-5 text-secondary-light shrink-0" />
                    <div>
                      <p className="text-sm text-secondary-light">Отримувач</p>
                      <p className="text-secondary font-medium">
                        {order.customer_name || "Гість"}
                      </p>
                      <p className="text-secondary font-medium">
                        {order.customer_phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <HomeIcon className="w-5 h-5 text-secondary-light shrink-0" />
                    <div>
                      <p className="text-sm text-secondary-light">Адреса</p>
                      <p className="text-secondary font-medium">
                        {order.city || "м. Бровари"}, {order.street} {order.building || order.house}
                      </p>
                      {(order.apartment || order.entrance || order.floor) && (
                        <p className="text-secondary text-sm">
                          {order.apartment && `Кв. ${order.apartment}`}
                          {order.entrance && `, Під. ${order.entrance}`}
                          {order.floor && `, Пов. ${order.floor}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {order.comment && (
                    <div className="pt-4 border-t border-gray-700/50 mt-4">
                      <p className="text-sm text-secondary-light mb-1">Коментар</p>
                      <p className="text-secondary italic">&quot;{order.comment}&quot;</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link href="/" className="btn-secondary">
                Повернутися на головну
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 19.5a7.5 7.5 0 0114.998 0A7.5 7.5 0 014.5 19.5z"
      />
    </svg>
  );
}

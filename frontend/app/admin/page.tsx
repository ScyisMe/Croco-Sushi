"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import {
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface DashboardStats {
  orders_today: number;
  orders_week: number;
  orders_month: number;
  orders_year: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  revenue_year: number;
  average_check: number;
  new_customers_today: number;
  new_customers_month: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Очікує", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Підтверджено", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Готується", color: "bg-orange-100 text-orange-800" },
  ready: { label: "Готово", color: "bg-green-100 text-green-800" },
  delivering: { label: "Доставляється", color: "bg-purple-100 text-purple-800" },
  completed: { label: "Виконано", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Скасовано", color: "bg-red-100 text-red-800" },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    orders_today: 0,
    orders_week: 0,
    orders_month: 0,
    orders_year: 0,
    revenue_today: 0,
    revenue_week: 0,
    revenue_month: 0,
    revenue_year: 0,
    average_check: 0,
    new_customers_today: 0,
    new_customers_month: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Отримуємо статистику та останні замовлення
      const [statsRes, ordersRes] = await Promise.all([
        apiClient.get("/admin/statistics/dashboard"),
        apiClient.get("/admin/orders?limit=5"),
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Дашборд</h1>
          <p className="text-gray-600">Огляд вашого бізнесу</p>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <ClockIcon className="w-5 h-5" />
          <span className="text-sm">
            Оновлено: {new Date().toLocaleTimeString("uk-UA")}
          </span>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Замовлень сьогодні</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats.orders_today}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              {stats.orders_month} за місяць
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Виручка сьогодні</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {formatPrice(stats.revenue_today)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              {formatPrice(stats.revenue_month)} за місяць
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Середній чек</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {formatPrice(stats.average_check)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Нові клієнти</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats.new_customers_today}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              {stats.new_customers_month} за місяць
            </span>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="mt-6">
        <SalesChart isLoading={isLoading} />
      </div>

      {/* Quick Actions and Recent Orders / Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Швидкі дії */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Швидкі дії
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/products/new"
              className="flex items-center p-3 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-3" />
              Додати новий товар
            </Link>
            <Link
              href="/admin/categories/new"
              className="flex items-center p-3 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition"
            >
              <TagIcon className="w-5 h-5 mr-3" />
              Додати категорію
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center p-3 bg-yellow-50 rounded-lg text-yellow-700 hover:bg-yellow-100 transition"
            >
              <ClipboardDocumentListIcon className="w-5 h-5 mr-3" />
              Переглянути замовлення
            </Link>
          </div>
        </div>

        {/* Останні замовлення */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Останні замовлення
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-green-600 hover:text-green-700"
            >
              Всі замовлення →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Замовлень поки немає
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">№ Замовлення</th>
                    <th className="pb-3 font-medium">Клієнт</th>
                    <th className="pb-3 font-medium">Сума</th>
                    <th className="pb-3 font-medium">Статус</th>
                    <th className="pb-3 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-800">
                        {order.customer_name || "—"}
                      </td>
                      <td className="py-3 font-medium text-gray-800">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[order.status]?.color ||
                            "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {STATUS_LABELS[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="mt-6">
        <TopProducts isLoading={isLoading} />
      </div>
    </div>
  );
}

import SalesChart from "./components/SalesChart";
import TopProducts from "./components/TopProducts";

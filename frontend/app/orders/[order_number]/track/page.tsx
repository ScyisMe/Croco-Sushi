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

export default function OrderTrackPage() {
  const params = useParams();
  const orderNumber = params.order_number as string;

  const orderQuery = useQuery<OrderTrackResponse>({
    queryKey: ["orderTrack", orderNumber],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderNumber}/track`);
      return response.data;
    },
    enabled: !!orderNumber,
  });

  const order = orderQuery.data;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {orderQuery.isLoading ? (
          <div className="text-center">Завантаження...</div>
        ) : orderQuery.isError || !order ? (
          <div className="text-center text-red-600">Замовлення не знайдено або сталася помилка.</div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6">Відстеження замовлення #{order.order_number}</h1>
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <p className="text-lg mb-2">
                Статус: <span className="font-semibold text-green-600">{order.status}</span>
              </p>
              <p className="text-lg mb-2">
                Оновлено: {format(new Date(order.updated_at), "dd MMMM yyyy, HH:mm", { locale: uk })}
              </p>
              {order.estimated_delivery_time && (
                <p className="text-lg mb-2">
                  Очікуваний час доставки: {format(new Date(order.estimated_delivery_time), "HH:mm", { locale: uk })}
                </p>
              )}
              {order.comment && <p className="text-lg mb-2">Коментар: {order.comment}</p>}
            </div>

            <h2 className="text-2xl font-bold mb-4">Історія статусів</h2>
            <div className="bg-white shadow-md rounded-lg p-6">
              {order.status_history && order.status_history.length > 0 ? (
                <ul className="space-y-4">
                  {order.status_history.map((historyItem, index) => (
                    <li key={index} className="border-l-4 border-green-500 pl-4">
                      <p className="font-semibold">{historyItem.status}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(historyItem.changed_at), "dd MMMM yyyy, HH:mm", { locale: uk })}
                      </p>
                      {historyItem.comment && (
                        <p className="text-sm text-gray-700">Коментар: {historyItem.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Історія статусів відсутня.</p>
              )}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="bg-green-500 text-white py-3 px-6 rounded-lg text-lg hover:bg-green-600 transition duration-300"
              >
                На головну
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}



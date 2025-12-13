"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";

export default function OrderSuccessPage() {
  const params = useParams();
  const orderNumber = params.order_number as string;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-green-600 mb-4">Оплата успішна!</h1>
            <p className="text-xl text-gray-700 mb-2">
              Ваше замовлення <span className="font-bold">{orderNumber}</span> успішно оплачено.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Ми надіслали підтвердження на вашу пошту та SMS.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Link
              href="/"
              className="bg-green-500 text-white py-3 px-6 rounded-lg text-lg hover:bg-green-600 transition duration-300"
            >
              На головну
            </Link>
            <Link
              href={`/orders/${orderNumber}/track`}
              className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg text-lg hover:bg-gray-300 transition duration-300"
            >
              Відстежити замовлення
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}




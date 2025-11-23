"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Кошик порожній");
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.productId,
          size_id: item.sizeId,
          quantity: item.quantity,
        })),
        customer_name: "Користувач",
        customer_phone: "+380000000000",
        payment_method: "cash",
        city: "Київ",
        street: "Вулиця",
        house: "1",
      };

      const response = await apiClient.post("/orders", orderData);
      clearCart();
      toast.success("Замовлення створено!");
      router.push(`/orders/${response.data.order_number}/track`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка створення замовлення");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Кошик порожній</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Оформлення замовлення</h1>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Ваше замовлення</h2>
              <ul className="space-y-2 mb-4">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.sizeId}`} className="flex justify-between">
                    <span>
                      {item.productName} ({item.sizeName}) x {item.quantity}
                    </span>
                    <span>{parseFloat(item.price) * item.quantity} грн</span>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-2">
                <p className="text-lg font-semibold flex justify-between">
                  <span>Всього:</span>
                  <span>{totalAmount} грн</span>
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {isLoading ? "Оформлення..." : "Підтвердити замовлення"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}



"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { phone, password });
      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
        
        // Сповіщаємо про зміну авторизації для синхронізації кошика
        window.dispatchEvent(new Event("auth-change"));
        
        toast.success("Вхід успішний!");
        router.push("/profile");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка входу");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Вхід</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="+380XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {isLoading ? "Вхід..." : "Увійти"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Немає акаунту?{" "}
              <a href="/register" className="text-green-600 hover:text-green-700 font-medium">
                Зареєструватися
              </a>
            </p>
          </div>

          <div className="mt-4 text-center">
            <a href="/reset-password" className="text-sm text-gray-500 hover:text-green-600">
              Забули пароль?
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}



"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EnvelopeIcon, LockClosedIcon, PhoneIcon } from "@heroicons/react/24/outline";

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
    <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <span className="text-3xl">🐊</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-2">
              Вхід в акаунт
            </h1>
            <p className="text-secondary-light">
              Увійдіть, щоб переглянути замовлення та бонуси
            </p>
          </div>

          {/* Форма */}
          <div className="bg-theme-surface rounded-2xl shadow-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Телефон */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Номер телефону
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-light" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="input pl-12"
                    placeholder="+380XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Пароль */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-light" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input pl-12"
                    placeholder="Введіть пароль"
                  />
                </div>
              </div>

              {/* Забули пароль */}
              <div className="flex justify-end">
                <Link 
                  href="/reset-password" 
                  className="text-sm text-primary hover:text-primary-600 transition"
                >
                  Забули пароль?
                </Link>
              </div>

              {/* Кнопка входу */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Входимо...
                  </span>
                ) : (
                  "Увійти"
                )}
              </button>
            </form>

            {/* Роздільник */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-theme" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-theme-surface text-secondary-light">
                  або
                </span>
              </div>
            </div>

            {/* Реєстрація */}
            <div className="text-center">
              <p className="text-secondary-light">
                Ще немає акаунту?{" "}
                <Link 
                  href="/register" 
                  className="text-primary hover:text-primary-600 font-semibold transition"
                >
                  Зареєструватися
                </Link>
              </p>
            </div>
          </div>

          {/* Переваги */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-theme-surface rounded-xl">
              <div className="text-2xl mb-2">🎁</div>
              <p className="text-sm text-secondary-light">Бонуси за замовлення</p>
            </div>
            <div className="p-4 bg-theme-surface rounded-xl">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm text-secondary-light">Історія замовлень</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

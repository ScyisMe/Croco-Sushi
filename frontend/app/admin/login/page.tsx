"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      if (response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);

        // Перевіряємо роль користувача з бекенду після отримання токена
        try {
          const userResponse = await apiClient.get("/users/me", {
            headers: {
              Authorization: `Bearer ${response.data.access_token}`,
            },
          });

          const userRole = userResponse.data.role;
          if (userRole !== "admin" && userRole !== "manager") {
            // Якщо не адмін і не менеджер - видаляємо токени і показуємо помилку
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            toast.error("Доступ заборонено. Тільки для адміністраторів.");
            return;
          }

          toast.success("Вхід успішний!");
          if (userRole === "manager") {
            router.push("/admin/manager");
          } else {
            router.push("/admin");
          }
        } catch (verifyError) {
          // Помилка верифікації
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          toast.error("Помилка верифікації користувача");
          return;
        }

      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Невірний email або пароль");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="relative w-12 h-12">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-3xl font-bold text-primary">Croco Sushi</span>
          </Link>
          <p className="text-gray-400 mt-2">Адміністративна панель</p>
        </div>

        {/* Форма входу */}
        <div className="bg-surface rounded-2xl shadow-xl p-8 border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Вхід для адміністратора
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-white placeholder-gray-500"
                placeholder="admin@crocosushi.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Вхід...
                </span>
              ) : (
                "Увійти"
              )}
            </button>
          </form>
        </div>

        {/* Посилання на сайт */}
        <p className="text-center mt-6 text-gray-500">
          <Link href="/" className="text-primary hover:text-primary-400 font-medium transition-colors">
            ← Повернутися на сайт
          </Link>
        </p>
      </div>
    </div>
  );
}



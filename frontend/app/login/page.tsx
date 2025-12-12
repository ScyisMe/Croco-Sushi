"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import { LockClosedIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "@/store/localeStore";

import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Форматування телефону - дозволяє тільки цифри
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 0) return "";
    if (digits.length <= 3) return `+${digits}`;
    if (digits.length <= 5) return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
    if (digits.length <= 10) return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

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

        toast.success(t("auth.loginSuccess"));
        router.push("/profile");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t("auth.loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-secondary transition-colors">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <Image
                  src="/logo.jpg"
                  alt="Croco Sushi"
                  fill
                  className="object-contain rounded-full"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t("auth.login")}
            </h1>
            <p className="text-foreground-secondary">
              {t("auth.loginDescription") || "Увійдіть, щоб переглянути замовлення та бонуси"}
            </p>
          </div>

          {/* Форма */}
          <div className="bg-surface rounded-2xl shadow-card p-6 md:p-8 border border-border">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Телефон */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.phone")}
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    className="input pl-12"
                    placeholder="+380 XX XXX XX XX"
                  />
                </div>
              </div>

              {/* Пароль */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input pl-12"
                    placeholder={t("auth.enterPassword") || "Введіть пароль"}
                  />
                </div>
              </div>

              {/* Забули пароль */}
              <div className="flex justify-end">
                <Link
                  href="/reset-password"
                  className="text-sm text-primary hover:text-primary-600 transition"
                >
                  {t("auth.forgotPassword")}
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
                    {t("auth.loggingIn") || "Входимо..."}
                  </span>
                ) : (
                  t("auth.signIn")
                )}
              </button>
            </form>

            {/* Роздільник */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface text-foreground-muted">
                  {t("common.or")}
                </span>
              </div>
            </div>

            {/* Реєстрація */}
            <div className="text-center">
              <p className="text-foreground-secondary">
                {t("auth.noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary-600 font-semibold transition"
                >
                  {t("auth.signUp")}
                </Link>
              </p>
            </div>
          </div>

          {/* Переваги */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="text-2xl mb-2">🎁</div>
              <p className="text-sm text-foreground-secondary">{t("auth.benefits.loyalty") || "Бонуси за замовлення"}</p>
            </div>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-sm text-foreground-secondary">{t("auth.benefits.history")}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


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
                  className="object-contain rounded-full shadow-2xl"
                  priority
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("auth.login")}
            </h1>
            <p className="text-foreground-secondary text-lg">
              {t("auth.loginDescription") || "Увійдіть, щоб переглянути замовлення та бонуси"}
            </p>
          </div>

          {/* Форма */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/10 relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Телефон */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.phone")}
                </label>
                <div className="relative group">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    className="input pl-12 bg-surface-card/50 focus:bg-surface-card transition-colors border-white/5 focus:border-primary/50"
                    placeholder="+380 XX XXX XX XX"
                  />
                </div>
              </div>

              {/* Пароль */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.password")}
                </label>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input pl-12 bg-surface-card/50 focus:bg-surface-card transition-colors border-white/5 focus:border-primary/50"
                    placeholder={t("auth.enterPassword") || "Введіть пароль"}
                  />
                </div>
              </div>

              {/* Забули пароль */}
              <div className="flex justify-end">
                <Link
                  href="/reset-password"
                  className="text-sm text-primary hover:text-primary-400 transition hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>

              {/* Кнопка входу */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-300"
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
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-foreground-muted backdrop-blur-md">
                  {t("common.or") || "або"}
                </span>
              </div>
            </div>

            {/* Соціальний вхід */}
            <div className="space-y-3 mb-8">
              <button className="w-full bg-white text-black hover:bg-gray-100 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </button>

              <button className="w-full bg-black text-white hover:bg-gray-900 border border-white/10 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                </svg>
                Sign in with Apple
              </button>
            </div>

            {/* Реєстрація */}
            <div className="text-center relative z-10">
              <p className="text-foreground-secondary">
                {t("auth.noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary-400 font-semibold transition hover:underline"
                >
                  {t("auth.signUp")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


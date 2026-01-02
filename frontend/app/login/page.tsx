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
                  src="/logo.webp"
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

            <div className="mt-8 bg-surface rounded-2xl shadow-card p-6 border border-border">
              <h2 className="font-semibold text-foreground mb-4">{t("auth.benefits.title")}</h2>
              <ul className="space-y-3">
                <li className="flex items-center text-foreground-secondary">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary text-sm">✓</span>
                  {t("auth.benefits.fast")}
                </li>
                <li className="flex items-center text-foreground-secondary">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary text-sm">✓</span>
                  {t("auth.benefits.history")}
                </li>
                <li className="flex items-center text-foreground-secondary">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary text-sm">✓</span>
                  {t("auth.benefits.loyalty")}
                </li>
                <li className="flex items-center text-foreground-secondary">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary text-sm">✓</span>
                  {t("auth.benefits.exclusive")}
                </li>
              </ul>
            </div>

            {/* Роздільник */}
            <div className="flex items-center gap-4 my-8">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-sm text-foreground-muted">
                {t("common.or") || "або"}
              </span>
              <div className="h-px bg-white/10 flex-1" />
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


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Видаляємо все крім цифр
    const digits = value.replace(/\D/g, "");
    
    // Форматуємо номер
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
    
    if (password !== confirmPassword) {
      toast.error("Паролі не співпадають");
      return;
    }

    if (!acceptTerms) {
      toast.error("Потрібно прийняти умови використання");
      return;
    }

    setIsLoading(true);
    try {
      // Видаляємо пробіли з номера телефону для відправки
      const cleanPhone = phone.replace(/\s/g, "");
      await apiClient.post("/auth/register", { 
        phone: cleanPhone, 
        email: email || undefined, 
        name: name || undefined, 
        password 
      });
      toast.success("Реєстрація успішна! Тепер увійдіть.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка реєстрації");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Дуже слабкий", "Слабкий", "Середній", "Хороший", "Надійний"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="text-3xl">🐊</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Створити акаунт</h1>
            <p className="text-gray-600">Приєднуйтесь до Croco Sushi</p>
          </div>

          {/* Форма */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Телефон */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер телефону <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="+380 XX XXX XX XX"
                />
              </div>

              {/* Ім'я */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваше ім&apos;я
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Як до вас звертатися?"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="email@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">Для отримання акцій та спеціальних пропозицій</p>
              </div>

              {/* Пароль */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="Мінімум 8 символів"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Індикатор сили пароля */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition ${
                            i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Надійність: {strengthLabels[passwordStrength - 1] || "Введіть пароль"}
                    </p>
                  </div>
                )}
              </div>

              {/* Підтвердження пароля */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Підтвердіть пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-green-500 transition ${
                      confirmPassword && password !== confirmPassword 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-gray-300 focus:border-green-500"
                    }`}
                    placeholder="Повторіть пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Паролі не співпадають</p>
                )}
              </div>

              {/* Умови використання */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
                  Я погоджуюсь з{" "}
                  <Link href="/terms" className="text-green-600 hover:text-green-700 underline">
                    умовами використання
                  </Link>{" "}
                  та{" "}
                  <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">
                    політикою конфіденційності
                  </Link>
                </label>
              </div>

              {/* Кнопка реєстрації */}
              <button
                type="submit"
                disabled={isLoading || !acceptTerms || password !== confirmPassword}
                className="w-full bg-green-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Реєстрація...
                  </>
                ) : (
                  "Зареєструватися"
                )}
              </button>
            </form>

            {/* Посилання на вхід */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Вже маєте акаунт?{" "}
                <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Увійти
                </Link>
              </p>
            </div>
          </div>

          {/* Переваги реєстрації */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Переваги реєстрації:</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-600">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-sm">✓</span>
                Швидке оформлення замовлень
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-sm">✓</span>
                Історія ваших замовлень
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-sm">✓</span>
                Бонусна програма лояльності
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-sm">✓</span>
                Ексклюзивні акції та знижки
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}



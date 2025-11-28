"use client";

import { useState, useEffect, useCallback } from "react";
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
  
  // Стани для помилок валідації
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Перевірка чи користувач вже авторизований
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/profile");
    }
  }, [router]);

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
    setPhoneError("");
  };

  // Валідація телефону
  const validatePhone = useCallback((): boolean => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 0) {
      setPhoneError("Введіть номер телефону");
      return false;
    }
    if (digits.length !== 12) {
      setPhoneError("Номер телефону має містити 12 цифр");
      return false;
    }
    if (!digits.startsWith("380")) {
      setPhoneError("Номер має починатися з +380");
      return false;
    }
    return true;
  }, [phone]);

  // Валідація email
  const validateEmail = useCallback((): boolean => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Введіть коректний email");
      return false;
    }
    return true;
  }, [email]);

  // Валідація імені
  const validateName = useCallback((): boolean => {
    if (name && name.trim().length < 2) {
      setNameError("Ім'я має містити мінімум 2 символи");
      return false;
    }
    if (name && !/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]+$/.test(name)) {
      setNameError("Ім'я може містити лише літери");
      return false;
    }
    return true;
  }, [name]);

  // Валідація пароля
  const validatePassword = useCallback((): boolean => {
    if (password.length < 8) {
      setPasswordError("Пароль має містити мінімум 8 символів");
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError("Паролі не співпадають");
      return false;
    }
    return true;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Очищуємо всі помилки
    setPhoneError("");
    setEmailError("");
    setNameError("");
    setPasswordError("");
    
    // Валідація всіх полів
    const isPhoneValid = validatePhone();
    const isEmailValid = validateEmail();
    const isNameValid = validateName();
    const isPasswordValid = validatePassword();
    
    if (!isPhoneValid || !isEmailValid || !isNameValid || !isPasswordValid) {
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
        name: name.trim() || undefined, 
        password 
      });
      toast.success("Реєстрація успішна! Тепер увійдіть.");
      router.push("/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const message = err.response?.data?.detail || "Помилка реєстрації";
      toast.error(message);
      
      // Показуємо специфічні помилки
      if (message.toLowerCase().includes("телефон") || message.toLowerCase().includes("phone")) {
        setPhoneError("Цей номер вже зареєстровано");
      } else if (message.toLowerCase().includes("email")) {
        setEmailError("Цей email вже використовується");
      }
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
    <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <span className="text-3xl">🐊</span>
            </div>
            <h1 className="text-3xl font-bold text-secondary mb-2">Створити акаунт</h1>
            <p className="text-secondary-light">Приєднуйтесь до Croco Sushi</p>
          </div>

          {/* Форма */}
          <div className="bg-theme-surface rounded-2xl shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Телефон */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-secondary mb-2">
                  Номер телефону <span className="text-accent-red">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={validatePhone}
                  required
                  aria-describedby={phoneError ? "phone-error" : undefined}
                  aria-invalid={!!phoneError}
                  className={`input ${phoneError ? "input-error" : ""}`}
                  placeholder="+380 XX XXX XX XX"
                />
                {phoneError && (
                  <p id="phone-error" className="mt-1 text-sm text-accent-red" role="alert">
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Ім'я */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary mb-2">
                  Ваше ім&apos;я
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError("");
                  }}
                  onBlur={validateName}
                  aria-describedby={nameError ? "name-error" : undefined}
                  aria-invalid={!!nameError}
                  className={`input ${nameError ? "input-error" : ""}`}
                  placeholder="Як до вас звертатися?"
                />
                {nameError && (
                  <p id="name-error" className="mt-1 text-sm text-accent-red" role="alert">
                    {nameError}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onBlur={validateEmail}
                  aria-describedby={emailError ? "email-error" : "email-hint"}
                  aria-invalid={!!emailError}
                  className={`input ${emailError ? "input-error" : ""}`}
                  placeholder="email@example.com"
                />
                {emailError ? (
                  <p id="email-error" className="mt-1 text-sm text-accent-red" role="alert">
                    {emailError}
                  </p>
                ) : (
                  <p id="email-hint" className="mt-1 text-xs text-secondary-light">
                    Для отримання акцій та спеціальних пропозицій
                  </p>
                )}
              </div>

              {/* Пароль */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary mb-2">
                  Пароль <span className="text-accent-red">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-describedby="password-strength"
                    className="input pr-12"
                    placeholder="Мінімум 8 символів"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-light hover:text-secondary transition"
                    aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
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
                  <div className="mt-2" id="password-strength">
                    <div className="flex gap-1" role="progressbar" aria-valuenow={passwordStrength} aria-valuemin={0} aria-valuemax={5}>
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition ${
                            i < passwordStrength ? strengthColors[Math.max(0, passwordStrength - 1)] : "bg-theme-tertiary"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-secondary-light mt-1">
                      Надійність: {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Дуже слабкий"}
                    </p>
                  </div>
                )}
              </div>

              {/* Підтвердження пароля */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary mb-2">
                  Підтвердіть пароль <span className="text-accent-red">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-describedby={passwordError ? "confirm-password-error" : undefined}
                    aria-invalid={!!(confirmPassword && password !== confirmPassword)}
                    className={`input pr-12 ${confirmPassword && password !== confirmPassword ? "input-error" : ""}`}
                    placeholder="Повторіть пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-light hover:text-secondary transition"
                    aria-label={showConfirmPassword ? "Приховати пароль" : "Показати пароль"}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p id="confirm-password-error" className="mt-1 text-xs text-accent-red" role="alert">
                    Паролі не співпадають
                  </p>
                )}
                {passwordError && (
                  <p className="mt-1 text-xs text-accent-red" role="alert">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Умови використання */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 text-primary border-theme rounded focus:ring-primary"
                />
                <label htmlFor="terms" className="ml-3 text-sm text-secondary-light">
                  Я погоджуюсь з{" "}
                  <Link href="/terms" className="text-primary hover:text-primary-600 underline">
                    умовами використання
                  </Link>{" "}
                  та{" "}
                  <Link href="/privacy" className="text-primary hover:text-primary-600 underline">
                    політикою конфіденційності
                  </Link>
                </label>
              </div>

              {/* Кнопка реєстрації */}
              <button
                type="submit"
                disabled={isLoading || !acceptTerms || password !== confirmPassword}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-secondary-light">
                Вже маєте акаунт?{" "}
                <Link href="/login" className="text-primary hover:text-primary-600 font-semibold transition">
                  Увійти
                </Link>
              </p>
            </div>
          </div>

          {/* Переваги реєстрації */}
          <div className="mt-8 bg-theme-surface rounded-2xl shadow-card p-6">
            <h3 className="font-semibold text-secondary mb-4">Переваги реєстрації:</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-secondary-light">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary text-sm">✓</span>
                Швидке оформлення замовлень
              </li>
              <li className="flex items-center text-secondary-light">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary text-sm">✓</span>
                Історія ваших замовлень
              </li>
              <li className="flex items-center text-secondary-light">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary text-sm">✓</span>
                Бонусна програма лояльності
              </li>
              <li className="flex items-center text-secondary-light">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 text-primary text-sm">✓</span>
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



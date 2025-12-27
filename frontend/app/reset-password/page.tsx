"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

// Час для повторної відправки коду (в секундах)
const RESEND_COOLDOWN = 60;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [phoneError, setPhoneError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Таймер для повторної відправки
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Форматування телефону (як в register)
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
    setPhoneError("");
  };

  // Валідація телефону
  const validatePhone = useCallback((phoneValue: string): boolean => {
    const digits = phoneValue.replace(/\D/g, "");
    if (digits.length !== 12) {
      setPhoneError("Номер телефону має містити 12 цифр");
      return false;
    }
    if (!digits.startsWith("380")) {
      setPhoneError("Номер має починатися з +380");
      return false;
    }
    return true;
  }, []);

  // Валідація коду
  const validateCode = useCallback((codeValue: string): boolean => {
    if (!/^\d{4,6}$/.test(codeValue)) {
      setCodeError("Код має містити 4-6 цифр");
      return false;
    }
    return true;
  }, []);

  // Валідація пароля
  const validatePassword = useCallback((): boolean => {
    if (newPassword.length < 8) {
      setPasswordError("Пароль має містити мінімум 8 символів");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Паролі не співпадають");
      return false;
    }
    return true;
  }, [newPassword, confirmPassword]);

  // Індикатор сили пароля
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Дуже слабкий", "Слабкий", "Середній", "Хороший", "Надійний"];

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone)) return;

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\s/g, "");
      await apiClient.post("/auth/reset-password", { phone: cleanPhone });
      toast.success("SMS код відправлено на ваш номер!");
      setStep("reset");
      setResendTimer(RESEND_COOLDOWN);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const message = err.response?.data?.detail || "Помилка відправки коду";
      toast.error(message);

      // Якщо номер не знайдено
      if (message.includes("не знайдено") || message.includes("not found")) {
        setPhoneError("Користувача з таким номером не знайдено");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\s/g, "");
      await apiClient.post("/auth/reset-password", { phone: cleanPhone });
      toast.success("Код відправлено повторно!");
      setResendTimer(RESEND_COOLDOWN);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Помилка повторної відправки");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setCodeError("");
    setPasswordError("");

    if (!validateCode(code)) return;
    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\s/g, "");
      await apiClient.post("/auth/change-password", {
        phone: cleanPhone,
        new_password: newPassword,
        reset_code: code
      });
      toast.success("Пароль успішно змінено! Тепер увійдіть з новим паролем.");
      router.push("/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const message = err.response?.data?.detail || "Помилка зміни пароля";
      toast.error(message);

      // Якщо код невірний
      if (message.includes("код") || message.includes("code")) {
        setCodeError("Невірний або прострочений код");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("request");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setCodeError("");
    setPasswordError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Відновлення пароля</h1>
            <p className="text-gray-600">
              {step === "request"
                ? "Введіть номер телефону для отримання коду"
                : "Введіть код з SMS та новий пароль"
              }
            </p>
          </div>

          {/* Форма */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="sr-only">Форма відновлення пароля</h2>
            {step === "request" ? (
              <form onSubmit={handleRequestCode} className="space-y-5">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Номер телефону <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    aria-describedby={phoneError ? "phone-error" : undefined}
                    aria-invalid={!!phoneError}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition ${phoneError ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="+380 XX XXX XX XX"
                  />
                  {phoneError && (
                    <p id="phone-error" className="mt-1 text-sm text-red-500" role="alert">
                      {phoneError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !phone}
                  className="w-full bg-green-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Відправка...
                    </>
                  ) : (
                    "Отримати код"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* Кнопка назад */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition mb-2"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Змінити номер
                </button>

                {/* Відображення номера */}
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-500">Код відправлено на</p>
                  <p className="font-medium text-gray-900">{phone}</p>
                </div>

                {/* SMS код */}
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    SMS код <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setCode(value);
                      setCodeError("");
                    }}
                    required
                    aria-describedby={codeError ? "code-error" : undefined}
                    aria-invalid={!!codeError}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-center text-2xl tracking-widest font-mono ${codeError ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="• • • • • •"
                  />
                  {codeError && (
                    <p id="code-error" className="mt-1 text-sm text-red-500" role="alert">
                      {codeError}
                    </p>
                  )}

                  {/* Повторна відправка */}
                  <div className="mt-2 text-center">
                    {resendTimer > 0 ? (
                      <p className="text-sm text-gray-500">
                        Повторна відправка через {resendTimer} сек.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Відправити код повторно
                      </button>
                    )}
                  </div>
                </div>

                {/* Новий пароль */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Новий пароль <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="Мінімум 8 символів"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition ${i < passwordStrength ? strengthColors[Math.max(0, passwordStrength - 1)] : "bg-gray-200"
                              }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Надійність: {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Введіть пароль"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Підтвердження пароля */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Підтвердіть пароль <span className="text-red-500">*</span>
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
                      aria-describedby={passwordError ? "password-error" : undefined}
                      aria-invalid={!!passwordError}
                      className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-green-500 transition ${confirmPassword && newPassword !== confirmPassword
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 focus:border-green-500"
                        }`}
                      placeholder="Повторіть пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showConfirmPassword ? "Приховати пароль" : "Показати пароль"}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">Паролі не співпадають</p>
                  )}
                  {passwordError && (
                    <p id="password-error" className="mt-1 text-sm text-red-500" role="alert">
                      {passwordError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !code || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full bg-green-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Зміна пароля...
                    </>
                  ) : (
                    "Змінити пароль"
                  )}
                </button>
              </form>
            )}

            {/* Посилання */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Згадали пароль?{" "}
                <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Увійти
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




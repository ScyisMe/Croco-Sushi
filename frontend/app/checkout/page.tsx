"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import {
  CheckIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  UserIcon,
  MapPinIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  BanknotesIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

// Типи
interface FormData {
  // Крок 1: Контактні дані
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  // Крок 2: Адреса доставки
  city: string;
  street: string;
  building: string;
  apartment: string;
  entrance: string;
  floor: string;
  comment: string;
  // Крок 3: Оплата
  payment_method: "cash" | "card_online" | "card_courier";
  // Крок 4: Підтвердження
  agree_terms: boolean;
  agree_privacy: boolean;
}

// Початкові дані форми
const initialFormData: FormData = {
  customer_name: "",
  customer_phone: "+380",
  customer_email: "",
  city: "Львів",
  street: "",
  building: "",
  apartment: "",
  entrance: "",
  floor: "",
  comment: "",
  payment_method: "cash",
  agree_terms: false,
  agree_privacy: false,
};

// Кроки оформлення
const STEPS = [
  { id: 1, name: "Контакти", icon: UserIcon },
  { id: 2, name: "Доставка", icon: MapPinIcon },
  { id: 3, name: "Оплата", icon: CreditCardIcon },
  { id: 4, name: "Підтвердження", icon: CheckIcon },
];

// Способи оплати
const PAYMENT_METHODS = [
  { value: "cash", label: "Готівкою кур'єру", icon: "💵" },
  { value: "card_courier", label: "Карткою кур'єру", icon: "💳" },
  { value: "card_online", label: "Онлайн оплата", icon: "🌐", disabled: true },
];

// Мінімальна сума замовлення
const MIN_ORDER_AMOUNT = 200;
const DELIVERY_COST = 200;
const FREE_DELIVERY_FROM = 1000;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Завантаження збережених даних з localStorage
  useEffect(() => {
    const saved = localStorage.getItem("checkout_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev: FormData) => ({ ...prev, ...parsed }));
      } catch {
        // Ігноруємо помилки парсингу
      }
    }
  }, []);

  // Збереження даних в localStorage
  useEffect(() => {
    const { agree_terms, agree_privacy, ...dataToSave } = formData;
    localStorage.setItem("checkout_form", JSON.stringify(dataToSave));
  }, [formData]);

  // Завантаження даних користувача
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Отримання профілю
        const { data: user } = await apiClient.get("/users/me");

        // Отримання адрес
        let address: any = null;
        try {
          const { data: addresses } = await apiClient.get("/users/me/addresses");
          if (addresses && addresses.length > 0) {
            address = addresses.find((a: any) => a.is_default) || addresses[0];
          }
        } catch (e) {
          console.error("Failed to fetch addresses:", e);
        }

        setFormData((prev: FormData) => {
          // Якщо поле вже заповнене вручну (і не дефолтне +380), не перезаписуємо його
          const isPhoneDefault = prev.customer_phone === "+380" || prev.customer_phone === "";

          return {
            ...prev,
            customer_name: prev.customer_name || user.name || "",
            customer_email: prev.customer_email || user.email || "",
            customer_phone: isPhoneDefault ? (user.phone || "+380") : prev.customer_phone,

            // Адреса
            city: prev.city === "Львів" && address ? address.city : prev.city,
            street: prev.street || (address?.street || ""),
            building: prev.building || (address?.house || ""),
            apartment: prev.apartment || (address?.apartment || ""),
            entrance: prev.entrance || (address?.entrance || ""),
            floor: prev.floor || (address?.floor || ""),
          };
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Розрахунок доставки
  const deliveryCost = totalAmount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_COST;
  const finalAmount = totalAmount + deliveryCost;

  // Оновлення поля форми
  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));
    // Очищаємо помилку при зміні поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Форматування телефону
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return "+380";
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 5) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
    if (digits.length <= 8)
      return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5)}`;
    if (digits.length <= 10)
      return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  };

  // Валідація кроку
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.customer_name.trim() || formData.customer_name.length < 2) {
        newErrors.customer_name = "Введіть ім'я (мінімум 2 символи)";
      }
      const phoneDigits = formData.customer_phone.replace(/\D/g, "");
      if (phoneDigits.length !== 12 || !phoneDigits.startsWith("380")) {
        newErrors.customer_phone = "Введіть коректний номер телефону";
      }
      if (formData.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
        newErrors.customer_email = "Введіть коректний email";
      }
    }

    if (step === 2) {
      if (!formData.city.trim()) {
        newErrors.city = "Введіть місто";
      }
      if (!formData.street.trim()) {
        newErrors.street = "Введіть вулицю";
      }
      if (!formData.building.trim()) {
        newErrors.building = "Введіть номер будинку";
      }
    }

    if (step === 4) {
      if (!formData.agree_terms) {
        newErrors.agree_terms = "Необхідно погодитись з умовами";
      }
      if (!formData.agree_privacy) {
        newErrors.agree_privacy = "Необхідно погодитись з політикою";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Перехід до наступного кроку
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev: number) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Перехід до попереднього кроку
  const prevStep = () => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Відправка замовлення
  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    if (items.length === 0) {
      toast.error("Кошик порожній");
      return;
    }

    if (totalAmount < MIN_ORDER_AMOUNT) {
      toast.error(`Мінімальна сума замовлення ${MIN_ORDER_AMOUNT} ₴`);
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.id,
          size_id: item.sizeId,
          quantity: item.quantity,
        })),
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone.replace(/\D/g, ""),
        customer_email: formData.customer_email || undefined,
        payment_method: formData.payment_method,
        city: formData.city,
        street: formData.street,
        house: formData.building,
        apartment: formData.apartment || undefined,
        entrance: formData.entrance || undefined,
        floor: formData.floor || undefined,
        comment: formData.comment || undefined,
      };

      const response = await apiClient.post("/orders/", orderData);

      // Очищаємо кошик на сервері (якщо користувач авторизований)
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          await apiClient.delete("/users/me/cart");
        } catch (e) {
          console.error("Failed to clear server cart:", e);
        }
      }

      // Очищаємо локальний кошик та збережені дані
      clearCart();
      localStorage.removeItem("checkout_form");

      toast.success("Замовлення успішно створено!");
      router.push(`/orders/${response.data.order_number}/track`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Помилка створення замовлення");
    } finally {
      setIsLoading(false);
    }
  };

  // Якщо кошик порожній
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <ShoppingBagIcon className="w-24 h-24 text-secondary-light mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-secondary mb-4">Кошик порожній</h1>
            <p className="text-secondary-light mb-8">
              Додайте страви з меню, щоб оформити замовлення
            </p>
            <Link href="/menu" className="btn-primary">
              Перейти до меню
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
      <Header />

      <main className="flex-grow">
        {/* Хлібні крихти */}
        <div className="bg-theme-surface">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm">
              <Link href="/" className="text-secondary-light hover:text-primary transition">
                Головна
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <span className="text-secondary font-medium">Оформлення замовлення</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary mb-4 sm:mb-8">
            Оформлення замовлення
          </h1>

          {/* Індикатор прогресу - Живий шлях кур'єра */}
          <div className="mb-6 sm:mb-10">
            <div className="relative flex items-center justify-between max-w-3xl mx-auto px-4">
              {/* Background Line */}
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/10 -translate-y-1/2 rounded-full" />

              {/* Active Line (Progress) */}
              <div
                className="absolute top-1/2 left-4 h-1 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} // Approximate width relative to container
              />

              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center group">
                    <div
                      className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-500 ${isActive
                        ? "bg-surface-card border-green-500 text-green-500 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                        : isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-surface-card border-white/10 text-gray-500"
                        }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : isActive ? (
                        index === 1 ? <TruckIcon className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /> :
                          index === 2 ? <BanknotesIcon className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /> :
                            <step.icon className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                      ) : (
                        <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}

                      {/* Moped/Croco Icon moving */}
                      {isActive && (
                        <motion.div
                          layoutId="moving-icon"
                          className="absolute -top-6 text-2xl"
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                          🐊
                        </motion.div>
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs sm:text-sm font-medium transition-colors duration-300 ${isActive ? "text-green-500" : isCompleted ? "text-white" : "text-gray-500"
                        }`}
                    >
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Форма */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="glass-card rounded-xl p-4 sm:p-6 md:p-8">
                {/* Крок 1: Контактні дані */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                      <UserIcon className="w-6 h-6 text-green-500" />
                      Контактні дані
                    </h2>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Ваше ім&apos;я *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.customer_name}
                          onChange={(e) => updateField("customer_name", e.target.value)}
                          placeholder="Введіть ваше ім&apos;я"
                          className={`input ${errors.customer_name ? "input-error" : ""} ${!errors.customer_name && formData.customer_name.length > 2 ? "border-green-500/50 focus:border-green-500" : ""}`}
                        />
                        {!errors.customer_name && formData.customer_name.length > 2 && (
                          <CheckCircleSolidIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                        )}
                      </div>
                      {errors.customer_name && (
                        <p className="mt-1 text-sm text-accent-red">{errors.customer_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Номер телефону *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.customer_phone}
                          onChange={(e) => updateField("customer_phone", formatPhone(e.target.value))}
                          placeholder="+38 (0__) ___-__-__"
                          className={`input ${errors.customer_phone ? "input-error" : ""} ${!errors.customer_phone && formData.customer_phone.length >= 10 ? "border-green-500/50 focus:border-green-500" : ""}`}
                        />
                        {!errors.customer_phone && formData.customer_phone.length >= 18 && ( // Full formatted length
                          <CheckCircleSolidIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                        )}
                      </div>
                      {errors.customer_phone && (
                        <p className="mt-1 text-sm text-accent-red">{errors.customer_phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Email (необов&apos;язково)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.customer_email}
                          onChange={(e) => updateField("customer_email", e.target.value)}
                          placeholder="example@email.com"
                          className={`input ${errors.customer_email ? "input-error" : ""}`}
                        />
                        {formData.customer_email && !errors.customer_email && (
                          <CheckCircleSolidIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                        )}
                      </div>
                      {errors.customer_email && (
                        <p className="mt-1 text-sm text-accent-red">{errors.customer_email}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Крок 2: Адреса доставки */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-secondary">Адреса доставки</h2>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Місто *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        placeholder="Введіть місто"
                        className={`input ${errors.city ? "input-error" : ""}`}
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-accent-red">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Вулиця *
                      </label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => updateField("street", e.target.value)}
                        placeholder="Введіть назву вулиці"
                        className={`input ${errors.street ? "input-error" : ""}`}
                      />
                      {errors.street && (
                        <p className="mt-1 text-sm text-accent-red">{errors.street}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Будинок *
                        </label>
                        <input
                          type="text"
                          value={formData.building}
                          onChange={(e) => updateField("building", e.target.value)}
                          placeholder="№"
                          className={`input ${errors.building ? "input-error" : ""}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Квартира
                        </label>
                        <input
                          type="text"
                          value={formData.apartment}
                          onChange={(e) => updateField("apartment", e.target.value)}
                          placeholder="№"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Під&apos;їзд
                        </label>
                        <input
                          type="text"
                          value={formData.entrance}
                          onChange={(e) => updateField("entrance", e.target.value)}
                          placeholder="№"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Поверх
                        </label>
                        <input
                          type="text"
                          value={formData.floor}
                          onChange={(e) => updateField("floor", e.target.value)}
                          placeholder="№"
                          className="input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Коментар для кур&apos;єра
                      </label>
                      <textarea
                        value={formData.comment}
                        onChange={(e) => updateField("comment", e.target.value)}
                        placeholder="Додаткова інформація для доставки..."
                        rows={3}
                        maxLength={500}
                        className="input resize-none"
                      />
                      <p className="mt-1 text-xs text-secondary-light text-right">
                        {formData.comment.length}/500
                      </p>
                    </div>
                  </div>
                )}

                {/* Крок 3: Спосіб оплати */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-secondary">Спосіб оплати</h2>

                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center p-4 border rounded-xl cursor-pointer transition ${method.disabled
                            ? "opacity-50 cursor-not-allowed"
                            : formData.payment_method === method.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary"
                            }`}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            value={method.value}
                            checked={formData.payment_method === method.value}
                            onChange={(e) => updateField("payment_method", e.target.value as FormData["payment_method"])}
                            disabled={method.disabled}
                            className="sr-only"
                          />
                          <span className="text-2xl mr-4">{method.icon}</span>
                          <span className="font-medium text-secondary">{method.label}</span>
                          {method.disabled && (
                            <span className="ml-auto text-sm text-secondary-light">
                              Скоро
                            </span>
                          )}
                          {!method.disabled && formData.payment_method === method.value && (
                            <CheckIcon className="w-5 h-5 text-primary ml-auto" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Крок 4: Підтвердження */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-secondary">Підтвердження замовлення</h2>

                    {/* Перегляд даних */}
                    <div className="space-y-4">
                      <div className="p-4 bg-theme-secondary rounded-lg">
                        <h3 className="font-semibold text-secondary mb-2">Контактні дані</h3>
                        <p className="text-secondary-light">{formData.customer_name}</p>
                        <p className="text-secondary-light">{formData.customer_phone}</p>
                        {formData.customer_email && (
                          <p className="text-secondary-light">{formData.customer_email}</p>
                        )}
                      </div>

                      <div className="p-4 bg-theme-secondary rounded-lg">
                        <h3 className="font-semibold text-secondary mb-2">Адреса доставки</h3>
                        <p className="text-secondary-light">
                          {formData.city}, вул. {formData.street}, буд. {formData.building}
                          {formData.apartment && `, кв. ${formData.apartment}`}
                        </p>
                        {formData.comment && (
                          <p className="text-secondary-light mt-1 text-sm">
                            Коментар: {formData.comment}
                          </p>
                        )}
                      </div>

                      <div className="p-4 bg-theme-secondary rounded-lg">
                        <h3 className="font-semibold text-secondary mb-2">Спосіб оплати</h3>
                        <p className="text-secondary-light">
                          {PAYMENT_METHODS.find((m) => m.value === formData.payment_method)?.label}
                        </p>
                      </div>
                    </div>

                    {/* Чекбокси */}
                    <div className="space-y-3">
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agree_terms}
                          onChange={(e) => updateField("agree_terms", e.target.checked)}
                          className="mt-1 mr-3 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-secondary-light">
                          Я погоджуюсь з{" "}
                          <Link href="/terms" className="text-primary hover:underline">
                            публічною офертою
                          </Link>{" "}
                          *
                        </span>
                      </label>
                      {errors.agree_terms && (
                        <p className="text-sm text-accent-red ml-7">{errors.agree_terms}</p>
                      )}

                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agree_privacy}
                          onChange={(e) => updateField("agree_privacy", e.target.checked)}
                          className="mt-1 mr-3 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-secondary-light">
                          Я погоджуюсь з{" "}
                          <Link href="/privacy" className="text-primary hover:underline">
                            політикою конфіденційності
                          </Link>{" "}
                          *
                        </span>
                      </label>
                      {errors.agree_privacy && (
                        <p className="text-sm text-accent-red ml-7">{errors.agree_privacy}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Кнопки навігації - адаптивні */}
                <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border gap-2">
                  {currentStep > 1 ? (
                    <button
                      onClick={prevStep}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-gray-300 hover:text-white transition-all duration-200 min-h-[44px] rounded-xl border border-white/10 hover:bg-white/5 active:scale-95"
                    >
                      <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">Назад</span>
                    </button>
                  ) : (
                    <Link
                      href="/menu"
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-gray-300 hover:text-white transition-all duration-200 min-h-[44px] rounded-xl border border-white/10 hover:bg-white/5 active:scale-95"
                    >
                      <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">До меню</span>
                    </Link>
                  )}

                  {currentStep < 4 ? (
                    <button onClick={nextStep} className="btn-primary text-sm sm:text-base flex-1 sm:flex-none sm:min-w-[140px] flex items-center justify-center">
                      Далі
                      <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="btn-primary text-sm sm:text-base flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
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
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Оформлення...
                        </>
                      ) : (
                        "Підтвердити замовлення"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Бокова панель - Sticky Glass Summary */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="sticky top-24 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 sm:p-6 transition-all">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center justify-between">
                  Ваше замовлення
                  <span className="text-xs font-normal text-white/50 bg-white/10 px-2 py-1 rounded-full">Чек</span>
                </h3>

                {/* Список товарів - компактний на мобільних */}
                <ul className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-48 sm:max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <li
                      key={`${item.id}-${item.sizeId || "default"}`}
                      className="flex gap-2 sm:gap-3"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-lg overflow-hidden bg-theme-secondary">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          // Replaced sushi placeholder with Image component
                          <Image
                            src="/placeholder-sushi.png" // Assuming a placeholder image path
                            alt="Sushi placeholder"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-secondary truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-secondary-light">
                          {item.size && `${item.size} • `}
                          {item.quantity} шт.
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-secondary whitespace-nowrap">
                        {item.price * item.quantity} ₴
                      </p>
                    </li>
                  ))}
                </ul>

                {/* Підсумок */}
                <div className="border-t border-border pt-3 sm:pt-4 space-y-3">
                  {/* Smart Upsell: Дожим кошика */}
                  {deliveryCost > 0 ? (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-300">До безкоштовної доставки</span>
                        <span className="font-bold text-primary">{FREE_DELIVERY_FROM - totalAmount} ₴</span>
                      </div>

                      {/* Animated Progress */}
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                          style={{ width: `${Math.min((totalAmount / FREE_DELIVERY_FROM) * 100, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-xl">
                          🎁
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-secondary-light">
                            Додайте ще на <span className="text-white font-bold">{FREE_DELIVERY_FROM - totalAmount} ₴</span> і доставка буде за наш рахунок!
                          </p>
                          {/* Smart Suggestion (Mock for UI) */}
                          {(FREE_DELIVERY_FROM - totalAmount) < 200 && (
                            <button
                              onClick={() => toast.success("Ця функція скоро запрацює! (Demo: Соус додано)")}
                              className="mt-2 text-xs flex items-center gap-1 text-primary hover:text-white transition"
                            >
                              <span className="w-4 h-4 bg-primary rounded-full text-black flex items-center justify-center font-bold text-[10px]">+</span>
                              Додати Соус Унагі (40 ₴)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                      <CheckCircleSolidIcon className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="text-sm font-bold text-white">Безкоштовна доставка активна!</p>
                        <p className="text-xs text-green-400/70">Ми оплатимо виїзд кур&apos;єра</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-secondary-light">Підсумок</span>
                    <span className="font-medium">{totalAmount} ₴</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-secondary-light">Доставка</span>
                    <span className={`font-medium ${deliveryCost === 0 ? "text-primary" : ""}`}>
                      {deliveryCost === 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="text-primary">✓</span> Безкоштовно
                        </span>
                      ) : (
                        `${deliveryCost} ₴`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-border">
                    <span>Разом</span>
                    <span className="text-primary">{finalAmount} ₴</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


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

// Simple debounce utility for autocomplete
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Типи
interface FormData {
  // Крок 1: Контактні дані
  customer_name: string;
  customer_phone: string;

  customer_email: string;
  // Крок 2: Адреса доставки
  delivery_type: "delivery" | "pickup";
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
  delivery_type: "delivery",
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Autocomplete state
  const [streetSuggestions, setStreetSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedStreet = useDebounceValue(formData.street, 500);

  // Fetch street suggestions
  useEffect(() => {
    const fetchStreets = async () => {
      if (debouncedStreet.length < 3 || !showSuggestions) return;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(debouncedStreet)}&city=Lviv&format=json&addressdetails=1&limit=5`
        );
        const data = await response.json();
        setStreetSuggestions(data);
      } catch (error) {
        console.error("Error fetching streets:", error);
      }
    };

    fetchStreets();
  }, [debouncedStreet, showSuggestions]);

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
        if (!token) {
          setIsAuthenticated(false);
          return;
        }
        setIsAuthenticated(true);

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
            city: "Львів",
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
  const deliveryCost = formData.delivery_type === 'pickup' ? 0 : (totalAmount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_COST);
  const finalAmount = totalAmount + deliveryCost;

  // Оновлення поля форми
  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));
    // Очищаємо помилку при зміні поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Форматування телефону - Strict Mask +380 (XX) XXX-XX-XX
  const formatPhone = (value: string) => {
    // Remove all non-digit characters
    let digits = value.replace(/\D/g, "");

    // If empty or just starting, return default prefix
    if (!digits) return "+380";

    // Ensure it starts with 380
    if (digits.startsWith("0")) {
      digits = "38" + digits; // Convert 0XX to 380XX
    } else if (digits.startsWith("80")) {
      digits = "38" + digits.substring(1); // Convert 80XX to 380XX
    } else if (!digits.startsWith("380")) {
      digits = "380" + digits; // Prepend 380 if not present
    }

    // Limit to 12 digits (380 + 9 digits)
    digits = digits.slice(0, 12);

    // Format
    let formatted = "+380";
    if (digits.length > 3) formatted += ` (${digits.slice(3, 5)}`;
    if (digits.length > 5) formatted += `) ${digits.slice(5, 8)}`;
    if (digits.length > 8) formatted += `-${digits.slice(8, 10)}`;
    if (digits.length > 10) formatted += `-${digits.slice(10, 12)}`;

    return formatted;
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
      if (formData.delivery_type === 'delivery') {
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
        delivery_type: formData.delivery_type,
        city: formData.delivery_type === 'delivery' ? formData.city : undefined,
        street: formData.delivery_type === 'delivery' ? formData.street : undefined,
        house: formData.delivery_type === 'delivery' ? formData.building : undefined,
        apartment: formData.delivery_type === 'delivery' ? formData.apartment || undefined : undefined,
        entrance: formData.delivery_type === 'delivery' ? formData.entrance || undefined : undefined,
        floor: formData.delivery_type === 'delivery' ? formData.floor : undefined,
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

        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-32 md:pb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary mb-4 sm:mb-8">
            Оформлення замовлення
          </h1>

          {/* Індикатор прогресу - Живий шлях кур'єра */}
          {/* Індикатор прогресу - Живий шлях кур'єра */}
          <div className="mb-6 sm:mb-10 max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between w-full relative">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isNext = index < STEPS.length - 1;
                const nextStepCompleted = currentStep > STEPS[index + 1]?.id;

                // Determine connector active state
                // Connector is active if CURRENT step is greater than the NEXT step index (meaning we passed this segment)
                // Actually simpler: if the next step is at least active, the connector leading to it (from current) is active?
                // No, we want structure: Step1 --[active]-- Step2 --[inactive]-- Step3
                // Connector i connects Step i and Step i+1.
                // It should be green if Step i+1 is either Completed or Active?
                // If we are on Step 2:
                // Struct: Step1 --[green]-- Step2 --[gray]-- Step3
                // Connector i (after step i) is green if currentStep > step.id.
                const isConnectorActive = currentStep > step.id;

                return (
                  <div key={step.id} className={`flex items-center ${isNext ? "flex-1 w-full" : ""}`}>
                    {/* Step Circle */}
                    <div className="relative z-10 flex flex-col items-center group">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-all duration-300 relative ${isActive
                          ? "bg-white text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-110 border-2 border-green-500"
                          : isCompleted
                            ? "bg-green-500 text-white border-2 border-green-500"
                            : "bg-surface-card border-2 border-white/10 text-gray-400"
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
                            className="absolute -top-8 text-3xl filter drop-shadow-lg"
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            🐊
                          </motion.div>
                        )}
                      </div>
                      <span
                        className={`absolute top-full mt-2 w-max text-xs sm:text-sm font-medium transition-colors duration-300 ${isActive ? "text-green-500" : isCompleted ? "text-white" : "text-gray-500"
                          }`}
                      >
                        {step.name}
                      </span>
                    </div>

                    {/* Connector Line (unless last step) */}
                    {isNext && (
                      <div className="flex-1 h-1.5 mx-2 sm:mx-4 relative rounded-full overflow-hidden bg-white/10">
                        <div
                          className={`absolute inset-0 bg-green-500 rounded-full transition-transform duration-700 ease-in-out origin-left ${isConnectorActive ? "scale-x-100" : "scale-x-0"
                            }`}
                        />
                      </div>
                    )}
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
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                        <UserIcon className="w-6 h-6 text-green-500" />
                        Контактні дані
                      </h2>
                      {!isAuthenticated && (
                        <Link
                          href="/login?redirect=/checkout"
                          className="text-sm font-medium text-primary hover:text-green-400 transition-colors flex items-center gap-1 group"
                        >
                          Вже є акаунт?
                          <span className="underline decoration-dashed decoration-1 underline-offset-4 group-hover:decoration-solid">Увійти</span>
                        </Link>
                      )}
                    </div>

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
                          className={`input text-base bg-[#2C2C2C] border-white/10 focus:border-green-500 focus:ring-1 focus:ring-green-500 hover:border-white/20 transition-all pr-10 ${errors.customer_name ? "input-error" : ""} ${!errors.customer_name && formData.customer_name.length > 2 ? "border-green-500/50" : ""}`}
                          autoComplete="given-name"
                        />
                        {!errors.customer_name && formData.customer_name.length > 2 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                          </div>
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
                          className={`input text-base bg-[#2C2C2C] border-white/10 focus:border-green-500 focus:ring-1 focus:ring-green-500 hover:border-white/20 transition-all pr-10 ${errors.customer_phone ? "input-error" : ""} ${!errors.customer_phone && formData.customer_phone.replace(/\D/g, "").length === 12 ? "border-green-500/50" : ""}`}
                          inputMode="tel"
                          autoComplete="tel"
                        />
                        {!errors.customer_phone && formData.customer_phone.replace(/\D/g, "").length === 12 && ( // Full formatted length
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                          </div>
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
                          className={`input text-base bg-[#2C2C2C] border-white/10 focus:border-green-500 focus:ring-1 focus:ring-green-500 hover:border-white/20 transition-all pr-10 ${errors.customer_email ? "input-error" : ""}`}
                          autoComplete="email"
                        />
                        {formData.customer_email && !errors.customer_email && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                          </div>
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
                    <h2 className="text-xl font-bold text-secondary">Дані доставки</h2>

                    {/* Delivery Type Toggle */}
                    <div className="grid grid-cols-2 gap-4 p-1 bg-black/20 rounded-xl mb-6">
                      <button
                        type="button"
                        onClick={() => updateField("delivery_type", "delivery")}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${formData.delivery_type === "delivery"
                          ? "bg-green-500 text-white shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <TruckIcon className="w-5 h-5" />
                          <span>Доставка</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("delivery_type", "pickup")}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${formData.delivery_type === "pickup"
                          ? "bg-green-500 text-white shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ShoppingBagIcon className="w-5 h-5" />
                          <span>Самовивіз</span>
                        </div>
                      </button>
                    </div>

                    {formData.delivery_type === "pickup" ? (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                        <MapPinIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Самовивіз з ресторану</h3>
                        <p className="text-gray-400 mb-4">
                          Заберіть замовлення за адресою:
                          <br />
                          <span className="text-white font-medium">м. Львів, вул. Володимира Янева, 31</span>
                        </p>
                        <div className="text-sm text-green-500 bg-green-500/10 py-2 px-4 rounded-lg inline-block">
                          Час приготування: ~30-40 хв
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                          <div className="relative z-20">
                            <label className="block text-sm font-medium text-secondary mb-2">
                              Вулиця *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={formData.street}
                                onChange={(e) => {
                                  updateField("street", e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Почніть вводити назву вулиці..."
                                className={`input bg-[#2C2C2C] border-white/10 focus:border-green-500 hover:border-white/20 transition-colors ${errors.street ? "input-error" : ""}`}
                                autoComplete="off"
                              />
                              {/* Autocomplete Dropdown */}
                              <AnimatePresence>
                                {showSuggestions && streetSuggestions.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-[#2C2C2C] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto"
                                  >
                                    {streetSuggestions.map((suggestion, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          updateField("street", suggestion.name || suggestion.address.road || "");
                                          setStreetSuggestions([]);
                                          setShowSuggestions(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm transition-colors border-b border-white/5 last:border-0"
                                      >
                                        <span className="text-secondary font-medium">{suggestion.name || suggestion.address.road}</span>
                                        {suggestion.address.suburb && (
                                          <span className="text-secondary-light text-xs ml-2">({suggestion.address.suburb})</span>
                                        )}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            {errors.street && (
                              <p className="mt-1 text-sm text-accent-red">{errors.street}</p>
                            )}
                          </div>

                          <div className="w-[140px]">
                            <label className="block text-sm font-medium text-secondary mb-2">
                              Місто
                            </label>
                            <input
                              type="text"
                              value="Львів"
                              readOnly
                              className="input bg-surface-card opacity-50 cursor-not-allowed text-center"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-secondary-light mb-1.5">
                              Будинок *
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.building}
                              onChange={(e) => updateField("building", e.target.value)}
                              placeholder="№"
                              className={`input bg-[#2C2C2C] border-white/10 focus:border-green-500 hover:border-white/20 transition-colors text-center ${errors.building ? "input-error" : ""}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-secondary-light mb-1.5">
                              Кв / Офіс
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.apartment}
                              onChange={(e) => updateField("apartment", e.target.value)}
                              placeholder="№"
                              className="input bg-[#2C2C2C] border-white/10 focus:border-green-500 hover:border-white/20 transition-colors text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-secondary-light mb-1.5">
                              Під&apos;їзд
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.entrance}
                              onChange={(e) => updateField("entrance", e.target.value)}
                              placeholder="№"
                              className="input bg-[#2C2C2C] border-white/10 focus:border-green-500 hover:border-white/20 transition-colors text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-secondary-light mb-1.5">
                              Поверх
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.floor}
                              onChange={(e) => updateField("floor", e.target.value)}
                              placeholder="№"
                              className="input bg-[#2C2C2C] border-white/10 focus:border-green-500 hover:border-white/20 transition-colors text-center"
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
                            className="input bg-[#2C2C2C] border-white/10 focus:border-green-500 hover:border-white/20 transition-colors resize-none"
                          />
                          <p className="mt-1 text-xs text-secondary-light text-right">
                            {formData.comment.length}/500
                          </p>
                        </div>
                      </div>
                    )}
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
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Підтвердження даних</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Контакти */}
                      <div className="group p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                          <label className="text-sm text-gray-400 uppercase tracking-wide font-bold">Контакт</label>
                        </div>
                        <p className="text-lg text-white font-medium">{formData.customer_name}</p>
                        <p className="text-white/80">{formData.customer_phone}</p>
                        <p className="text-sm text-gray-500 mt-1">{formData.customer_email}</p>
                      </div>

                      {/* Доставка */}
                      <div className="group p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPinIcon className="w-5 h-5 text-gray-400" />
                          <label className="text-sm text-gray-400 uppercase tracking-wide font-bold">
                            {formData.delivery_type === "pickup" ? "Самовивіз" : "Доставка"}
                          </label>
                        </div>
                        {formData.delivery_type === "pickup" ? (
                          <>
                            <p className="text-lg text-white font-medium">Самовивіз з ресторану</p>
                            <p className="text-white/80">м. Львів, вул. Володимира Янева, 31</p>
                          </>
                        ) : (
                          <>
                            <p className="text-lg text-white font-medium">{formData.city}</p>
                            <p className="text-white/80">вул. {formData.street}, буд. {formData.building}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formData.apartment && `кв. ${formData.apartment}`}
                              {formData.entrance && ` • під'їзд ${formData.entrance}`}
                              {formData.floor && ` • поверх ${formData.floor}`}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Оплата */}
                      <div className="group md:col-span-2 p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCardIcon className="w-5 h-5 text-gray-400" />
                            <label className="text-sm text-gray-400 uppercase tracking-wide font-bold">Оплата</label>
                          </div>
                          <div className="flex items-center gap-2 text-white">
                            <span className="text-2xl">{PAYMENT_METHODS.find((m) => m.value === formData.payment_method)?.icon}</span>
                            <span className="text-lg font-medium">{PAYMENT_METHODS.find((m) => m.value === formData.payment_method)?.label}</span>
                          </div>
                        </div>
                        <button onClick={() => setCurrentStep(3)} className="text-sm text-green-400 hover:text-green-300 underline mt-2 sm:mt-0 font-medium transition-colors">
                          Змінити
                        </button>
                      </div>

                    </div>

                    <div className="border-t border-white/10 my-6" />

                    {/* Чекбокси - Unified */}
                    <div className="bg-surface-card/50 p-4 rounded-xl border border-white/5">
                      <label className="flex items-start cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.agree_terms && formData.agree_privacy}
                            onChange={(e) => {
                              updateField("agree_terms", e.target.checked);
                              updateField("agree_privacy", e.target.checked);
                            }}
                            className="peer sr-only"
                          />
                          <div className="w-5 h-5 border-2 border-gray-400 rounded peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center mr-3 group-hover:border-green-400">
                            <CheckIcon className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <span className="text-sm text-secondary-light select-none group-hover:text-gray-200 transition-colors">
                          Я підтверджую замовлення та погоджуюсь з{" "}
                          <Link href="/terms" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                            публічною офертою
                          </Link>{" "}
                          та{" "}
                          <Link href="/privacy" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                            політикою конфіденційності
                          </Link>
                        </span>
                      </label>
                      {(errors.agree_terms || errors.agree_privacy) && (
                        <p className="text-sm text-accent-red mt-2 pl-8">Будь ласка, погодьтесь з умовами для продовження</p>
                      )}
                    </div>

                  </div>
                )}

                {/* Кнопки навігації - адаптивні */}
                <div className={`flex items-center gap-4 mt-8 pt-6 border-t border-white/5 ${currentStep === 4 ? "flex-col-reverse md:flex-row md:justify-between" : "justify-between"}`}>

                  {/* Back Button */}
                  {currentStep > 1 && (
                    <button
                      onClick={prevStep}
                      className={`flex items-center justify-center gap-2 h-12 rounded-xl transition-all duration-200 active:scale-95 group ${currentStep === 4 ? "w-full md:w-auto text-gray-400 hover:text-white px-4 hover:bg-white/5" : "px-6 text-gray-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5"}`}
                    >
                      <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      <span className="font-medium text-base">Назад</span>
                    </button>
                  )}

                  {/* Home Button for Step 1 */}
                  {currentStep === 1 && (
                    <Link
                      href="/menu"
                      className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl transition-all duration-200 active:scale-95 text-gray-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5 group"
                    >
                      <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      <span className="font-medium text-base">До меню</span>
                    </Link>
                  )}

                  {currentStep < 4 ? (
                    <button
                      onClick={nextStep}
                      className="btn-primary h-12 px-8 flex items-center justify-center text-base shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_25px_rgba(34,197,94,0.4)] transition-all transform hover:-translate-y-0.5"
                    >
                      <span className="font-bold">{currentStep === 1 ? "До доставки" : "Далі"}</span>
                      <ChevronRightIcon className="w-5 h-5 ml-2" />
                    </button>
                  ) : (
                    /* Sticky Mobile Footer for Confirm Button */
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1E1E1E]/90 backdrop-blur-lg border-t border-white/10 md:relative md:bg-transparent md:border-0 md:p-0 z-50">
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="btn-primary w-full md:w-auto md:px-12 py-4 h-14 md:h-12 text-lg font-bold shadow-[0_4px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_40px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Обробка...
                          </>
                        ) : (
                          "Підтвердити замовлення"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Бокова панель - Sticky Glass Summary */}
            <div className="lg:col-span-1 order-1 lg:order-2 h-full">
              <div className="sticky top-24 space-y-4">
                <div className="bg-[#1E1E1E] border border-white/10 shadow-2xl rounded-2xl p-4 sm:p-6 overflow-hidden relative">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                  <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between relative z-10">
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
                              Додайте ще на <span className="text-yellow-400 font-bold text-sm shadow-black/50 drop-shadow-md">{FREE_DELIVERY_FROM - totalAmount} ₴</span> і доставка буде за наш рахунок!
                            </p>
                            {/* Smart Suggestion (Mock for UI) */}
                            {(FREE_DELIVERY_FROM - totalAmount) < 200 && (
                              <button
                                onClick={() => toast.success("Ця функція скоро запрацює! (Demo: Соус додано)")}
                                className="mt-3 w-full bg-[#1E1E1E] hover:bg-[#2C2C2C] border border-white/10 rounded-lg py-2 px-3 flex items-center justify-center gap-2 group transition-all active:scale-95"
                              >
                                <div className="w-5 h-5 bg-green-500 rounded-full text-black flex items-center justify-center font-bold text-xs shadow-lg group-hover:scale-110 transition-transform">+</div>
                                <span className="text-xs font-bold text-white uppercase tracking-wide">Додати Соус Унагі</span>
                                <span className="text-xs text-secondary-light">(40 ₴)</span>
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
                    <div className="flex justify-between items-end border-t border-border pt-4 mt-2">
                      <span className="text-base font-medium text-gray-400 mb-1">Разом до сплати</span>
                      <span className="text-3xl font-bold text-white tracking-tight">{finalAmount} <span className="text-xl text-gray-400 font-normal">₴</span></span>
                    </div>
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


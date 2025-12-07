"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, PhoneIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "@/store/localeStore";

interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CallbackModal({ isOpen, onClose }: CallbackModalProps) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Форматування телефону
  const formatPhone = (value: string) => {
    // Видаляємо всі символи крім цифр
    const digits = value.replace(/\D/g, "");

    // Форматуємо телефон
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 5) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
    if (digits.length <= 8) return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5)}`;
    if (digits.length <= 10) return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError("");
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("380");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      setError(t("validation.invalidPhone"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ""),
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setPhone("");
        }, 2000);
      } else {
        const data = await response.json();
        // Handle Pydantic validation errors (array of objects) or string errors
        const errorMessage = typeof data.detail === 'string'
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((e: any) => e.msg).join(', ')
            : t("callback.error");
        setError(errorMessage);
      }
    } catch {
      setError(t("callback.error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Скидаємо стан при закритті
  useEffect(() => {
    if (!isOpen) {
      setPhone("");
      setError("");
      setIsSuccess(false);
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-card p-6 shadow-modal transition-all">
                {/* Кнопка закриття */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-secondary-light hover:text-secondary transition"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                {isSuccess ? (
                  // Успішне відправлення
                  <div className="text-center py-8">
                    <CheckCircleIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                    <Dialog.Title className="text-2xl font-bold text-secondary mb-2">
                      {t("callback.thankYou") || "Дякуємо!"}
                    </Dialog.Title>
                    <p className="text-secondary-light">
                      {t("callback.success")}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Заголовок */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PhoneIcon className="w-8 h-8 text-primary" />
                      </div>
                      <Dialog.Title className="text-2xl font-bold text-secondary">
                        {t("callback.title")}
                      </Dialog.Title>
                      <p className="text-secondary-light mt-2">
                        {t("callback.description")}
                      </p>
                    </div>

                    {/* Форма */}
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-secondary mb-2">
                          {t("callback.phone")}
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="+38 (0__) ___-__-__"
                          className={`input text-lg ${error ? "input-error" : ""}`}
                          autoFocus
                        />
                        {error && (
                          <p className="mt-2 text-sm text-accent-red">{error}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t("common.loading")}
                          </span>
                        ) : (
                          t("callback.submit")
                        )}
                      </button>
                    </form>

                    <p className="text-xs text-center text-secondary-light mt-4">
                      {t("callback.privacyNote")}{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        {t("auth.privacy")}
                      </a>
                    </p>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}


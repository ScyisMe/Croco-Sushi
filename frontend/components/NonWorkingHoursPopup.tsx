"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, PhoneIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "@/store/localeStore";
import apiClient from "@/lib/api/apiClient";

interface NonWorkingHoursPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NonWorkingHoursPopup({ isOpen, onClose }: NonWorkingHoursPopupProps) {
    const { t } = useTranslation();
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    // Форматування телефону
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, "");
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
            await apiClient.post("/callback", {
                phone: phone.replace(/\D/g, ""),
            });

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setPhone("");
            }, 3000);
        } catch (error: any) {
            const data = error.response?.data;
            const errorMessage =
                data && typeof data.detail === "string"
                    ? data.detail
                    : t("callback.error");
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1A1A1A] border border-white/10 p-6 shadow-2xl transition-all relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-red to-transparent opacity-50"></div>

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>

                                {isSuccess ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircleIcon className="w-10 h-10 text-primary" />
                                        </div>
                                        <Dialog.Title as="div" className="text-2xl font-bold text-white mb-2">
                                            {t("callback.thankYou")}
                                        </Dialog.Title>
                                        <p className="text-gray-400">
                                            {t("callback.success")}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                <ClockIcon className="w-8 h-8 text-accent-red" />
                                            </div>
                                            <Dialog.Title as="div" className="text-2xl font-bold text-white mb-3">
                                                {t("callback.closedTitle") || "Ми наразі зачинені"}
                                            </Dialog.Title>
                                            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                                                {t("callback.closedDescription") || "Залиште свій номер, і ми передзвонимо вам в робочий час для оформлення замовлення"}
                                            </p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label htmlFor="phone" className="sr-only">
                                                    {t("callback.phone")}
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <PhoneIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        id="phone"
                                                        value={phone}
                                                        onChange={handlePhoneChange}
                                                        placeholder="+38 (0__) ___-__-__"
                                                        className={`block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 sm:text-sm transition-colors ${error ? "border-accent-red/50 focus:ring-accent-red/50" : ""}`}
                                                        autoFocus
                                                    />
                                                </div>
                                                {error && (
                                                    <p className="mt-2 text-xs text-accent-red text-center">{error}</p>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? (
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    t("callback.submit")
                                                )}
                                            </button>
                                        </form>

                                        <p className="text-[10px] text-center text-gray-600 mt-6">
                                            Графік роботи: {t("header.workingHours") || "10:00 - 21:45"}
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

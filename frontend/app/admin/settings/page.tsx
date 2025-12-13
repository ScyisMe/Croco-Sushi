
"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/apiClient";
import {
    Cog6ToothIcon,
    BuildingStorefrontIcon,
    TruckIcon,
    CreditCardIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface Settings {
    project_name: string;
    contact_phone?: string;
    contact_email?: string;
    address?: string;
    working_hours?: string;
    min_order_amount?: number;
    delivery_cost?: number;
    free_delivery_threshold?: number;
    sms_api_key?: string;
    payment_liqpay_public_key?: string;
    payment_liqpay_private_key?: string;
    google_maps_api_key?: string;
    google_analytics_id?: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        project_name: "",
    });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get<Settings>("/admin/settings");
            setSettings(response.data);
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast.error("Не вдалося завантажити налаштування");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.put("/admin/settings", settings);
            toast.success("Налаштування збережено");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Помилка при збереженні");
        }
    };

    const handleChange = (field: keyof Settings, value: string | number) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    const tabs = [
        { id: "general", label: "Загальні", icon: BuildingStorefrontIcon },
        { id: "delivery", label: "Доставка", icon: TruckIcon },
        { id: "integrations", label: "Інтеграції", icon: CreditCardIcon },
    ];

    const inputClassName = "w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Налаштування</h1>
                    <p className="text-gray-400">Конфігурація сайту та інтеграцій</p>
                </div>
                <button
                    onClick={handleSubmit}
                    className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                    <Cog6ToothIcon className="w-5 h-5 mr-2" />
                    Зберегти зміни
                </button>
            </div>

            <div className="bg-surface-card rounded-xl shadow-sm border border-white/10 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-6 py-4 text-sm font-medium transition ${activeTab === tab.id
                                ? "text-primary-500 border-b-2 border-primary-500 bg-white/5"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <tab.icon className="w-5 h-5 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        {activeTab === "general" && (
                            <div className="space-y-4 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Назва проекту</label>
                                    <input
                                        type="text"
                                        className={inputClassName}
                                        value={settings.project_name}
                                        onChange={e => handleChange("project_name", e.target.value)}
                                        placeholder="Croco Sushi"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Телефон</label>
                                        <input
                                            type="text"
                                            className={inputClassName}
                                            value={settings.contact_phone || ""}
                                            onChange={e => handleChange("contact_phone", e.target.value)}
                                            placeholder="+380 XX XXX XX XX"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            className={inputClassName}
                                            value={settings.contact_email || ""}
                                            onChange={e => handleChange("contact_email", e.target.value)}
                                            placeholder="info@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Адреса</label>
                                    <input
                                        type="text"
                                        className={inputClassName}
                                        value={settings.address || ""}
                                        onChange={e => handleChange("address", e.target.value)}
                                        placeholder="м. Київ, вул. Хрещатик, 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Години роботи</label>
                                    <input
                                        type="text"
                                        className={inputClassName}
                                        value={settings.working_hours || ""}
                                        onChange={e => handleChange("working_hours", e.target.value)}
                                        placeholder="10:00 - 22:00"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "delivery" && (
                            <div className="space-y-4 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Мінімальна сума замовлення (₴)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className={inputClassName}
                                        value={settings.min_order_amount || 0}
                                        onChange={e => handleChange("min_order_amount", Number(e.target.value))}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Мінімальна сума для оформлення замовлення</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Базова вартість доставки (₴)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className={inputClassName}
                                        value={settings.delivery_cost || 0}
                                        onChange={e => handleChange("delivery_cost", Number(e.target.value))}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Вартість доставки для замовлень нижче порогу безкоштовної доставки</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Безкоштовна доставка від (₴)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className={inputClassName}
                                        value={settings.free_delivery_threshold || 0}
                                        onChange={e => handleChange("free_delivery_threshold", Number(e.target.value))}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">При замовленні на цю суму та вище — доставка безкоштовна</p>
                                </div>
                            </div>
                        )}

                        {activeTab === "integrations" && (
                            <div className="space-y-6 max-w-2xl">
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        Google Maps
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                                        <input
                                            type="password"
                                            className={inputClassName}
                                            value={settings.google_maps_api_key || ""}
                                            onChange={e => handleChange("google_maps_api_key", e.target.value)}
                                            placeholder="••••••••••••••••"
                                        />
                                    </div>
                                </div>

                                {/* LiqPay Section */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                        LiqPay (Оплата)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Public Key</label>
                                            <input
                                                type="text"
                                                className={inputClassName}
                                                value={settings.payment_liqpay_public_key || ""}
                                                onChange={e => handleChange("payment_liqpay_public_key", e.target.value)}
                                                placeholder="sandbox_xxxxxxxx"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Private Key</label>
                                            <input
                                                type="password"
                                                className={inputClassName}
                                                value={settings.payment_liqpay_private_key || ""}
                                                onChange={e => handleChange("payment_liqpay_private_key", e.target.value)}
                                                placeholder="••••••••••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Google Analytics Section */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                        Google Analytics
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Measurement ID</label>
                                        <input
                                            type="text"
                                            className={inputClassName}
                                            value={settings.google_analytics_id || ""}
                                            onChange={e => handleChange("google_analytics_id", e.target.value)}
                                            placeholder="G-XXXXXXXXXX"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}


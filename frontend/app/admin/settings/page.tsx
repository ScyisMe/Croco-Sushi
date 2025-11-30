"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import {
    Cog6ToothIcon,
    BuildingStorefrontIcon,
    TruckIcon,
    CreditCardIcon,
    ChatBubbleLeftRightIcon
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Налаштування</h1>
                    <p className="text-gray-500">Конфігурація сайту та інтеграцій</p>
                </div>
                <button
                    onClick={handleSubmit}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    <Cog6ToothIcon className="w-5 h-5 mr-2" />
                    Зберегти зміни
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`flex items-center px-6 py-4 text-sm font-medium transition \${activeTab === 'general' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
                        Загальні
                    </button>
                    <button
                        onClick={() => setActiveTab("delivery")}
                        className={`flex items-center px-6 py-4 text-sm font-medium transition \${activeTab === 'delivery' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <TruckIcon className="w-5 h-5 mr-2" />
                        Доставка
                    </button>
                    <button
                        onClick={() => setActiveTab("integrations")}
                        className={`flex items-center px-6 py-4 text-sm font-medium transition \${activeTab === 'integrations' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <CreditCardIcon className="w-5 h-5 mr-2" />
                        Інтеграції
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        {activeTab === "general" && (
                            <div className="space-y-4 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Назва проекту</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={settings.project_name}
                                        onChange={e => handleChange("project_name", e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                            value={settings.contact_phone || ""}
                                            onChange={e => handleChange("contact_phone", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                            value={settings.contact_email || ""}
                                            onChange={e => handleChange("contact_email", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Адреса</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={settings.address || ""}
                                        onChange={e => handleChange("address", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Години роботи</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Мінімальна сума замовлення (₴)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={settings.min_order_amount || 0}
                                        onChange={e => handleChange("min_order_amount", Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Базова вартість доставки (₴)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={settings.delivery_cost || 0}
                                        onChange={e => handleChange("delivery_cost", Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Безкоштовна доставка від (₴)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={settings.free_delivery_threshold || 0}
                                        onChange={e => handleChange("free_delivery_threshold", Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "integrations" && (
                            <div className="space-y-4 max-w-2xl">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">SMS (TurboSMS)</h3>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={settings.sms_api_key || ""}
                                        onChange={e => handleChange("sms_api_key", e.target.value)}
                                    />
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Google Maps</h3>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        value={settings.google_maps_api_key || ""}
                                        onChange={e => handleChange("google_maps_api_key", e.target.value)}
                                    />
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">LiqPay</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                value={settings.payment_liqpay_public_key || ""}
                                                onChange={e => handleChange("payment_liqpay_public_key", e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Private Key</label>
                                            <input
                                                type="password"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                                value={settings.payment_liqpay_private_key || ""}
                                                onChange={e => handleChange("payment_liqpay_private_key", e.target.value)}
                                            />
                                        </div>
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

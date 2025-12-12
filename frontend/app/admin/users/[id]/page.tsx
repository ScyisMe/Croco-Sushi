"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    ShoppingBagIcon,
    CurrencyDollarIcon,
    GiftIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/api/apiClient";
import { User, Order } from "@/lib/types";
import { format } from "date-fns";

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const userId = params.id as string;
    const isNew = userId === "new";

    const [bonusAmount, setBonusAmount] = useState("");
    const [bonusReason, setBonusReason] = useState("");

    // Fetch user details
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ["admin", "users", userId],
        queryFn: async () => {
            if (isNew) return null;
            const response = await apiClient.get<User>(`/admin/users/${userId}`);
            return response.data;
        },
        enabled: !isNew,
    });

    // Fetch user orders
    const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
        queryKey: ["admin", "orders", "user", userId],
        queryFn: async () => {
            if (isNew) return [];
            const response = await apiClient.get<Order[]>("/admin/orders", {
                params: { user_id: userId },
            });
            return response.data;
        },
        enabled: !isNew,
    });

    // Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<Partial<User>>({
        values: user || {},
    });

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: async (data: Partial<User>) => {
            if (isNew) {
                // TODO: Implement create user endpoint if available
                toast.error("Створення користувача ще не реалізовано");
                throw new Error("Not implemented");
            } else {
                const response = await apiClient.put<User>(`/admin/users/${userId}`, data);
                return response.data;
            }
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["admin", "users", userId], data);
            toast.success("Дані користувача оновлено");
            if (isNew) router.push(`/admin/users/${data.id}`);
        },
        onError: () => {
            toast.error("Помилка при збереженні");
        },
    });

    // Block/Unblock mutation
    const toggleBlockMutation = useMutation({
        mutationFn: async () => {
            const endpoint = user?.is_active
                ? `/admin/users/${userId}/block`
                : `/admin/users/${userId}/unblock`;
            const response = await apiClient.put<User>(endpoint);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["admin", "users", userId], data);
            toast.success(data.is_active ? "Користувача розблоковано" : "Користувача заблоковано");
        },
    });

    // Add bonus mutation
    const addBonusMutation = useMutation({
        mutationFn: async () => {
            const amount = parseInt(bonusAmount);
            if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

            const response = await apiClient.post<User>(`/admin/users/${userId}/add-bonus`, {
                amount,
                reason: bonusReason,
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["admin", "users", userId], data);
            toast.success("Бонуси нараховано");
            setBonusAmount("");
            setBonusReason("");
        },
        onError: () => {
            toast.error("Помилка при нарахуванні бонусів");
        },
    });

    if (isUserLoading) {
        return <div className="p-8 text-center">Завантаження...</div>;
    }

    if (!user && !isNew) {
        return <div className="p-8 text-center">Користувача не знайдено</div>;
    }

    const onSubmit = (data: Partial<User>) => {
        updateUserMutation.mutate(data);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/users"
                        className="p-2 hover:bg-gray-700 rounded-full transition text-gray-400"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {isNew ? "Новий користувач" : user?.name || "Користувач"}
                        </h1>
                        {!isNew && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>ID: {user?.id}</span>
                                <span>•</span>
                                <span>Реєстрація: {user?.created_at ? format(new Date(user.created_at), "dd.MM.yyyy") : "-"}</span>
                            </div>
                        )}
                    </div>
                </div>
                {!isNew && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => toggleBlockMutation.mutate()}
                            className={`btn ${user?.is_active ? "btn-danger" : "btn-success"}`}
                        >
                            {user?.is_active ? "Заблокувати" : "Розблокувати"}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Form */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-primary" />
                            Основна інформація
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Ім&apos;я
                                    </label>
                                    <input
                                        {...register("name")}
                                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Телефон
                                    </label>
                                    <input
                                        {...register("phone")}
                                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        {...register("email")}
                                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Роль
                                    </label>
                                    <select
                                        {...register("role")}
                                        className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-700 text-white"
                                    >
                                        <option value="client">Клієнт</option>
                                        <option value="manager">Менеджер</option>
                                        <option value="admin">Адмін</option>
                                        <option value="courier">Кур&apos;єр</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...register("newsletter_subscription")}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-300">Підписка на новини</span>
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary"
                                >
                                    {isSubmitting ? "Збереження..." : "Зберегти зміни"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Orders History */}
                    {!isNew && (
                        <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <ShoppingBagIcon className="w-5 h-5 text-primary" />
                                Історія замовлень
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-700 border-b border-gray-600">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-gray-300">№</th>
                                            <th className="px-4 py-3 font-medium text-gray-300">Дата</th>
                                            <th className="px-4 py-3 font-medium text-gray-300">Сума</th>
                                            <th className="px-4 py-3 font-medium text-gray-300">Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {isOrdersLoading ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-gray-300">Завантаження...</td></tr>
                                        ) : orders.length === 0 ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-gray-400">Замовлень немає</td></tr>
                                        ) : (
                                            orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-700">
                                                    <td className="px-4 py-3 text-gray-200">
                                                        <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">
                                                            {order.order_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400">
                                                        {format(new Date(order.created_at), "dd.MM.yyyy HH:mm")}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-white">
                                                        {order.total_amount} ₴
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'}`}
                                                        >
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                {!isNew && (
                    <div className="space-y-6">
                        {/* Loyalty Card */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <GiftIcon className="w-5 h-5 text-primary" />
                                Лояльність
                            </h2>

                            <div className="bg-gray-700 p-4 rounded-lg mb-4">
                                <div className="text-sm text-gray-400 mb-1">Бонусний баланс</div>
                                <div className="text-3xl font-bold text-primary">{user?.bonus_balance} ₴</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Статус: <span className="font-medium text-white uppercase">{user?.loyalty_status}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Нарахувати бонуси
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Сума"
                                        value={bonusAmount}
                                        onChange={(e) => setBonusAmount(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Причина (опціонально)"
                                    value={bonusReason}
                                    onChange={(e) => setBonusReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-gray-700 text-white placeholder-gray-400"
                                />
                                <button
                                    onClick={() => addBonusMutation.mutate()}
                                    disabled={!bonusAmount || addBonusMutation.isPending}
                                    className="w-full btn-primary py-2 text-sm"
                                >
                                    {addBonusMutation.isPending ? "Нарахування..." : "Нарахувати"}
                                </button>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <CurrencyDollarIcon className="w-5 h-5 text-primary" />
                                Статистика
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                    <span className="text-gray-400">Всього замовлень</span>
                                    <span className="font-bold text-white">{orders.length}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                    <span className="text-gray-400">Загальна сума</span>
                                    <span className="font-bold text-primary">
                                        {orders.reduce((sum, order) => sum + Number(order.total_amount), 0).toFixed(2)} ₴
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                    <span className="text-gray-400">Середній чек</span>
                                    <span className="font-bold text-primary">
                                        {orders.length > 0
                                            ? (orders.reduce((sum, order) => sum + Number(order.total_amount), 0) / orders.length).toFixed(2)
                                            : "0.00"} ₴
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


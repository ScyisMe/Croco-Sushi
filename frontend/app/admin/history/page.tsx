"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/apiClient";
import { MagnifyingGlassIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// Duplicated STATUS_CONFIG (should be shared)
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: "Очікує", color: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" },
    confirmed: { label: "Підтверджено", color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
    preparing: { label: "Готується", color: "bg-orange-500/10 text-orange-500 border border-orange-500/20" },
    ready: { label: "Готово", color: "bg-green-500/10 text-green-500 border border-green-500/20" },
    delivering: { label: "Доставляється", color: "bg-purple-500/10 text-purple-500 border border-purple-500/20" },
    completed: { label: "Виконано", color: "bg-white/5 text-gray-400 border border-white/10" },
    cancelled: { label: "Скасовано", color: "bg-red-500/10 text-red-500 border border-red-500/20" },
};

interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    status: string;
    payment_method: string;
    created_at: string;
    // For Modal
    delivery_type: string;
    delivery_address?: string;
    items?: any[];
    history?: any[];
}

export default function OrderHistoryPage() {
    const [historyLog, setHistoryLog] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [hasMore, setHasMore] = useState(true);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to first page on new search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const skip = (page - 1) * limit;

            const params = new URLSearchParams();
            params.append('limit', limit.toString());
            params.append('skip', skip.toString());

            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }

            const response = await apiClient.get<any[]>(`/admin/orders/history-log?${params.toString()}`);

            if (Array.isArray(response.data)) {
                setHistoryLog(response.data);
                setHasMore(response.data.length === limit);
            } else {
                setHistoryLog([]);
                setHasMore(false);
            }

        } catch (error) {
            console.error("Failed to fetch history log:", error);
            toast.error("Не вдалося завантажити журнал змін");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    }

    // Helper for Status Badge
    const StatusBadge = ({ status }: { status: string }) => {
        const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Історія змін статусів</h1>
                    <p className="text-gray-400">Журнал усіх змін статусів замовлень (Audit Log)</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-surface-card rounded-xl shadow-sm p-4 border border-white/10">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Пошук за номером замовлення, іменем клієнта або менеджера..."
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
                        />
                    </div>
                </form>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            ) : historyLog.length === 0 ? (
                <div className="text-center py-12 bg-surface-card rounded-xl border border-white/10">
                    <p className="text-gray-400">Історія змін порожня</p>
                </div>
            ) : (
                <>
                    <div className="bg-surface-card border border-white/10 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase">Час</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase">Замовлення</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase">Менеджер</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase">Зміна статусу</th>
                                        <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase">Коментар</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {historyLog.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(item.changed_at).toLocaleString("uk-UA")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">{item.order_number}</div>
                                                <div className="text-xs text-gray-500">{item.customer_name}</div>
                                                <div className="text-xs text-gray-500">{item.total_amount} ₴</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {item.manager_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status={item.previous_status} />
                                                    <ArrowRightIcon className="w-4 h-4 text-gray-500" />
                                                    <StatusBadge status={item.new_status} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate" title={item.comment}>
                                                {item.comment || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center bg-surface-card p-4 rounded-xl border border-white/10">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            Попередня
                        </button>
                        <span className="text-gray-400 text-sm">
                            Сторінка {page}
                        </span>
                        <button
                            disabled={!hasMore}
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Наступна
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}


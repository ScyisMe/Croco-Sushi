"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import { OrderTable } from "@/components/admin/orders/OrderTable";
import { MagnifyingGlassIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useOrderStatus } from "@/hooks/useOrderStatus";
import { StatusChangeModal } from "@/components/admin/orders/StatusChangeModal";
import { OrderDetailsModal } from "@/components/admin/orders/OrderDetailsModal";

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
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [hasMore, setHasMore] = useState(true);

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Status Hook
    const {
        changeStatus,
        confirmCancel,
        cancelModalOpen,
        closeCancelModal,
        isLoading: isStatusLoading
    } = useOrderStatus({
        onStatusChanged: (orderId, newStatus) => {
            setOrders(current =>
                current.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
            );
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
            toast.success(`Статус оновлено`);
        }
    });

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to first page on new search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const skip = (page - 1) * limit;

            const params = new URLSearchParams();
            params.append('limit', limit.toString());
            params.append('skip', skip.toString());

            // Default statuses for history
            params.append('status', 'completed');
            params.append('status', 'cancelled');

            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }

            const response = await apiClient.get<Order[]>(`/admin/orders?${params.toString()}`);

            if (Array.isArray(response.data)) {
                setOrders(response.data);
                setHasMore(response.data.length === limit);
            } else {
                setOrders([]);
                setHasMore(false);
            }

        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("Не вдалося завантажити історію замовлень");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Search is already handled by debounce effect
    }

    const handleRowClick = async (order: any) => {
        // Fetch full order details including items if needed
        // Assuming the list order object might not have items
        try {
            // Optimistically open with existing data
            setSelectedOrder(order);
            setIsDetailsModalOpen(true);

            // Optionally fetch detail to get items if missing
            if (!order.items) {
                const res = await apiClient.get(`/admin/orders/${order.id}`);
                setSelectedOrder(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Історія замовлень</h1>
                    <p className="text-gray-400">Архів виконаних та скасованих замовлень</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-surface-card rounded-xl shadow-sm p-4 border border-white/10">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Пошук за номером, ім'ям або телефоном..."
                            className="w-full pl-10 pr-4 py-2 bg-surface/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
                    >
                        Пошук
                    </button>
                </form>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-surface-card rounded-xl border border-white/10">
                    <p className="text-gray-400">Замовлень не знайдено</p>
                </div>
            ) : (
                <>
                    <OrderTable orders={orders} onRowClick={handleRowClick} />

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

            <OrderDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                order={selectedOrder as any}
                statusConfig={STATUS_CONFIG}
                onStatusChange={changeStatus}
            />

            <StatusChangeModal
                isOpen={cancelModalOpen}
                onClose={closeCancelModal}
                onConfirm={confirmCancel}
                status="cancelled"
                isLoading={isStatusLoading}
            />
        </div>
    );
}

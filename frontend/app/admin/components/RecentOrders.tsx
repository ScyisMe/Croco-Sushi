"use client";

import Link from "next/link";
import { ClockIcon } from "@heroicons/react/24/outline";

interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
}

interface RecentOrdersProps {
    orders?: Order[];
    isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    delivering: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Н new',
    confirmed: 'Підтверджено',
    preparing: 'Готується',
    delivering: 'Доставляється',
    completed: 'Виконано',
    cancelled: 'Скасовано',
};

export default function RecentOrders({ orders = [], isLoading = false }: RecentOrdersProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                ))}
            </div>
        );
    }

    // Mock data if none provided
    const displayOrders = orders.length > 0 ? orders : [
        { id: 1, order_number: 'ORD-2024-001', customer_name: 'Олександр П.', total: 850, status: 'pending', created_at: '2024-01-15T14:30:00' },
        { id: 2, order_number: 'ORD-2024-002', customer_name: 'Марія К.', total: 1200, status: 'confirmed', created_at: '2024-01-15T13:15:00' },
        { id: 3, order_number: 'ORD-2024-003', customer_name: 'Іван С.', total: 650, status: 'preparing', created_at: '2024-01-15T12:45:00' },
        { id: 4, order_number: 'ORD-2024-004', customer_name: 'Анна Г.', total: 950, status: 'delivering', created_at: '2024-01-15T11:20:00' },
        { id: 5, order_number: 'ORD-2024-005', customer_name: 'Петро М.', total: 1500, status: 'completed', created_at: '2024-01-15T10:00:00' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Останні замовлення</h3>
                <Link
                    href="/admin/orders"
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                    Дивитись всі →
                </Link>
            </div>

            <div className="space-y-3">
                {displayOrders.map((order) => (
                    <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 -mx-2 px-2 rounded transition"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <p className="font-medium text-gray-900">{order.order_number}</p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status]}`}>
                                    {STATUS_LABELS[order.status]}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <ClockIcon className="w-4 h-4" />
                                <span>{new Date(order.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>• {order.customer_name}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900">{order.total} ₴</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

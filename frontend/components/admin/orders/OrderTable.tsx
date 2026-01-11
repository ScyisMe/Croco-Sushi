import { EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface OrderHistoryEntry {
    manager_name: string;
    new_status: string;
    changed_at: string;
}

interface Order {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    status: string;
    created_at: string;
    history?: OrderHistoryEntry[];
    discount?: number;
    delivery_cost?: number;
    payment_method?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: "Очікує", color: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" },
    confirmed: { label: "Підтверджено", color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
    preparing: { label: "Готується", color: "bg-orange-500/10 text-orange-500 border border-orange-500/20" },
    ready: { label: "Готово", color: "bg-green-500/10 text-green-500 border border-green-500/20" },
    delivering: { label: "Доставляється", color: "bg-purple-500/10 text-purple-500 border border-purple-500/20" },
    completed: { label: "Виконано", color: "bg-white/5 text-gray-400 border border-white/10" },
    cancelled: { label: "Скасовано", color: "bg-red-500/10 text-red-500 border border-red-500/20" },
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
        minimumFractionDigits: 0,
    }).format(price);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

interface OrderTableProps {
    orders: Order[];
    onRowClick?: (order: Order) => void;
}

export const OrderTable = ({ orders, onRowClick }: OrderTableProps) => {
    return (
        <div className="overflow-x-auto bg-surface-card rounded-xl border border-white/10">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-white uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">№ Замовлення</th>
                        <th className="px-6 py-4">Дата</th>
                        <th className="px-6 py-4">Клієнт</th>
                        <th className="px-6 py-4">Сума</th>
                        <th className="px-6 py-4">Менеджер</th>
                        <th className="px-6 py-4">Оплата</th>
                        <th className="px-6 py-4">Статус</th>
                        <th className="px-6 py-4 text-right">Дії</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {orders.map((order) => {
                        // Find the last relevant history entry (usually the last one)
                        const lastAction = order.history && order.history.length > 0
                            ? order.history[order.history.length - 1]
                            : null;

                        return (
                            <tr
                                key={order.id}
                                className={`hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick && onRowClick(order)}
                            >
                                <td className="px-6 py-4 font-mono font-medium text-white">
                                    <Link
                                        href={`/admin/orders/${order.id}`}
                                        className="hover:text-primary-500 transition"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        #{order.order_number}
                                    </Link>
                                </td>
                                <td className="px-6 py-4">{formatDate(order.created_at)}</td>
                                <td className="px-6 py-4">
                                    <div className="text-white font-medium">{order.customer_name || "Гість"}</div>
                                    <div className="text-xs opacity-60">{order.customer_phone}</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-200">
                                    {formatPrice(
                                        order.total_amount -
                                        (order.discount ? Number(order.discount) : 0) +
                                        (order.delivery_cost ? Number(order.delivery_cost) : 0)
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {lastAction ? (
                                        <span className="text-white text-sm bg-white/5 px-2 py-1 rounded">
                                            {lastAction.manager_name}
                                        </span>
                                    ) : (
                                        <span className="text-gray-600">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${order.payment_method === 'online' ? 'bg-green-500/10 text-green-500' :
                                        order.payment_method === 'card' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-gray-500/10 text-gray-400'
                                        }`}>
                                        {order.payment_method === 'online' ? 'Online' :
                                            order.payment_method === 'card' ? 'Термінал' :
                                                order.payment_method === 'cash' ? 'Готівка' :
                                                    'Не вказано'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${STATUS_CONFIG[order.status]?.color || "text-gray-400 border-gray-700"
                                        }`}>
                                        {STATUS_CONFIG[order.status]?.label || order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onRowClick) onRowClick(order);
                                        }}
                                        className="p-2 text-gray-400 hover:text-primary-500 inline-block hover:bg-primary-500/10 rounded-lg transition"
                                        title="Переглянути"
                                    >
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

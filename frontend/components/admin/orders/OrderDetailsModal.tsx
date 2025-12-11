import React from "react";
import { XMarkIcon, PrinterIcon, PhoneIcon, UserIcon, MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    image_url?: string;
    size_name?: string;
}

interface OrderDetails {
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    delivery_type: string;
    delivery_address?: string;
    status: string;
    created_at: string;
    total_amount: number;
    items?: OrderItem[];
    // Add other fields as needed
}

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderDetails | null;
    statusConfig: Record<string, { label: string; color: string }>;
    onStatusChange: (order: any, newStatus: string) => void;
}

export const OrderDetailsModal = ({ isOpen, onClose, order, statusConfig, onStatusChange }: OrderDetailsModalProps) => {
    if (!isOpen || !order) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("uk-UA", {
            style: "currency",
            currency: "UAH",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "d MMMM yyyy, HH:mm", { locale: uk });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-surface-card rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-surface/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            Замовлення #{order.order_number}
                            <button onClick={() => window.print()} className="p-1 hover:text-primary-500 transition text-gray-500" title="Друк">
                                <PrinterIcon className="w-5 h-5" />
                            </button>
                        </h2>
                        <div className="flex items-center text-gray-400 text-sm mt-1">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {formatDate(order.created_at)}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <XMarkIcon className="w-8 h-8" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Items */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white">Склад замовлення</h3>
                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="w-16 h-16 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-xs text-gray-500 overflow-hidden">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                            ) : "IMG"}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-white">{item.product_name}</p>
                                            {item.size_name && <p className="text-xs text-gray-400">{item.size_name}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">{item.quantity} шт</p>
                                            <p className="text-sm text-gray-400">{formatPrice(item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <span className="text-xl font-bold text-white">Разом</span>
                                <span className="text-2xl font-bold text-primary-500">{formatPrice(order.total_amount)}</span>
                            </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="space-y-6">
                            {/* Client */}
                            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Клієнт</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-white">
                                        <UserIcon className="w-5 h-5 text-primary-500" />
                                        <span className="font-medium text-lg">{order.customer_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-white">
                                        <PhoneIcon className="w-5 h-5 text-primary-500" />
                                        <span className="font-mono">{order.customer_phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery */}
                            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Доставка</h3>
                                <div className="flex items-start gap-3">
                                    <MapPinIcon className="w-5 h-5 text-primary-500 mt-1" />
                                    <div>
                                        <p className="text-white font-medium">
                                            {order.delivery_type === 'delivery' ? 'Доставка' : 'Самовивіз'}
                                        </p>
                                        {order.delivery_address && (
                                            <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                                                {order.delivery_address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status Control */}
                            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Статус</h3>
                                <div className="flex flex-col gap-3">
                                    <div className={`px-4 py-2 rounded-lg text-center font-bold border mb-2 ${statusConfig[order.status]?.color?.replace('text-', 'text-opacity-100 text-') || 'text-white border-gray-600'
                                        } ${statusConfig[order.status]?.color?.includes('bg-') ? '' : 'bg-white/10'
                                        }`}>
                                        {statusConfig[order.status]?.label || order.status}
                                    </div>

                                    <label className="text-xs text-gray-500">Змінити статус:</label>
                                    <select
                                        value={order.status}
                                        onChange={(e) => onStatusChange(order, e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer hover:bg-black/30 transition"
                                    >
                                        {Object.entries(statusConfig).map(([value, { label }]) => (
                                            <option key={value} value={value} className="bg-gray-800">
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { Order, OrderStatus } from "@/lib/types";
import {
    ClockIcon,
    UserIcon,
    PhoneIcon,
    BanknotesIcon,
    MapPinIcon,
    ShoppingBagIcon,
} from "@heroicons/react/24/outline";

// Extended interface for Manager view (simulated for now until API is ready)
export interface ManagerOrder extends Order {
    customer_name?: string;
    customer_phone?: string;
    delivery_address?: string;
    payment_method?: string;
    comment?: string;
    history?: {
        manager_name: string;
        previous_status: string;
        new_status: string;
        changed_at: string;
        comment?: string;
    }[];
}

interface OrderCardProps {
    order: ManagerOrder;
    onDragStart?: (e: any) => void;
    onClick?: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
    const timeAgo = useMemo(() => {
        try {
            return formatDistanceToNow(new Date(order.created_at), {
                addSuffix: true,
                locale: uk,
            });
        } catch (e) {
            return "щойно";
        }
    }, [order.created_at]);

    const isUrgent = useMemo(() => {
        const created = new Date(order.created_at).getTime();
        const now = new Date().getTime();
        return now - created > 15 * 60 * 1000; // 15 mins
    }, [order.created_at]);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("orderId", order.id.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={onClick}
            className={`bg-surface-card p-4 rounded-xl border border-white/5 hover:border-primary/50 transition-all shadow-lg cursor-grab active:cursor-grabbing relative overflow-hidden group select-none`}
        >
            {/* Status Strip */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${isUrgent && order.status === "pending"
                    ? "bg-red-500 animate-pulse"
                    : "bg-primary"
                    }`}
            />

            <div className="pl-2">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-lg text-white">
                        #{order.order_number}
                    </span>
                    <div
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isUrgent && order.status === "pending"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-white/5 text-gray-400"
                            }`}
                    >
                        <ClockIcon className="w-3 h-3" />
                        <span>{timeAgo}</span>
                    </div>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-1 text-primary font-bold text-lg mb-3">
                    <BanknotesIcon className="w-4 h-4" />
                    {parseFloat(order.total_amount).toFixed(0)} ₴
                </div>

                {/* Items Summary */}
                <div className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {order.items.map((item) => (
                        <span key={item.id} className="mr-1">
                            {item.quantity}x {item.product_name},
                        </span>
                    ))}
                </div>

                {/* Customer Info */}
                <div className="space-y-1 text-xs text-secondary-light border-t border-white/5 pt-2">
                    {order.customer_name && (
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-3 h-3" />
                            <span className="truncate">{order.customer_name}</span>
                        </div>
                    )}
                    {order.customer_phone && (
                        <div className="flex items-center gap-2">
                            <PhoneIcon className="w-3 h-3" />
                            <span>{order.customer_phone}</span>
                        </div>
                    )}
                    {order.delivery_type === 'pickup' ? (
                        <div className="flex items-center gap-2">
                            <ShoppingBagIcon className="w-3 h-3 text-primary-500" />
                            <span className="font-medium text-white">Самовивіз</span>
                        </div>
                    ) : (
                        order.delivery_address && (
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="w-3 h-3" />
                                <span className="truncate">{order.delivery_address}</span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

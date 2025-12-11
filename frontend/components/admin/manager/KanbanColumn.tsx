"use client";

import { ManagerOrder } from "./OrderCard";
import OrderCard from "./OrderCard";
import { motion } from "framer-motion";

interface KanbanColumnProps {
    id: string;
    title: string;
    orders: ManagerOrder[];
    color: string;
    onDrop: (orderId: number) => void;
    onOrderClick: (order: ManagerOrder) => void;
}

export default function KanbanColumn({
    id,
    title,
    orders,
    color,
    onDrop,
    onOrderClick,
}: KanbanColumnProps) {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData("orderId");
        if (orderId) {
            onDrop(Number(orderId));
        }
    };

    return (
        <div
            className="flex flex-col h-full min-w-[320px] w-[320px] bg-white/5 rounded-2xl border border-white/5 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className={`p-4 border-b border-white/5 ${color}`}>
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white">{title}</h3>
                    <span className="px-2 py-0.5 bg-black/20 rounded-full text-xs text-white font-mono">
                        {orders.length}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <div className="space-y-3 min-h-[100px]">
                    {orders.map((order) => (
                        <motion.div layout key={order.id}>
                            <OrderCard order={order} onClick={() => onOrderClick(order)} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import KanbanColumn from "./KanbanColumn";
import { ManagerOrder } from "./OrderCard";
import apiClient from "@/lib/api/apiClient";
import { toast } from "react-hot-toast";
import OrderDetailsModal from "./OrderDetailsModal";
import { StatusChangeModal } from "../orders/StatusChangeModal";

export default function KanbanBoard() {
    const queryClient = useQueryClient();

    // Fetch orders from API
    const { data: orders = [], isError } = useQuery<ManagerOrder[]>({
        queryKey: ["admin_orders"],
        queryFn: async () => {
            const response = await apiClient.get("/admin/orders", {
                params: { limit: 100 }
            });
            return response.data;
        },
        refetchInterval: 10000,
        refetchIntervalInBackground: true,
    });

    // Distribute orders into columns
    const pendingOrders = orders.filter((o) => o.status === "pending");
    const preparingOrders = orders.filter((o) => ["preparing", "confirmed", "ready"].includes(o.status));
    const deliveringOrders = orders.filter((o) => o.status === "delivering");
    const completedOrders = orders.filter((o) => ["delivered", "completed"].includes(o.status));
    const cancelledOrders = orders.filter((o) => o.status === "cancelled");

    // Sound notification logic
    const [audio] = useState(() => typeof Audio !== "undefined" ? new Audio("/sounds/notification.mp3") : null);
    const prevPendingCountRef = useRef(0);

    useEffect(() => {
        if (pendingOrders.length > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
            audio?.play().catch(() => console.log("Audio play blocked"));
            toast("Нове замовлення!", { icon: "🔔" });
        }
        prevPendingCountRef.current = pendingOrders.length;
    }, [pendingOrders.length, audio]);

    // Mutation for updating status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, comment }: { id: number; status: string; comment?: string }) => {
            await apiClient.patch(`/admin/orders/${id}/status`, { status, comment });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
            toast.success("Статус оновлено");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Помилка при оновленні статусу");
        }
    });

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [orderIdToCancel, setOrderIdToCancel] = useState<number | null>(null);

    const executeStatusUpdate = (orderId: number, status: string, comment?: string) => {
        // Ensure mapping for grouped statuses
        let apiStatus = status;
        if (status === "preparing") apiStatus = "preparing";
        if (status === "completed") apiStatus = "completed";

        updateStatusMutation.mutate({ id: orderId, status: apiStatus, comment });
    };

    const handleDrop = (orderId: number, newStatus: string) => {
        // Find order
        const order = orders.find(o => o.id === orderId);
        if (!order || order.status === newStatus) return;

        // If cancelling, open modal
        if (newStatus === "cancelled") {
            setOrderIdToCancel(orderId);
            setIsCancelModalOpen(true);
            return;
        }

        executeStatusUpdate(orderId, newStatus);
    };

    const handleCancelConfirm = async (reason: string) => {
        if (orderIdToCancel) {
            await updateStatusMutation.mutateAsync({ id: orderIdToCancel, status: "cancelled", comment: reason });
            setIsCancelModalOpen(false);
            setOrderIdToCancel(null);
        }
    };

    const handleManualStatusChange = (order: ManagerOrder, newStatus: string) => {
        handleDrop(order.id, newStatus);
    };

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

    return (
        <div className="h-full flex gap-6 overflow-x-auto pb-4">
            <KanbanColumn
                id="pending"
                title="Нові"
                orders={pendingOrders}
                color="bg-green-500/20 text-green-500"
                onDrop={(id) => handleDrop(id, "pending")}
                onOrderClick={(order) => setSelectedOrderId(order.id)}
            />
            <KanbanColumn
                id="preparing"
                title="Готуються"
                orders={preparingOrders}
                color="bg-yellow-500/20 text-yellow-500"
                onDrop={(id) => handleDrop(id, "preparing")}
                onOrderClick={(order) => setSelectedOrderId(order.id)}
            />
            <KanbanColumn
                id="delivering"
                title="Доставка"
                orders={deliveringOrders}
                color="bg-blue-500/20 text-blue-500"
                onDrop={(id) => handleDrop(id, "delivering")}
                onOrderClick={(order) => setSelectedOrderId(order.id)}
            />
            <KanbanColumn
                id="completed"
                title="Виконано"
                orders={completedOrders}
                color="bg-gray-500/20 text-gray-500"
                onDrop={(id) => handleDrop(id, "completed")}
                onOrderClick={(order) => setSelectedOrderId(order.id)}
            />
            <KanbanColumn
                id="cancelled"
                title="Скасовано"
                orders={cancelledOrders}
                color="bg-red-500/20 text-red-500"
                onDrop={(id) => handleDrop(id, "cancelled")}
                onOrderClick={(order) => setSelectedOrderId(order.id)}
            />

            <OrderDetailsModal
                isOpen={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrderId(null)}
                onStatusChange={handleManualStatusChange}
            />

            <StatusChangeModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleCancelConfirm}
                status="cancelled"
                isLoading={updateStatusMutation.isPending}
            />
        </div>
    );
}


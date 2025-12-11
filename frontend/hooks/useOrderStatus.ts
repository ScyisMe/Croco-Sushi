import { useState } from "react";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";

interface UseOrderStatusProps {
    onStatusChanged?: (orderId: number, newStatus: string) => void;
}

export const useOrderStatus = ({ onStatusChanged }: UseOrderStatusProps = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<{ id: number; orderNumber: string } | null>(null);

    const changeStatus = async (order: { id: number; order_number: string }, newStatus: string) => {
        if (newStatus === "cancelled") {
            setOrderToCancel({ id: order.id, orderNumber: order.order_number });
            return;
        }

        await executeStatusChange(order.id, newStatus);
    };

    const executeStatusChange = async (orderId: number, newStatus: string, reason?: string) => {
        setIsLoading(true);
        try {
            const payload: any = { status: newStatus };
            if (reason) {
                payload.reason = reason;
            }

            await apiClient.patch(`/admin/orders/${orderId}/status`, payload);

            // Optimistic / Client update
            if (onStatusChanged) {
                onStatusChanged(orderId, newStatus);
            }

            // Only show success toast for non-cancellations (cancellation usually has its own flow/toast)
            // or we can generalize.
            // toast.success("Статус оновлено"); 
        } catch (error: any) {
            console.error("Status update error:", error);
            toast.error(error.response?.data?.detail || "Помилка зміни статусу");
        } finally {
            setIsLoading(false);
            setOrderToCancel(null); // Close modal if open
        }
    };

    const confirmCancel = async (reason: string) => {
        if (!orderToCancel) return;
        await executeStatusChange(orderToCancel.id, "cancelled", reason);
        toast.success("Замовлення скасовано");
    };

    return {
        changeStatus,
        confirmCancel,
        isLoading,
        cancelModalOpen: !!orderToCancel,
        closeCancelModal: () => setOrderToCancel(null),
        orderNumber: orderToCancel?.orderNumber,
    };
};

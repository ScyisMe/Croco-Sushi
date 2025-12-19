"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api/apiClient";
import { Receipt } from "@/components/admin/orders/Receipt";

export default function OrderReceiptPage() {
    const params = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await apiClient.get(`/admin/orders/${params.id}`);
                setOrder(response.data);
            } catch (error) {
                console.error("Failed to fetch order", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    useEffect(() => {
        if (!loading && order) {
            // Wait for images (QR code) to potentially load, though hard to know exact time.
            // A short delay helps.
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, order]);

    if (loading) return <div className="p-4">Завантаження...</div>;
    if (!order) return <div className="p-4">Замовлення не знайдено</div>;

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
            <div className="bg-white shadow-lg print:shadow-none mb-8 print:mb-0">
                <Receipt order={order} />
            </div>

            <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 print:hidden"
            >
                Друкувати
            </button>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto; 
                    }
                    body {
                        background: white;
                    }
                    /* Hide everything that is not the receipt container if needed, 
                       but since this page ONLY contains the receipt, it's fine. */
                }
            `}</style>
        </div>
    );
}

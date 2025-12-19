import React from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    size_name?: string;
}

interface Order {
    id: number;
    order_number: string;
    created_at: string;
    customer_name: string;
    total_amount: number;
    items: OrderItem[];
    payment_method: string;
    delivery_cost?: number;
    discount?: number;
}

interface ReceiptProps {
    order: Order;
}

export const Receipt: React.FC<ReceiptProps> = ({ order }) => {
    // Helper to format currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("uk-UA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };

    // Helper to format date
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "dd.MM.yyyy HH:mm:ss", { locale: uk });
    };

    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discount = order.discount || 0;
    const delivery = order.delivery_cost || 0;
    // Assuming VAT is included or calculated differently. 
    // The template shows "ПДВ A 20.00%". 
    // Usually restaurants in Ukraine might be FOP (no VAT) or TOV (with VAT).
    // I'll calculate it as included 20% for visual similarity if needed, or just 0.
    // Template: "ПДВ А 20.00%   46.83" (which is ~16.67% of total roughly? No, 280.97 total. 46.83 is 1/6th if included. 280.97 / 6 = 46.828. Yes, included VAT)
    const vatAmount = (order.total_amount / 6).toFixed(2);

    const qrData = `Check_${order.order_number}_${order.total_amount}`;

    return (
        <div className="p-4 mx-auto bg-white text-black font-mono text-sm max-w-[80mm] w-full" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            {/* Header */}
            <div className="text-center mb-4 uppercase">
                <h1 className="font-bold text-base mb-1">ТзОВ &quot;Croco Sushi&quot;</h1>
                <p>Україна, м. Львів</p>
                <p>вул. Шевченка, 1</p>
                <p>МАГАЗИН</p>
            </div>

            {/* Info */}
            <div className="mb-4 text-xs">
                <p>ПН: 000000000000</p>
                <p>ІД: 00000000</p>
                <p>Оператор: Адміністратор</p>
                <p>Чек № {order.id} ({order.order_number})</p>
                <p>Каса: 1 [1]</p>
            </div>

            {/* Items */}
            <div className="border-b border-black border-dashed mb-2 pb-2">
                {order.items.map((item) => (
                    <div key={item.id} className="mb-2">
                        <div className="flex justify-between">
                            <span>{item.quantity.toFixed(3)} X {formatPrice(item.price)}</span>
                            <span>{formatPrice(item.quantity * item.price)}</span>
                        </div>
                        <div className="uppercase">
                            {item.product_name} {item.size_name ? `(${item.size_name})` : ""}
                        </div>
                        <div className="text-right">A</div>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="mb-4">
                <div className="flex justify-between mb-1">
                    <span>ГОТІВКА/КАРТКА</span>
                    <span>{formatPrice(order.total_amount)} ГРН</span>
                </div>
                {/* 
                <div className="flex justify-between mb-1">
                    <span>РЕШТА</span>
                    <span>0.00</span>
                </div>
                 */}
            </div>

            <div className="border-b border-black border-dashed mb-2 pb-2">
                <div className="flex justify-between font-bold text-base">
                    <span>СУМА</span>
                    <span>{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>ПДВ А 20.00%</span>
                    <span>{vatAmount}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Заокруглення:</span>
                    <span>0.00</span>
                </div>
                <div className="flex justify-between font-bold mt-1">
                    <span>До сплати:</span>
                    <span>{formatPrice(order.total_amount)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center">
                <p className="mb-2">{order.items.length} АРТИКУЛІВ</p>
                <div className="flex justify-between items-end mb-4">
                    <span>ЧЕК {order.order_number}</span>
                    <span>ОНЛАЙН</span>
                </div>
                <p className="mb-4">{formatDate(order.created_at)}</p>

                <div className="flex justify-center mb-4">
                    {/* QR Code */}
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=120x120`}
                        alt="QR Code"
                        className="w-24 h-24"
                    />
                </div>

                <div className="flex justify-between items-center text-xs font-bold uppercase">
                    <span>ФН 0000000000</span>
                    <div className="text-right">
                        <p>ФІСКАЛЬНИЙ ЧЕК</p>
                        <p>Croco Sushi!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

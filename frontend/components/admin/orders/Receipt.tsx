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
    customer_phone: string;
    total_amount: number;
    items: OrderItem[];
    payment_method: string;
    delivery_cost?: number;
    discount?: number;
    delivery_type: string;
    delivery_address?: string;
}

interface ReceiptProps {
    order: Order;
}

export const Receipt: React.FC<ReceiptProps> = ({ order }) => {
    // Helper to format currency
    const formatPrice = (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return new Intl.NumberFormat("uk-UA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false,
        }).format(numPrice);
    };

    // Helper to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return format(new Date(dateString), "dd.MM.yyyy HH:mm:ss", { locale: uk });
    };

    const subtotal = order.items.reduce((acc, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        const qty = item.quantity; // Quantity usually number
        return acc + price * qty;
    }, 0);

    // Ensure total_amount is number
    const totalAmount = typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount;

    // Assuming VAT is included (20%)
    // If Total = Net + VAT, and VAT = 20% of Net. 
    // Total = 1.2 * Net => Net = Total / 1.2
    // VAT = Total - Net = Total - (Total/1.2) = Total * (1 - 1/1.2) = Total / 6
    const vatAmount = (totalAmount / 6).toFixed(2);

    const qrData = `Check_${order.order_number}_${totalAmount}`;

    return (
        <div
            className="p-4 mx-auto bg-white text-black font-mono text-sm leading-tight"
            style={{
                fontFamily: "'Courier New', Courier, monospace",
                width: "80mm",
                fontWeight: 600
            }}
        >
            {/* Header */}
            <div className="text-center mb-4 uppercase">
                <h1 className="font-bold text-base mb-1">ФОП &quot;Croco Sushi&quot;</h1>
                <p>Україна, м. Львів</p>
                <p>вул. Володимира Янева, 31</p>
                <p>МАГАЗИН</p>
            </div>

            {/* Info */}
            <div className="mb-4 text-xs uppercase">
                <p>ПН: 3000000000</p>
                <p>ІД: 00000000</p>
                <p>Оператор: Менеджер</p>
                <p>Чек # {order.id} ({order.order_number})</p>
                <p>Клієнт: {order.customer_name}</p>
                <p>Тел: {order.customer_phone}</p>
                <p>Каса: 1 [1]</p>
            </div>

            {/* Items */}
            <div className="border-t border-b border-dashed border-black py-2 mb-2">
                {order.items.map((item) => {
                    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                    return (
                        <div key={item.id} className="mb-2">
                            <div className="flex justify-between">
                                <span>{item.quantity.toFixed(3)} X</span>
                                <span>{formatPrice(price)}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="uppercase max-w-[70%]">
                                    {item.product_name} {item.size_name ? `(${item.size_name})` : ""}
                                </span>
                                <span>{formatPrice(item.quantity * price)} A</span>
                            </div>
                        </div>
                    )
                })}

                {order.delivery_cost && order.delivery_cost > 0 && (
                    <div className="mb-2">
                        <div className="flex justify-between">
                            <span>1.000 X</span>
                            <span>{formatPrice(order.delivery_cost)}</span>
                        </div>
                        <div className="flex justify-between items-start">
                            <span className="uppercase">Доставка</span>
                            <span>{formatPrice(order.delivery_cost)} A</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Totals */}
            <div className="mb-2 space-y-1">
                <div className="flex justify-between">
                    <span>СУМА</span>
                    <span>{formatPrice(totalAmount)} ГРН</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>ПДВ А 20.00%</span>
                    <span>{vatAmount}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Заокруглення:</span>
                    <span>0.00</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black pt-2 mb-4">
                <div className="flex justify-between font-bold text-lg">
                    <span>ДО СПЛАТИ:</span>
                    <span>{formatPrice(totalAmount)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center uppercase text-xs">
                <p className="mb-2">{order.items.length + (order.delivery_cost ? 1 : 0)} АРТИКУЛІВ</p>
                <div className="flex justify-between items-end mb-2">
                    <span>ЧЕК {order.order_number}</span>
                    <span>ОНЛАЙН</span>
                </div>
                <p className="mb-4">{formatDate(order.created_at)}</p>

                <div className="flex justify-center mb-4">
                    {/* QR Code */}
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=150x150`}
                        alt="QR Code"
                        className="w-32 h-32 render-pixelated"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </div>

                <div className="flex justify-between items-end font-bold">
                    <span>ФН 4000138375</span>
                    <div className="text-right">
                        <p>ФІСКАЛЬНИЙ ЧЕК</p>
                        <p>Croco Sushi!</p>
                    </div>
                </div>
                <div className="text-right mt-1">13019</div>
            </div>
        </div>
    );
};

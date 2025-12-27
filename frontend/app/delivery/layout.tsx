
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Доставка Суші Львів: Зони та Умови | Croco Sushi",
    description: "Безкоштовна доставка суші у Львові від 1000 грн. Карта зон доставки, умови оплати карткою та готівкою. Швидка доставка додому та в офіс.",
    alternates: {
        canonical: "https://crocosushi.com/delivery",
    }
};

export default function DeliveryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

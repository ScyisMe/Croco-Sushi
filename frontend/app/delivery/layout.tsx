
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Доставка та Оплата | Croco Sushi",
    description: "Умови доставки та оплати Croco Sushi. Безкоштовна доставка від 1000 грн. Зони доставки у Львові.",
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

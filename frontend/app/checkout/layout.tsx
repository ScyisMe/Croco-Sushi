
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Оформлення замовлення | Croco Sushi",
    description: "Оформлення замовлення суші та ролів у Львові.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}


import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Реєстрація | Croco Sushi",
    description: "Створіть акаунт Croco Sushi. Швидке замовлення, історія покупок та бонусна програма.",
    robots: {
        index: false,
        follow: true,
    },
    alternates: {
        canonical: "https://crocosushi.com/register",
    }
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

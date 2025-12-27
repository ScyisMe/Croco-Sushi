
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Публічна Оферта та Умови Використання Сайту | Croco Sushi",
    description: "Публічна оферта та умови надання послуг Croco Sushi. Права та обов'язки сторін, умови оплати та доставки.",
    alternates: {
        canonical: "https://crocosushi.com/terms",
    }
};

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

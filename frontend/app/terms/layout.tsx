
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Публічна оферта та Умови надання послуг | Croco Sushi",
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

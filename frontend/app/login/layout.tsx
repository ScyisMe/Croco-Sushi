
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Вхід до Особистого Кабінету | Croco Sushi - Доставка Суші",
    description: "Вхід в особистий кабінет Croco Sushi. Відстежуйте замовлення та зберігайте улюблені страви.",
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "https://crocosushi.com/login",
    }
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

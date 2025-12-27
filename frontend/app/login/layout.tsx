
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Вхід | Croco Sushi",
    description: "Вхід в особистий кабінет Croco Sushi. Відстежуйте замовлення та зберігайте улюблені страви.",
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

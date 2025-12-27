
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Відновлення пароля | Croco Sushi",
    description: "Забули пароль? Відновіть доступ до особистого кабінету Croco Sushi за номером телефону. Швидке та безпечне відновлення для замовлення улюблених суші.",
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "https://crocosushi.com/reset-password",
    }
};

export default function ResetPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

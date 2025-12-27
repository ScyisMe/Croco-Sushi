
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Відновлення пароля | Croco Sushi",
    description: "Відновлення доступу до особистого кабінету Croco Sushi.",
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

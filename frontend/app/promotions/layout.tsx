
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Акції та Знижки | Croco Sushi",
    description: "Всі актуальні акції та знижки на суші та роли у Львові. Знижки на день народження, самовивіз та акційні сети. Економте смачно!",
    alternates: {
        canonical: "https://crocosushi.com/promotions",
    }
};

export default function PromotionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}


import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Акції та Знижки | Croco Sushi",
    description: "Актуальні акції, знижки та спеціальні пропозиції від Croco Sushi. Смакуйте більше за менші гроші!",
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

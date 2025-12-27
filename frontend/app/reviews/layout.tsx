
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Відгуки клієнтів | Суші Львів | Croco Sushi",
    description: "Реальні відгуки про доставку суші Croco Sushi у Львові. Діліться своїми враженнями та читайте думки інших клієнтів.",
    alternates: {
        canonical: "https://crocosushi.com/reviews",
    }
};

export default function ReviewsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

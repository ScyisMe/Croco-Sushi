
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Відгуки | Croco Sushi",
    description: "Відгуки клієнтів про Croco Sushi. Дізнайтеся, що кажуть про наші суші та доставку.",
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

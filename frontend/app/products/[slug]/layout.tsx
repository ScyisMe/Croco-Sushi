
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
    params: { slug: string };
    children: React.ReactNode;
};

async function getProduct(slug: string) {
    // Use fallback if env not set (though it should be for valid setup)
    // We assume the backend is reachable via this URL. 
    // If running in Docker and building locally, localhost might refer to this machine's localhost where backend port is exposed.
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
        const res = await fetch(`${API_URL}/api/v1/products/${slug}`, {
            // Revalidate typically good for SEO to not be stale, 
            // but simplistic caching strategy for now.
            next: { revalidate: 60 }
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch product for SEO:", error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const product = await getProduct(params.slug);
    if (!product) {
        return {
            title: "Croco Sushi",
        };
    }

    return {
        title: `${product.name} | Croco Sushi`,
        description: product.description ? product.description.substring(0, 160) : "Свіжі суші з доставкою у Львові",
        openGraph: {
            title: product.name,
            description: product.description,
            images: product.image_url ? [product.image_url] : ['/logo.png'],
            url: `https://crocosushi.com/products/${params.slug}`,
        }
    };
}

export default async function ProductLayout({ params, children }: Props) {
    const product = await getProduct(params.slug);

    if (!product) {
        return notFound();
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.image_url ? [product.image_url] : [],
        "description": product.description,
        "sku": product.id,
        "offers": {
            "@type": "Offer",
            "url": `https://crocosushi.com/products/${params.slug}`,
            "priceCurrency": "UAH",
            "price": product.price,
            "availability": "https://schema.org/InStock",
            "priceValidUntil": "2025-12-31" // Optional but good for valid schema
        },
        // Adding aggregateRating if available (but it's not in basic product type easily unless we fetch reviews)
        // For now, basic Product schema is "Must Have" per user.
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}

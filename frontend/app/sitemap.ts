
import { MetadataRoute } from 'next';

const BASE_URL = 'https://crocosushi.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getProducts() {
    try {
        const res = await fetch(`${API_URL}/api/v1/products?limit=1000&is_active=true`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        // Support both direct list and paginated response
        const items = Array.isArray(data) ? data : (data.items || []);
        // Double check for active status just in case
        return items.filter((p: any) => p.is_active !== false);
    } catch (error) {
        console.error("Failed to fetch products for sitemap:", error);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const products = await getProducts();

    const productEntries = products.map((product: any) => ({
        url: `${BASE_URL}/products/${product.slug || product.id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Categories based on footer links
    const categories = ["rolls", "sets", "sushi", "drinks", "bowls"];
    const categoryEntries = categories.map((cat) => ({
        url: `${BASE_URL}/menu?category=${cat}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const staticRoutes = [
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/menu`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/delivery`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/promotions`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/reviews`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
    ];

    return [...staticRoutes, ...categoryEntries, ...productEntries];
}


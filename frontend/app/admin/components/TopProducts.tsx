"use client";

import Image from "next/image";

interface Product {
    id: number;
    name: string;
    sales: number;
    revenue: number;
    image_url?: string;
}

interface TopProductsProps {
    products?: Product[];
    isLoading?: boolean;
}

export default function TopProducts({ products = [], isLoading = false }: TopProductsProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100">
                        <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                ))}
            </div>
        );
    }

    // Mock data if none provided
    const displayProducts = products.length > 0 ? products : [
        { id: 1, name: 'Філадельфія', sales: 125, revenue: 18750, image_url: '/images/products/philadelphia.jpg' },
        { id: 2, name: 'Каліфорнія', sales: 98, revenue: 14700, image_url: '/images/products/california.jpg' },
        { id: 3, name: 'Дракон', sales: 87, revenue: 15660, image_url: '/images/products/dragon.jpg' },
        { id: 4, name: 'Сякі маки', sales: 76, revenue: 9120, image_url: '/images/products/sake-maki.jpg' },
        { id: 5, name: 'Сет №1', sales: 65, revenue: 19500, image_url: '/images/products/set-1.jpg' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Топ продукти</h3>

            <div className="space-y-3">
                {displayProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-bold rounded">
                                {index + 1}
                            </span>
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-12 h-12 rounded object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center p-2">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src="/logo.png"
                                            alt="Product"
                                            fill
                                            className="object-contain opacity-50 grayscale"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.sales} продажів</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900">{product.revenue.toLocaleString()} ₴</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

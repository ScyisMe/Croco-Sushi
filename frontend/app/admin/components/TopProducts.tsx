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
            <div className="bg-surface-card rounded-xl shadow-sm p-6 border border-white/10">
                <div className="h-6 bg-white/10 rounded w-40 mb-4 animate-pulse"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-white/10">
                        <div className="w-12 h-12 bg-white/5 rounded animate-pulse"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-white/10 rounded w-32 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-white/5 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-white/10 rounded w-16 animate-pulse"></div>
                    </div>
                ))}
            </div>
        );
    }

    // Use provided data or empty array
    const displayProducts = products;

    return (
        <div className="bg-surface-card rounded-xl shadow-sm p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-6">Топ позиції</h3>

            {displayProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    Ще немає даних про продажі
                </div>
            ) : (
                <div className="space-y-3">
                    {displayProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center gap-4 py-3 border-b border-white/10 last:border-0">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="w-6 h-6 flex items-center justify-center bg-white/10 text-gray-400 text-xs font-bold rounded">
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
                                    <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center p-2">
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
                                <p className="font-medium text-white truncate">{product.name}</p>
                                <p className="text-sm text-gray-400">{product.sales} продажів</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-white">{product.revenue.toLocaleString()} ₴</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

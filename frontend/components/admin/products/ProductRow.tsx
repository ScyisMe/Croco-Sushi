import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Product {
    id: number;
    name: string;
    slug: string;
    description?: string;
    price: number;
    old_price?: number;
    image_url?: string;
    category_id: number;
    category_name?: string;
    is_available: boolean;
    is_popular: boolean;
    weight?: string;
}

interface Category {
    id: number;
    name: string;
}

interface ProductRowProps {
    product: Product;
    categoryName: string;
    onTogglePopular: (product: Product) => void;
    onToggleAvailable: (product: Product) => void;
    onDelete: (id: number) => void;
    formatPrice: (price: number) => string;
}

export const ProductRow = memo(({
    product,
    categoryName,
    onTogglePopular,
    onToggleAvailable,
    onDelete,
    formatPrice
}: ProductRowProps) => {
    return (
        <tr className="hover:bg-white/5 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        {product.image_url ? (
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                Фото
                            </div>
                        )}
                    </div>
                    <div>
                        <span className="font-medium text-white block">
                            {product.name}
                        </span>
                        {product.weight && (
                            <span className="text-sm text-gray-500">
                                {product.weight}
                            </span>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-gray-400">
                {categoryName}
            </td>
            <td className="px-6 py-4">
                <div>
                    <span className="font-medium text-white">
                        {formatPrice(product.price)}
                    </span>
                    {product.old_price && (
                        <span className="text-sm text-gray-600 line-through ml-2">
                            {formatPrice(product.old_price)}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                <button
                    onClick={() => onTogglePopular(product)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${product.is_popular
                            ? "bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                >
                    {product.is_popular ? "⭐ Так" : "Ні"}
                </button>
            </td>
            <td className="px-6 py-4">
                <button
                    onClick={() => onToggleAvailable(product)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${product.is_available
                            ? "bg-primary-500/20 text-primary-500 hover:bg-primary-500/30"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                >
                    {product.is_available ? "В наявності" : "Немає"}
                </button>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-end space-x-2">
                    <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => onDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

ProductRow.displayName = "ProductRow";

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import apiClient from "@/lib/api/apiClient";
import { Product } from "@/lib/types";
import toast from "react-hot-toast";

interface CheckoutUpsellProps {
    missingAmount: number;
}

export default function CheckoutUpsell({ missingAmount }: CheckoutUpsellProps) {
    const [upsellProducts, setUpsellProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addItem } = useCartStore();

    useEffect(() => {
        const fetchUpsellProducts = async () => {
            if (missingAmount <= 0) return;

            try {
                setIsLoading(true);
                let params: any = { limit: 5 };

                // Smart logic based on missing amount
                // We want to find the CHEAPEST product that COVERS the gap.
                // So min_price = missingAmount.
                // max_price = missingAmount + 200 (to give some range)

                // If missingAmount is very small (e.g. < 40), we might not find anything >= missingAmount.
                // In that case, we just want the cheapest item available (min_price = 0).

                // Strategy:
                // 1. Try to find items >= missingAmount first.
                // 2. If valid items found, pick the cheapest one.
                // 3. If no items found (maybe gap is tiny), just pick cheapest item overall.

                const minPrice = Math.max(0, missingAmount);
                const maxPrice = minPrice + 300; // Search range

                // Fetch products in range
                params.min_price = minPrice;
                params.max_price = maxPrice;
                params.limit = 10; // Fetch a few to sort client-side

                let response = await apiClient.get<Product[]>("/products/", { params });
                let products = response.data || [];

                // If no products found in range (gap might be too small, e.g. 5 UAH),
                // fetch generally cheap items
                if (products.length === 0) {
                    response = await apiClient.get<Product[]>("/products/", {
                        params: { min_price: 10, max_price: 150, limit: 10 }
                    });
                    products = response.data || [];
                }

                // Client-side Sort: Price Low to High
                // We want to recommend the item that is closest to bridging the gap (cheapest valid option).
                products.sort((a, b) => Number(a.price) - Number(b.price));

                setUpsellProducts(products);
            } catch (error) {
                console.error("Failed to fetch upsell products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUpsellProducts();
    }, [missingAmount]);

    if (isLoading || upsellProducts.length === 0) return null;

    const suggestedProduct = upsellProducts[0];

    return (
        <div className="mt-3">
            <button
                onClick={() => {
                    addItem({
                        id: suggestedProduct.id,
                        name: suggestedProduct.name,
                        price: Number(suggestedProduct.price),
                        image_url: suggestedProduct.image_url,
                        quantity: 1,
                        sizeId: suggestedProduct.sizes?.[0]?.id, // Default to first size if available
                        size: suggestedProduct.sizes?.[0]?.name
                    });
                    toast.success(`${suggestedProduct.name} додано!`);
                }}
                className="w-full bg-[#1E1E1E] hover:bg-[#2C2C2C] border border-white/10 rounded-lg py-2 px-3 flex items-center justify-center gap-2 group transition-all active:scale-95 text-left h-auto min-h-[40px]"
            >
                <div className="w-5 h-5 flex-shrink-0 bg-green-500 rounded-full text-black flex items-center justify-center font-bold text-xs shadow-lg group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-3 h-3 text-black" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wide whitespace-normal leading-tight ml-1">
                    Додати {suggestedProduct.name}
                </span>
                <span className="text-xs text-secondary-light whitespace-nowrap ml-auto pl-2">({suggestedProduct.price} ₴)</span>
            </button>
        </div>
    );
}

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
                // If amount is small (< 100), suggest cheap items (sauces, drinks)
                // If amount is larger, suggest items up to that price + 20%
                if (missingAmount <= 150) {
                    // Try fetching sauces or drinks first if possible, or just cheap items
                    // Since we don't have confident category slugs, we'll use price filter
                    params.max_price = 150;
                    params.min_price = 10; // Avoid 0 price items if any
                } else {
                    // Suggest items that can fill the gap roughly
                    // We want items that are ideally LESS than the gap but close to it, or slightly above
                    // Let's just say anything up to gap + 100
                    params.max_price = missingAmount + 100;
                    params.min_price = 50;
                }

                // If gap is small, maybe prioritize "drinks" or "sauces" if we could
                // But for now purely price based is safer as requested

                const response = await apiClient.get<Product[]>("/products/", { params });

                // Randomize or pick best fit? Backend sort is by position.
                // Let's take the first few that match
                setUpsellProducts(response.data || []);
            } catch (error) {
                console.error("Failed to fetch upsell products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUpsellProducts();
    }, [missingAmount]);

    if (isLoading || upsellProducts.length === 0) return null;

    // We only show one "Best Match" item for the compact view in the summary
    // Or maybe a small list? The design in the screenshot shows a single "Add Sauce" button style
    // But user asked for "recommend products" (plural) and "add them"
    // The screenshot has a specific UI for "Add Unagi Sauce".
    // Let's adapt that UI to show the *first* recommended product, and maybe a "More" option or just cycle them?
    // For simplicity and UI match, let's show the first relevant product.

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
                className="w-full bg-[#1E1E1E] hover:bg-[#2C2C2C] border border-white/10 rounded-lg py-2 px-3 flex items-center justify-center gap-2 group transition-all active:scale-95"
            >
                <div className="w-5 h-5 bg-green-500 rounded-full text-black flex items-center justify-center font-bold text-xs shadow-lg group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-3 h-3 text-black" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wide truncate max-w-[150px]">
                    Додати {suggestedProduct.name}
                </span>
                <span className="text-xs text-secondary-light">({suggestedProduct.price} ₴)</span>
            </button>

            {/* If we have more products, maybe allow cycling or show a small list below? 
                For now keeping it simple to match the design requested.
            */}
        </div>
    );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import apiClient from "@/lib/api/apiClient";
import { Product } from "@/lib/types";

export default function CartUpsell() {
    const [upsellProducts, setUpsellProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addItem } = useCartStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUpsellProducts = async () => {
            try {
                setIsLoading(true);
                // Fetch drinks and add-ons (sauces, extras)
                const [drinksRes, addonsRes] = await Promise.all([
                    apiClient.get<Product[]>("/products/", { params: { category_slug: "drinks", limit: 10 } }),
                    apiClient.get<Product[]>("/products/", { params: { category_slug: "sauces", limit: 10 } }) // Using 'sauces' as likely slug for 'dodatku' or checking if 'dodatku' exists. User said 'dodatku' url is https://crocosushi.com/menu/dodatku so slug is likely 'dodatku'. Let's try 'dodatku' first, fallbacks might be needed if slug is different. User provided URL implies 'dodatku'.
                ]);

                // Actually user provided https://crocosushi.com/menu/dodatku, so slug is 'dodatku'.
                // Wait, I should double check if I can just fetch 'dodatku' directly.
                // Let's assume 'dodatku' and 'drinks'.

                // However, I should probably check if 'sauces' are in 'dodatku' or separate. 
                // User mentioned: "соуси, напої, десерти".
                // Let's try to fetch explicit categories if possilbe or just trust the 'dodatku' and 'drinks'.
                // Re-reading user request: "https://crocosushi.com/menu/drinks і https://crocosushi.com/menu/dodatku".
                // Okay, I will use 'drinks' and 'dodatku'.

                const drinks = drinksRes.data || [];
                const addons = addonsRes.data || []; // Verify if second request should be 'dodatku'

                // Actually, let's fetch 'dodatku' as requested.
                let extraProducts: Product[] = addons;
                if (addons.length === 0) {
                    // Fallback or retry with 'sauces' if 'dodatku' returns nothing? 
                    // For now, I'll stick to the requested slugs.
                }

                // Interleave or just concat? Randomize?
                // Let's simple concat for now, maybe shuffle.
                const combined = [...drinks, ...addons].sort(() => 0.5 - Math.random()).slice(0, 10);

                setUpsellProducts(combined);
            } catch (error) {
                console.error("Failed to fetch upsell products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // We need to fetch 'dodatku' actually.
        // Let's correct the Promise.all above in a real implementation within this file.
        const fetchReal = async () => {
            try {
                setIsLoading(true);
                const [drinksRes, addonsRes] = await Promise.all([
                    apiClient.get<Product[]>("/products/", { params: { category_slug: "drinks", limit: 6 } }),
                    apiClient.get<Product[]>("/products/", { params: { category_slug: "dodatku", limit: 6 } })
                ]);

                const drinks = drinksRes.data || [];
                const addons = addonsRes.data || [];

                // Combine and Shuffle slightly to mix drinks and addons
                const combined = [...addons, ...drinks];
                // Better to show addons first (sauces/sticks) as per text "Don't forget sticks and sauce"

                setUpsellProducts(combined);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }

        fetchReal();
    }, []);

    if (isLoading || upsellProducts.length === 0) return null;

    return (
        <div className="mt-6 mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 px-1">
                Не забудьте напої та соус
            </h3>

            <div
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {upsellProducts.map((product) => (
                    <div
                        key={product.id}
                        className="flex-shrink-0 w-[140px] snap-start bg-white/5 border border-white/5 rounded-xl overflow-hidden flex flex-col"
                    >
                        {/* Image */}
                        <div className="relative h-24 w-full bg-white/5">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                                    No Photo
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-2 flex flex-col flex-1">
                            <h4 className="text-xs font-medium text-white line-clamp-2 h-8 leading-tight mb-1">
                                {product.name}
                            </h4>

                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-sm font-bold text-primary">
                                    {product.price} <span className="text-[10px] font-normal text-gray-400">₴</span>
                                </span>

                                <button
                                    onClick={() => {
                                        addItem({
                                            id: product.id,
                                            name: product.name,
                                            price: Number(product.price),
                                            image_url: product.image_url,
                                            quantity: 1
                                        });
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary hover:text-white text-primary transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

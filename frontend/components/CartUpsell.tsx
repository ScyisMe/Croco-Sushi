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
                // Fetch only drinks as requested, increased limit to allow scrolling
                const response = await apiClient.get<Product[]>("/products/", {
                    params: { category_slug: "drinks", limit: 15 }
                });

                setUpsellProducts(response.data || []);
            } catch (error) {
                console.error("Failed to fetch upsell products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUpsellProducts();
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;

            // Check if we can scroll
            const canScrollLeft = container.scrollLeft > 0;
            const canScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth;

            if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [upsellProducts]);

    if (isLoading || upsellProducts.length === 0) return null;

    return (
        <div className="mt-6 mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 px-1">
                Не забудьте <span className="text-primary-500">напої</span>
            </h3>

            <div
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onPointerDown={(e) => e.stopPropagation()}
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
                                <span className="text-sm font-bold text-primary-500">
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
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary-500 hover:text-white text-primary-500 transition-colors"
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

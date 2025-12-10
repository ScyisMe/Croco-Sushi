"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import apiClient from "@/lib/api/client";
import { Category } from "@/lib/types";

export default function CategoryNav() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await apiClient.get("/categories");
            return response.data.filter((cat: Category) => cat.is_active);
        },
    });

    const scrollToCategory = (slug: string) => {
        const element = document.getElementById(`category-${slug}`);
        if (element) {
            // Offset for sticky header.
            const offset = 140;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveCategory(slug);
        }
    };

    const scrollNav = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    if (categories.length === 0) return null;

    return (
        <div className="sticky top-16 sm:top-20 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-sm py-2 transition-all">
            <div className="container mx-auto px-4 relative">
                <div className="flex items-center gap-2">

                    {/* Left Arrow (Desktop) */}
                    <button
                        onClick={() => scrollNav("left")}
                        className="hidden md:flex p-1.5 rounded-full hover:bg-surface-hover text-secondary transition flex-shrink-0"
                        aria-label="Previous"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>

                    {/* Categories List */}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-2 overflow-x-auto hide-scrollbar flex-1 items-center px-2 snap-x"
                    >
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => scrollToCategory(category.slug)}
                                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap snap-center ${activeCategory === category.slug
                                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                                    : "bg-surface-card/80 backdrop-blur-sm text-secondary hover:bg-surface-hover hover:text-primary hover:shadow-md"
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {/* Right Arrow (Desktop) */}
                    <button
                        onClick={() => scrollNav("right")}
                        className="hidden md:flex p-1.5 rounded-full hover:bg-surface-hover text-secondary transition flex-shrink-0"
                        aria-label="Next"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Gradients for mobile */}
                <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-surface to-transparent pointer-events-none md:hidden" />
                <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-surface to-transparent pointer-events-none md:hidden" />
            </div>
        </div>
    );
}

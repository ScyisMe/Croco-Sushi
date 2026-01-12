"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/apiClient";
import { Category } from "@/lib/types";
import CategorySection from "./CategorySection";

interface CategoryFeedProps {
    initialCategories?: Category[] | null;
}

export default function CategoryFeed({ initialCategories }: CategoryFeedProps) {
    const { data: categories = [], isLoading } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await apiClient.get("/categories");
            return response.data
                .filter((cat: Category) => cat.is_active);
        },
        // Only use initialData if we actually have categories. 
        // If initialCategories is null (fetch failed) or empty, we want to try fetching on client.
        initialData: (initialCategories && initialCategories.length > 0) ? initialCategories : undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-12">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-6">
                        <div className="h-8 w-48 bg-surface-card rounded animate-pulse" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="h-80 bg-surface-card rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {categories.map((category) => (
                <CategorySection key={category.id} category={category} />
            ))}
        </div>
    );
}


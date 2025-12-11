"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import apiClient from "@/lib/api/client";
import { Product, Category } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCard";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
};


interface CategorySectionProps {
    category: Category;
}

export default function CategorySection({ category }: CategorySectionProps) {
    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ["products", category.slug],
        queryFn: async () => {
            // Using category_id as required by the backend
            const response = await apiClient.get('/products', {
                params: {
                    category_id: category.id,
                    limit: 4
                }
            });
            // Backend returns List[ProductResponse] directly as response.data
            return response.data;
        },
    });

    if (!isLoading && products.length === 0) {
        return null;
    }

    return (
        <section
            id={`category-${category.slug}`}
            className="py-8 md:py-12 scroll-mt-36"
        >
            <div className="container mx-auto px-4">
                {/* Helper Wrapper for Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold font-display text-secondary">
                        {category.name}
                    </h2>

                    <Link
                        href={`/menu?category=${category.slug}`}
                        className="flex items-center text-primary font-medium hover:text-primary-600 transition group"
                    >
                        <span className="mr-2 text-sm md:text-base">Дивитись всі</span>
                        <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>



                {/* Products Grid */}
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                >
                    {isLoading ? (
                        // Skeletons
                        [...Array(4)].map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))
                    ) : (
                        products.map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                <ProductCard
                                    product={product}
                                    isSet={['sets', 'sety', 'seti'].includes(category.slug)}
                                />
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}

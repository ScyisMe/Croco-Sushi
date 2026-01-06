"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PromoBanner() {
    return (
        <section className="container mx-auto px-4 py-8 md:py-12">
            <Link href="/menu">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative w-full aspect-[21/9] md:aspect-[21/7] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer"
                >
                    {/* Background Highlight */}
                    <div className="absolute inset-0 bg-primary-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500" />

                    <Image
                        src="/banners/tomyam-banner.webp"
                        alt="Новинка Том Ям"
                        width={1200}
                        height={400}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                        quality={80}
                        priority
                    />

                    {/* Overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                    {/* Minimal shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
                </motion.div>
            </Link>
        </section>
    );
}

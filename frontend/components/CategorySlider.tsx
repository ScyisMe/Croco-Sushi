"use client";

import { useTranslation } from "@/store/localeStore";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";

const CATEGORIES = [
  { id: "rolls", nameKey: "categories.rolls", image: "/images/categories/rolls.png", slug: "rolls" },
  { id: "sets", nameKey: "categories.sets", image: "/images/categories/sets.png", slug: "sets" },
  { id: "sushi", nameKey: "categories.sushi", image: "/images/categories/sushi.png", slug: "sushi" },
  { id: "drinks", nameKey: "categories.drinks", image: "/images/categories/drinks.png", slug: "drinks" },
  { id: "sauces", nameKey: "categories.sauces", image: "/images/categories/sauces.png", slug: "sauces" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function CategorySlider() {
  const { t } = useTranslation();

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-display font-bold text-center text-white mb-12"
        >
          {t("categories.title")}
        </motion.h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
        >
          {CATEGORIES.map((category) => (
            <motion.div key={category.id} variants={item}>
              <Link href={`/menu?category=${category.slug}`}>
                <GlassCard
                  hoverEffect
                  className="h-full flex flex-col items-center justify-center p-6 text-center group border-white/5 bg-surface-card/30 hover:bg-surface-card/60"
                >
                  <div className="relative w-24 h-24 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Image
                      src={category.image}
                      alt={t(category.nameKey)}
                      fill
                      className="object-contain drop-shadow-lg"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">
                    {t(category.nameKey)}
                  </h3>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

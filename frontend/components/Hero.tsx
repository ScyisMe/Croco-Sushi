"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useTranslation } from "@/store/localeStore";

// Слайди для Hero секції з ключами локалізації
const HERO_SLIDES = [
  {
    id: 1,
    titleKey: "hero.title1",
    subtitleKey: "hero.subtitle1",
    image: "/images/hero/hero-1.jpg",
    buttonTextKey: "header.order",
    buttonLink: "/menu",
  },
  {
    id: 2,
    titleKey: "hero.title2",
    subtitleKey: "hero.subtitle2",
    image: "/images/hero/hero-2.jpg",
    buttonTextKey: "hero.orderNow",
    buttonLink: "/menu",
  },
  {
    id: 3,
    titleKey: "hero.title3",
    subtitleKey: "hero.subtitle3",
    image: "/images/hero/hero-3.jpg",
    buttonTextKey: "header.promotions",
    buttonLink: "/promotions",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();

  // Автоматична зміна слайдів
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Фонове зображення */}
      <div className="absolute inset-0">
        <Image
          src={slide.image}
          alt={t(slide.titleKey)}
          fill
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Контент */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl text-white"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t(slide.titleKey)}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            {t(slide.subtitleKey)}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={slide.buttonLink}
              className="inline-flex items-center bg-white text-secondary font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition group"
            >
              {t(slide.buttonTextKey)}
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center bg-secondary/80 backdrop-blur text-white font-semibold px-6 py-3 rounded-lg hover:bg-secondary transition"
            >
              {t("hero.viewMenu")}
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Індикатори слайдів */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

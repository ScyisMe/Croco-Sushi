"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

// Слайди для Hero секції
const HERO_SLIDES = [
  {
    id: 1,
    title: "Самі круті суші",
    subtitle: "Свіжі інгредієнти та найкращі ціни в місті",
    image: "/images/hero/hero-1.jpg",
    buttonText: "Оформити замовлення",
    buttonLink: "/menu",
  },
  {
    id: 2,
    title: "Безкоштовна доставка",
    subtitle: "При замовленні від 500 грн",
    image: "/images/hero/hero-2.jpg",
    buttonText: "Замовити зараз",
    buttonLink: "/menu",
  },
  {
    id: 3,
    title: "Акційні пропозиції",
    subtitle: "Знижки до 30% на популярні страви",
    image: "/images/hero/hero-3.jpg",
    buttonText: "Переглянути акції",
    buttonLink: "/promotions",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Автоматична зміна слайдів
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Симуляція завантаження
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  if (isLoading) {
    return (
      <section className="relative h-[500px] md:h-[600px] bg-gray-200">
        <div className="absolute inset-0 skeleton-shimmer" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-64 mx-auto skeleton rounded-lg" />
            <div className="h-6 w-96 mx-auto skeleton rounded-lg" />
            <div className="h-12 w-48 mx-auto skeleton rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Фонове зображення */}
      <div className="absolute inset-0">
        {/* Fallback градієнт якщо немає зображення */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary to-primary-600" />
        
        {/* Зображення */}
        <Image
          src={slide.image}
          alt={slide.title}
          fill
          className="object-cover"
          priority
          onError={(e) => {
            // Якщо зображення не завантажилось, приховуємо його
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Затемнення для читабельності тексту */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      </div>

      {/* Контент */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl text-white"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            {slide.title}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90 drop-shadow">
            {slide.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={slide.buttonLink}
              className="inline-flex items-center gap-2 bg-white text-primary hover:bg-gray-100 font-bold px-8 py-4 rounded-lg transition transform hover:scale-105 shadow-lg"
            >
              {slide.buttonText}
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-bold px-8 py-4 rounded-lg transition"
            >
              Меню
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Індикатори слайдів */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Перейти до слайду ${index + 1}`}
          />
        ))}
      </div>

      {/* Декоративні елементи */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

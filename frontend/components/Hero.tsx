"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
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

  // Використовуємо startTransition для некритичних оновлень - INP optimization
  const handleSlideChange = useCallback((index: number) => {
    startTransition(() => {
      setCurrentSlide(index);
    });
  }, []);

  // Автоматична зміна слайдів з startTransition
  useEffect(() => {
    const timer = setInterval(() => {
      startTransition(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    // CLS optimization - фіксована висота з адаптивними значеннями
    <section className="relative h-[60vh] min-h-[400px] max-h-[500px] sm:max-h-[550px] md:h-[500px] md:max-h-[600px] overflow-hidden">
      {/* Фонове зображення - LCP optimization */}
      <div className="absolute inset-0">
        {/* Placeholder для CLS prevention */}
        <div className="absolute inset-0 bg-gray-900" aria-hidden="true" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt={t(slide.titleKey)}
              fill
              className="object-cover"
              priority={currentSlide === 0}
              fetchPriority={currentSlide === 0 ? "high" : "auto"}
              sizes="100vw"
              quality={85}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Overlay - GPU accelerated, посилений для приховування фонового тексту */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 transform-gpu" 
          aria-hidden="true"
        />
      </div>

      {/* Контент з анімацією */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-xl"
        >
          {/* Заголовок - великий та помітний */}
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 md:mb-5 leading-tight text-white"
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}
          >
            {t(slide.titleKey)}
          </h1>
          
          {/* Підзаголовок - яскравий та читабельний */}
          <p 
            className="text-lg sm:text-xl md:text-2xl text-white font-medium mb-8 md:mb-10 leading-relaxed"
            style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.8)' }}
          >
            {t(slide.subtitleKey)}
          </p>
          
          {/* Одна головна CTA кнопка - велика та помітна */}
          <Link
            href="/menu"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-600 text-white font-bold text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 rounded-xl active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl min-h-[56px] sm:min-h-[64px] touch-target group max-w-md"
            style={{ boxShadow: '0 8px 30px rgba(0, 168, 89, 0.4)' }}
          >
            🍣 {t("header.order")}
            <ArrowRightIcon className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Індикатори слайдів - touch targets 44px */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSlideChange(index)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center touch-target"
            aria-label={`Перейти до слайду ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          >
            <span 
              className={`block rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "bg-white w-8 h-3" 
                  : "bg-white/50 hover:bg-white/75 w-3 h-3"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

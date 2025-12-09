"use client";

import Link from "next/link";
import { useTranslation } from "@/store/localeStore";
import { Button } from "./ui/Button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Video Background with improved dark overlay */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
        {/* Darker overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-surface-dark z-10" />
        {/* Additional center vignette for text area */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] z-10" />
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          poster="/images/hero-poster.jpg"
        >
          {/* TODO: Upload a valid video file. Current sushi-hero.mp4 is 0 bytes and causes 416 errors. */}
          {/* <source src="/videos/sushi-hero.mp4" type="video/mp4" /> */}
        </video>
      </motion.div>

      {/* Content - improved with slogan instead of brand name */}
      <div className="container mx-auto px-4 pt-20 relative z-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Main headline - emotional slogan instead of brand name */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight leading-tight">
            <span className="block">Японська якість</span>
            <span className="block text-primary-400">
              у кожному шматочку
            </span>
          </h1>

          {/* Subtitle - value proposition */}
          <p className="text-lg md:text-xl lg:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light drop-shadow-lg">
            {t("hero.subtitle")}
          </p>

          {/* CTA buttons - primary action emphasized, secondary with white ghost style */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/menu">
              <Button
                size="lg"
                className="shadow-primary-500/40 shadow-xl hover:shadow-primary-500/60 transition-shadow text-lg px-8 py-6"
              >
                {t("hero.orderNow")}
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="backdrop-blur-md bg-white/5 border-white/40 text-white hover:bg-white/15 hover:border-white/60 transition-all text-lg px-8 py-6"
              >
                {t("hero.aboutUs")}
              </Button>
            </Link>
          </div>

          {/* Free delivery badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8"
          >
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm px-4 py-2 rounded-full border border-white/20">
              <span className="text-primary-400">✓</span>
              Безкоштовна доставка від 1000 грн
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}

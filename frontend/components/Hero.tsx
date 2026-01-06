"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/store/localeStore";
import { Button } from "./ui/Button";
import { LazyMotion, domAnimation, m, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function Hero() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <LazyMotion features={domAnimation}>
      <section ref={ref} className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <m.div
          style={{ y: isMobile ? 0 : y, opacity }}
          className="absolute inset-0 z-0 will-change-transform"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-surface-dark z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)] z-10" />

          {/* Mobile: Static Image */}
          {/* Mobile: Static Image */}
          <div className="relative w-full h-full md:hidden">
            <Image
              src="/images/hero-poster.webp"
              alt="Hero Background"
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={70}
            />
          </div>

          {/* Desktop: Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/images/hero-poster.webp"
            className="w-full h-full object-cover hidden md:block"
          >
            <source src="/hero-bg.mp4" media="(min-width: 769px)" type="video/mp4" />
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
        </m.div>

        {/* Content */}
        <div className="container mx-auto px-4 pt-20 relative z-20 text-center">
          <div className="relative z-20">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-2xl tracking-tight leading-tight">
              <span className="block text-primary-400">Риби більше,</span>
              <span className="block text-white">
                ніж рису
              </span>
            </h1>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >

              <p className="text-lg md:text-xl lg:text-2xl text-white/95 mb-10 max-w-2xl mx-auto font-medium drop-shadow-md">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/menu">
                  <Button
                    size="lg"
                    className="shadow-primary-500/40 shadow-xl hover:shadow-primary-500/60 transition-shadow text-lg px-8 py-6"
                  >
                    {t("hero.orderNow")}
                  </Button>
                </Link>
                <Link href="/promotions">
                  <Button
                    variant="outline"
                    size="lg"
                    className="backdrop-blur-md bg-white/5 border-white/40 text-white hover:bg-white/15 hover:border-white/60 transition-all text-lg px-8 py-6"
                  >
                    Акції
                  </Button>
                </Link>
              </div>

              {/* Free delivery badge */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-8"
              >
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="text-primary-400">✓</span>
                  Безкоштовна доставка від 1000 грн
                </span>
              </m.div>
            </m.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <m.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </m.div>
      </section>
    </LazyMotion>
  );
}

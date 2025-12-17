'use client';

import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function ParallaxBackground() {
  const { scrollY } = useScroll();

  // Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      // Center origin
      const x = (clientX / innerWidth) - 0.5;
      const y = (clientY / innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Transform definitions for different layers
  // Avocado: fast move, rotates
  const avoX = useTransform(smoothMouseX, [-0.5, 0.5], [40, -40]);
  const avoY = useTransform(smoothMouseY, [-0.5, 0.5], [40, -40]);
  const avoScrollY = useTransform(scrollY, [0, 1000], [0, 150]);
  const avoRotate = useTransform(scrollY, [0, 1000], [0, 45]);

  // Nori: slower, different direction
  const noriX = useTransform(smoothMouseX, [-0.5, 0.5], [-30, 30]);
  const noriY = useTransform(smoothMouseY, [-0.5, 0.5], [-30, 30]);
  const noriScrollY = useTransform(scrollY, [0, 1000], [0, -100]);

  // Caviar: subtle
  const caviarX = useTransform(smoothMouseX, [-0.5, 0.5], [20, -20]);
  const caviarY = useTransform(smoothMouseY, [-0.5, 0.5], [20, -20]);
  const caviarScrollY = useTransform(scrollY, [0, 1000], [0, 80]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Dark overlay can be handled by parent or here if needed */}

      {/* Ingredient 1 (Avocado-like) - Top Right */}
      <motion.div
        style={{
          x: avoX,
          y: avoY,
          translateY: avoScrollY,
          rotate: avoRotate,
        }}
        className="absolute top-20 right-10 opacity-80 w-32 h-32 md:w-48 md:h-48 blur-[1px]"
      >
        <Image
          src="/images/parallax/ingredient-1.jpg"
          alt="Ingredient 1"
          width={200}
          height={200}
          className="object-contain" // removed mix-blend-screen as these might be opaque cutouts
        />
      </motion.div>

      {/* Ingredient 2 (Nori-like) - Bottom Left */}
      <motion.div
        style={{
          x: noriX,
          y: noriY,
          translateY: noriScrollY,
        }}
        className="absolute bottom-40 -left-10 opacity-70 w-40 h-40 md:w-56 md:h-56 blur-[2px]"
      >
        <Image
          src="/images/parallax/ingredient-2.jpg"
          alt="Ingredient 2"
          width={250}
          height={250}
          className="object-contain"
        />
      </motion.div>

      {/* Ingredient 3 (Caviar-like) - Middle Rightish */}
      <motion.div
        style={{
          x: caviarX,
          y: caviarY,
          translateY: caviarScrollY,
        }}
        className="absolute top-1/2 right-[15%] opacity-60 w-24 h-24 blur-[1px]"
      >
        <Image
          src="/images/parallax/ingredient-3.jpg"
          alt="Ingredient 3"
          width={150}
          height={150}
          className="object-contain"
        />
      </motion.div>

      {/* Extra Ingredient 1 - Bottom Right deep (Simulated depth) */}
      <motion.div
        style={{
          x: noriX,
          y: avoY,
          translateY: noriScrollY,
          rotate: useTransform(scrollY, [0, 1000], [0, -30]),
        }}
        className="absolute bottom-10 right-20 opacity-40 w-20 h-20 blur-[3px]"
      >
        <Image
          src="/images/parallax/ingredient-1.jpg"
          alt="Ingredient 1"
          width={150}
          height={150}
          className="object-contain"
        />
      </motion.div>
    </div>
  );
}

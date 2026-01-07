"use client";

import { useEffect, useState } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { throttle } from "@/lib/utils";

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    // Scroll to top smoothly
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // Show button when page is scrolled down (Intersection Observer to avoid forced reflows)
    useEffect(() => {
        const sentinel = document.createElement("div");
        sentinel.style.position = "absolute";
        sentinel.style.top = "0";
        sentinel.style.left = "0";
        sentinel.style.height = "300px";
        sentinel.style.width = "1px";
        sentinel.style.pointerEvents = "none";
        sentinel.style.visibility = "hidden";
        document.body.prepend(sentinel);

        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the top 300px sentinel is intersecting (partially visible), hide button.
                // If it's NOT intersecting, it means we scrolled past it (or it's way below?? No, it's at top).
                // So not intersecting = scrolled down.
                setIsVisible(!entry.isIntersecting);
            },
            { threshold: 0 }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
            if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
        };
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 p-3 md:p-4 bg-primary text-white rounded-full shadow-lg shadow-primary/30 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#121212]"
                    aria-label="Scroll to top"
                >
                    <ChevronUpIcon className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}

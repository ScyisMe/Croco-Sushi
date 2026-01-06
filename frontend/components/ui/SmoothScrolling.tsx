"use client";

import { useEffect } from "react";
// Use type import to avoid including the library in the initial bundle
import type Lenis from "lenis";

export default function SmoothScrolling() {
    useEffect(() => {
        // Disable smooth scrolling on mobile devices to prevent glitches and conflicts with native scroll
        if (window.innerWidth < 768) return;

        let lenis: Lenis | null = null;
        let rafId: number;

        import("lenis").then((LenisModule) => {
            const LenisClass = LenisModule.default;
            lenis = new LenisClass({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: "vertical",
                gestureOrientation: "vertical",
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 2,
            });

            function raf(time: number) {
                lenis?.raf(time);
                rafId = requestAnimationFrame(raf);
            }

            rafId = requestAnimationFrame(raf);
        });

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            lenis?.destroy();
        };
    }, []);

    return null;
}

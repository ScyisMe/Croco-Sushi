import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface NumberTickerProps {
    value: number;
    direction?: "up" | "down";
    className?: string;
    delay?: number; // delay in s
    decimalPlaces?: number;
    damping?: number;
    stiffness?: number;
}

export default function NumberTicker({
    value,
    direction = "up",
    delay = 0,
    className,
    decimalPlaces = 0,
    damping = 60,
    stiffness = 100,
}: NumberTickerProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(direction === "down" ? value : 0);
    const springValue = useSpring(motionValue, {
        damping,
        stiffness,
    });
    const isInView = useInView(ref, { once: true, margin: "0px" });

    useEffect(() => {
        if (isInView) {
            setTimeout(() => {
                motionValue.set(direction === "down" ? 0 : value);
            }, delay * 1000);
        }
    }, [motionValue, isInView, delay, value, direction]);

    useEffect(() => {
        springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Intl.NumberFormat("en-US", {
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces,
                }).format(Number(latest.toFixed(decimalPlaces))).replace(/,/g, " "); // Replace comma with space for thousands separator typical in UA
            }
        });
    }, [springValue, decimalPlaces]);

    // Update target value when prop changes
    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    return (
        <span
            className={`inline-block tabular-nums text-black dark:text-white tracking-wider ${className}`}
            ref={ref}
        />
    );
}

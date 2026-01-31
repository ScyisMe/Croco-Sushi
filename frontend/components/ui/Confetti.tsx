"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#eab308", "#ec4899", "#8b5cf6"];

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
}

export default function Confetti() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Generate particles
        const count = 50;
        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: 0, // start from center (relative to container) or will be randomized in animation
            y: 0,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random(),
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-[110] flex items-center justify-center overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{
                        opacity: 1,
                        x: 0,
                        y: 0,
                        scale: 0
                    }}
                    animate={{
                        opacity: [1, 1, 0],
                        x: (Math.random() - 0.5) * 800 * Math.random(), // Explode outwards
                        y: (Math.random() - 0.5) * 800 * Math.random(),
                        rotate: p.rotation + 720 * (Math.random() - 0.5),
                        scale: p.scale
                    }}
                    transition={{
                        duration: 2 + Math.random(),
                        ease: "easeOut"
                    }}
                    style={{ backgroundColor: p.color }}
                    className="absolute w-3 h-3 rounded-sm shadow-sm"
                />
            ))}
        </div>
    );
}

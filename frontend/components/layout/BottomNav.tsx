"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, Squares2X2Icon, TruckIcon, TagIcon } from "@heroicons/react/24/outline";
import { HomeIcon as HomeSolid, Squares2X2Icon as MenuSolid, TruckIcon as TruckSolid, TagIcon as TagSolid } from "@heroicons/react/24/solid";
import { LazyMotion, domAnimation, m } from "framer-motion";

export default function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Головна", icon: HomeIcon, activeIcon: HomeSolid },
        { href: "/menu", label: "Меню", icon: Squares2X2Icon, activeIcon: MenuSolid },
        { href: "/promotions", label: "Акції", icon: TagIcon, activeIcon: TagSolid },
        { href: "/delivery", label: "Доставка", icon: TruckIcon, activeIcon: TruckSolid },
    ];

    return (
        <LazyMotion features={domAnimation}>
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden print:hidden">
                {/* Neon Container Effect */}
                <div className="absolute inset-0 bg-[#080808]/95 backdrop-blur-xl border-t border-primary/20 shadow-[0_-5px_20px_rgba(16,185,129,0.15)]" />
                <div className="relative flex justify-around items-center h-16 px-2 pb-safe">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = isActive ? link.activeIcon : link.icon;

                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive
                                    ? "text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <m.div
                                    className="relative p-1"
                                    whileTap={{ scale: 0.9 }}
                                    animate={isActive ? { scale: [1, 1.1, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Icon className={`w-6 h-6 ${isActive ? "stroke-2" : "stroke-1"}`} />
                                    {isActive && (
                                        <m.div
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(16,185,129,1)]"
                                        />
                                    )}
                                </m.div>
                                <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                                    {link.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </LazyMotion>
    );
}



"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, Squares2X2Icon, TruckIcon, TagIcon } from "@heroicons/react/24/outline";
import { HomeIcon as HomeSolid, Squares2X2Icon as MenuSolid, TruckIcon as TruckSolid, TagIcon as TagSolid } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

export default function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Головна", icon: HomeIcon, activeIcon: HomeSolid },
        { href: "/menu", label: "Меню", icon: Squares2X2Icon, activeIcon: MenuSolid },
        { href: "/promotions", label: "Акції", icon: TagIcon, activeIcon: TagSolid },
        { href: "/delivery", label: "Доставка", icon: TruckIcon, activeIcon: TruckSolid },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-surface-dark/95 backdrop-blur-xl border-t border-white/10" />
            <div className="relative flex justify-around items-center h-16 px-2 pb-safe">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = isActive ? link.activeIcon : link.icon;

                    return (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary-500" : "text-gray-400 hover:text-gray-200"
                                }`}
                        >
                            <motion.div
                                className="relative p-1"
                                whileTap={{ scale: 0.9 }}
                                animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Icon className="w-6 h-6" />
                            </motion.div>
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}



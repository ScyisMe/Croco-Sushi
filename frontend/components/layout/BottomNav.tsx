"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, Squares2X2Icon, ShoppingBagIcon, UserIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { HomeIcon as HomeSolid, Squares2X2Icon as MenuSolid, ShoppingBagIcon as CartSolid, UserIcon as UserSolid, EllipsisHorizontalIcon as MoreSolid } from "@heroicons/react/24/solid";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";

export default function BottomNav() {
    const pathname = usePathname();
    const itemsCount = useCartStore((state) => state.items.length);

    const links = [
        { href: "/", label: "Home", icon: HomeIcon, activeIcon: HomeSolid },
        { href: "/menu", label: "Menu", icon: Squares2X2Icon, activeIcon: MenuSolid },
        { href: "/cart", label: "Cart", icon: ShoppingBagIcon, activeIcon: CartSolid, badge: itemsCount },
        { href: "/profile", label: "Profile", icon: UserIcon, activeIcon: UserSolid },
        { href: "/more", label: "More", icon: EllipsisHorizontalIcon, activeIcon: MoreSolid },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-surface-dark/80 backdrop-blur-xl border-t border-white/10" />
            <div className="relative flex justify-around items-center h-16 px-2 pb-safe">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = isActive ? link.activeIcon : link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary-500" : "text-gray-400 hover:text-gray-200"
                                }`}
                        >
                            <div className="relative">
                                <Icon className="w-6 h-6" />
                                {link.badge ? (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-accent-red rounded-full"
                                    >
                                        {link.badge}
                                    </motion.span>
                                ) : null}
                            </div>
                            <span className="text-[10px] font-medium">{link.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

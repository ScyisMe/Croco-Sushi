"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, Squares2X2Icon, ShoppingBagIcon, UserIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { HomeIcon as HomeSolid, Squares2X2Icon as MenuSolid, ShoppingBagIcon as CartSolid, UserIcon as UserSolid, EllipsisHorizontalIcon as MoreSolid } from "@heroicons/react/24/solid";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";
import Cart from "@/components/Cart";
export default function BottomNav() {
    const pathname = usePathname();
    const itemsCount = useCartStore((state) => state.items.length);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const links = [
        { href: "/", label: "Home", icon: HomeIcon, activeIcon: HomeSolid },
        { href: "/menu", label: "Menu", icon: Squares2X2Icon, activeIcon: MenuSolid },
        {
            href: "#",
            label: "Cart",
            icon: ShoppingBagIcon,
            activeIcon: CartSolid,
            badge: itemsCount,
            onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                setIsCartOpen(true);
            }
        },
        { href: "/profile", label: "Profile", icon: UserIcon, activeIcon: UserSolid },
    ];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-surface-dark/95 backdrop-blur-xl border-t border-white/10" />
                <div className="relative flex justify-around items-center h-16 px-2 pb-safe">
                    {links.map((link) => {
                        const isActive = link.href !== "#" && pathname === link.href;
                        const Icon = isActive ? link.activeIcon : link.icon;

                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={link.onClick}
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
                                    {link.badge ? (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-accent-red rounded-full ring-2 ring-surface-dark"
                                        >
                                            {link.badge}
                                        </motion.span>
                                    ) : null}
                                </motion.div>
                                <span className="text-[10px] font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            <Cart isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
        </>
    );
}



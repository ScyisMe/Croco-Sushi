"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface NavLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export const NavLink = ({ href, children, className = "", onClick }: NavLinkProps) => {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`group relative px-2 py-1 text-white/90 transition-colors duration-300 hover:text-green-500 ${className}`}
        >
            {children}
            {/* Line starting from center */}
            <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-green-500 transition-all duration-300 ease-out group-hover:w-full"></span>
        </Link>
    );
};

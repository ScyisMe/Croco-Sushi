import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = ({
    children,
    className,
    hoverEffect = false,
    ...props
}: GlassCardProps) => {
    return (
        <div
            className={cn(
                "glass-card relative overflow-hidden rounded-2xl p-6 transition-all duration-500 group",
                hoverEffect && "hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] hover:border-primary-500/30",
                className
            )}
            {...props}
        >
            {hoverEffect && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out] bg-gradient-to-r from-transparent via-white/5 to-transparent z-0 pointer-events-none" />
            )}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

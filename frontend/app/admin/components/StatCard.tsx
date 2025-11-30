"use client";

import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: ReactNode;
    iconColor?: string;
    isLoading?: boolean;
}

export default function StatCard({
    title,
    value,
    change,
    icon,
    iconColor = "bg-green-100 text-green-600",
    isLoading = false,
}: StatCardProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {change !== undefined && (
                        <p className={`text-sm mt-2 font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                            <span className="text-gray-500 ml-1">vs минулий місяць</span>
                        </p>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${iconColor} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

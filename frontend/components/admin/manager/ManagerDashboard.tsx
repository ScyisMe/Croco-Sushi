"use client";

import { useState, useEffect } from "react";
import KanbanBoard from "./KanbanBoard";

export default function ManagerDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <header className="bg-surface-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Manager Terminal</h1>
                    <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full font-medium animate-pulse">
                        Live
                    </span>
                </div>
                <div className="text-xl font-mono text-gray-400">
                    {currentTime.toLocaleTimeString()}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-6">
                <KanbanBoard />
            </div>
        </div>
    );
}
